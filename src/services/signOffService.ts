import { db } from "@/db";
import {
  CreateSignOffData,
  SignOffSummary,
  SignOffSummaryResponse,
  SignOffDetails,
} from "@/types/api/signOff.types";
import { NotFoundError, ArgumentError } from "@/util/errors";
import { Prisma, ShipmentStatus } from "@prisma/client";
import { Filters } from "@/types/api/filter.types";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";
import { DistributionItem } from "@/types/api/distribution.types";

export class SignOffService {
  static async createSignOff(data: CreateSignOffData) {
    const partner = await db.user.findUnique({
      where: { id: data.partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    if (!partner.enabled) {
      throw new ArgumentError("Cannot create sign-off for deactivated partner");
    }

    if (partner.pending) {
      throw new ArgumentError("Cannot create sign-off for pending partner");
    }

    return db.signOff.create({
      data: {
        staffMemberName: data.staffName,
        partnerName: data.partnerName,
        date: data.date,
        partnerId: data.partnerId,
        signatureUrl: data.signatureUrl,
        allocations: {
          connect: data.allocations.map((id) => ({ id })),
        },
      },
    });
  }

  static async updateSignOff(
    signOffId: number,
    data: Partial<CreateSignOffData>
  ) {
    return db.signOff.update({
      where: { id: signOffId },
      data: {
        ...data,
        allocations: data.allocations
          ? {
              connect: data.allocations.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        allocations: true,
      },
    });
  }

  static async deleteSignOff(signOffId: number) {
    await db.signOff.delete({
      where: { id: signOffId },
    });
  }

  static async getAllSignOffs(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ): Promise<SignOffSummaryResponse> {
    const where = buildWhereFromFilters<Prisma.SignOffWhereInput>(
      Object.keys(Prisma.SignOffScalarFieldEnum),
      filters
    );

    const query = Prisma.validator<Prisma.SignOffFindManyArgs>()({
      where,
      include: {
        allocations: true,
        _count: {
          select: {
            allocations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    buildQueryWithPagination(query, page, pageSize);

    const [signOffs, total] = await Promise.all([
      db.signOff.findMany(query),
      db.signOff.count({ where }),
    ]);

    type SignOffWithCount = Prisma.SignOffGetPayload<typeof query>;

    const mapped: SignOffSummary[] = (signOffs as SignOffWithCount[]).map(
      (signOff) => ({
        staffName: signOff.staffMemberName,
        numberOfItems: signOff._count.allocations,
        dateCreated: signOff.createdAt,
        signOffDate: signOff.createdAt,
        status: "-",
      })
    );

    return { signOffs: mapped, total };
  }

  static async getSignOffsByPartner(
    partnerId: number
  ): Promise<SignOffSummary[]> {
    // Check if the partner is enabled and not pending
    const partner = await db.user.findUnique({
      where: { id: partnerId },
      select: { enabled: true, pending: true },
    });

    if (!partner?.enabled || partner?.pending) {
      return [];
    }

    const query = Prisma.validator<Prisma.SignOffFindManyArgs>()({
      where: { partnerId },
      include: {
        allocations: true,
        _count: {
          select: {
            allocations: true,
          },
        },
      },
    });

    const signOffs = await db.signOff.findMany(query);

    type SignOffWithCount = Prisma.SignOffGetPayload<typeof query>;

    return (signOffs as SignOffWithCount[]).map((signOff) => ({
      staffName: signOff.staffMemberName,
      numberOfItems: signOff._count.allocations,
      dateCreated: signOff.createdAt,
      signOffDate: signOff.createdAt,
      status: "-",
    }));
  }

  static async getSignOffById(signOffId: number): Promise<SignOffDetails> {
    const signOff = await db.signOff.findUnique({
      where: { id: signOffId },
      include: {
        allocations: {
          include: {
            lineItem: true,
          },
        },
      },
    });

    if (!signOff) {
      throw new NotFoundError("Sign-off not found");
    }

    const distributions: DistributionItem[] = await Promise.all(
      signOff.allocations.map(async (allocation) => {
        if (!allocation.lineItem) {
          throw new NotFoundError("Allocation line item not found");
        }

        let shipmentStatus: ShipmentStatus =
          ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR;

        if (
          allocation.lineItem.donorShippingNumber &&
          allocation.lineItem.hfhShippingNumber
        ) {
          const status = await db.shippingStatus.findFirst({
            where: {
              donorShippingNumber: allocation.lineItem.donorShippingNumber,
              hfhShippingNumber: allocation.lineItem.hfhShippingNumber,
            },
          });

          if (status) {
            shipmentStatus = status.value;
          }
        }

        return {
          ...allocation.lineItem,
          shipmentStatus,
          quantityAllocated: allocation.lineItem.quantity,
        };
      })
    );

    return {
      id: signOff.id,
      date: signOff.date,
      staffMemberName: signOff.staffMemberName,
      partnerName: signOff.partnerName,
      partnerId: signOff.partnerId,
      distributions,
    };
  }
}
