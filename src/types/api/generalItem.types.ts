export interface CreateGeneralItemParams {
  donorOfferId: number;
  title: string;
  type: string;
  expirationDate?: Date;
  unitType: string;
  quantityPerUnit: number;
  initialQuantity: number;
  requestQuantity?: number;
}
