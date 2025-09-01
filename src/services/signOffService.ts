import { db } from "@/db";
import { 
  CreateSignOffData, 
  SignOffSummary, 
  SignOffDetails, 
  DistributionItem,
} from "@/types/api/signOff.types";

export class SignOffService {
  static async createSignOff(data: CreateSignOffData) {
    await db.signOff.create({
      data: {
        staffMemberName: data.staffName,
        partnerName: data.partnerName,
        date: data.date,
        partnerId: data.partnerId,
        distributions: {
          createMany: {
            data: data.distributions.map((dist) => ({
              partnerId: data.partnerId,
              ...(dist.allocationType === "unallocated"
                ? {
                    unallocatedItemRequestAllocationId: dist.allocationId,
                  }
                : {
                    donorOfferItemRequestAllocationId: dist.allocationId,
                  }),
              actualQuantity: dist.actualQuantity,
            })),
          },
        },
      },
    });
  }

  static async getSignOffsByPartner(partnerId: number): Promise<SignOffSummary[]> {
    const signOffs = await db.signOff.findMany({
      where: { partnerId },
      include: {
        distributions: true,
        _count: {
          select: {
            distributions: true,
          },
        },
      },
    });

    return signOffs.map((signOff) => ({
      staffName: signOff.staffMemberName,
      numberOfItems: signOff._count.distributions,
      dateCreated: signOff.createdAt,
      signOffDate: signOff.createdAt,
      status: "-",
    }));
  }

  static async getSignOffById(signOffId: number): Promise<SignOffDetails | null> {
    const signOff = await db.signOff.findUnique({
      where: { id: signOffId },
      include: { distributions: true },
    });

    if (!signOff) {
      return null;
    }

    const distributionItems: DistributionItem[] = [];
    
    for (const distribution of signOff.distributions) {
      let item = null;
      let quantityAllocated = null;

      if (distribution.unallocatedItemRequestAllocationId) {
        const allocation = await db.unallocatedItemRequestAllocation.findUnique({
          where: { id: distribution.unallocatedItemRequestAllocationId },
          include: { unallocatedItem: true },
        });
        item = allocation?.unallocatedItem;
        quantityAllocated = allocation?.quantity;

        if (item && quantityAllocated !== undefined) {
          distributionItems.push({
            ...item,
            quantityAllocated: quantityAllocated,
            actualQuantity: distribution.actualQuantity,
          });
        }
      }

      if (distribution.donorOfferItemRequestAllocationId) {
        const allocation = await db.donorOfferItemRequestAllocation.findUnique({
          where: { id: distribution.donorOfferItemRequestAllocationId },
          include: { item: true },
        });
        item = allocation?.item;
        quantityAllocated = allocation?.quantity;

        if (item && quantityAllocated !== undefined) {
          distributionItems.push({
            ...item,
            quantityAllocated: quantityAllocated,
            actualQuantity: distribution.actualQuantity,
          });
        }
      }
    }

    return {
      id: signOff.id,
      date: signOff.date,
      staffMemberName: signOff.staffMemberName,
      partnerName: signOff.partnerName,
      distributions: distributionItems,
    };
  }
}
