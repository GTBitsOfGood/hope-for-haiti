"use client";

import { useState, useEffect, useCallback } from "react";
import { MagnifyingGlass, Plus, EyeSlash, Trash, Eye } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { User, UserType } from "@prisma/client";
import { useRouter } from "next/navigation";
import InviteUserForm from "@/components/InviteUserForm";
import ConfirmationModal from "@/components/AccountManagement/ConfirmationModal";
import EditModal from "@/components/AccountManagement/EditModal";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import { isStaff, isPartner, isAdmin, formatUserType } from "@/lib/userUtils";
import { useUser } from "@/components/context/UserContext";
import BaseTable, { extendTableHeader } from "@/components/BaseTable";
import AccountDropdown from "@/components/AccountManagement/AccountDropdown";
import AccountStatusTag from "@/components/tags/AccountStatusTag";

type UserInvite = {
  id: number;
  token: string;
  email: string;
  name: string;
  userType: UserType;
  expiration: Date;
  tag?: string;
};

type UserOrInvite =
  | (User & { isInvite?: false })
  | (UserInvite & { isInvite: true });

type UsersWithInvitesResponse = {
  users: User[];
  invites: UserInvite[];
};

const EMPTY_USERS: User[] = [];
const EMPTY_INVITES: UserInvite[] = [];

enum UserFilterKey {
  ALL = "All",
  INVITES = "Invites",
  EXPIRED = "Expired",
  DEACTIVATED = "Deactivated",
  STAFF = "Hope for Haiti Staff",
  PARTNERS = "Partners",
}

const filterMap: Record<UserFilterKey, (item: UserOrInvite) => boolean> = {
  [UserFilterKey.ALL]: () => true,
  [UserFilterKey.INVITES]: (item) =>
    item.isInvite === true &&
    new Date() < new Date((item as UserInvite).expiration),
  [UserFilterKey.EXPIRED]: (item) =>
    item.isInvite === true &&
    new Date() >= new Date((item as UserInvite).expiration),
  [UserFilterKey.DEACTIVATED]: (item) =>
    !item.isInvite && !(item as User).enabled,
  [UserFilterKey.STAFF]: (item) =>
    !item.isInvite && (item as User).enabled && isStaff((item as User).type),
  [UserFilterKey.PARTNERS]: (item) =>
    !item.isInvite && (item as User).enabled && isPartner((item as User).type),
};

export default function AccountManagementPage() {
  const { apiClient } = useApiClient();
  const { user: currentUser } = useUser();

  const {
    data: usersData,
    isLoading,
    refetch: refetchData,
  } = useFetch<UsersWithInvitesResponse>("/api/users?includeInvites=true", {
    cache: "no-store",
  });

  const users = usersData?.users ?? EMPTY_USERS;
  const invites = usersData?.invites ?? EMPTY_INVITES;

  const [filteredItems, setFilteredItems] = useState<UserOrInvite[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOrInvite | null>(null);

  const applyFilters = useCallback((tabFilter: UserFilterKey, search: string) => {
    const allItems: UserOrInvite[] = [
      ...(invites || []).map((invite) => ({
        ...invite,
        isInvite: true as const,
      })),
      ...(users || []).map((user) => ({ ...user, isInvite: false as const })),
    ];

    let filtered = allItems.filter(filterMap[tabFilter]);

    if (search.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [usersData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyFilters(activeTab as UserFilterKey, searchQuery);
  }, [applyFilters, activeTab, searchQuery]);

  const filterUsers = (type: UserFilterKey) => {
    setActiveTab(type);
    applyFilters(type, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(activeTab as UserFilterKey, query);
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
        refetchData();
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

  return (
    <>
      <h1 className="text-3xl text-gray-primary font-bold">
        Account Management
      </h1>

      <div className="flex justify-between items-center w-full pt-6">
        <div className="relative w-1/3">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-primary/50"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 text-gray-primary/50 w-full border border-gray-primary/10 rounded-lg bg-[#F9F9F9] focus:outline-none focus:border-gray-400"
          />
        </div>
        {currentUser && isAdmin(currentUser.type) && (
          <button
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
            onClick={() => setInviteModalOpen(true)}
          >
            <Plus size={18} /> Add account
          </button>
        )}
      </div>

      <div className="flex space-x-4 my-3 border-b-2">
        {Object.keys(filterMap).map((tab) => {
          const key = tab as UserFilterKey;

          return (
            <button
              key={tab}
              data-active={activeTab === tab}
              className="px-1 py-1 text-md font-medium relative -mb-px transition-colors focus:outline-none data-[active=true]:text-gray-primary data-[active=true]:border-b-2 data-[active=true]:border-gray-primary/70 data-[active=true]:border-black data-[active=true]:bottom-[-1px] data-[active=false]:text-gray-primary/70"
              onClick={() => filterUsers(key)}
            >
              <div className="hover:bg-gray-primary/5 px-2 py-1 rounded">
                {tab}
              </div>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <BaseTable
          headers={[
            "Name",
            "Email",
            "Role",
            "Tag",
            "Status",
            extendTableHeader("Manage", "w-1/12"),
          ]}
          rows={filteredItems.map((item) => {
            const roleType = item.isInvite ? item.userType : item.type!;
            const roleText = formatUserType(roleType);

            const status: string = item.isInvite
              ? ("expiration" in item && item.expiration && new Date() >= new Date(item.expiration)
                  ? "Expired"
                  : "Pending invite")
              : ("enabled" in item && item.enabled === false
                  ? "Deactivated"
                  : "Activated");

            const tagNode = item.tag ? (
              <span key="tag" className="px-3 py-1 bg-red-primary/70 text-white rounded-md text-sm">{item.tag}</span>
            ) : (
              <span key="tag" className="italic text-gray-400">No tag</span>
            );

            return {
              cells: [
                item.name,
                item.email,
                roleText,
                tagNode,
                <AccountStatusTag status={status} key="status" />,
                <div className="float-right" key="options" onClick={(e) => e.stopPropagation()}>
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
          })}
        />
      )}

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
