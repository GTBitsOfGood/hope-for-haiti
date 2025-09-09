import { DotsThree } from "@phosphor-icons/react";
import { UserType } from "@prisma/client";
import { formatUserType } from "@/lib/userUtils";

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
  onManageClick,
}: TableRowProps) {
  return (
    <tr
      key={index}
      data-odd={index % 2 !== 0}
      className="bg-white data-[odd=false]:bg-sunken border-b border-gray-primary/10 text-gray-primary"
    >
      <td className="border-b px-4 py-4">{user.name}</td>
      <td className="border-b px-4 py-4">{user.email}</td>
      <td className="border-b px-4 py-4">
        {formatUserType(user.type || user.userType!)}
      </td>
      <td className="border-b px-4 py-4">
        <span
          className={`px-3 py-2 rounded whitespace-nowrap ${
            isInvite ? "bg-yellow-primary" : "bg-green-primary"
          }`}
        >
          {isInvite ? "Pending" : "Account created"}
        </span>
      </td>
      <td className="border-b px-4 py-4">
        <div className="float-right">
          <DotsThree
            weight="bold"
            className="cursor-pointer"
            onClick={() => onManageClick?.(user)}
          />
        </div>
      </td>
    </tr>
  );
}
