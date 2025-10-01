import { RequestPriority } from "@prisma/client";

export interface UpdateGeneralItemRequestData {
  id: number;
  priority: RequestPriority;
  quantity: string;
  comments: string;
}
