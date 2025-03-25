interface ModalTextFieldProps {
  label: string;
  placeholder: string;
  required?: boolean;
  name: string;
}
export default function ModalTextField({
  label,
  required,
  placeholder,
  name,
}: ModalTextFieldProps) {
  return (
    <div className="grow">
      <label className="block">
        {label}
        <span className="text-red-500">{required ? " *" : ""}</span>
        <textarea
          className="mt-1 block w-full px-3 py-2 border border-gray-primary border-opacity-10 rounded-sm bg-sunken text-gray-primary placeholder-gray-primary placeholder-opacity-50 focus:outline-none focus:border-gray-400 resize-none"
          rows={5}
          placeholder={placeholder}
          name={name}
        ></textarea>
      </label>
    </div>
  );
}
