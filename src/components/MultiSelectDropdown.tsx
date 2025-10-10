import { ReactNode, useState } from "react";

export default function MultiSelectDropdown<TId>({
  label,
  options,
  onChange,
  selectedValues = [],
}: {
  label: string;
  options: {
    id: TId;
    label: ReactNode;
  }[];
  onChange: (toggledId: TId) => void;
  selectedValues?: TId[];
}) {
  const [isOpen, setIsOpen] = useState(false);

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
                  onChange={() => onChange(option.id)}
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
            onClick={() => setIsOpen(false)}
            className="mt-2 px-3 py-1 bg-gray-300 rounded"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
