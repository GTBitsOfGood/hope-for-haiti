interface StyleOptions {
  text: string;
  className: string;
}

interface OptionsTagProps {
  value: string;
  styleMap: Map<string, StyleOptions>;
}

export default function OptionsTag({ value, styleMap }: OptionsTagProps) {
  const style = styleMap.get(value);

  return (
    <span
      className={`inline-block px-2 py-1 rounded-md bg-opacity-20 ${style?.className || "bg-gray-400"}`}
    >
      {style?.text || "N/A"}
    </span>
  );
}
