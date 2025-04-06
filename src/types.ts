export interface GeneralItem {
  title: string;
  type: string;
  expirationDate: Date | null;
  unitType: string;
  quantityPerUnit: number;
}

export interface QuantizedGeneralItem extends GeneralItem {
  quantity: number;
}
