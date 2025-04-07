import { z } from "zod";
import { zfd } from "zod-form-data";

export const editAllocationFormSchema = zfd.formData({
  allocationId: zfd.numeric(z.number().int().min(0)),
  title: zfd.text(),
  type: zfd.text(),
  expirationDate: z.coerce.date().optional(),
  unitType: zfd.text(),
  quantityPerUnit: zfd.numeric(z.number().int().min(0)),
  donorName: zfd.text(),
  lotNumber: zfd.text(),
  palletNumber: zfd.text(),
  boxNumber: zfd.text(),
  quantity: zfd.numeric(z.number().int().min(0)),
});
