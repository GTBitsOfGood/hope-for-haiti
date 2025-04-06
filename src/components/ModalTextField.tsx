interface ModalTextFieldProps {
  label: string;
  required?: boolean;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ModalTextField({
  label,
  required = false,
  name,
  placeholder = label,
  defaultValue,
  type = "text",
  value,
  onChange,
}: ModalTextFieldProps) {
  return (
    <div className="grow">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        <span className="text-red-500">{required ? " *" : ""}</span>
        <input
          type={type}
          className="mt-1 block w-full px-3 py-2 border border-gray-primary border-opacity-10 rounded-sm bg-sunken text-gray-primary placeholder-gray-primary placeholder-opacity-50 focus:outline-none focus:border-gray-400"
          placeholder={placeholder}
          required={required}
          name={name}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
        />
      </label>
    </div>
  );
}
