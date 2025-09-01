import { UserType, RequestPriority, Item } from "@prisma/client";

export interface GetUnallocatedItemsParams {
  expirationDateBefore?: Date;
  expirationDateAfter?: Date;
  userType: UserType;
  userId: string;
}

export interface CreateUnallocatedItemRequestData {
  title: string;
  type: string;
  priority: RequestPriority;
  expirationDate?: Date;
  unitType: string;
  quantityPerUnit: number;
  quantity: number;
  comments: string;
  partnerId: number;
}

export interface GetLineItemsParams {
  title: string;
  type: string;
  expirationDate: Date | null;
  unitType: string;
  quantityPerUnit: number;
}

export interface GetUnallocatedItemRequestsParams {
  title: string;
  type: string;
  expirationDate: Date | null;
  unitType: string;
  quantityPerUnit: number;
}

export interface UnallocatedItem extends Item {
  quantityLeft: number;
}

export interface GeneralItem {
  title: string;
  type: string;
  expirationDate: string;
  unitType: string;
  quantityPerUnit: number;
}

export interface ItemRequest {
  generalItem: GeneralItem;
  priority: RequestPriority;
  quantity: string;
  comments: string;
}

export interface CreateMultipleUnallocatedItemRequestsData {
  requests: ItemRequest[];
  partnerId: number;
}
