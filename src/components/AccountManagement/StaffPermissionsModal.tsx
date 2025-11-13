"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "@phosphor-icons/react";
import {
  STAFF_PERMISSION_GROUPS,
  STAFF_PERMISSION_METADATA,
  STAFF_PERMISSION_DEPENDENCIES,
  STAFF_PERMISSION_DEPENDENTS,
  createEmptyStaffPermissionState,
} from "@/constants/staffPermissions";
import {
  EditablePermissionField,
  StaffPermissionFlags,
} from "@/types/api/user.types";
import { cn } from "@/util/util";

interface StaffPermissionsModalProps {
  isOpen: boolean;
  title?: string;
  initialPermissions?: Partial<StaffPermissionFlags>;
  onClose: () => void;
  onCancel: () => void;
  onSave: (permissions: StaffPermissionFlags) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  isLoading?: boolean;
  isTargetSuper?: boolean;
  canGrantUserWrite?: boolean;
}

const buildPermissionState = (
  overrides?: Partial<StaffPermissionFlags>
): StaffPermissionFlags => {
  const base = createEmptyStaffPermissionState();
  if (!overrides) return base;

  (Object.entries(overrides) as [EditablePermissionField, boolean][]).forEach(
    ([field, value]) => {
      if (typeof value === "boolean") {
        base[field] = value;
      }
    }
  );

  return base;
};

export default function StaffPermissionsModal({
  isOpen,
  title = "Staff permissions",
  initialPermissions,
  onClose,
  onCancel,
  onSave,
  confirmLabel = "Save permissions",
  cancelLabel = "Cancel",
  isSaving = false,
  isLoading = false,
  isTargetSuper = false,
  canGrantUserWrite = false,
}: StaffPermissionsModalProps) {
  const [draft, setDraft] = useState<StaffPermissionFlags>(() =>
    buildPermissionState(initialPermissions)
  );

  useEffect(() => {
    if (isOpen) {
      setDraft(buildPermissionState(initialPermissions));
    }
  }, [initialPermissions, isOpen]);

  const dependencyLabels = useMemo(() => {
    return Object.keys(STAFF_PERMISSION_DEPENDENCIES).reduce(
      (acc, key) => {
        const field = key as EditablePermissionField;
        acc[field] = STAFF_PERMISSION_DEPENDENCIES[field].map(
          (dep) => STAFF_PERMISSION_METADATA[dep].label
        );
        return acc;
      },
      {} as Record<EditablePermissionField, string[]>
    );
  }, []);

  const isInteractionDisabled = isTargetSuper || isLoading;

  const togglePermission = (field: EditablePermissionField) => {
    if (isInteractionDisabled) return;
    if (!canToggle(field)) return;

    setDraft((prev) => {
      const next = { ...prev };
      const isCurrentlyEnabled = Boolean(prev[field]);
      if (isCurrentlyEnabled) {
        disablePermission(field, next);
      } else {
        enablePermission(field, next);
      }
      return next;
    });
  };

  const enablePermission = (
    field: EditablePermissionField,
    state: StaffPermissionFlags,
    visited = new Set<EditablePermissionField>()
  ) => {
    if (visited.has(field)) return;
    visited.add(field);

    state[field] = true;
    STAFF_PERMISSION_DEPENDENCIES[field].forEach((dependency) => {
      if (!state[dependency]) {
        enablePermission(dependency, state, visited);
      }
    });
  };

  const disablePermission = (
    field: EditablePermissionField,
    state: StaffPermissionFlags,
    visited = new Set<EditablePermissionField>()
  ) => {
    if (visited.has(field)) return;
    visited.add(field);

    state[field] = false;
    STAFF_PERMISSION_DEPENDENTS[field].forEach((dependent) => {
      if (state[dependent]) {
        disablePermission(dependent, state, visited);
      }
    });
  };

  const canToggle = (field: EditablePermissionField) => {
    if (isTargetSuper) return false;
    if (field === "userWrite" && !canGrantUserWrite) {
      return false;
    }
    return true;
  };

  const disabledReason = (field: EditablePermissionField) => {
    if (isTargetSuper) {
      return "Super administrators automatically have every permission.";
    }
    if (field === "userWrite" && !canGrantUserWrite) {
      return "Only super administrators can assign Manage accounts.";
    }
    return undefined;
  };

  const handleSave = () => {
    onSave(draft);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">
              Enabling a permission automatically enables its prerequisites. When
              you turn one off, any permissions that rely on it will also be
              disabled.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close permissions modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 border-b border-gray-50 px-8 py-4">
          {isTargetSuper && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Super administrators inherit every permission and cannot be
              modified from this screen.
            </div>
          )}
          {!canGrantUserWrite && !isTargetSuper && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Only super administrators can assign the “Manage accounts”
              permission. Contact a super admin if this should change.
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`permissions-skeleton-${index}`}
                  className="h-32 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {STAFF_PERMISSION_GROUPS.map((group) => (
                <section
                  key={group.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.title}
                    </h3>
                    <p className="text-sm text-gray-600">{group.blurb}</p>
                  </div>
                  <div className="space-y-4">
                    {group.permissions.map((permissionKey) => {
                      const meta = STAFF_PERMISSION_METADATA[permissionKey];
                      const isEnabled = Boolean(draft[permissionKey]);
                      const reason = disabledReason(permissionKey);
                      const requires = dependencyLabels[permissionKey];

                      return (
                        <div
                          key={permissionKey}
                          className="flex gap-4 rounded-xl bg-white p-4 shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => togglePermission(permissionKey)}
                            disabled={Boolean(reason) || isInteractionDisabled}
                            className={cn(
                              "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition",
                              isEnabled
                                ? "border-red-500 bg-red-500"
                                : "border-gray-300 bg-gray-200",
                              (reason || isInteractionDisabled) &&
                                "cursor-not-allowed opacity-50"
                            )}
                            role="switch"
                            aria-checked={isEnabled}
                          >
                            <span
                              className={cn(
                                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                                isEnabled ? "translate-x-5" : "translate-x-1"
                              )}
                            />
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {meta.label}
                              </p>
                              {reason && (
                                <span className="text-xs font-medium text-gray-500">
                                  {reason}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {meta.description}
                            </p>
                            {requires.length > 0 && (
                              <p className="text-xs text-gray-500">
                                Requires: {requires.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-8 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isInteractionDisabled}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-semibold text-white transition",
              isInteractionDisabled
                ? "bg-gray-400"
                : "bg-red-500 hover:bg-red-600",
              isSaving && "opacity-70"
            )}
          >
            {isSaving ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
