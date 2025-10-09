import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";

export default function ItemRequestTable({
  requests,
}: {
  requests: UnallocatedItemData["requests"];
}) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Partner
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Date
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Quantity
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Priority
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {requests.map((request) => (
          <tr key={request.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {request.partner.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {new Date(request.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {request.quantity}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {request.priority ?? "N/A"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
