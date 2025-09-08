import { DotsThree } from "@phosphor-icons/react";
import { User } from "@prisma/client";
import { formatUserType } from "@/lib/userUtils";

interface TableRowProps {
  user: User;
  index: number;
  isInvite?: boolean;
  onManageClick?: (user: User) => void;
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
      className="bg-white data-[odd=true]:bg-gray-50"
    >
      <td className="border-b px-4 py-2">{user.name}</td>
      <td className="border-b px-4 py-2">{user.email}</td>
      <td className="border-b px-4 py-2">{formatUserType(user.type)}</td>
      <td className="border-b px-4 py-2">
        <span
          className={`px-2 py-1 rounded whitespace-nowrap ${
            isInvite ? "bg-yellow-primary" : "bg-green-primary"
          }`}
        >
          {isInvite ? "Pending" : "Account created"}
        </span>
      </td>
      <td className="border-b px-4 py-2">
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
