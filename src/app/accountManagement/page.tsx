"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { User, UserType } from "@prisma/client";
import { useRouter } from "next/navigation";
import InviteUserForm from "@/components/InviteUserForm";
import TableRow from "@/components/AccountManagement/TableRow";
import { useFetch } from "@/hooks/useFetch";
import { isStaff, isPartner } from "@/lib/userUtils";

type UserInvite = {
  id: number;
  email: string;
  name: string;
  userType: UserType;
  expiration: Date;
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

  const isLoading = isLoadingUsers || isLoadingInvites;

  useEffect(() => {
    const allItems: UserOrInvite[] = [
      ...(invites || []).map((invite) => ({
        ...invite,
        isInvite: true as const,
      })),
      ...(users || []).map((user) => ({ ...user, isInvite: false as const })),
    ];
    setFilteredItems(allItems);
  }, [users, invites]);

  const filterUsers = (type: UserFilterKey) => {
    setActiveTab(type);
    const allItems: UserOrInvite[] = [
      ...(invites || []).map((invite) => ({
        ...invite,
        isInvite: true as const,
      })),
      ...(users || []).map((user) => ({ ...user, isInvite: false as const })),
    ];
    setFilteredItems(allItems.filter(filterMap[type]));
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
        <div className="overflow-x-scroll">
          <table className="mt-4">
            <thead>
              <tr className="bg-gray-100 border-b-2 font-bold">
                <th className="px-4 py-2 text-left w-1/5 rounded-tl-lg">
                  Name
                </th>
                <th className="px-4 py-2 text-left w-1/5">Email</th>
                <th className="px-4 py-2 text-left w-1/5">Role</th>
                <th className="px-4 py-2 text-left w-1/5">Status</th>
                <th className="px-4 py-2 text-left rounded-tr-lg w-1/12">
                  Manage
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <TableRow
                  key={`${item.isInvite ? "invite" : "user"}-${item.id}`}
                  user={item}
                  index={index}
                  isInvite={item.isInvite}
                  onManageClick={(user) => {
                    console.log("Manage user:", user);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
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
