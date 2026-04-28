import { useState, useEffect } from "react";
import { UserType } from "@prisma/client";
import GeneralModal from "./GeneralModal";
import CreatableConfiguredSelect from "@/components/CreatableConfiguredSelect";
import { useApiClient } from "@/hooks/useApiClient";
import toast from "react-hot-toast";

interface TagOption {
  value: number;
  label: string;
}

interface EditModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: (data: { name: string; email: string; tags: TagOption[] }) => void;
  initialData?: {
    name: string;
    email: string;
    role: UserType;
    tags?: TagOption[];
  };
  confirmText?: string;
  cancelText?: string;
  isStaffAccount?: boolean;
  existingTags?: TagOption[];
  onManagePermissions?: () => void;
  isPending?: boolean;
  onEditPartnerDetails?: () => void;
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
  existingTags = [],
  onManagePermissions,
  isPending = false,
  onEditPartnerDetails,
}: EditModalProps) {
  const isPartnerAccount = initialData?.role === UserType.PARTNER;

  const canEditEmail = false;
  const canEditName = isPending || isStaffAccount;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tags: [] as TagOption[],
  });

  const [tagOptions, setTagOptions] = useState<TagOption[]>(existingTags ?? []);

  const { apiClient } = useApiClient();

  useEffect(() => {
    setTagOptions(existingTags ?? []);
  }, [existingTags]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        tags: initialData.tags || [],
      });
    }
  }, [initialData]);

  const handleInputChange = (
    field: string,
    value: string | UserType | TagOption[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateTag = async (inputValue: string) => {
    try {
      const newTag = await apiClient.post<{ id: number; name: string }>(
        "/api/tags",
        {
          body: JSON.stringify({ name: inputValue }),
        }
      );
      const newOption: TagOption = { value: newTag.id, label: newTag.name };
      setTagOptions((prev) => [...prev, newOption]);
      handleInputChange("tags", [...formData.tags, newOption]);
      
      return newOption;
    } catch {
      toast.error("Failed to create tag");
      return null;
    }
  };

  const handleConfirm = () => {
    onConfirm(formData);
  };

  const handleCancel = () => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        tags: initialData.tags || [],
      });
    }
    onCancel();
  };

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
            disabled={!canEditName}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
              canEditName
                ? "bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                : "bg-gray-100 cursor-not-allowed opacity-60"
            }`}
          />
          {!canEditName && isPartnerAccount && (
            <p className="mt-1 text-xs text-gray-500">
              Name can only be edited while the account is pending. User can
              change their name themselves.
            </p>
          )}
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
            disabled={!canEditEmail}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
              canEditEmail
                ? "bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                : "bg-gray-100 cursor-not-allowed opacity-60"
            }`}
          />
          {!canEditEmail && (
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be edited.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <CreatableConfiguredSelect<TagOption, true>
            value={formData.tags}
            onChange={(selected) =>
              handleInputChange("tags", selected ? [...selected] : [])
            }
            onCreateOption={handleCreateTag}
            options={tagOptions}
            isMulti
            isClearable
            placeholder="Select or create tags..."
          />
        </div>

        {isStaffAccount && onManagePermissions && (
          <div className="rounded-lg border border-gray-200 bg-red-50/30 px-4 py-3">
            <p className="text-sm text-gray-700">
              Permissions control what this staff member can view or edit across
              the platform.
            </p>
            <button
              type="button"
              onClick={onManagePermissions}
              className="mt-2 text-sm font-semibold text-red-500 hover:text-red-600"
            >
              Manage permissions
            </button>
          </div>
        )}

        {isPartnerAccount && onEditPartnerDetails && (
          <div className="rounded-lg border border-gray-200 bg-red-50/30 px-4 py-3">
            <p className="text-sm text-gray-700">
              Edit comprehensive partner details including facility information,
              programs, finances, and more.
            </p>
            <button
              type="button"
              onClick={onEditPartnerDetails}
              className="mt-2 text-sm font-semibold text-red-500 hover:text-red-600"
            >
              Edit partner details
            </button>
          </div>
        )}
      </div>
    </GeneralModal>
  );
}
