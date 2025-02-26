import Link from "next/link";

export default function UnallocatedItemsScreen() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Unallocated Items</h1>
      <Link href={"/bulk_add_items"}>
      <button className="bg-red-500 hover:bg-red-700 text-white py-1 px-4 mt-7 rounded focus:outline-none focus:shadow-outline">
        Bulk Add Items
      </button>
      </Link>
    </>
  );
}
