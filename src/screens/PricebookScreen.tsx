"use client";
import { useCallback, useRef, useState } from "react";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import AdvancedBaseTable from "@/components/baseTable/AdvancedBaseTable";
import type { AdvancedBaseTableHandle, ColumnDefinition, FilterList, TableQuery } from "@/types/ui/table.types";
import type { ItemPriceInput, ItemPriceResponse } from "@/types/api/itemPrice.types";
import { useApiClient } from "@/hooks/useApiClient";
import PriceEntryModal from "@/components/Pricebook/PriceEntryModal";
import DeletePriceModal from "@/components/Pricebook/DeletePriceModal";

function currency(value: string) {
  const [whole, fraction = ""] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${grouped}${fraction ? `.${fraction.padEnd(2, "0")}` : ".00"}`;
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function PricebookScreen() {
  const table = useRef<AdvancedBaseTableHandle<ItemPriceResponse>>(null);
  const { apiClient } = useApiClient();
  const [entry, setEntry] = useState<ItemPriceResponse | null | "new">(null);
  const [deleting, setDeleting] = useState<ItemPriceResponse | null>(null);

  const fetchFn = useCallback(async (
    pageSize: number,
    page: number,
    filters: FilterList<ItemPriceResponse>,
  ): Promise<TableQuery<ItemPriceResponse>> => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      filters: JSON.stringify(filters),
    });
    return apiClient.get(`/api/itemPrices?${params.toString()}`);
  }, [apiClient]);

  const save = async (value: ItemPriceInput, item: ItemPriceResponse | null) => {
    if (item) await apiClient.patch(`/api/itemPrices/${item.id}`, { body: JSON.stringify(value) });
    else await apiClient.post("/api/itemPrices", { body: JSON.stringify(value) });
    setEntry(null);
    table.current?.reload();
    toast.success(item ? "Price updated" : "Price added. It may not appear while an NDC filter is active.");
  };

  const remove = async (item: ItemPriceResponse) => {
    await apiClient.delete(`/api/itemPrices/${item.id}`);
    table.current?.removeItemById(item.id);
    setDeleting(null);
    table.current?.reload();
    toast.success("Price deleted");
  };

  const columns: ColumnDefinition<ItemPriceResponse>[] = [
    { id: "ndc", header: "NDC", filterType: "string", cell: row => row.ndc },
    { id: "unitPrice", header: "Unit price", filterable: false, cell: row => currency(row.unitPrice) },
    { id: "updatedAt", header: "Last updated", filterable: false, cell: row => <time dateTime={row.updatedAt}>{dateLabel(row.updatedAt)}</time> },
    { id: "needsRecheck", header: "Status", filterable: false, cell: row => row.needsRecheck ? <span className="rounded-full bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900">Needs re-check</span> : <span>Current</span> },
    { id: "enteredBy", header: "Entered by", filterable: false, cell: row => row.enteredBy?.name ?? "Unknown" },
    {
      id: "actions",
      header: "Actions",
      filterable: false,
      cell: row => (
        <div className="flex gap-2">
          <button type="button" aria-label={`Edit price for ${row.ndc}`} onClick={() => setEntry(row)} className="rounded-md border border-gray-300 p-2 text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
            <PencilSimple size={18} />
          </button>
          <button type="button" aria-label={`Delete price for ${row.ndc}`} onClick={() => setDeleting(row)} className="rounded-md border border-red-primary p-2 text-red-primary transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
            <Trash size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="text-gray-primary">
      <h1 className="text-2xl font-semibold text-gray-primary m-0">Pricebook</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">Search by NDC using the table filter.</p>
      <AdvancedBaseTable
        ref={table}
        columns={columns}
        fetchFn={fetchFn}
        rowId="id"
        pageSize={10}
        toolBar={(
          <button
            type="button"
            onClick={() => setEntry("new")}
            className="order-1 ml-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <Plus size={18} /> Add price
          </button>
        )}
      />
      <PriceEntryModal item={entry} onClose={() => setEntry(null)} onSave={save} />
      <DeletePriceModal item={deleting} onClose={() => setDeleting(null)} onDelete={remove} />
    </main>
  );
}
