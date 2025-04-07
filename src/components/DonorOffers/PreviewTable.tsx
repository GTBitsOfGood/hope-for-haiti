// Define donor offer item data type based on schema
export type DonorOfferItem = {
  title: string;
  type: string;
  expirationDate: Date;
  unitType: string;
  quantityPerUnit: string;
  quantity: number;

  unitPrice?: number;
  lotNumber?: string;
  palletNumber?: string;
  boxNumber?: string;
  maxRequestLimit?: string;
  donorShippingNumber?: string;
  hfhShippingNumber?: string;
  visible?: boolean;
  notes?: string;
};

interface PreviewTableProps {
  data: DonorOfferItem[];
  final: boolean;
}

export const PreviewTable = ({ data, final }: PreviewTableProps) => (
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
            {final && (
              <>
                <th className="px-4 py-2 text-left font-bold">Unit Price</th>
                <th className="px-4 py-2 text-left font-bold">Lot</th>
                <th className="px-4 py-2 text-left font-bold">Pallet</th>
                <th className="px-4 py-2 text-left font-bold">Box</th>
                <th className="px-4 py-2 text-left font-bold">Max Limit</th>
                <th className="px-4 py-2 text-left font-bold">
                  Donor Shipping #
                </th>
                <th className="px-4 py-2 text-left font-bold">
                  HfH Shipping #
                </th>
                <th className="px-4 py-2 text-left font-bold">Visibility</th>
                <th className="px-4 py-2 text-left font-bold">Comment</th>
              </>
            )}
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
              <td className="px-4 py-2">{item.unitType || "-"}</td>
              <td className="px-4 py-2">{item.quantityPerUnit || "-"}</td>
              <td className="px-4 py-2">
                {item.expirationDate
                  ? new Date(item.expirationDate).toLocaleDateString()
                  : "-"}
              </td>
              {final && (
                <>
                  <td className="px-4 py-2">{item.unitPrice}</td>
                  <td className="px-4 py-2">{item.lotNumber}</td>
                  <td className="px-4 py-2">{item.palletNumber}</td>
                  <td className="px-4 py-2">{item.boxNumber}</td>
                  <td className="px-4 py-2">{item.maxRequestLimit}</td>
                  <td className="px-4 py-2">{item.donorShippingNumber}</td>
                  <td className="px-4 py-2">{item.hfhShippingNumber}</td>
                  <td className="px-4 py-2">
                    {item.visible ? "Hidden" : "Visible"}
                  </td>
                  <td className="px-4 py-2">{item.notes}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
