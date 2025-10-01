"use client";

import { useState, useCallback } from "react";
import { Plus, EyeSlash, Trash, Eye } from "@phosphor-icons/react";
import { User, UserType, UserInvite } from "@prisma/client";
import { useRouter } from "next/navigation";
import InviteUserForm from "@/components/InviteUserForm";
import ConfirmationModal from "@/components/AccountManagement/ConfirmationModal";
import EditModal from "@/components/AccountManagement/EditModal";
import { useApiClient } from "@/hooks/useApiClient";
import { isStaff, isAdmin, formatUserType } from "@/lib/userUtils";
import { useUser } from "@/components/context/UserContext";
import AccountDropdown from "@/components/AccountManagement/AccountDropdown";
import AccountStatusTag from "@/components/tags/AccountStatusTag";
import AdvancedBaseTable, {
  FilterList,
  extendTableHeader,
} from "@/components/baseTable/AdvancedBaseTable";

type UserOrInvite =
  | (User & { isInvite?: false })
  | (UserInvite & { isInvite: true; tag?: string });

type UsersWithInvitesResponse = {
  users: User[];
  invites: UserInvite[];
};

export default function AccountManagementPage() {
  const { apiClient } = useApiClient();
  const { user: currentUser } = useUser();

  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOrInvite | null>(null);
  const [baseTableReloadKey, setBaseTableReloadKey] = useState(0);

  const refetchData = () => {
    setBaseTableReloadKey((prev) => prev + 1);
  };

  const router = useRouter();

  const handleInviteSubmit = (role: UserType) => {
    if (role === "PARTNER") {
      setInviteModalOpen(false);
      router.push("/createPartnerAccount");
    } else {
      console.log("Sending invite link for", role);
    }
  };

  const handleDeleteAccount = (user: UserOrInvite) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleEditAccount = (user: UserOrInvite) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeactivateAccount = (user: UserOrInvite) => {
    setSelectedUser(user);
    setDeactivateModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.isInvite) {
        const invite = selectedUser as UserInvite;
        await apiClient.delete(`/api/invites/${invite.token}`);
      } else {
        console.log("Delete user account for:", selectedUser);
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
    if (!selectedUser || selectedUser.isInvite) return;

    try {
      await apiClient.patch(`/api/users/${selectedUser.id}`, {
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
          tag: data.tag,
        }),
      });
      refetchData();
    } catch (error) {
      console.error("Error updating user:", error);
    }

    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const confirmDeactivateAccount = async () => {
    if (!selectedUser || selectedUser.isInvite) return;

    try {
      const isCurrentlyEnabled = (selectedUser as User).enabled;
      await apiClient.patch(`/api/users/${selectedUser.id}`, {
        body: JSON.stringify({ enabled: !isCurrentlyEnabled }),
      });
      refetchData();
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
      filters: FilterList<UserOrInvite>
    ) => {
      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        page: page.toString(),
        filters: JSON.stringify(filters),
      });
      const { users, invites } = await apiClient.get<UsersWithInvitesResponse>(
        `/api/users?includeInvites=true&${params.toString()}`
      );
      const allItems: UserOrInvite[] = [
        ...(invites || []).map((invite) => ({
          ...invite,
          isInvite: true as const,
        })),
        ...(users || []).map((user) => ({
          ...user,
          isInvite: false as const,
        })),
      ];
      return {
        data: allItems,
        total: allItems.length,
      };
    },
    [apiClient]
  );

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
        headers={[
          "Name",
          "Email",
          "Role",
          "Tag",
          "Status",
          extendTableHeader("Manage", "w-1/12"),
        ]}
        reloadKey={baseTableReloadKey}
        renderRow={(item) => {
          const roleType = item.isInvite ? item.userType : item.type!;
          const roleText = formatUserType(roleType);

          const status: string = item.isInvite
            ? "expiration" in item &&
              item.expiration &&
              new Date() >= new Date(item.expiration)
              ? "Expired"
              : "Pending invite"
            : "enabled" in item && item.enabled === false
              ? "Deactivated"
              : "Activated";

          const tagNode = item.tag ? (
            <span
              key="tag"
              className="px-3 py-1 bg-red-primary/70 text-white rounded-md text-sm"
            >
              {item.tag}
            </span>
          ) : (
            <span key="tag" className="italic text-gray-400">
              No tag
            </span>
          );

          return {
            cells: [
              item.name,
              item.email,
              roleText,
              tagNode,
              <AccountStatusTag status={status} key="status" />,
              <div
                className="float-right"
                key="options"
                onClick={(e) => e.stopPropagation()}
              >
                <AccountDropdown
                  isInvite={!!item.isInvite}
                  user={!item.isInvite ? (item as User) : undefined}
                  onDeleteAccount={() => handleDeleteAccount(item)}
                  onEditAccount={() => handleEditAccount(item)}
                  onDeactivateAccount={() => handleDeactivateAccount(item)}
                />
              </div>,
            ],
            onClick: () => {},
            className: "text-gray-primary",
          };
        }}
        fetchFn={fetchFn}
        filterableCols={["name", "email"]}
        filterLabels={["Name", "Email"]}
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
          selectedUser &&
          !selectedUser.isInvite &&
          (selectedUser as User).enabled
            ? "Deactivate account"
            : "Activate account"
        }
        text={
          selectedUser &&
          !selectedUser.isInvite &&
          (selectedUser as User).enabled
            ? `Are you sure you would like to deactivate this account?
For partner accounts, deactivation means the partner will no longer have access to request distributions. However, admins will still retain access to view all historical data associated with the account.`
            : `Are you sure you would like to activate this account?
This will restore the user's access to the system.`
        }
        icon={
          selectedUser &&
          !selectedUser.isInvite &&
          (selectedUser as User).enabled ? (
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
          selectedUser &&
          !selectedUser.isInvite &&
          (selectedUser as User).enabled
            ? "Deactivate"
            : "Activate"
        }
      />

      <EditModal
        title={
          selectedUser && !selectedUser.isInvite && isStaff(selectedUser.type)
            ? "Edit staff account"
            : "Edit account"
        }
        isOpen={isEditModalOpen}
        onClose={closeAllModals}
        onCancel={closeAllModals}
        onConfirm={confirmEditAccount}
        initialData={
          selectedUser && !selectedUser.isInvite
            ? {
                name: selectedUser.name,
                email: selectedUser.email,
                role: selectedUser.type || "STAFF",
                tag: selectedUser.tag || "",
              }
            : undefined
        }
        isStaffAccount={
          selectedUser && !selectedUser.isInvite
            ? isStaff(selectedUser.type)
            : true
        }
        selectedUserId={
          selectedUser && !selectedUser.isInvite ? selectedUser.id : undefined
        }
      />
    </>
  );
}
