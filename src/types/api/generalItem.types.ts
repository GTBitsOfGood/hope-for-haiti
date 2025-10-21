export interface CreateGeneralItemParams {
  donorOfferId: number;
  title: string;
  expirationDate?: Date;
  unitType: string;
  initialQuantity: number;
  requestQuantity?: number;
}

export type UpdateGeneralItemParams = Partial<
  Omit<CreateGeneralItemParams, "donorOfferId">
>;
