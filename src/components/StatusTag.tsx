interface StatusTagProps {
  value: boolean;
  trueText: string;
  falseText: string;
  grayWhenFalse?: boolean;
}

export default function StatusTag({
  value,
  trueText,
  falseText,
  grayWhenFalse = false,
}: StatusTagProps) {
  return (
    <span
      className={`inline-block px-2 py-1 rounded-md text-sm ${
        value
          ? "bg-green-50 text-green-700"
          : grayWhenFalse
            ? "bg-gray-100 text-gray-700"
            : "bg-red-50 text-red-700"
      }`}
    >
      {value ? trueText : falseText}
    </span>
  );
}
