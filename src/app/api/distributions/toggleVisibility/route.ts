import { auth } from "@/auth";
import { db } from "@/db";
import {
  authenticationError,
  authorizationError,
  argumentError,
  ok,
} from "@/util/responses";
import { UserType } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

const AUTHORIZED_USER_TYPES = [
  UserType.ADMIN,
  UserType.SUPER_ADMIN,
] as UserType[];

export const schema = z.object({
  ids: z.array(z.number()),
  visible: z.boolean(),
});

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return authenticationError("Session required");
  if (!AUTHORIZED_USER_TYPES.includes(session.user.type)) {
    return authorizationError("Unauthorized");
  }

  const body = await request.json();

  const validatedForm = schema.safeParse(body);

  if (!validatedForm.success) {
    //console.log(validatedForm.error.format());
    return argumentError("Invalid data");
  }

  const ids = validatedForm.data.ids;

  const distributions = await db.distribution.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  const donorAllocations = distributions
    .filter(
      (distribution) => distribution.donorOfferItemRequestAllocationId !== null,
    )
    .map(
      (distribution) =>
        distribution.donorOfferItemRequestAllocationId as number,
    );
  const unallocatedAllocations = distributions
    .filter(
      (distribution) =>
        distribution.unallocatedItemRequestAllocationId !== null,
    )
    .map(
      (distribution) =>
        distribution.unallocatedItemRequestAllocationId as number,
    );

  await db.donorOfferItemRequestAllocation.updateMany({
    data: {
      visible: validatedForm.data.visible,
    },
    where: {
      id: {
        in: donorAllocations,
      },
    },
  });

  await db.unallocatedItemRequestAllocation.updateMany({
    data: {
      visible: validatedForm.data.visible,
    },
    where: {
      id: {
        in: unallocatedAllocations,
      },
    },
  });

  return ok();
}
