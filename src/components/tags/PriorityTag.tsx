import OptionsTag from "./OptionsTag";
export default function PriorityTag({ 
  priority, 
  dark = true 
}: { 
  priority: string; 
  dark?: boolean; 
}) {
  const darkStyleMap = new Map([
    ["HIGH", { className: "bg-red-primary/70", text: "High" }],
    ["MEDIUM", { className: "bg-yellow-primary", text: "Medium" }],
    ["LOW", { className: "bg-green-primary", text: "Low" }],
  ]);

  const lightStyleMap = new Map([
    ["HIGH", { className: "bg-red-50 text-red-700", text: "High" }],
    ["MEDIUM", { className: "bg-yellow-50 text-yellow-700", text: "Medium" }],
    ["LOW", { className: "bg-green-50 text-green-700", text: "Low" }],
  ]);

  return <OptionsTag value={priority} styleMap={dark ? darkStyleMap : lightStyleMap} />;
}
