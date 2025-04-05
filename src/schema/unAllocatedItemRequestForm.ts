import { z } from "zod";
import { zfd } from "zod-form-data";

export const editAllocationFormSchema = zfd.formData({
  allocationId: zfd.numeric(z.number().int().min(0)),
  title: zfd.text(),
  type: zfd.text(),
  expiration: z.coerce.date(),
  unitSize: zfd.numeric(z.number().int().min(0)),
  donorName: zfd.text(),
  lotNumber: zfd.numeric(z.number().int().min(0)),
  palletNumber: zfd.numeric(z.number().int().min(0)),
  boxNumber: zfd.numeric(z.number().int().min(0)),
  quantity: zfd.numeric(z.number().int().min(0)),
});
