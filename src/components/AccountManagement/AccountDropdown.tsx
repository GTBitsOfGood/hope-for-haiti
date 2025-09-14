import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { DotsThree } from "@phosphor-icons/react";
import {
  EnvelopeSimple,
  PencilSimple,
  EyeSlash,
  Eye,
  Trash,
} from "@phosphor-icons/react";
import { UserType } from "@prisma/client";
import { useUser } from "@/components/context/UserContext";
import { isAdmin } from "@/lib/userUtils";

interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface AccountDropdownProps {
  isInvite: boolean;
  userType?: UserType;
  user?: { enabled?: boolean; expiration?: Date; id?: number };
  onDeleteAccount?: () => void;
  onEditAccount?: () => void;
  onDeactivateAccount?: () => void;
}

export default function AccountDropdown({
  isInvite,
  user,
  onDeleteAccount,
  onEditAccount,
  onDeactivateAccount,
}: AccountDropdownProps) {
  const { user: currentUser } = useUser();

  const canEdit = currentUser && isAdmin(currentUser.type);

  const getDropdownItems = (): DropdownItem[] => {
    if (isInvite) {
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
          onClick: () => onDeleteAccount?.(),
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
          onClick: () => onEditAccount?.(),
        });
      }

      if (canEdit) {
        items.push({
          icon: isEnabled ? <EyeSlash size={18} /> : <Eye size={18} />,
          label: isEnabled ? "Deactivate account" : "Activate account",
          onClick: () => onDeactivateAccount?.(),
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
