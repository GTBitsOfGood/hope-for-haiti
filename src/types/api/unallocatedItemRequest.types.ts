import { RequestPriority } from "@prisma/client";

export interface UpdateUnallocatedItemRequestData {
  id: number;
  priority: RequestPriority;
  quantity: string;
  comments: string;
}
