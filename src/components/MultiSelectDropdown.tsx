import { ReactNode, useState } from "react";

export default function MultiSelectDropdown({
  label,
  options,
  onChange,
}: {
  label: string;
  options: {
    id: string;
    label: ReactNode;
  }[];
  onChange: (selectedValues: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  function handleCheckboxChange(value: string, isChecked: boolean) {
    if (isChecked) {
      setSelectedValues((prev) => [...prev, value]);
    } else {
      setSelectedValues((prev) => prev.filter((v) => v !== value));
    }

    onChange(selectedValues);
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
              <div key={option.id}>
                <input
                  type="checkbox"
                  id={option.id}
                  checked={selectedValues.includes(option.id)}
                  onChange={(e) =>
                    handleCheckboxChange(option.id, e.target.checked)
                  }
                  className="mr-2"
                />
                <label htmlFor={option.id} className="text-sm text-gray-700">
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
