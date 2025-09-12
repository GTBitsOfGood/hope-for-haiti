import { UserType } from "@prisma/client";
import { formatUserType } from "@/lib/userUtils";
import AccountDropdown from "./AccountDropdown";

interface TableRowItem {
  id: number;
  email: string;
  name: string;
  tag?: string;
  type?: UserType;
  userType?: UserType;
  isInvite?: boolean;
}

interface TableRowProps {
  user: TableRowItem;
  index: number;
  isInvite?: boolean;
  onSendReminder?: () => void;
  onDeleteAccount?: () => void;
  onEditAccount?: () => void;
  onDeactivateAccount?: () => void;
}

export default function TableRow({
  user,
  index,
  isInvite = false,
  onSendReminder,
  onDeleteAccount,
  onEditAccount,
  onDeactivateAccount,
}: TableRowProps) {
  const userType = user.type || user.userType;

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
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {user.tag}
          </span>
        ) : (
          <span className="italic text-gray-400">No tag</span>
        )}
      </td>
      <td className="border-b px-4 py-4 w-1/6">
        <span
          className={`px-3 py-2 rounded whitespace-nowrap ${
            isInvite ? "bg-yellow-primary" : "bg-green-primary"
          }`}
        >
          {isInvite ? "Pending" : "Account created"}
        </span>
      </td>
      <td className="border-b px-4 py-4 w-1/12 text-right">
        <div className="inline-block" onClick={(e) => e.stopPropagation()}>
          <AccountDropdown
            isInvite={isInvite}
            userType={userType}
            onSendReminder={onSendReminder}
            onDeleteAccount={onDeleteAccount}
            onEditAccount={onEditAccount}
            onDeactivateAccount={onDeactivateAccount}
          />
        </div>
      </td>
    </tr>
  );
}
