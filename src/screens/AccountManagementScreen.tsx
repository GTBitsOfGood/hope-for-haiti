"use client";

import { useEffect, useState } from "react";
import { DotsThree, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { User, UserType } from "@prisma/client";
import { useRouter } from "next/navigation";
import InviteUserForm from "@/components/InviteUserForm";

enum UserFilterKey {
  ALL = "All",
  STAFF = "Hope for Haiti Staff",
  PARTNERS = "Partners",
}

const filterMap: Record<UserFilterKey, (user: User) => boolean> = {
  [UserFilterKey.ALL]: () => true,
  [UserFilterKey.STAFF]: (user) =>
    user.type === UserType.STAFF ||
    user.type === UserType.ADMIN ||
    user.type === UserType.SUPER_ADMIN,
  [UserFilterKey.PARTNERS]: (user) => user.type === UserType.PARTNER,
};

function formatUserType(type: UserType): string {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AccountManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          setFilteredUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filterUsers = (type: UserFilterKey) => {
    setActiveTab(type);
    setFilteredUsers(users.filter(filterMap[type]));
  };

  const router = useRouter();
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

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
              {filteredUsers.map((user, index) => (
                <tr
                  key={index}
                  data-odd={index % 2 !== 0}
                  className="bg-white data-[odd=true]:bg-gray-50"
                >
                  <td className="border-b px-4 py-2">{user.name}</td>
                  <td className="border-b px-4 py-2">{user.email}</td>
                  <td className="border-b px-4 py-2">
                    {formatUserType(user.type)}
                  </td>
                  <td className="border-b px-4 py-2">
                    <span className="px-2 py-1 rounded bg-green-primary whitespace-nowrap">
                      Account created
                    </span>
                  </td>
                  <td className="border-b px-4 py-2">
                    <div className="float-right">
                      <DotsThree
                        weight="bold"
                        className="cursor-pointer"
                        onClick={() => {}}
                      />
                    </div>
                  </td>
                </tr>
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
