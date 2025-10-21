import { z } from "zod";
import { zfd } from "zod-form-data";

export const editAllocationFormSchema = zfd.formData({
  allocationId: zfd.numeric(z.number().int().min(0)),

  // General item search fields
  title: zfd.text(),
  expirationDate: z.coerce.date(),
  unitType: zfd.text(),

  // Line item search fields
  donorName: zfd.text(),
  lotNumber: zfd.text(),
  palletNumber: zfd.text(),
  boxNumber: zfd.text(),
});

export const createAllocationFormSchema = zfd.formData({
  partnerId: zfd.numeric(z.number().int().min(0)).optional(),
  itemId: zfd.numeric(z.number().int().min(0)),
  distributionId: zfd.numeric(z.number().int().min(0)),
  signOffId: zfd.numeric(z.number().int().min(0)).optional(),
});
