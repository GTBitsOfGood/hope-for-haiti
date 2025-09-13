import React from "react";

export type FieldType =
  | "text"
  | "number"
  | "email"
  | "textarea"
  | "select"
  | "multiselect"
  | "boolean"
  | "radio"
  | "file";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
  placeholder?: string;
  description?: string;
  conditionalField?: string;
  conditionalValue?: unknown;
  min?: number;
  max?: number;
  accept?: string;
}

export type FieldValue =
  | string
  | number
  | boolean
  | string[]
  | undefined
  | null;

interface FieldRendererProps {
  config: FieldConfig;
  value: FieldValue;
  onChange: (name: string, value: FieldValue) => void;
  onFileChange?: (name: string, file: File | null) => void;
  isEditing: boolean;
  errors?: Record<string, string>;
  allValues?: Record<string, FieldValue>;
  renderLayoutWrapper?: boolean;
}

export default function FieldRenderer({
  config,
  value,
  onChange,
  onFileChange,
  isEditing,
  errors,
  allValues = {},
  renderLayoutWrapper = true,
}: FieldRendererProps) {
  const {
    name,
    label,
    type,
    required,
    options = [],
    placeholder,
    description,
    conditionalField,
    conditionalValue,
    min,
    max,
    accept,
  } = config;

  if (conditionalField && allValues[conditionalField] !== conditionalValue) {
    return null;
  }

  const errorMessage = errors?.[name];
  const baseInputClasses = `border p-3 rounded-[4px] ${
    errorMessage
      ? "border-red-500 bg-red-50"
      : "border-[#22070B]/10 bg-[#F9F9F9]"
  } text-[16px] text-[#22070B] placeholder:text-[#22070B]/50`;

  const renderViewMode = () => {
    switch (type) {
      case "boolean":
        return (
          <p className="text-[16px] text-[#22070B]">{value ? "Yes" : "No"}</p>
        );

      case "select":
        const selectedOption = options.find((opt) => opt.value === value);
        return (
          <p className="text-[16px] text-[#22070B]">
            {selectedOption?.label || value || "Not specified"}
          </p>
        );

      case "multiselect":
        const selectedOptions = Array.isArray(value)
          ? value
              .map((v) => options.find((opt) => opt.value === v)?.label || v)
              .join(", ")
          : "None selected";
        return <p className="text-[16px] text-[#22070B]">{selectedOptions}</p>;

      case "file":
        return (
          <p className="text-[16px] text-[#22070B]">
            {typeof value === "string" && value ? value : "No file uploaded"}
          </p>
        );

      default:
        return (
          <p className="text-[16px] text-[#22070B]">
            {value?.toString() || "Not specified"}
          </p>
        );
    }
  };

  const renderEditMode = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            className={`${baseInputClasses} min-h-[100px] w-full`}
            required={required}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={typeof value === "number" ? value.toString() : ""}
            onChange={(e) => onChange(name, parseInt(e.target.value) || 0)}
            placeholder={placeholder}
            min={min}
            max={max}
            className={`${baseInputClasses} w-full`}
            required={required}
          />
        );

      case "email":
        return (
          <input
            type="email"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            className={`${baseInputClasses} w-full`}
            required={required}
          />
        );

      case "select":
        return (
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(name, e.target.value)}
            className={`${baseInputClasses} w-full`}
            required={required}
          >
            <option value="">Select an option...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-[4px] bg-[#F9F9F9]">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center text-[16px] text-[#22070B] cursor-pointer hover:bg-gray-100 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value);
                    onChange(name, newValues);
                  }}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case "boolean":
        return (
          <div className="flex space-x-4">
            <label className="flex items-center text-[16px] text-[#22070B] cursor-pointer">
              <input
                type="radio"
                checked={value === true}
                onChange={() => onChange(name, true)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center text-[16px] text-[#22070B] cursor-pointer">
              <input
                type="radio"
                checked={value === false}
                onChange={() => onChange(name, false)}
                className="mr-2"
              />
              No
            </label>
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center text-[16px] text-[#22070B] cursor-pointer"
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(name, e.target.value)}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case "file":
        return (
          <div className="space-y-2">
            <input
              type="file"
              accept={accept}
              onChange={(e) =>
                onFileChange?.(name, e.target.files?.[0] || null)
              }
              className={`${baseInputClasses} w-full`}
              required={required}
            />
            {typeof value === "string" && value && (
              <p className="text-sm text-gray-600">Current file: {value}</p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            className={`${baseInputClasses} w-full`}
            required={required}
          />
        );
    }
  };

  const fieldContent = (
    <>
      {isEditing ? renderEditMode() : renderViewMode()}
      {renderLayoutWrapper && errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </>
  );

  if (!renderLayoutWrapper) {
    return fieldContent;
  }

  return (
    <div className="mb-4">
      <div className="space-y-2">
        <div>
          <p className="text-[18px] font-semibold text-[#22070B]">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
          {description && (
            <p className="text-[14px] text-[#22070B]/70 mt-1">{description}</p>
          )}
        </div>
        <div>{fieldContent}</div>
      </div>
    </div>
  );
}
