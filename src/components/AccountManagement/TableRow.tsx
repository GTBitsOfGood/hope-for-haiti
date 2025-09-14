import { UserType } from "@prisma/client";
import { formatUserType } from "@/lib/userUtils";
import AccountDropdown from "./AccountDropdown";

export interface TableRowItem {
  id: number;
  token?: string;
  email: string;
  name: string;
  tag?: string | null;
  type?: UserType;
  userType?: UserType;
  isInvite?: boolean;
  enabled?: boolean;
  expiration?: Date;
}

interface TableRowProps {
  user: TableRowItem;
  index: number;
  isInvite?: boolean;
  onDeleteAccount?: () => void;
  onEditAccount?: () => void;
  onDeactivateAccount?: () => void;
}

export default function TableRow({
  user,
  index,
  isInvite = false,
  onDeleteAccount,
  onEditAccount,
  onDeactivateAccount,
}: TableRowProps) {
  const userType = user.type || user.userType;

  const getStatus = () => {
    if (isInvite) {
      const inviteUser = user as TableRowItem & { expiration?: Date };
      if (
        inviteUser.expiration &&
        new Date() >= new Date(inviteUser.expiration)
      ) {
        return { text: "Expired", className: "bg-red-primary/70" };
      }
      return { text: "Pending", className: "bg-yellow-primary" };
    } else {
      const regularUser = user as TableRowItem & { enabled?: boolean };
      if (regularUser.enabled === false) {
        return { text: "Deactivated", className: "bg-red-primary/70" };
      }
      return { text: "Activated", className: "bg-green-primary" };
    }
  };

  const status = getStatus();

  return (
    <tr
      key={index}
      data-odd={index % 2 !== 0}
      className="bg-white data-[odd=false]:bg-sunken border-b border-gray-primary/10 text-gray-primary"
    >
      <td className="border-b px-4 py-4 w-1/5">{user.name}</td>
      <td className="border-b px-4 py-4 w-1/5">{user.email}</td>
      <td className="border-b px-4 py-4 w-1/6">
        {formatUserType(user.type || user.userType!)}
      </td>
      <td className="border-b px-4 py-4 w-1/6">
        {user.tag ? (
          <span className="px-3 py-1 bg-red-primary/70 text-white rounded-md text-sm">
            {user.tag}
          </span>
        ) : (
          <span className="italic text-gray-400">No tag</span>
        )}
      </td>
      <td className="border-b px-4 py-4 w-1/6">
        <span
          className={`px-3 py-2 rounded whitespace-nowrap ${status.className}`}
        >
          {status.text}
        </span>
      </td>
      <td className="border-b px-4 py-4 w-1/12 text-right">
        <div className="inline-block" onClick={(e) => e.stopPropagation()}>
          <AccountDropdown
            isInvite={isInvite}
            userType={userType}
            user={user}
            onDeleteAccount={onDeleteAccount}
            onEditAccount={onEditAccount}
            onDeactivateAccount={onDeactivateAccount}
          />
        </div>
      </td>
    </tr>
  );
}
