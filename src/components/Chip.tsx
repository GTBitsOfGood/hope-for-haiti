import { ReactNode, Ref } from "react";

export default function Chip({
  children,
  className,
  onClick,
  ref,
  popover,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ref?: Ref<HTMLButtonElement>;
  popover?: ReactNode;
}) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`relative rounded-lg border m-2 px-2 py-1 text-sm flex items-center gap-1 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
      {popover && (
        <span className="absolute -left-2 -top-2 rounded overflow-clip text-xs shadow-sm bg-white">
          {popover}
        </span>
      )}
    </button>
  );
}
