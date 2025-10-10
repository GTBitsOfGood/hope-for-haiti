"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import React from "react";
import { useRouter } from "next/navigation";
import AddItemModal from "@/components/AddItemModal";
import { $Enums } from "@prisma/client";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import ItemRequestTable from "@/components/ItemRequestTable";

export interface UnallocatedItemData {
  id: number;
  title: string;
  type: string;
  quantity: number;
  expirationDate: string | null;
  unitType: string;
  quantityPerUnit: number;
  requests: {
    id: number;
    partner: {
      name: string;
    };
    createdAt: string;
    quantity: number;
    priority: $Enums.RequestPriority | null;
    comments: string;
  }[];
  items: {
    id: number;
    quantity: number;
    allocationId: number | null;
  }[];
}

export default function AdminUnallocatedItemsScreen() {
  const router = useRouter();

  const [addItemExpanded, setAddItemExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<UnallocatedItemData>();

  const [data, setData] = useState<{
    items: UnallocatedItemData[];
    unitTypes: string[];
    donorNames: string[];
    itemTypes: string[];
  }>();

  const unitTypes = data?.unitTypes ?? [];
  const donorNames = data?.donorNames ?? [];
  const itemTypes = data?.itemTypes ?? [];

  const tableRef = useRef<AdvancedBaseTableHandle<UnallocatedItemData>>(null);

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<UnallocatedItemData>
    ) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });

      const res = await fetch(
        `/api/generalItems/unallocated?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch table data");
      }

      const body = (await res.json()) as Exclude<typeof data, undefined>;
      console.log(body);

      setData(body);

      return {
        data: body.items,
        total: body.items?.length ?? 0,
      };
    },
    []
  );

  const columns: ColumnDefinition<UnallocatedItemData>[] = [
    "title",
    "type",
    "quantity",
    {
      id: "expirationDate",
      header: "Expiration",
      cell: (item) => {
        return item.expirationDate
          ? new Date(item.expirationDate).toLocaleDateString()
          : "N/A";
      },
    },
    "unitType",
    "quantityPerUnit",
    {
      id: "requests",
      header: "# of Requests",
      cell: (item) => item.requests?.length,
    },
    {
      id: "items",
      header: "# of Line Items",
      cell: (item) => item.items?.length,
    }
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] =
    useState<FilterList<UnallocatedItemData>>();

  useEffect(() => {
    if (!searchQuery && !searchFilter) return;

    if (!searchQuery) {
      setSearchFilter(undefined);
      return;
    }

    setSearchFilter({
      title: { type: "string", value: searchQuery },
    });
  }, [searchQuery]);

  console.log(data?.items);

  return (
    <>
      {isModalOpen ? (
        <AddItemModal
          setIsOpen={setIsModalOpen}
          unitTypes={unitTypes}
          donorNames={donorNames}
          itemTypes={itemTypes}
        />
      ) : null}
      <h1 className="text-2xl font-semibold">Unallocated Items</h1>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchTableData}
        rowId="id"
        pageSize={20}
        additionalFilters={searchFilter}
        onRowClick={(item) => {
          if (item.id === selectedItem?.id) {
            setSelectedItem(undefined);
          } else setSelectedItem(item);
        }}
        embeds={
          selectedItem
            ? {
                [String(selectedItem.id)]: (
                  <ItemRequestTable generalItemData={selectedItem} />
                ),
              }
            : undefined
        }
        emptyState={
          <div className="flex justify-center items-center mt-8">
            <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
          </div>
        }
        toolBar={
          <div className="flex justify-between items-center w-full">
            <div className="relative w-1/3">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <button
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
                  onClick={() => {
                    setAddItemExpanded(!addItemExpanded);
                  }}
                >
                  <Plus size={18} /> Add Item
                </button>
                {addItemExpanded ? (
                  <div className="flex flex-col gap-y-1 items-center absolute left-0 mt-2 p-1 origin-top-right bg-white border border-solid border-gray-primary rounded border-opacity-10">
                    <button
                      className="block font-medium w-full rounded text-gray-primary text-opacity-70 text-center px-2 py-1 hover:bg-gray-primary hover:bg-opacity-5"
                      onClick={() => {
                        setIsModalOpen(true);
                        setAddItemExpanded(false);
                      }}
                    >
                      Single item
                    </button>
                    <button
                      className="block font-medium w-full rounded text-gray-primary text-opacity-70 text-center px-2 py-1 hover:bg-gray-primary hover:bg-opacity-5"
                      onClick={() => router.push("/bulkAddItems")}
                    >
                      Bulk items
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        }
      />
    </>
  );
}
