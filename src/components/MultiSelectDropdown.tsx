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
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select multiple>
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
            onClick={(e) =>
              handleCheckboxChange(option.id, (e.target as HTMLOptionElement).selected)
            }
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
