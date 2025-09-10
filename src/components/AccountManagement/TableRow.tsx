import { UserType } from "@prisma/client";
import { formatUserType } from "@/lib/userUtils";
import AccountDropdown from "./AccountDropdown";

interface TableRowItem {
  id: number;
  email: string;
  name: string;
  type?: UserType;
  userType?: UserType;
  isInvite?: boolean;
}

interface TableRowProps {
  user: TableRowItem;
  index: number;
  isInvite?: boolean;
  onManageClick?: (user: TableRowItem) => void;
}

export default function TableRow({
  user,
  index,
  isInvite = false,
}: TableRowProps) {
  const userType = user.type || user.userType;

  const handleSendReminder = () => {
    console.log("Send reminder for:", user);
    // TODO: Implement send reminder functionality
  };

  const handleDeleteAccount = () => {
    console.log("Delete account for:", user);
    // TODO: Implement delete account functionality
  };

  const handleEditAccount = () => {
    console.log("Edit account for:", user);
    // TODO: Implement edit account functionality
  };

  const handleDeactivateAccount = () => {
    console.log("Deactivate account for:", user);
    // TODO: Implement deactivate account functionality
  };

  return (
    <tr
      key={index}
      data-odd={index % 2 !== 0}
      className="bg-white data-[odd=false]:bg-sunken border-b border-gray-primary/10 text-gray-primary"
    >
      <td className="border-b px-4 py-4 w-1/4">{user.name}</td>
      <td className="border-b px-4 py-4 w-1/4">{user.email}</td>
      <td className="border-b px-4 py-4 w-1/5">
        {formatUserType(user.type || user.userType!)}
      </td>
      <td className="border-b px-4 py-4 w-1/5">
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
            onSendReminder={handleSendReminder}
            onDeleteAccount={handleDeleteAccount}
            onEditAccount={handleEditAccount}
            onDeactivateAccount={handleDeactivateAccount}
          />
        </div>
      </td>
    </tr>
  );
}
