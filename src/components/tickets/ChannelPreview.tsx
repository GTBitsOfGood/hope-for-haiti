import { isAdmin } from "@/lib/userUtils";
import { ExtraChannelData } from "@/types/api/streamio.types";
import { useSession } from "next-auth/react";
import { ChannelPreviewUIComponentProps } from "stream-chat-react";
import ChannelOptionsButton from "./ChannelOptionsButton";

export default function ChannelPreview({
  channel,
  displayTitle,
  latestMessagePreview,
  unread,
  setActiveChannel,
}: ChannelPreviewUIComponentProps) {
  const session = useSession();

  const admin = session.data ? isAdmin(session.data.user.type) : false;

  const data = channel.data as ExtraChannelData;

  const lastActiveTime = channel.lastMessage()
    ? new Date(channel.lastMessage()!.created_at)
    : channel.data?.created_at
      ? new Date(channel.data?.created_at)
      : new Date();
  const status =
    unread && unread > 0
      ? "Unread"
      : data.closed
        ? "Closed"
        : lastActiveTime.getHours() > 48
          ? "Stale"
          : "Open";

  const statusColors: Record<typeof status, string> = {
    Unread: "bg-blue-primary/30",
    Open: "",
    Stale: "bg-gray-primary/5",
    Closed: "bg-gray-primary/15",
  };

  return (
    // Use <a> instead of <button> because we need buttons inside and buttons cannot have other buttons inside them
    <a
      onClick={() => setActiveChannel?.(channel)}
      className={`w-full flex p-2 ${statusColors[status]} hover:bg-blue-primary/50 transition-all duration-200`}
    >
      <img
        src={data.image}
        alt={data.name ?? displayTitle}
        className="w-10 h-10 rounded-full mr-3"
      />
      <div className="w-full flex flex-col text-left">
        <div className="flex justify-between items-center">
          <div className="font-semibold">
            {data.name}
            {admin && ` (${data.partnerName})`}
          </div>
          {admin && status !== "Closed" && (
            <ChannelOptionsButton channel={channel} />
          )}
        </div>
        <div className="text-sm text-gray-600 flex gap-1">
          {latestMessagePreview}
          {unread && unread > 0 ? (
            <span className="text-red-primary">({unread} unread)</span>
          ) : (
            ""
          )}
        </div>
      </div>
    </a>
  );
}
