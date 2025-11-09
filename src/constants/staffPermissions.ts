import {
  EDITABLE_PERMISSION_FIELDS,
  EditablePermissionField,
  StaffPermissionFlags,
} from "@/types/api/user.types";

export interface StaffPermissionMeta {
  key: EditablePermissionField;
  label: string;
  description: string;
  dependsOn?: EditablePermissionField[];
}

export interface StaffPermissionGroup {
  id: string;
  title: string;
  blurb: string;
  permissions: EditablePermissionField[];
}

const PERMISSION_COPY: Record<EditablePermissionField, StaffPermissionMeta> = {
  userRead: {
    key: "userRead",
    label: "View accounts",
    description: "Read access to staff and partner account management.",
  },
  userWrite: {
    key: "userWrite",
    label: "Manage accounts",
    description:
      "Create, update, delete, and deactivate users. Requires account view access.",
    dependsOn: ["userRead"],
  },
  requestRead: {
    key: "requestRead",
    label: "View donor offers",
    description: "Read access to unfinalized donor offers and partner requests.",
  },
  requestWrite: {
    key: "requestWrite",
    label: "Manage donor requests",
    description:
      "Update partner requests inside unfinalized donor offers (partners create their own).",
    dependsOn: ["requestRead"],
  },
  offerWrite: {
    key: "offerWrite",
    label: "Finalize donor offers",
    description:
      "Update or create donor offers, finalize drafts, and archive finalized offers.",
    dependsOn: ["requestRead", "allocationRead", "archivedRead"],
  },
  allocationRead: {
    key: "allocationRead",
    label: "View finalized inventory",
    description: "Read finalized donor offers and unallocated inventory items.",
  },
  allocationWrite: {
    key: "allocationWrite",
    label: "Manage allocations",
    description:
      "Create, edit, or delete allocations in finalized offers or unallocated items.",
    dependsOn: ["allocationRead"],
  },
  itemNotify: {
    key: "itemNotify",
    label: "Item alerts",
    description:
      "Receive notifications for item events (expirations, allocations, etc.).",
    dependsOn: ["requestRead", "allocationRead"],
  },
  archivedRead: {
    key: "archivedRead",
    label: "View archived offers",
    description: "Read archived donor offers and their historical context.",
  },
  distributionRead: {
    key: "distributionRead",
    label: "View distributions",
    description: "Read access to the distributions table.",
  },
  distributionWrite: {
    key: "distributionWrite",
    label: "Manage distributions",
    description:
      "Transfer items between pending distributions and approve distributions.",
    dependsOn: ["distributionRead"],
  },
  shipmentRead: {
    key: "shipmentRead",
    label: "View shipments",
    description: "Read access to the shipments table.",
  },
  shipmentWrite: {
    key: "shipmentWrite",
    label: "Manage shipments",
    description: "Change shipment statuses as they move through fulfillment.",
    dependsOn: ["shipmentRead"],
  },
  signoffWrite: {
    key: "signoffWrite",
    label: "Create signoffs",
    description: "Create signoffs for items that have shipped.",
    dependsOn: ["shipmentRead"],
  },
  supportRead: {
    key: "supportRead",
    label: "View support tickets",
    description: "View support tickets submitted by partners.",
  },
  supportWrite: {
    key: "supportWrite",
    label: "Respond to support tickets",
    description: "Create or reply to support tickets on behalf of the team.",
    dependsOn: ["supportRead"],
  },
  supportNotify: {
    key: "supportNotify",
    label: "Support notifications",
    description: "Receive notifications for support ticket messages.",
    dependsOn: ["supportRead"],
  },
  wishlistRead: {
    key: "wishlistRead",
    label: "View wishlists",
    description: "Read partner wishlists (partners submit their own).",
  },
};

export const STAFF_PERMISSION_GROUPS: StaffPermissionGroup[] = [
  {
    id: "accounts",
    title: "Account Management",
    blurb: "Control who can view or maintain staff and partner accounts.",
    permissions: ["userRead", "userWrite"],
  },
  {
    id: "donor-offers",
    title: "Unfinalized Donor Offers",
    blurb: "Access and edit donor offers before they are finalized.",
    permissions: ["requestRead", "requestWrite", "offerWrite"],
  },
  {
    id: "inventory",
    title: "Finalized & Archived Inventory",
    blurb: "Give visibility into allocations, unallocated items, and alerts.",
    permissions: ["allocationRead", "allocationWrite", "itemNotify", "archivedRead"],
  },
  {
    id: "logistics",
    title: "Distributions & Shipments",
    blurb: "Manage item movement after offers are finalized.",
    permissions: [
      "distributionRead",
      "distributionWrite",
      "shipmentRead",
      "shipmentWrite",
      "signoffWrite",
    ],
  },
  {
    id: "partner-support",
    title: "Partner Support & Wishlists",
    blurb: "Coordinate partner needs and communications.",
    permissions: ["wishlistRead", "supportRead", "supportWrite", "supportNotify"],
  },
];

export const STAFF_PERMISSION_METADATA = PERMISSION_COPY;

export const STAFF_PERMISSION_DEPENDENCIES = EDITABLE_PERMISSION_FIELDS.reduce(
  (map, field) => {
    map[field] = PERMISSION_COPY[field]?.dependsOn ?? [];
    return map;
  },
  {} as Record<EditablePermissionField, EditablePermissionField[]>
);

export const STAFF_PERMISSION_DEPENDENTS = EDITABLE_PERMISSION_FIELDS.reduce(
  (map, field) => {
    map[field] = [];
    return map;
  },
  {} as Record<EditablePermissionField, EditablePermissionField[]>
);

Object.values(PERMISSION_COPY).forEach(({ key, dependsOn }) => {
  dependsOn?.forEach((dependency) => {
    STAFF_PERMISSION_DEPENDENTS[dependency].push(key);
  });
});

export const createEmptyStaffPermissionState = (): StaffPermissionFlags =>
  EDITABLE_PERMISSION_FIELDS.reduce((acc, field) => {
    acc[field] = false;
    return acc;
  }, {} as StaffPermissionFlags);
