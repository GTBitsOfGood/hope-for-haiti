import { zfd } from "zod-form-data";
import { z } from "zod";
import { ItemCategory } from "@prisma/client";

export const lineItemFormSchema = zfd.formData({
  category: zfd.text(z.nativeEnum(ItemCategory)),
  quantity: zfd.numeric(z.number().int().min(0)),
  datePosted: z.coerce.date(),
  lotNumber: zfd.text(),
  palletNumber: zfd.text(),
  boxNumber: zfd.text(),
  donorName: zfd.text(),
  unitPrice: zfd.numeric(z.number().min(0)),
  maxRequestLimit: zfd.text(),
  visible: zfd.checkbox(),
  allowAllocations: zfd.checkbox(),
  gik: zfd.checkbox(),
  donorShippingNumber: zfd.text(),
  hfhShippingNumber: zfd.text(),
  ndc: zfd.text(z.string().optional()),
  notes: zfd.text(z.string().optional()),
});

export type ItemForm = z.infer<typeof lineItemFormSchema>;
