import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

/**
 * A multi-select dropdown component. Has a button to open the dropdown,
 * a list of options with checkboxes, and Confirm/Cancel buttons. Closes
 * when clicking outside or pressing Escape.
 *
 * Pass defaultSelectedValues to pre-select options when opening. These
 * options can be changed later by the user.
 */
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  function toggleValue(id: TId) {
    setSelectedValues((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  const cancel = useCallback(() => {
    setIsOpen(false);
    setSelectedValues(defaultSelectedValues);
  }, [defaultSelectedValues]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    if (!dropdownRef.current) return;

    function handleClickOutside(event: Event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        cancel();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancel();
      }
    }

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [defaultSelectedValues, isOpen, cancel]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 bg-blue-500 text-white rounded"
      >
        {label}
      </button>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="w-full bg-gray-100 rounded p-2 flex flex-col absolute top-0 left-0 z-10"
        >
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
            onClick={cancel}
            className="mt-2 px-3 py-1 bg-gray-300 rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
