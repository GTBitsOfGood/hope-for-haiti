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

export interface QuantizedGeneralItemStringDate
  extends Omit<GeneralItem, "expirationDate"> {
  quantity: number;
  expirationDate: string | null;
}
