import { useState, useRef } from "react";
import { DotsThree } from "@phosphor-icons/react";
import {
  EnvelopeSimple,
  PencilSimple,
  EyeSlash,
  Eye,
  Trash,
} from "@phosphor-icons/react";
import { useUser } from "@/components/context/UserContext";
import { isAdmin } from "@/lib/userUtils";
import Portal from "@/components/baseTable/Portal";

interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface AccountDropdownProps {
  isPending: boolean;
  user?: { enabled?: boolean; expiration?: Date | string; id?: number };
  onDeleteAccount?: () => void;
  onEditAccount?: () => void;
  onDeactivateAccount?: () => void;
}

export default function AccountDropdown({
  isPending,
  user,
  onDeleteAccount,
  onEditAccount,
  onDeactivateAccount,
}: AccountDropdownProps) {
  const { user: currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const canEdit = currentUser && isAdmin(currentUser.type);

  const getDropdownItems = (): DropdownItem[] => {
    if (isPending) {
      return [
        {
          icon: <EnvelopeSimple size={18} />,
          label: "Send reminder",
          onClick: () => {},
          disabled: true,
        },
        {
          icon: <Trash size={18} />,
          label: "Delete account",
          onClick: () => {
            onDeleteAccount?.();
            setIsOpen(false);
          },
          disabled: !canEdit,
        },
      ];
    } else {
      const isEnabled = user?.enabled !== false;
      const items: DropdownItem[] = [];

      if (canEdit) {
        items.push({
          icon: <PencilSimple size={18} />,
          label: "Edit account",
          onClick: () => {
            onEditAccount?.();
            setIsOpen(false);
          },
        });
      }

      if (canEdit) {
        items.push({
          icon: isEnabled ? <EyeSlash size={18} /> : <Eye size={18} />,
          label: isEnabled ? "Deactivate account" : "Activate account",
          onClick: () => {
            onDeactivateAccount?.();
            setIsOpen(false);
          },
        });
      }

      if (!canEdit) {
        items.push({
          icon: <PencilSimple size={18} />,
          label: "View only",
          onClick: () => {},
          disabled: true,
        });
      }

      return items;
    }
  };

  const dropdownItems = getDropdownItems();

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
      >
        <DotsThree
          weight="bold"
          size={20}
          className="cursor-pointer text-gray-600"
        />
      </button>

      <Portal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={buttonRef}
        position="bottom-right"
        className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5"
      >
        <div className="py-1">
          {dropdownItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              disabled={item.disabled}
              className={`
                flex items-center w-full px-4 py-2 text-sm text-left
                ${!item.disabled ? "hover:bg-gray-50 text-gray-900" : "text-gray-700"}
                ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                transition-colors duration-150
              `}
            >
              <span className="mr-3 flex-shrink-0">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </Portal>
    </div>
  );
}
