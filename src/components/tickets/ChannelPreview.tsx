import { ExtraChannelData } from "@/types/api/streamio.types";
import { ChannelPreviewUIComponentProps } from "stream-chat-react";

export default function ChannelPreview({
  channel,
  displayTitle,
  latestMessagePreview,
  setActiveChannel,
}: ChannelPreviewUIComponentProps) {
  const data = channel.data as ExtraChannelData;

  return (
    <button
      onClick={() => setActiveChannel?.(channel)}
      className="w-full flex p-2 hover:bg-blue-light transition-all duration-200"
    >
      <img
        src={data.image}
        alt={data.name ?? displayTitle}
        className="w-10 h-10 rounded-full mr-3"
      />
      <div className="flex flex-col text-left">
        <div className="font-semibold">{data.name}</div>
        <div className="text-sm text-gray-600">{latestMessagePreview}</div>
      </div>
    </button>
  );
}
