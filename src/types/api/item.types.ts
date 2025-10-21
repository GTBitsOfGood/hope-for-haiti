import { ItemForm } from "@/schema/itemForm";
import { ItemCategory } from "@prisma/client";

export type CreateItemData = ItemForm;

export interface BulkItemData {
  title: string;
  expirationDate?: Date | string;
  unitType: string;
  donorName: string;
  category: ItemCategory;
  quantity: number;
  datePosted: Date;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
  donorShippingNumber?: string;
  hfhShippingNumber?: string;
  unitPrice: number;
  maxRequestLimit: string;
  ndc?: string;
  visible: boolean;
  allowAllocations: boolean;
  gik: boolean;
}

export interface BulkUploadResult {
  success: boolean;
  createdCount?: number;
  errors?: string[];
  items?: BulkItemData[];
}

export interface UnallocatedItemRequestSummary {
  id: number;
  partnerId: number;
  quantity: number;
  comments: string;
}
