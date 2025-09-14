import OptionsTag from "./OptionsTag";

function normalizeStatus(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

export default function AccountStatusTag({ status }: { status: string }) {
  const styleMap = new Map([
    ["ACTIVATED", { className: "bg-green-primary", text: "Activated" }],
    ["DEACTIVATED", { className: "bg-red-primary/70", text: "Deactivated" }],
    [
      "PENDING_INVITE",
      { className: "bg-yellow-primary", text: "Pending invite" },
    ],
    ["PENDING", { className: "bg-yellow-primary", text: "Pending invite" }],
    ["EXPIRED", { className: "bg-red-primary/70", text: "Expired" }],
  ]);

  const normalized = normalizeStatus(status);
  return <OptionsTag value={normalized} styleMap={styleMap} />;
}


