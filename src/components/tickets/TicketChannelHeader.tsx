import { ExtraChannelData } from "@/types/api/streamio.types";
import { useChannelStateContext } from "stream-chat-react";
import ChannelOptionsButton from "./ChannelOptionsButton";
import { useSession } from "next-auth/react";
import { isStaff } from "@/lib/userUtils";

export default function TicketChannelHeader() {
  const session = useSession();
  const { channel } = useChannelStateContext();

  const data = channel.data as ExtraChannelData;

  const isStaffUser = session.data ? isStaff(session.data.user.type) : false;

  return (
    <div className="p-4 border-b flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">
          {data.name || "Unnamed Support Ticket"}
        </h2>
        {isStaffUser && data.partnerName && <span className="text-sm text-gray-primary/70">{data.partnerName}</span>}
        <span
          className={`px-2 py-1 ${data.closed ? "bg-gray-primary/20 text-gray-primary" : "bg-green-primary text-green-dark"} rounded-full text-sm`}
        >
          {data.closed ? "Closed" : "Open"}
        </span>
      </div>
      {!data.closed && isStaffUser && <ChannelOptionsButton channel={channel} />}
    </div>
  );
}
