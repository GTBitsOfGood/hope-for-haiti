import { cn } from "@/util/util";

interface ModalTextFieldProps {
  className?: string;
  label?: string;
  required?: boolean;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}
export default function ModalTextField({
  className = "",
  label,
  required = false,
  name,
  placeholder = label,
  defaultValue,
  type = "text",
  value,
  onChange,
  inputProps,
}: ModalTextFieldProps) {
  return (
    <div className="grow">
      {label && (
        <label className="block">
          {label}
          <span className="text-red-500">{required ? " *" : ""}</span>
        </label>
      )}
      <input
        type={type}
        className={cn(
          // Match ModalDropDown trigger styling
          "mt-1 w-full px-3 py-2 h-10 rounded-sm border-gray-primary/10",
          "bg-sunken text-gray-primary placeholder-gray-primary/50",
          "focus:outline-none focus:border-gray-400",
          className
        )}
        placeholder={placeholder}
        required={required}
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        {...inputProps}
      />
    </div>
  );
}
