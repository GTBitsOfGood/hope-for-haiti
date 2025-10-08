import { RequestPriority } from "@prisma/client";

export interface UpdateGeneralItemRequestData {
  priority: RequestPriority;
  quantity: number;
  comments: string;
}
