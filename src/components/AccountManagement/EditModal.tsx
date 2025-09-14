import { useState, useEffect } from "react";
import { UserType } from "@prisma/client";
import Select from "react-select/creatable";
import GeneralModal from "./GeneralModal";
import { useFetch } from "@/hooks/useFetch";

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
}: EditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "STAFF" as UserType,
    tag: "",
  });

  const { data: existingTags } = useFetch<string[]>("/api/users/tags", {
    conditionalFetch: isOpen
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

        {isStaffAccount && (
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
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tag
          </label>
          <Select
            value={
              formData.tag ? { value: formData.tag, label: formData.tag } : null
            }
            onChange={(selectedOption) =>
              handleInputChange("tag", selectedOption?.value || "")
            }
            options={
              existingTags?.map((tag) => ({
                value: tag,
                label: tag,
              })) || []
            }
            isClearable
            placeholder="Select or create a tag..."
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              control: (provided, state) => ({
                ...provided,
                backgroundColor: "#f9fafb",
                borderColor: state.isFocused ? "#ef4444" : "#d1d5db",
                boxShadow: state.isFocused
                  ? "0 0 0 2px rgba(239, 68, 68, 0.2)"
                  : "none",
                "&:hover": {
                  borderColor: state.isFocused ? "#ef4444" : "#d1d5db",
                },
              }),
            }}
          />
        </div>
      </div>
    </GeneralModal>
  );
}
