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
  partnerId: zfd.numeric(z.number().int().min(0)).optional(),
  itemId: zfd.numeric(z.number().int().min(0)),
  distributionId: zfd.numeric(z.number().int().min(0)),
  signOffId: zfd.numeric(z.number().int().min(0)).optional(),
});
