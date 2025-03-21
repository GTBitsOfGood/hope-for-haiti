interface ModalNDCFieldProps {
  required?: boolean;
  name?: string;
}
// NOTE: only accounts for 4-4-2 NDCs, not other types
export default function ModalNDCField({ required, name }: ModalNDCFieldProps) {
  const formatNDC = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");

    // Format as XXXX-XXXX-XX
    if (digits.length >= 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    } else if (digits.length >= 4) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else {
      return digits; // Return as is if less than 4 digits
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNDC(event.target.value);
    event.target.value = formattedValue; // Update the input value
  };

  return (
    <div className="grow">
      <label className="block">
        NDC
        <span className="text-red-500">{required ? " *" : ""}</span>
        <input
          type="text"
          className="mt-1 block w-full px-3 py-2 border border-gray-primary border-opacity-10 rounded-sm bg-sunken text-gray-primary placeholder-gray-primary placeholder-opacity-50 focus:outline-none focus:border-gray-400"
          placeholder="XXXX-XXXX-XX"
          required={required}
          name={name}
          maxLength={12} // Maximum length for XXXX-XXXX-XX
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
