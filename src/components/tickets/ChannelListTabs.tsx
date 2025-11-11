"use client";

interface ChannelListTabsProps {
  activeTab: "Unresolved" | "Resolved";
  onTabChange: (tab: "Unresolved" | "Resolved") => void;
}

export default function ChannelListTabs({
  activeTab,
  onTabChange,
}: ChannelListTabsProps) {
  return (
    <div className="flex space-x-4 border-b-2 border-gray-primary/10">
      <button
        data-active={activeTab === "Unresolved"}
        className="px-2 py-1 text-md font-medium text-gray-primary/70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
        onClick={() => onTabChange("Unresolved")}
      >
        <div className="hover:bg-sunken px-2 py-1 rounded">Unresolved</div>
      </button>
      <button
        data-active={activeTab === "Resolved"}
        className="px-2 py-1 text-md font-medium text-gray-primary/70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
        onClick={() => onTabChange("Resolved")}
      >
        <div className="hover:bg-sunken px-2 py-1 rounded">Resolved</div>
      </button>
    </div>
  );
}

