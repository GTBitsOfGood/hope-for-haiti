import { ReactNode, useEffect, useState } from "react";
import ConfiguredSelect from "./ConfiguredSelect";

interface ModalDropDownOption {
  fullLabel?: ReactNode;
  label: string;
  value: string;
}

interface ModalDropDownProps {
  label?: string;
  required?: boolean;
  name: string;
  placeholder?: string;
  options: ModalDropDownOption[];
  defaultSelected?: { label: string; value: string };
  onSelect?: (value: string) => void;
  className?: string;
}

export default function ModalDropDown({
  label,
  required,
  name,
  placeholder = "Select an option",
  options,
  defaultSelected,
  onSelect,
  className,
}: ModalDropDownProps) {
  const [selectedOptionValue, setSelectedOptionValue] = useState(
    defaultSelected?.value ?? ""
  );
  const [selectedOptionLabel, setSelectedOptionLabel] = useState(
    defaultSelected?.label ?? ""
  );

  const handleSelect = (option: { label: string; value: string }) => {
    setSelectedOptionValue(option.value);
    setSelectedOptionLabel(option.label);
    if (onSelect) onSelect(option.value);
  };

  // Sync internal state when defaultSelected changes (e.g., parent updates value)
  useEffect(() => {
    if (defaultSelected) {
      setSelectedOptionValue(defaultSelected.value ?? "");
      setSelectedOptionLabel(defaultSelected.label ?? "");
    } else {
      setSelectedOptionValue("");
      setSelectedOptionLabel("");
    }
  }, [defaultSelected]);

  return (
    <div className={`grow relative ${className}`}>
      {label && (
        <label className="block">
          {label}
          <span className="text-red-500">{required ? " *" : ""}</span>
        </label>
      )}
      <ConfiguredSelect
        className="mt-1"
        controlStyle={{
          borderRadius: "2px",
          paddingBottom: "2px",
          borderColor: "#22070b1a", // Taken from ModalTextField. Referencing Tailwind theme vars didn't work
        }}
        placeholder={placeholder}
        options={options.map((opt) => ({
          label: opt.label,
          value: opt.value,
        }))}
        value={{
          label: selectedOptionLabel,
          value: selectedOptionValue,
        }}
        onChange={(newVal) =>
          handleSelect({
            label: options.find((o) => o.value === newVal?.value)?.label || "",
            value: newVal?.value || "",
          })
        }
      />
      {/* Hidden input to store the actual value for form submission */}
      <input type="hidden" name={name} value={selectedOptionValue} />
    </div>
  );
}
