"use client";

import { useEffect, useState } from "react";
import { DotsThree, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { User, UserType } from "@prisma/client";
import classNames from "classnames";

function formatUserType(type: UserType): string {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const filterMap: Record<string, (user: User) => boolean> = {
  All: () => true,
  "Hope for Haiti Staff": (user) => user.type === UserType.STAFF,
  Partners: (user) => user.type === UserType.PARTNER,
};

export default function AccountManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
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

  const filterUsers = (type: string) => {
    setActiveTab(type);
    setFilteredUsers(users.filter(filterMap[type]));
  };

  return (
    <div>
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
        <button className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition">
          <Plus size={18} /> Add account
        </button>
      </div>
      <div className="flex space-x-4 mt-4 border-b-2">
        {Object.keys(filterMap).map((tab) => (
          <button
            key={tab}
            className={classNames(
              "px-4 py-2 text-md font-medium relative -mb-px",
              {
                "border-b-2 border-black bottom-[-1px]": activeTab === tab,
                "text-gray-500": activeTab !== tab,
              }
            )}
            onClick={() => filterUsers(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <table className="min-w-full mt-4 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100 border-b-2">
              <th className="px-4 py-2 text-left font-normal">Name</th>
              <th className="px-4 py-2 text-left font-normal">Email</th>
              <th className="px-4 py-2 text-left font-normal">Role</th>
              <th className="px-4 py-2 text-left font-normal">Status</th>
              <th className="px-4 py-2 text-left font-normal">Manage</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr
                key={index}
                className={classNames({
                  "bg-white": index % 2 === 0,
                  "bg-gray-50": index % 2 !== 0,
                })}
              >
                <td className="border px-4 py-2">{user.name}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">
                  {formatUserType(user.type)}
                </td>
                <td className="border-b border-l px-4 py-2">
                  <span className="px-2 py-1 rounded bg-green-primary whitespace-nowrap">
                    Account created
                  </span>
                </td>
                <td className="border-b border-r w-2 px-2 py-2">
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
      )}
    </div>
  );
}
