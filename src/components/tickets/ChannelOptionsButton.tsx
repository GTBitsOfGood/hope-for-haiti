import { Channel } from "stream-chat";
import Portal from "../baseTable/Portal";
import { useState, useRef } from "react";
import { DotsThree } from "@phosphor-icons/react";
import { useApiClient } from "@/hooks/useApiClient";
import { toast } from "react-hot-toast";

export default function ChannelOptionsButton({
  channel,
}: {
  channel: Channel;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { apiClient } = useApiClient();

  async function closeTicket() {
    if (!apiClient) {
      toast.error("API client not available");
      return;
    }

    const promise = apiClient.patch(`/api/tickets/${channel.id}`, {
      body: JSON.stringify({
        closed: true,
      }),
    });

    toast.promise(promise, {
      loading: "Closing ticket...",
      success: "Ticket closed",
      error: "Failed to close ticket",
    });

    await promise;

    channel.watch(); // Refresh channel data

    setIsDropdownOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className="p-[2px] rounded-full hover:bg-sunken hover:shadow-md transition-all duration-150"
      >
        <DotsThree size={20} />
      </button>
      <Portal
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        triggerRef={buttonRef}
        position="bottom-right"
        className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-1"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeTicket();
          }}
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
        >
          Close Ticket
        </button>
      </Portal>
    </div>
  );
}
