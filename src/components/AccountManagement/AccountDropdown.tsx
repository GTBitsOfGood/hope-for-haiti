import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { DotsThree } from "@phosphor-icons/react";
import {
  EnvelopeSimple,
  PencilSimple,
  EyeSlash,
  Trash,
} from "@phosphor-icons/react";
import { UserType } from "@prisma/client";
import { isStaff } from "@/lib/userUtils";

interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface AccountDropdownProps {
  isInvite: boolean;
  userType?: UserType;
  onSendReminder?: () => void;
  onDeleteAccount?: () => void;
  onEditAccount?: () => void;
  onDeactivateAccount?: () => void;
}

export default function AccountDropdown({
  isInvite,
  userType,
  onSendReminder,
  onDeleteAccount,
  onEditAccount,
  onDeactivateAccount,
}: AccountDropdownProps) {
  const getDropdownItems = (): DropdownItem[] => {
    if (isInvite) {
      return [
        {
          icon: <EnvelopeSimple size={18} />,
          label: "Send reminder",
          onClick: () => onSendReminder?.(),
        },
        {
          icon: <Trash size={18} />,
          label: "Delete account",
          onClick: () => onDeleteAccount?.(),
        },
      ];
    } else {
      return [
        {
          icon: <PencilSimple size={18} />,
          label: "Edit account",
          onClick: () => onEditAccount?.(),
          disabled: userType ? !isStaff(userType) : false,
        },
        {
          icon: <EyeSlash size={18} />,
          label: "Deactivate account",
          onClick: () => onDeactivateAccount?.(),
        },
      ];
    }
  };

  const dropdownItems = getDropdownItems();

  return (
    <Menu as="div" className="relative">
      <MenuButton className="p-1 hover:bg-gray-100 rounded transition-colors">
        <DotsThree
          weight="bold"
          size={20}
          className="cursor-pointer text-gray-600"
        />
      </MenuButton>

      <MenuItems className="absolute right-0 z-20 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
        <div className="py-1">
          {dropdownItems.map((item, index) => (
            <MenuItem key={index} disabled={item.disabled}>
              {({ active, disabled }) => (
                <button
                  onClick={item.onClick}
                  disabled={disabled}
                  className={`
                    flex items-center w-full px-4 py-2 text-sm text-left
                    ${active && !disabled ? "bg-gray-50 text-gray-900" : "text-gray-700"}
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    transition-colors duration-150
                  `}
                >
                  <span className="mr-3 flex-shrink-0">{item.icon}</span>
                  {item.label}
                </button>
              )}
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}
