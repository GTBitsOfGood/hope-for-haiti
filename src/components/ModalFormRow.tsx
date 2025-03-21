import { ReactNode } from "react";

interface ModalFormRowProps {
  children: ReactNode;
}

export default function ModalFormRow({ children }: ModalFormRowProps) {
  return <div className="flex gap-x-2">{children}</div>;
}
