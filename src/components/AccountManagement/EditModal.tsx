import { useState, useEffect } from "react";
import { UserType } from "@prisma/client";
import GeneralModal from "./GeneralModal";
import ConfiguredSelect from "@/components/ConfiguredSelect";

interface EditModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: (data: { name: string; email: string; tag: string }) => void;
  initialData?: {
    name: string;
    email: string;
    role: UserType;
    tag?: string;
  };
  confirmText?: string;
  cancelText?: string;
  isStaffAccount?: boolean;
  existingTags?: string[];
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
    tag: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
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
        tag: initialData.tag || "",
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
