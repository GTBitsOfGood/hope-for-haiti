"use client";

import { Tooltip } from "react-tooltip";
import Image from "next/image";

interface SignatureImageTooltipProps {
  tooltipId: string;
  signatureUrl: string;
}

export default function SignatureImageTooltip({
  tooltipId,
  signatureUrl,
}: SignatureImageTooltipProps) {
  return (
    <Tooltip
      id={tooltipId}
      className="!bg-white !border !border-gray-200 !shadow-lg !p-2 !max-w-none"
    >
      <div className="relative max-w-xs max-h-48 min-w-[128px] min-h-[96px]">
        <Image
          src={signatureUrl}
          alt="Signature"
          width={600}
          height={200}
          className="w-full h-auto"
        />
      </div>
    </Tooltip>
  );
}
