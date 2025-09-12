"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { User, UserType } from "@prisma/client";
import { useRouter } from "next/navigation";
import InviteUserForm from "@/components/InviteUserForm";
import TableRow from "@/components/AccountManagement/TableRow";
import ConfirmationModal from "@/components/AccountManagement/ConfirmationModal";
import EditModal from "@/components/AccountManagement/EditModal";
import { useFetch } from "@/hooks/useFetch";
import { isStaff, isPartner } from "@/lib/userUtils";
import { EyeSlash, Trash, EnvelopeSimple } from "@phosphor-icons/react";

type UserInvite = {
  id: number;
  email: string;
  name: string;
  userType: UserType;
  expiration: Date;
  tag?: string;
};

type UserOrInvite =
  | (User & { isInvite?: false })
  | (UserInvite & { isInvite: true });

enum UserFilterKey {
  ALL = "All",
  INVITES = "Invites",
  STAFF = "Hope for Haiti Staff",
  PARTNERS = "Partners",
}

const filterMap: Record<UserFilterKey, (item: UserOrInvite) => boolean> = {
  [UserFilterKey.ALL]: () => true,
  [UserFilterKey.INVITES]: (item) => item.isInvite === true,
  [UserFilterKey.STAFF]: (item) => !item.isInvite && isStaff(item.type),
  [UserFilterKey.PARTNERS]: (item) => !item.isInvite && isPartner(item.type),
};

export default function AccountManagementPage() {
  const { data: users, isLoading: isLoadingUsers } = useFetch<User[]>(
    "/api/users",
    {
      cache: "no-store",
    }
  );
  const { data: invites, isLoading: isLoadingInvites } = useFetch<UserInvite[]>(
    "/api/invites",
    {
      cache: "no-store",
    }
  );

  const [filteredItems, setFilteredItems] = useState<UserOrInvite[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isSendReminderModalOpen, setSendReminderModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOrInvite | null>(null);

  const isLoading = isLoadingUsers || isLoadingInvites;

  const applyFilters = (tabFilter: UserFilterKey, search: string) => {
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
  };

  useEffect(() => {
    applyFilters(activeTab as UserFilterKey, searchQuery);
  }, [users, invites, activeTab, searchQuery]);

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

  // Modal handlers
  const handleSendReminder = (user: UserOrInvite) => {
    setSelectedUser(user);
    setSendReminderModalOpen(true);
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

  // Modal action handlers
  const confirmSendReminder = () => {
    console.log("Send reminder for:", selectedUser);
    // TODO: Implement send reminder API call
    setSendReminderModalOpen(false);
    setSelectedUser(null);
  };

  const confirmDeleteAccount = () => {
    console.log("Delete account for:", selectedUser);
    // TODO: Implement delete account API call
    setDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const confirmEditAccount = (data: {
    name: string;
    email: string;
    role: UserType;
  }) => {
    console.log("Edit account for:", selectedUser, "with data:", data);
    // TODO: Implement edit account API call
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const confirmDeactivateAccount = () => {
    console.log("Deactivate account for:", selectedUser);
    // TODO: Implement deactivate account API call
    setDeactivateModalOpen(false);
    setSelectedUser(null);
  };

  // Modal close handlers
  const closeAllModals = () => {
    setSendReminderModalOpen(false);
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
        <button
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
          onClick={() => setInviteModalOpen(true)}
        >
          <Plus size={18} /> Add account
        </button>
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
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-gray-primary/5 border-b-2 border-gray-primary/10 text-gray-primary/70">
                <th className="px-4 py-4 text-left w-1/5 rounded-tl-lg font-normal">
                  Name
                </th>
                <th className="px-4 py-4 text-left w-1/5 font-normal">Email</th>
                <th className="px-4 py-4 text-left w-1/6 font-normal">Role</th>
                <th className="px-4 py-4 text-left w-1/6 font-normal">Tag</th>
                <th className="px-4 py-4 text-left w-1/6 font-normal">
                  Status
                </th>
                <th className="px-4 py-4 text-right rounded-tr-lg w-1/12 font-normal">
                  Manage
                </th>
              </tr>
            </thead>
          </table>

          {/* Scrollable Body */}
          <div className="overflow-y-auto max-h-[63vh]">
            <table className="w-full table-fixed">
              <tbody>
                {filteredItems.map((item, index) => (
                  <TableRow
                    key={`${item.isInvite ? "invite" : "user"}-${item.id}`}
                    user={item}
                    index={index}
                    isInvite={item.isInvite}
                    onSendReminder={() => handleSendReminder(item)}
                    onDeleteAccount={() => handleDeleteAccount(item)}
                    onEditAccount={() => handleEditAccount(item)}
                    onDeactivateAccount={() => handleDeactivateAccount(item)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <InviteUserForm
          closeModal={() => setInviteModalOpen(false)}
          onSubmit={handleInviteSubmit}
        />
      )}

      {/* Account Management Modals */}
      <ConfirmationModal
        title="Send reminder"
        text={`Are you sure you would like to send a reminder to this user?
This will send an email reminder about their pending invitation.`}
        icon={<EnvelopeSimple size={78} />}
        isOpen={isSendReminderModalOpen}
        onClose={closeAllModals}
        onCancel={closeAllModals}
        onConfirm={confirmSendReminder}
        confirmText="Send reminder"
        confirmButtonClass="bg-blue-500 hover:bg-blue-600 text-white"
      />

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
        title="Deactivate account"
        text={`Are you sure you would like to deactivate this account?
For partner accounts, deactivation means the partner will no longer have access to request distributions. However, admins will still retain access to view all historical data associated with the account.`}
        icon={<EyeSlash size={78} />}
        isOpen={isDeactivateModalOpen}
        onClose={closeAllModals}
        onCancel={closeAllModals}
        onConfirm={confirmDeactivateAccount}
        confirmText="Deactivate"
      />

      <EditModal
        title="Edit staff account"
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
              }
            : undefined
        }
      />
    </>
  );
}
