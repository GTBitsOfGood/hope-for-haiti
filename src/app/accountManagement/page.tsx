"use client";

import { useState, useEffect } from "react";
import { DotsThree, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { User, UserType } from "@prisma/client";
import { useRouter } from "next/navigation";
import InviteUserForm from "@/components/InviteUserForm";
import { useFetch } from "@/hooks/useFetch";
import { isStaff, isPartner, formatUserType } from "@/lib/userUtils";
import BaseTable, { extendTableHeader } from "@/components/BaseTable";

enum UserFilterKey {
  ALL = "All",
  STAFF = "Hope for Haiti Staff",
  PARTNERS = "Partners",
}

const filterMap: Record<UserFilterKey, (user: User) => boolean> = {
  [UserFilterKey.ALL]: () => true,
  [UserFilterKey.STAFF]: (user) => isStaff(user.type),
  [UserFilterKey.PARTNERS]: (user) => isPartner(user.type),
};

export default function AccountManagementPage() {
  const { data: users, isLoading } = useFetch<User[]>("/api/users", {
    cache: "no-store",
  });
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    setFilteredUsers(users || []);
  }, [users]);

  const filterUsers = (type: UserFilterKey) => {
    setActiveTab(type);
    setFilteredUsers((users || []).filter(filterMap[type]));
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

  return (
    <>
      <h1 className="text-2xl font-semibold">Account Management</h1>
      <div className="flex justify-between items-center w-full py-4">
        <div className="relative w-1/3">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:border-gray-400"
          />
        </div>
        <button
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
          onClick={() => setInviteModalOpen(true)}
        >
          <Plus size={18} /> Add account
        </button>
      </div>
      <div className="flex space-x-4 mt-4 border-b-2">
        {Object.keys(filterMap).map((tab) => {
          const key = tab as UserFilterKey;

          return (
            <button
              key={tab}
              data-active={activeTab === tab}
              className="px-2 py-1 text-md font-medium relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-black data-[active=true]:bottom-[-1px] data-[active=false]:text-gray-500"
              onClick={() => filterUsers(key)}
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
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
            "Status",
            extendTableHeader("Manage", "w-1/12"),
          ]}
          rows={filteredUsers.map((user) => ({
            cells: [
              user.name,
              user.email,
              formatUserType(user.type),
              <span
                className="px-2 py-1 rounded bg-green-primary whitespace-nowrap"
                key="status"
              >
                Account created
              </span>,
              <div className="float-right" key="options">
                <DotsThree
                  weight="bold"
                  className="cursor-pointer"
                  onClick={() => {}}
                />
              </div>,
            ],
          }))}
          pageSize={10}
        />
      )}

      {isInviteModalOpen && (
        <InviteUserForm
          closeModal={() => setInviteModalOpen(false)}
          onSubmit={handleInviteSubmit}
        />
      )}
    </>
  );
}
