interface ModalToggleFieldProps {
  label: string;
  description: string;
}
export default function ModalToggleField({
  label,
  description,
}: ModalToggleFieldProps) {
  return (
    <div className="grow rounded-sm border border-gray-primary border-opacity-10 p-4 has-[:checked]:border-[#99B6FF] has-[:checked]:bg-[#EFF6FF] transition">
      <label className="flex space-x-4 cursor-pointer">
        <div className="relative">
          <input type="checkbox" className="sr-only peer" name="toggle" />
          <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-[#2D68FE] peer-focus:ring-2 peer-focus:ring-blue-300 transition"></div>
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition"></div>
        </div>
        <div>
          {label}
          <p className="text-xs text-[#71839B]">{description}</p>
        </div>
      </label>
    </div>
  );
}
