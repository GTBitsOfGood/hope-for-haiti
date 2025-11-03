import { useState, useEffect } from "react";
import { UserType } from "@prisma/client";
import GeneralModal from "./GeneralModal";
import { useUser } from "@/components/context/UserContext";
import { isAdmin } from "@/lib/userUtils";
import ConfiguredSelect from "@/components/ConfiguredSelect";

interface EditModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: (data: {
    name: string;
    email: string;
    role: UserType;
    tag: string;
  }) => void;
  initialData?: {
    name: string;
    email: string;
    role: UserType;
    tag?: string;
  };
  confirmText?: string;
  cancelText?: string;
  isStaffAccount?: boolean;
  selectedUserId?: number;
  existingTags?: string[];
}

export default function EditModal({
  title,
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  initialData,
  confirmText = "Save changes",
  cancelText = "Cancel",
  isStaffAccount = true,
  selectedUserId,
  existingTags = [],
}: EditModalProps) {
  const { user: currentUser } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "STAFF" as UserType,
    tag: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        tag: initialData.tag || "",
      });
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: string | UserType) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirm = () => {
    onConfirm(formData);
  };

  const handleCancel = () => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        tag: initialData.tag || "",
      });
    }
    onCancel();
  };

  // Determine if the current user can edit roles
  const canEditRoles = currentUser && isAdmin(currentUser.type);

  // Check if editing own account
  const isEditingOwnAccount =
    currentUser &&
    selectedUserId &&
    parseInt(currentUser.id) === selectedUserId;

  // Determine available role options based on current user's permissions
  const getAvailableRoleOptions = () => {
    if (!currentUser || !canEditRoles) return [];

    // If editing own account, don't allow role changes
    if (isEditingOwnAccount) return [];

    // SUPER_ADMIN can assign any role except PARTNER (handled elsewhere)
    if (currentUser.type === "SUPER_ADMIN") {
      return [
        { value: "STAFF", label: "Staff" },
        { value: "ADMIN", label: "Admin" },
        { value: "SUPER_ADMIN", label: "Super Admin" },
      ];
    }

    // ADMIN can only assign STAFF and ADMIN roles, not SUPER_ADMIN
    if (currentUser.type === "ADMIN") {
      return [
        { value: "STAFF", label: "Staff" },
        { value: "ADMIN", label: "Admin" },
      ];
    }

    return [];
  };

  const availableRoleOptions = getAvailableRoleOptions();
  const shouldShowRoleField =
    isStaffAccount &&
    canEditRoles &&
    !isEditingOwnAccount &&
    availableRoleOptions.length > 0;

  return (
    <GeneralModal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {shouldShowRoleField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                handleInputChange("role", e.target.value as UserType)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {availableRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isEditingOwnAccount && isStaffAccount && (
          <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <strong>Note:</strong> You cannot change your own role for security
            reasons.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tag
          </label>
          <ConfiguredSelect
            value={
              formData.tag ? { value: formData.tag, label: formData.tag } : null
            }
            onChange={(selectedOption) =>
              handleInputChange("tag", selectedOption?.value || "")
            }
            options={existingTags.map((tag) => ({
              value: tag,
              label: tag,
            }))}
            isClearable
            placeholder="Select or create a tag..."
          />
        </div>
      </div>
    </GeneralModal>
  );
}
