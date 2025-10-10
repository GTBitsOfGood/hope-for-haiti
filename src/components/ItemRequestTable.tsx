import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";

export default function ItemRequestTable({
  requests,
}: {
  requests: UnallocatedItemData["requests"];
}) {
  const headerClassName =
    "text-left bg-gray-primary/5 text-gray-primary/70 border-b-2 border-gray-primary/10";

  const rowCellClassName = "text-gray-primary/90";

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th
            className={headerClassName}
          >
            Partner
          </th>
          <th
            className={headerClassName}
          >
            Requested On
          </th>
          <th
            className={headerClassName}
          >
            Quantity
          </th>
          <th
            className={headerClassName}
          >
            Priority
          </th>
          <th className={headerClassName}>
            Comments
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {requests.map((request) => (
          <tr key={request.id}>
            <td className={rowCellClassName}>
              {request.partner.name}
            </td>
            <td className={rowCellClassName}>
              {new Date(request.createdAt).toLocaleDateString()}
            </td>
            <td className={rowCellClassName}>
              {request.quantity}
            </td>
            <td className={rowCellClassName}>
              {request.priority ?? "N/A"}
            </td>
            <td className={rowCellClassName}>
              {request.comments ?? "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
