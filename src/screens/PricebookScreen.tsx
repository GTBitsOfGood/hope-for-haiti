"use client";
import { useCallback, useRef, useState } from "react";
import { PencilSimple, Plus, Trash, UploadSimple } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import AdvancedBaseTable from "@/components/baseTable/AdvancedBaseTable";
import type { AdvancedBaseTableHandle, ColumnDefinition, FilterList, TableQuery } from "@/types/ui/table.types";
import type {
  ItemPriceInput,
  ItemPriceResponse,
  ItemPriceUploadReview,
} from "@/types/api/itemPrice.types";
import { useApiClient } from "@/hooks/useApiClient";
import { useFileUpload } from "@/hooks/useFileUpload";
import PriceEntryModal from "@/components/Pricebook/PriceEntryModal";
import DeletePriceModal from "@/components/Pricebook/DeletePriceModal";
import PriceUploadModal from "@/components/Pricebook/PriceUploadModal";

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
  const [review, setReview] = useState<ItemPriceUploadReview | null>(null);
  const [reviewKey, setReviewKey] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const {
    fileName,
    fileErrorMessage,
    fileLoading,
    errors,
    uploadedFile,
    handleFileChange,
    resetUpload,
  } = useFileUpload<ItemPriceUploadReview>({
    previewEndpoint: "/api/itemPrices/upload?preview=true",
    previewEndpointMethod: "POST",
    onSuccess: (result) => {
      setReview(result);
      setReviewKey((current) => current + 1);
    },
  });

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

  const closeUpload = () => {
    setReview(null);
    resetUpload();
    if (fileInput.current) fileInput.current.value = "";
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    await handleFileChange(event);
    input.value = "";
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/itemPrices/template");
      if (!response.ok) {
        let message = "Unable to download the template.";
        try {
          const body = await response.json();
          if (typeof body.message === "string") message = body.message;
        } catch {
          // Keep the fallback message for non-JSON failures.
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "pricebook-template.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to download the template."
      );
    }
  };

  const saveUpload = async (selectedLineNumbers: number[]) => {
    if (!uploadedFile) throw new Error("Upload a file before saving prices.");
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("selectedLineNumbers", JSON.stringify(selectedLineNumbers));
    await apiClient.post("/api/itemPrices/upload", { body: formData });
    closeUpload();
    table.current?.reload();
    toast.success(
      `Saved ${selectedLineNumbers.length} price${
        selectedLineNumbers.length === 1 ? "" : "s"
      }`
    );
  };

  const columns: ColumnDefinition<ItemPriceResponse>[] = [
    { id: "ndc", header: "NDC", filterType: "string", cell: row => row.ndc },
    { id: "name", header: "Name", filterable: false, cell: row => row.name ?? "" },
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
      <p className="mt-1 mb-6 text-sm text-gray-600">
        Search by NDC using the table filter.{" "}
        <button
          type="button"
          onClick={downloadTemplate}
          className="font-medium text-red-primary underline hover:text-red-700"
        >
          Download template
        </button>
      </p>
      {(fileErrorMessage || errors.length > 0) && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {fileErrorMessage ?? errors[0]}
        </p>
      )}
      <input
        ref={fileInput}
        type="file"
        accept=".csv,.xlsx"
        onChange={onFileChange}
        className="hidden"
      />
      <AdvancedBaseTable
        ref={table}
        columns={columns}
        fetchFn={fetchFn}
        rowId="id"
        pageSize={10}
        toolBar={(
          <div className="order-1 ml-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={fileLoading}
              className="flex items-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2 font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
            >
              <UploadSimple size={18} />
              {fileLoading ? "Reading file..." : "Upload prices"}
            </button>
            <button
              type="button"
              onClick={() => setEntry("new")}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <Plus size={18} /> Add price
            </button>
          </div>
        )}
      />
      <PriceEntryModal item={entry} onClose={() => setEntry(null)} onSave={save} />
      <DeletePriceModal item={deleting} onClose={() => setDeleting(null)} onDelete={remove} />
      {review && (
        <PriceUploadModal
          key={reviewKey}
          review={review}
          fileName={fileName}
          onClose={closeUpload}
          onSave={saveUpload}
        />
      )}
    </main>
  );
}
