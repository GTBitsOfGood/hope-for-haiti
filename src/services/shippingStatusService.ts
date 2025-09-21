import { db } from "@/db";
import { LineItem, ShippingStatus } from "@prisma/client";
import {
  ShippingStatusWithItems,
  UpdateShippingStatusData,
} from "@/types/api/shippingStatus.types";

export class ShippingStatusService {
  static async getShippingStatuses(): Promise<ShippingStatusWithItems> {
    const shippingNumberPairs = await db.lineItem.findMany({
      where: {
        donorShippingNumber: { not: null },
        hfhShippingNumber: { not: null },
      },
      distinct: ["donorShippingNumber", "hfhShippingNumber"],
    });

    const itemMap: LineItem[][] = [];
    const statuses: ShippingStatus[] = [];
    let i = 0;

    for (const pair of shippingNumberPairs) {
      const donorShippingNumber = pair.donorShippingNumber as string;
      const hfhShippingNumber = pair.hfhShippingNumber as string;

      const status = await db.shippingStatus.findFirst({
        where: {
          donorShippingNumber: donorShippingNumber,
          hfhShippingNumber: hfhShippingNumber,
        },
      });

      if (status) {
        statuses.push({ ...status, id: i });
      } else {
        statuses.push({
          id: i,
          donorShippingNumber: donorShippingNumber,
          hfhShippingNumber: hfhShippingNumber,
          value: "WAITING_ARRIVAL_FROM_DONOR",
        });
      }

      const items = await db.lineItem.findMany({
        where: {
          donorShippingNumber: donorShippingNumber,
          hfhShippingNumber: hfhShippingNumber,
        },
      });
      itemMap.push(items);
      i++;
    }

    return {
      shippingStatuses: statuses,
      items: itemMap,
    };
  }

  static async getPartnerShippingStatuses(
    partnerId: number
  ): Promise<ShippingStatusWithItems> {
    const shippingNumberPairs = await db.lineItem.findMany({
      where: {
        AND: [
          {
            donorShippingNumber: { not: null },
            hfhShippingNumber: { not: null },
          },
          {
            allocation: {
              partnerId,
            },
          },
        ],
      },
      distinct: ["donorShippingNumber", "hfhShippingNumber"],
    });

    const itemMap: LineItem[][] = [];
    const statuses: ShippingStatus[] = [];
    let i = 0;

    for (const pair of shippingNumberPairs) {
      const donorShippingNumber = pair.donorShippingNumber as string;
      const hfhShippingNumber = pair.hfhShippingNumber as string;

      const status = await db.shippingStatus.findFirst({
        where: {
          donorShippingNumber: donorShippingNumber,
          hfhShippingNumber: hfhShippingNumber,
        },
      });

      if (status) {
        statuses.push({ ...status, id: i });
      } else {
        statuses.push({
          id: i,
          donorShippingNumber: donorShippingNumber,
          hfhShippingNumber: hfhShippingNumber,
          value: "WAITING_ARRIVAL_FROM_DONOR",
        });
      }

      const items = await db.lineItem.findMany({
        where: {
          donorShippingNumber: donorShippingNumber,
          hfhShippingNumber: hfhShippingNumber,
        },
      });
      itemMap.push(items);
      i++;
    }

    return {
      shippingStatuses: statuses.filter(
        (s) => s.donorShippingNumber && s.hfhShippingNumber
      ),
      items: itemMap,
    };
  }

  static async updateShippingStatus(data: UpdateShippingStatusData) {
    await db.shippingStatus.upsert({
      where: {
        donorShippingNumber_hfhShippingNumber: {
          donorShippingNumber: data.donorShippingNumber,
          hfhShippingNumber: data.hfhShippingNumber,
        },
      },
      update: {
        value: data.value,
      },
      create: {
        donorShippingNumber: data.donorShippingNumber,
        hfhShippingNumber: data.hfhShippingNumber,
        value: data.value,
      },
    });
  }
}
