"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, EyeSlash, Trash, Eye } from "@phosphor-icons/react";
import { UserType } from "@prisma/client";
import { useRouter } from "next/navigation";
import InviteUserForm from "@/components/InviteUserForm";
import ConfirmationModal from "@/components/AccountManagement/ConfirmationModal";
import EditModal from "@/components/AccountManagement/EditModal";
import StaffPermissionsModal from "@/components/AccountManagement/StaffPermissionsModal";
import { useApiClient } from "@/hooks/useApiClient";
import { useFetch } from "@/hooks/useFetch";
import { formatUserType, isStaff, hasPermission } from "@/lib/userUtils";
import AccountDropdown from "@/components/AccountManagement/AccountDropdown";
import AccountStatusTag from "@/components/tags/AccountStatusTag";
import AdvancedBaseTable from "@/components/baseTable/AdvancedBaseTable";
import {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/types/ui/table.types";
import toast from "react-hot-toast";
import { useUser } from "@/components/context/UserContext";
import {
  EDITABLE_PERMISSION_FIELDS,
  PermissionFlags,
  StaffPermissionFlags,
} from "@/types/api/user.types";
import { createEmptyStaffPermissionState } from "@/constants/staffPermissions";

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
type AccountUserDetail = AccountUserResponse & PermissionFlags;

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
  const { user: currentUser, loading } = useUser();
  const canViewAccounts = hasPermission(currentUser, "userRead");
  const canManageAccounts = hasPermission(currentUser, "userWrite");

  const tableRef = useRef<AdvancedBaseTableHandle<AccountRow>>(null);
  const { apiClient } = useApiClient();
  const { data: tags, refetch: refetchTags } = useFetch<string[]>(
    "/api/users/tags"
  );

  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AccountRow | null>(null);
  const [isPermissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [permissionsModalLoading, setPermissionsModalLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<{
    userId: number;
    permissions: StaffPermissionFlags;
    isSuper: boolean;
  } | null>(null);

  const router = useRouter();
  const mapPermissionsFromUser = (
    user: Partial<PermissionFlags>
  ): StaffPermissionFlags => {
    const permissions = createEmptyStaffPermissionState();
    EDITABLE_PERMISSION_FIELDS.forEach((field) => {
      permissions[field] = Boolean(user[field]);
    });
    return permissions;
  };

  useEffect(() => {
    if (!loading && !canViewAccounts) {
      router.replace("/");
    }
  }, [loading, canViewAccounts, router]);

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
    if (!canManageAccounts) return;
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleSendReminder = async (user: AccountRow) => {
    if (!canManageAccounts) return;
    try {
      await apiClient.post(`/api/users/${user.id}/reminder`);
      toast.success(`Sent a reminder to ${user.name}`);
    } catch (error) {
      console.error(`Error sending reminder: ${error}`);
      toast.error(`Error occured while sending reminder to ${user.name}`);
    }
  }

  const handleEditAccount = (user: AccountRow) => {
    if (!canManageAccounts) return;
    if (user.pending) return;
    setSelectedUser(user);
    setPermissionState(null);
    setPermissionsModalOpen(false);
    setPermissionsModalLoading(false);
    setEditModalOpen(true);
  };

  const handleDeactivateAccount = (user: AccountRow) => {
    if (!canManageAccounts) return;
    if (user.pending) return;
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!canManageAccounts) return;
    if (!selectedUser) return;

    try {
      if (selectedUser.pending) {
        if (selectedUser.invite?.token) {
          await apiClient.delete(`/api/invites/${selectedUser.invite.token}`);
        }
        tableRef.current?.removeItemById(selectedUser.id);
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
    tag: string;
  }) => {
    if (!canManageAccounts) return;
    if (!selectedUser || selectedUser.pending) return;

    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        tag: data.tag,
      };

      if (
        isStaff(selectedUser.type) &&
        permissionState &&
        permissionState.userId === selectedUser.id
      ) {
        payload.permissions = permissionState.permissions;
      }

      await apiClient.patch(`/api/users/${selectedUser.id}`, {
        body: JSON.stringify(payload),
      });

      const nextUser: AccountRow = {
        ...selectedUser,
        name: data.name,
        email: data.email,
        tag: data.tag || null,
      };

      tableRef.current?.upsertItem(nextUser);
      setSelectedUser(nextUser);
      refetchTags();
    } catch (error) {
      console.error("Error updating user:", error);
    }

    setEditModalOpen(false);
    setSelectedUser(null);
    setPermissionState(null);
    setPermissionsModalOpen(false);
    setPermissionsModalLoading(false);
  };

  const confirmDeactivateAccount = async () => {
    if (!canManageAccounts) return;
    if (!selectedUser || selectedUser.pending) return;

    try {
      const isCurrentlyEnabled = selectedUser.enabled;
      await apiClient.patch(`/api/users/${selectedUser.id}`, {
        body: JSON.stringify({ enabled: !isCurrentlyEnabled }),
      });
      tableRef.current?.updateItemById(selectedUser.id, {
        enabled: !isCurrentlyEnabled,
      });
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
    setPermissionState(null);
    setPermissionsModalOpen(false);
    setPermissionsModalLoading(false);
  };

  const closePermissionModal = () => {
    setPermissionsModalOpen(false);
    setPermissionsModalLoading(false);
  };

  const handleManagePermissions = async (user: AccountRow) => {
    if (user.pending || !isStaff(user.type)) return;
    setPermissionsModalOpen(true);

    if (permissionState && permissionState.userId === user.id) {
      setPermissionsModalLoading(false);
      return;
    }

    setPermissionsModalLoading(true);
    try {
      const data = await apiClient.get<{ user: AccountUserDetail }>(
        `/api/users/${user.id}`
      );
      const detailedUser = data.user;
      setPermissionState({
        userId: detailedUser.id,
        permissions: mapPermissionsFromUser(detailedUser),
        isSuper: Boolean(detailedUser.isSuper),
      });
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("Unable to load permissions. Please try again.");
      setPermissionState(null);
      closePermissionModal();
    } finally {
      setPermissionsModalLoading(false);
    }
  };

  const handleSavePermissions = (nextPermissions: StaffPermissionFlags) => {
    if (!selectedUser) return;
    setPermissionState((prev) => ({
      userId: selectedUser.id,
      permissions: nextPermissions,
      isSuper: prev?.isSuper ?? false,
    }));
    closePermissionModal();
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
      const data = await apiClient.get<{ users: AccountUserResponse[], total: number }>(`/api/users?` + params);
      return {
        data: data.users,
        total: data.total,
      };
    },
    [apiClient]
  );

  const baseColumns: ColumnDefinition<AccountRow>[] = [
    "name",
    "email",
    {
      id: "type",
      header: "Role",
      cell: (item) => formatUserType(item.type),
    },
    {
      id: "tag",
      filterType: "enum",
      filterOptions: tags ?? [],
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
  ];

  if (canManageAccounts) {
    baseColumns.push({
      id: "manage",
      cell: (item) => (
        <div
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <AccountDropdown
            isPending={item.pending}
            user={{ enabled: item.enabled }}
            onDeleteAccount={() => handleDeleteAccount(item)}
            onEditAccount={() => handleEditAccount(item)}
            onDeactivateAccount={() => handleDeactivateAccount(item)}
            onSendReminder={() => handleSendReminder(item)}
            canManage={canManageAccounts}
          />
        </div>
      ),
    });
  }

  if (!canViewAccounts) {
    return null;
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-primary">
        Account Management
      </h1>

      <AdvancedBaseTable
        ref={tableRef}
        columns={baseColumns}
        fetchFn={fetchFn}
        rowId="id"
        headerCellStyles="min-w-32"
        emptyState="No accounts to display"
        toolBar={
          canManageAccounts && (
            <button
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
              onClick={() => setInviteModalOpen(true)}
            >
              <Plus size={18} /> Add account
            </button>
          )
        }
      />

      {canManageAccounts && isInviteModalOpen && (
        <InviteUserForm
          closeModal={() => setInviteModalOpen(false)}
          onSubmit={handleInviteSubmit}
        />
      )}

      {canManageAccounts && (
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
      )}

      {canManageAccounts && (
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
      )}

      {canManageAccounts && (
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
        existingTags={tags ?? []}
        onManagePermissions={
          selectedUser &&
          !selectedUser.pending &&
          isStaff(selectedUser.type)
            ? () => handleManagePermissions(selectedUser)
            : undefined
        }
      />
      )}

      {canManageAccounts && (
        <StaffPermissionsModal
          isOpen={isPermissionsModalOpen}
          title={
            selectedUser
              ? `Permissions for ${selectedUser.name}`
              : "Staff permissions"
          }
          initialPermissions={
            permissionState &&
            selectedUser &&
            permissionState.userId === selectedUser.id
              ? permissionState.permissions
              : undefined
          }
          onClose={closePermissionModal}
          onCancel={closePermissionModal}
          onSave={handleSavePermissions}
          isLoading={permissionsModalLoading}
          isTargetSuper={Boolean(permissionState?.isSuper)}
          canGrantUserWrite={Boolean(currentUser?.isSuper)}
        />
      )}
    </>
  );
}
