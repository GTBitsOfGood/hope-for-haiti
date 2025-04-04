import { useState, useRef, useEffect } from "react";

interface ModalAutoTextFieldProps {
  label: string;
  required?: boolean;
  name: string;
  placeholder?: string;
  options: string[];
  defaultValue?: string;
  onInputChange?: (value: string) => void;
}

export default function ModalAutoTextField({
  label,
  required,
  name,
  placeholder = label,
  options,
  defaultValue,
  onInputChange,
}: ModalAutoTextFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const [inputValue, setInputValue] = useState(""); // State to manage the input value
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown container

  const handleSelect = (option: string) => {
    changeInputValue(option);
    setIsOpen(false);
  };

  useEffect(() => {
    if (defaultValue) {
      setInputValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false); // Close the dropdown if the click is outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    changeInputValue(value);
  };

  useEffect(() => {
    setFilteredOptions(
      options.filter((option) =>
        option.toLowerCase().includes(inputValue.toLowerCase())
      )
    );
  }, [options, inputValue]);

  const changeInputValue = (value: string) => {
    setInputValue(value);

    if (onInputChange) {
      onInputChange(value);
    }
  };

  return (
    <div className="grow relative">
      <label className="block">
        {label}
        <span className="text-red-500">{required ? " *" : ""}</span>
      </label>
      <div ref={dropdownRef}>
        <input
          type="text"
          className="mt-1 block w-full px-3 py-2 border border-gray-primary border-opacity-10 rounded-sm bg-sunken text-gray-primary placeholder-gray-primary placeholder-opacity-50 focus:outline-none focus:border-gray-400"
          placeholder={placeholder}
          required={required}
          name={name}
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
        />
        {isOpen && (
          <ul className="absolute z-10 w-full bg-gray-100 border border-gray-primary border-opacity-10 rounded-sm shadow-lg max-h-48 overflow-y-auto">
            {filteredOptions.map((option, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-gray-200"
                onClick={() => handleSelect(option)}
              >
                <div className="bg-red-400 text-white px-3 py-1 rounded-md w-fit">
                  {option}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
