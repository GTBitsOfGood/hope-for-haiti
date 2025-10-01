import { db } from "@/db";
import {
  CreateSignOffData,
  SignOffSummary,
  SignOffDetails,
} from "@/types/api/signOff.types";

export class SignOffService {
  static async createSignOff(data: CreateSignOffData) {
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

  static async getAllSignOffs() {
    const signOffs = await db.signOff.findMany({
      include: {
        allocations: true,
        _count: {
          select: {
            allocations: true,
          },
        },
      },
    });

    return signOffs.map((signOff) => ({
      staffName: signOff.staffMemberName,
      numberOfItems: signOff._count.allocations,
      dateCreated: signOff.createdAt,
      signOffDate: signOff.createdAt,
      status: "-",
    }));
  }

  static async getSignOffsByPartner(
    partnerId: number
  ): Promise<SignOffSummary[]> {
    const signOffs = await db.signOff.findMany({
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

    return signOffs.map((signOff) => ({
      staffName: signOff.staffMemberName,
      numberOfItems: signOff._count.allocations,
      dateCreated: signOff.createdAt,
      signOffDate: signOff.createdAt,
      status: "-",
    }));
  }

  static async getSignOffById(
    signOffId: number
  ): Promise<SignOffDetails | null> {
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
      return null;
    }

    return {
      id: signOff.id,
      date: signOff.date,
      staffMemberName: signOff.staffMemberName,
      partnerName: signOff.partnerName,
      allocatedItems: signOff.allocations.map(
        (allocation) => allocation.lineItem
      ),
    };
  }
}
