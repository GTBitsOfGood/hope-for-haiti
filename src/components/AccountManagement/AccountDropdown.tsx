import { useRef, useState } from "react";
import { DotsThree } from "@phosphor-icons/react";
import {
  EnvelopeSimple,
  PencilSimple,
  EyeSlash,
  Eye,
  Trash,
} from "@phosphor-icons/react";
import Portal from "@/components/baseTable/Portal";

interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tutorialId?: string;
}

interface AccountDropdownProps {
  isPending: boolean;
  user?: { enabled?: boolean; expiration?: Date | string; id?: number };
  onDeleteAccount?: () => void;
  onEditAccount?: () => void;
  onDeactivateAccount?: () => void;
  onSendReminder?: () => void;
  canManage?: boolean;
  /** When true, hide Deactivate/Activate option (e.g. for self or protected users) */
  hideDeactivateOption?: boolean;
  forceOpen?: boolean;
  triggerTutorialId?: string;
  menuTutorialId?: string;
  editOptionTutorialId?: string;
  deactivateOptionTutorialId?: string;
}

export default function AccountDropdown({
  isPending,
  user,
  onDeleteAccount,
  onEditAccount,
  onDeactivateAccount,
  onSendReminder,
  canManage = true,
  hideDeactivateOption = false,
  forceOpen = false,
  triggerTutorialId,
  menuTutorialId,
  editOptionTutorialId,
  deactivateOptionTutorialId,
}: AccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!canManage) {
    return null;
  }

  const getDropdownItems = (): DropdownItem[] => {
    if (isPending) {
      return [
        {
          icon: <EnvelopeSimple size={18} />,
          label: "Send reminder",
          onClick: () => {
            onSendReminder?.();
            setIsOpen(false);
          },
        },
        {
          icon: <Trash size={18} />,
          label: "Delete account",
          onClick: () => {
            onDeleteAccount?.();
            setIsOpen(false);
          },
        },
      ];
    } else {
      const isEnabled = user?.enabled !== false;
      const items: DropdownItem[] = [
        {
          icon: <PencilSimple size={18} />,
          label: "Edit account",
          tutorialId: editOptionTutorialId,
          onClick: () => {
            onEditAccount?.();
            setIsOpen(false);
          },
        },
      ];
      if (!hideDeactivateOption) {
        items.push({
          icon: isEnabled ? <EyeSlash size={18} /> : <Eye size={18} />,
          label: isEnabled ? "Deactivate account" : "Activate account",
          tutorialId: deactivateOptionTutorialId,
          onClick: () => {
            onDeactivateAccount?.();
            setIsOpen(false);
          },
        });
      }
      return items;
    }
  };

  const dropdownItems = getDropdownItems();
  const shouldShowMenu = forceOpen || isOpen;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          if (forceOpen) return;
          setIsOpen(!isOpen);
        }}
        data-tutorial={triggerTutorialId}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
      >
        <DotsThree
          weight="bold"
          size={20}
          className="cursor-pointer text-gray-600"
        />
      </button>

      <Portal
        isOpen={shouldShowMenu}
        onClose={() => {
          if (forceOpen) return;
          setIsOpen(false);
        }}
        triggerRef={buttonRef}
        position="bottom-right"
        className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5"
        tutorialId={menuTutorialId}
        closeOnOutsideClick={!forceOpen}
      >
        <div className="py-1">
          {dropdownItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              disabled={item.disabled}
              data-tutorial={item.tutorialId}
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
