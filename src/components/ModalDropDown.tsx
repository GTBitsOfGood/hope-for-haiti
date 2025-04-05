import { useEffect, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

interface ModalDropDownOption {
  label: string;
  value: string;
}

interface ModalDropDownProps {
  label: string;
  required?: boolean;
  name: string;
  placeholder?: string;
  options: ModalDropDownOption[];
}

export function StringToModalDropDownOption(
  strs: string[]
): ModalDropDownOption[] {
  return strs.map((str) => ({
    label: str,
    value: str,
  }));
}

export default function ModalDropDown({
  label,
  required,
  name,
  placeholder = "Select an option",
  options,
}: ModalDropDownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptionValue, setSelectedOptionValue] = useState("");
  const [selectedOptionLabel, setSelectedOptionLabel] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null); // Attach ref to the root <div>

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (option: ModalDropDownOption) => {
    setSelectedOptionValue(option.value);
    setSelectedOptionLabel(option.label);
    setIsOpen(false); // Close the dropdown after selecting an option
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false); // Close the dropdown if the click is outside
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="grow relative">
      <label className="block">
        {label}
        <span className="text-red-500">{required ? " *" : ""}</span>
      </label>
      <div ref={dropdownRef}>
        <div className="relative">
          {/* Input field to show the selected option but shouldn't be in form submission */}
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-primary border-opacity-10 rounded-sm bg-sunken text-gray-primary placeholder-gray-primary placeholder-opacity-50 focus:outline-none focus:border-gray-400"
            placeholder={placeholder}
            value={selectedOptionLabel || ""}
            required={required}
            onClick={toggleDropdown}
            readOnly
          />
          {/* Add the arrow icon */}
          <FaChevronDown className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {isOpen && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-primary border-opacity-10 rounded-sm shadow-lg max-h-48 overflow-y-auto">
            {options.map((option, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-gray-100"
                onClick={() =>
                  handleSelect({ label: option.label, value: option.value })
                }
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Hidden input to store the actual value for form submission */}
      <input type="hidden" name={name} value={selectedOptionValue} />
    </div>
  );
}
