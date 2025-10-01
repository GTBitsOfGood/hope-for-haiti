import { db } from "@/db";
import { CreateSignOffData, SignOffSummary } from "@/types/api/signOff.types";
import { NotFoundError } from "@/util/errors";

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

  static async getSignOffById(signOffId: number) {
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

    return signOff;
  }
}
