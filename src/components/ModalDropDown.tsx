import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FaChevronDown } from "react-icons/fa";

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
  renderOption?: (option: ModalDropDownOption) => ReactNode;
  renderValue?: (option: ModalDropDownOption) => ReactNode;
}

export default function ModalDropDown({
  label,
  required,
  name,
  placeholder = "Select an option",
  options,
  defaultSelected,
  onSelect,
  renderOption,
  renderValue,
}: ModalDropDownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptionValue, setSelectedOptionValue] = useState(
    defaultSelected?.value ?? ""
  );
  const [selectedOptionLabel, setSelectedOptionLabel] = useState(
    defaultSelected?.label ?? ""
  );
  const dropdownRef = useRef<HTMLDivElement>(null); // Attach ref to the root <div>
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  const measureAndPosition = useCallback(() => {
    const root = dropdownRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const width = rect.width;
    const left = rect.left;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estItemHeight = 36; // px
    const estMenuHeight = Math.min(options.length, 6) * estItemHeight;
    const shouldUp = spaceBelow < estMenuHeight + 16 && spaceAbove > spaceBelow;
    const top = shouldUp
      ? Math.max(8, rect.top - estMenuHeight - 4)
      : Math.min(window.innerHeight - 8, rect.bottom + 4);
    setMenuPos({ left, top, width });
  }, [options.length]);

  const toggleDropdown = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      measureAndPosition();
    }
  };

  const handleSelect = (option: { label: string; value: string }) => {
    setSelectedOptionValue(option.value);
    setSelectedOptionLabel(option.label);
    setIsOpen(false); // Close the dropdown after selecting an option
    if (onSelect) onSelect(option.value);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    const clickedInsideTrigger = dropdownRef.current?.contains(target);
    const clickedInsideMenu = menuRef.current?.contains(target);
    if (!clickedInsideTrigger && !clickedInsideMenu) {
      setIsOpen(false); // Close the dropdown if the click is outside both trigger and menu
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  useEffect(() => {
    if (!isOpen) return;
    const onRecalc = () => measureAndPosition();
    window.addEventListener("resize", onRecalc);
    window.addEventListener("scroll", onRecalc, true);
    return () => {
      window.removeEventListener("resize", onRecalc);
      window.removeEventListener("scroll", onRecalc, true);
    };
  }, [isOpen, measureAndPosition]);

  const selectedOption = useMemo(() => {
    return options.find((o) => o.value === selectedOptionValue) || null;
  }, [options, selectedOptionValue]);

  return (
    <div className="grow relative">
      {label && (
        <label className="block">
          {label}
          <span className="text-red-500">{required ? " *" : ""}</span>
        </label>
      )}
      <div ref={dropdownRef}>
        <div className="relative">
          {/* Display area acting like an input but supports ReactNode */}
          <button
            type="button"
            onClick={toggleDropdown}
            className="h-10 mt-1 flex w-full items-center justify-between gap-2 px-3 py-2 border border-gray-primary border-opacity-10 rounded-sm bg-sunken text-gray-primary placeholder-gray-primary focus:outline-none focus:border-gray-400"
          >
            <span className="truncate text-left">
              {selectedOption ? (
                (renderValue?.(selectedOption) ??
                selectedOption.fullLabel ??
                selectedOptionLabel)
              ) : (
                <span className="text-gray-primary/50">{placeholder}</span>
              )}
            </span>
            <FaChevronDown className="text-gray-400" />
          </button>
        </div>
        {isOpen &&
          menuPos &&
          createPortal(
            <ul
              ref={menuRef}
              className="fixed z-[9999] bg-white border border-gray-primary border-opacity-10 rounded-sm shadow-lg max-h-48 overflow-y-auto"
              style={{
                left: menuPos.left,
                top: menuPos.top,
                width: menuPos.width,
              }}
            >
              {options.map((option, index) => (
                <li
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() =>
                    handleSelect({ label: option.label, value: option.value })
                  }
                >
                  {renderOption?.(option) ?? option.fullLabel ?? option.label}
                </li>
              ))}
            </ul>,
            document.body
          )}
      </div>
      {/* Hidden input to store the actual value for form submission */}
      <input type="hidden" name={name} value={selectedOptionValue} />
    </div>
  );
}
