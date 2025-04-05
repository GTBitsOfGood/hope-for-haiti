// Define donor offer item data type based on schema
export type DonorOfferItem = {
  title: string;
  type: string;
  expiration?: Date;
  unitType?: string;
  quantityPerUnit?: string;
  quantity: number;
};

interface PreviewTableProps {
  data: DonorOfferItem[];
}

export const PreviewTable = ({ data }: PreviewTableProps) => (
  <div className="p-4 mt-6 bg-zinc-100 border border-zinc-300 rounded">
    <div className="overflow-x-scroll">
      <table className="rounded overflow-hidden min-w-full">
        <thead>
          <tr className="bg-blue-primary opacity-80 text-white border-b-2">
            <th className="px-4 py-2 text-left font-bold">Title</th>
            <th className="px-4 py-2 text-left font-bold">Type</th>
            <th className="px-4 py-2 text-left font-bold">Quantity</th>
            <th className="px-4 py-2 text-left font-bold">Unit Type</th>
            <th className="px-4 py-2 text-left font-bold">Quantity Per Unit</th>
            <th className="px-4 py-2 text-left font-bold">Expiration</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              data-odd={index % 2 !== 0}
              className="bg-white data-[odd=true]:bg-gray-50 border transition-colors"
            >
              <td className="px-4 py-2">{item.title}</td>
              <td className="px-4 py-2">{item.type}</td>
              <td className="px-4 py-2">{item.quantity}</td>
              <td className="px-4 py-2">{item.unitType || '-'}</td>
              <td className="px-4 py-2">{item.quantityPerUnit || '-'}</td>
              <td className="px-4 py-2">
                {item.expiration ? new Date(item.expiration).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
); 