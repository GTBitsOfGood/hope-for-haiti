import { isStaff } from "@/lib/userUtils";
import { ExtraChannelData } from "@/types/api/streamio.types";
import { useSession } from "next-auth/react";
import { ChannelPreviewUIComponentProps } from "stream-chat-react";
import ChannelOptionsButton from "./ChannelOptionsButton";
import { formatRelativeDate } from "@/util/relativeDate";

interface ChannelPreviewProps extends ChannelPreviewUIComponentProps {
  isActive?: boolean;
}

export default function ChannelPreview({
  channel,
  latestMessagePreview,
  setActiveChannel,
  isActive = false,
  unread = 0,
}: ChannelPreviewProps) {
  const session = useSession();

  const isStaffUser = session.data ? isStaff(session.data.user.type) : false;

  const data = channel.data as ExtraChannelData;

  const lastActiveTime = channel.lastMessage()
    ? new Date(channel.lastMessage()!.created_at)
    : channel.data?.created_at
      ? new Date(channel.data?.created_at)
      : new Date();

  const relativeDate = formatRelativeDate(lastActiveTime);

  const hasUnread = unread > 0;

  return (
    // Use <a> instead of <button> because we need buttons inside and buttons cannot have other buttons inside them
    <a
      onClick={() => setActiveChannel?.(channel)}
      className={`flex flex-col p-3 rounded-lg my-1 relative ${
        isActive ? "bg-blue-light" : "bg-white"
      } hover:bg-blue-dark/75 transition-all duration-200 cursor-default`}
    >
      {/* Top Row */}
      <div className="flex items-start mb-1 gap-2 min-w-0">
        <div className="font-semibold text-left flex-1 min-w-0 overflow-hidden">
          <span className="inline">{data.name}</span>
          {isStaffUser && data.partnerName && (
            <span className="text-sm text-gray-500 font-normal ml-2">
              {data.partnerName}
            </span>
          )}
        </div>
        {isStaffUser && !data.closed && (
          <div className="flex-shrink-0">
            <ChannelOptionsButton channel={channel} />
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex-1 min-w-0 max-w-[170px] truncate text-ellipsis">
          {latestMessagePreview == "Nothing yet..." ? "" : latestMessagePreview}
        </div>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <span className="text-xs text-red-500 font-semibold">Unread</span>
          )}
          <div className="text-xs text-gray-500 whitespace-nowrap">
            {relativeDate}
          </div>
        </div>
      </div>
    </a>
  );
}
