"use client";

import { useState, useCallback, useRef } from "react";
import { Plus, EyeSlash, Trash, Eye } from "@phosphor-icons/react";
import { UserType } from "@prisma/client";
import { useRouter } from "next/navigation";
import InviteUserForm from "@/components/InviteUserForm";
import ConfirmationModal from "@/components/AccountManagement/ConfirmationModal";
import EditModal from "@/components/AccountManagement/EditModal";
import { useApiClient } from "@/hooks/useApiClient";
import { isStaff, isAdmin, formatUserType } from "@/lib/userUtils";
import { useUser } from "@/components/context/UserContext";
import AccountDropdown from "@/components/AccountManagement/AccountDropdown";
import AccountStatusTag from "@/components/tags/AccountStatusTag";
import AdvancedBaseTable from "@/components/baseTable/AdvancedBaseTable";
import {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/types/ui/table.types";

interface AccountUserResponse {
  id: number;
  email: string;
  type: UserType;
  name: string;
  tag: string | null;
  enabled: boolean;
  pending: boolean;
  invite?: {
    token: string;
    expiration: string;
  } | null;
}

type AccountRow = AccountUserResponse;

function getStatusLabel(user: AccountUserResponse) {
  if (user.pending) {
    const expiration = user.invite?.expiration
      ? new Date(user.invite.expiration)
      : null;
    if (expiration && expiration < new Date()) {
      return "Expired";
    }
    return "Pending invite";
  }

  return user.enabled === false ? "Deactivated" : "Activated";
}

export default function AccountManagementPage() {
  const tableRef = useRef<AdvancedBaseTableHandle<AccountRow>>(null);
  const { apiClient } = useApiClient();
  const { user: currentUser } = useUser();

  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AccountRow | null>(null);

  const router = useRouter();

  const handleInviteSubmit = (role: UserType) => {
    if (role === "PARTNER") {
      setInviteModalOpen(false);
      router.push("/createPartnerAccount");
    } else {
      setInviteModalOpen(false);
      tableRef.current?.reload();
    }
  };

  const handleDeleteAccount = (user: AccountRow) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleEditAccount = (user: AccountRow) => {
    if (user.pending) return;
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeactivateAccount = (user: AccountRow) => {
    if (user.pending) return;
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.pending) {
        if (selectedUser.invite?.token) {
          await apiClient.delete(`/api/invites/${selectedUser.invite.token}`);
        }
        tableRef.current?.removeItemById(selectedUser.id);
      } else {
        await apiClient.patch(`/api/users/${selectedUser.id}`, {
          body: JSON.stringify({
            enabled: false,
          }),
        });
        tableRef.current?.updateItemById(selectedUser.id, (current) => ({
          ...current,
          enabled: false,
        }));
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }

    setDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const confirmEditAccount = async (data: {
    name: string;
    email: string;
    role: UserType;
    tag: string;
  }) => {
    if (!selectedUser || selectedUser.pending) return;

    try {
      await apiClient.patch(`/api/users/${selectedUser.id}`, {
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
          tag: data.tag,
        }),
      });

      const nextUser: AccountRow = {
        ...selectedUser,
        name: data.name,
        email: data.email,
        type: data.role,
        tag: data.tag || null,
      };

      tableRef.current?.upsertItem(nextUser);
      setSelectedUser(nextUser);
    } catch (error) {
      console.error("Error updating user:", error);
    }

    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const confirmDeactivateAccount = async () => {
    if (!selectedUser || selectedUser.pending) return;

    try {
      const isCurrentlyEnabled = selectedUser.enabled;
      await apiClient.patch(`/api/users/${selectedUser.id}`, {
        body: JSON.stringify({ enabled: !isCurrentlyEnabled }),
      });

      const nextUser: AccountRow = {
        ...selectedUser,
        enabled: !isCurrentlyEnabled,
      };

      tableRef.current?.upsertItem(nextUser);
      setSelectedUser(nextUser);
    } catch (error) {
      console.error("Error updating user status:", error);
    }

    setDeactivateModalOpen(false);
    setSelectedUser(null);
  };

  const closeAllModals = () => {
    setDeleteModalOpen(false);
    setEditModalOpen(false);
    setDeactivateModalOpen(false);
    setSelectedUser(null);
  };

  const fetchFn = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<AccountRow>
    ) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });
      const users = await apiClient.get<AccountUserResponse[]>(`/api/users?` + params);
      const mapped = users;
      return {
        data: mapped,
        total: mapped.length,
      };
    },
    [apiClient]
  );

  const columns: ColumnDefinition<AccountRow>[] = [
    "name",
    "email",
    {
      id: "type",
      header: "Role",
      cell: (item) => formatUserType(item.type),
    },
    {
      id: "tag",
      cell: (item) =>
        item.tag ? (
          <span className="px-3 py-1 bg-red-primary/70 text-white rounded-md text-sm">
            {item.tag}
          </span>
        ) : (
          <span className="italic text-gray-400">No tag</span>
        ),
    },
    {
      id: "status",
      cell: (item) => <AccountStatusTag status={getStatusLabel(item)} />,
    },
    {
      id: "manage",
      headerClassName: "w-1/12",
      cellClassName: "w-1/12",
      cell: (item) => (
        <div
          className="float-right"
          onClick={(e) => e.stopPropagation()}
        >
          <AccountDropdown
            isPending={item.pending}
            user={{ enabled: item.enabled }}
            onDeleteAccount={() => handleDeleteAccount(item)}
            onEditAccount={() => handleEditAccount(item)}
            onDeactivateAccount={() => handleDeactivateAccount(item)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <h1 className="text-3xl text-gray-primary font-bold">
        Account Management
      </h1>

      <div className="flex justify-end items-center w-full pt-6">
        {currentUser && isAdmin(currentUser.type) && (
          <button
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
            onClick={() => setInviteModalOpen(true)}
          >
            <Plus size={18} /> Add account
          </button>
        )}
      </div>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchFn}
        rowId="id"
        headerCellStyles="min-w-32"
        emptyState="No accounts to display"
      />

      {isInviteModalOpen && (
        <InviteUserForm
          closeModal={() => setInviteModalOpen(false)}
          onSubmit={handleInviteSubmit}
        />
      )}

      <ConfirmationModal
        title="Delete account"
        text={`Are you sure you would like to delete this account?
Deleting an account will permanently remove all associated information from the database. This action is irreversible.`}
        icon={<Trash size={78} />}
        isOpen={isDeleteModalOpen}
        onClose={closeAllModals}
        onCancel={closeAllModals}
        onConfirm={confirmDeleteAccount}
        confirmText="Delete account"
      />

      <ConfirmationModal
        title={
          selectedUser && !selectedUser.pending && selectedUser.enabled
            ? "Deactivate account"
            : "Activate account"
        }
        text={
          selectedUser && !selectedUser.pending && selectedUser.enabled
            ? `Are you sure you would like to deactivate this account?
For partner accounts, deactivation means the partner will no longer have access to request distributions. However, admins will still retain access to view all historical data associated with the account.`
            : `Are you sure you would like to activate this account?
This will restore the user's access to the system.`
        }
        icon={
          selectedUser && !selectedUser.pending && selectedUser.enabled ? (
            <EyeSlash size={78} />
          ) : (
            <Eye size={78} />
          )
        }
        isOpen={isDeactivateModalOpen}
        onClose={closeAllModals}
        onCancel={closeAllModals}
        onConfirm={confirmDeactivateAccount}
        confirmText={
          selectedUser && !selectedUser.pending && selectedUser.enabled
            ? "Deactivate"
            : "Activate"
        }
      />

      <EditModal
        title={
          selectedUser && !selectedUser.pending && isStaff(selectedUser.type)
            ? "Edit staff account"
            : "Edit account"
        }
        isOpen={isEditModalOpen}
        onClose={closeAllModals}
        onCancel={closeAllModals}
        onConfirm={confirmEditAccount}
        initialData={
          selectedUser && !selectedUser.pending
            ? {
                name: selectedUser.name,
                email: selectedUser.email,
              role: selectedUser.type,
              tag: selectedUser.tag || "",
            }
            : undefined
        }
        isStaffAccount={
          selectedUser && !selectedUser.pending
            ? isStaff(selectedUser.type)
            : true
        }
        selectedUserId={
          selectedUser && !selectedUser.pending ? selectedUser.id : undefined
        }
      />
    </>
  );
}
