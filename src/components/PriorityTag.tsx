import OptionsTag from "./OptionsTag";
export default function PriorityTag({ priority }: { priority: string }) {
  const styleMap = new Map([
    ["HIGH", { className: "bg-red-primary", text: "High" }],
    ["MEDIUM", { className: "bg-orange-primary", text: "Medium" }],
    ["LOW", { className: "bg-green-dark", text: "Low" }],
  ]);

  return <OptionsTag value={priority} styleMap={styleMap} />;
}
