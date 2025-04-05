interface ModalTextFieldProps {
  label: string;
  required?: boolean;
  name: string;
  placeholder?: string;
  defaultValue?: string;
}
export default function ModalTextField({
  label,
  required,
  name,
  placeholder = label,
  defaultValue,
}: ModalTextFieldProps) {
  return (
    <div className="grow">
      <label className="block">
        {label}
        <span className="text-red-500">{required ? " *" : ""}</span>
        <input
          type="text"
          className="mt-1 block w-full px-3 py-2 border border-gray-primary border-opacity-10 rounded-sm bg-sunken text-gray-primary placeholder-gray-primary placeholder-opacity-50 focus:outline-none focus:border-gray-400"
          placeholder={placeholder}
          required={required}
          name={name}
          defaultValue={defaultValue}
        />
      </label>
    </div>
  );
}
