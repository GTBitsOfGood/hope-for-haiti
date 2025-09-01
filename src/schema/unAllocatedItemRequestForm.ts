import { z } from "zod";
import { zfd } from "zod-form-data";

export const editAllocationFormSchema = zfd.formData({
  allocationId: zfd.numeric(z.number().int().min(0)),
  title: zfd.text(),
  type: zfd.text(),
  expirationDate: z.coerce.date(),
  unitType: zfd.text(),
  quantityPerUnit: zfd.numeric(z.number().int().min(0)),
  donorName: zfd.text(),
  lotNumber: zfd.text(),
  palletNumber: zfd.text(),
  boxNumber: zfd.text(),
  quantity: zfd.numeric(z.number().int().min(0)),
});

export const createAllocationFormSchema = zfd.formData({
  unallocatedItemRequestId: zfd.numeric(z.number().int().min(0)).optional(),
  donorOfferItemRequestId: zfd.numeric(z.number().int().min(0)).optional(),
  partnerId: zfd.numeric(z.number().int().min(0)).optional(),
  quantity: zfd.numeric(z.number().int().min(0)),
  itemId: zfd.numeric(z.number().int().min(0)).optional(),
  visible: zfd.checkbox().optional(),
  // Item search fields
  title: zfd.text().optional(),
  type: zfd.text().optional(),
  expirationDate: z.coerce.date().optional(),
  unitType: zfd.text().optional(),
  quantityPerUnit: zfd.numeric(z.number().int().min(0)).optional(),
  donorName: zfd.text().optional(),
  lotNumber: zfd.text().optional(),
  palletNumber: zfd.text().optional(),
  boxNumber: zfd.text().optional(),
});
