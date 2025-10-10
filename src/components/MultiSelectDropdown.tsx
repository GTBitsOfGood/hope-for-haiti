import { ReactNode, useState } from "react";

export default function MultiSelectDropdown<TId>({
  label,
  options,
  onConfirm,
  defaultSelectedValues = [],
}: {
  label: string;
  options: {
    id: TId;
    label: ReactNode;
  }[];
  onConfirm: (selectedValues: TId[]) => void;
  defaultSelectedValues?: TId[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<TId[]>(
    defaultSelectedValues
  );

  function toggleValue(id: TId) {
    setSelectedValues((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 bg-blue-500 text-white rounded"
      >
        {label}
      </button>
      {isOpen && (
        <div className="w-full bg-gray-100 rounded p-2 flex flex-col absolute top-0 left-0 z-10">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div>
            {options.map((option) => (
              <div key={String(option.id)}>
                <input
                  type="checkbox"
                  id={String(option.id)}
                  checked={selectedValues.includes(option.id)}
                  onChange={() => toggleValue(option.id)}
                  className="mr-2"
                />
                <label
                  htmlFor={String(option.id)}
                  className="text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onConfirm(selectedValues);
            }}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
          >
            Confirm
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setSelectedValues(defaultSelectedValues);
            }}
            className="mt-2 px-3 py-1 bg-gray-300 rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
