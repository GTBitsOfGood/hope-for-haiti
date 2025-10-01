import { X } from "@phosphor-icons/react";
import { FilterList } from "./AdvancedBaseTable";

function EnumInput() {
  return <div>TODO</div>;
}

interface TableFilterMenuProps<T> {
  labels: string[];
  data: T[];
  close: () => void;
  filters: FilterList<T>;
  setFilters: (filters: FilterList<T>) => void;
  filterableCols: (keyof T)[];
}

function isEnumLike(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;

  const keys = Object.keys(obj) as (keyof typeof obj)[];
  return (
    keys.some((k) => !isNaN(Number(k))) &&
    keys.some((k) => typeof obj[k] === "number")
  );
}

export default function TableFilterMenu<T extends object>({
  labels,
  data,
  close,
  filters,
  setFilters,
  filterableCols,
}: TableFilterMenuProps<T>) {
  function getStringFilterValue(filters: FilterList<T>, key: keyof T) {
    const f = filters[key];
    return f?.type === "string" ? f.value : undefined;
  }

  const updateFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFilters: FilterList<T> = {};
    formData.forEach((value, key) => {
      if (value) {
        const col = filterableCols.find((c) => c === key);
        if (col) {
          newFilters[col] = { type: "string", value: value.toString() };
        }
      }
    });
    setFilters(newFilters);
    close();
  };
  return (
    <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-10">
      <div className="h-full w-2/5 min-w-[300px] bg-white p-8 rounded-l-lg shadow-lg relative text-gray-primary">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Filter</h2>
          <X onClick={close} size={24} className="cursor-pointer" />
        </div>
        <form onSubmit={updateFilters}>
          <div className="flex flex-col gap-y-4 mb-4">
            {labels.map((label, i) => (
              <div key={label}>
                <label className="font-medium">
                  <p className="mb-1">{label}</p>
                  {typeof data[0][filterableCols[i]] == "number" && (
                    <input
                      type="number"
                      name={filterableCols[i] as string}
                      className="block border border-gray-primary/20 rounded-md p-2 w-full"
                    />
                  )}
                  {typeof data[0][filterableCols[i]] == "string" && (
                    <input
                      type="string"
                      name={filterableCols[i] as string}
                      className="block border border-gray-primary/20 rounded-md p-2 w-full"
                      defaultValue={getStringFilterValue(
                        filters,
                        filterableCols[i]
                      )}
                    />
                  )}
                  {isEnumLike(data[0][filterableCols[i]]) && <EnumInput />}
                </label>
              </div>
            ))}
          </div>
          <button className="flex items-center gap-2 border border-red-500 text-red-500 bg-white px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition">
            Set filters
          </button>
        </form>
      </div>
    </div>
  );
}
