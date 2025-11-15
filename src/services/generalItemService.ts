import { db } from "@/db";
import {
  CreateGeneralItemParams,
  UpdateGeneralItemParams,
} from "@/types/api/generalItem.types";
import { NotFoundError, ArgumentError } from "@/util/errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Filters } from "@/types/api/filter.types";
import { $Enums, Prisma } from "@prisma/client";
import { buildQueryWithPagination, buildWhereFromFilters } from "@/util/table";
import { GeneralItemWithRelations } from "@/types/api/generalItem.types";
import { getOpenAIClient } from "@/lib/azureOpenAI";

export type DescribeItemInput = {
  title: string;
  unitType: string;
};

type BilingualDescription = {
  haitian: string;
  english: string;
};

type ItemMetadata = {
  description: BilingualDescription;
  type: $Enums.ItemType;
  category: $Enums.ItemCategory;
};

type GeneratedItemMetadata = {
  description: string;
  type: $Enums.ItemType;
  category: $Enums.ItemCategory;
};

export class GeneralItemService {
  static async createGeneralItem(item: CreateGeneralItemParams) {
    return await db.generalItem.create({
      data: item,
    });
  }

  static async updateGeneralItem(id: number, updates: UpdateGeneralItemParams) {
    try {
      // Check if the general item belongs to an archived donor offer
      const generalItem = await db.generalItem.findUnique({
        where: { id },
        include: {
          donorOffer: {
            select: { state: true }
          }
        }
      });

      if (generalItem?.donorOffer?.state === "ARCHIVED") {
        throw new ArgumentError("Cannot update general items for archived donor offers. Archived offers are read-only.");
      }

      return await db.generalItem.update({
        where: { id },
        data: updates,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("General item not found");
        }
      }
      throw error;
    }
  }

  static async deleteGeneralItem(id: number) {
    try {
      // Check if the general item belongs to an archived donor offer
      const generalItem = await db.generalItem.findUnique({
        where: { id },
        include: {
          donorOffer: {
            select: { state: true }
          }
        }
      });

      if (generalItem?.donorOffer?.state === "ARCHIVED") {
        throw new ArgumentError("Cannot delete general items for archived donor offers. Archived offers are read-only.");
      }

      return await db.generalItem.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundError("General item not found");
        }
      }
      throw error;
    }
  }

  static async getUnallocatedItems(
    filters?: Filters,
    page?: number,
    pageSize?: number
  ) {

    const filterWhere = buildWhereFromFilters<Prisma.GeneralItemWhereInput>(
      Object.keys(Prisma.GeneralItemScalarFieldEnum),
      filters
    );

    const query: Prisma.GeneralItemFindManyArgs = {
      where: {
        ...filterWhere,
        donorOffer: {
          state: "ARCHIVED",
        },
        items: {
          some: {
            allocation: null,
          }
        }
      },
      include: {
        items: {
          where: {
            allocation: null,
          }
        },
        requests: {
          include: {
            partner: {
              select: { id: true, name: true },
            },
          },
        },
        donorOffer: true,
      },
      orderBy: {
        id: "asc",
      },
      take: pageSize,
      skip: (page && pageSize) ? (page - 1) * pageSize : undefined,
    };

    buildQueryWithPagination(query, page, pageSize);

    const [generalItems, total] = await Promise.all([
      db.generalItem.findMany(query) as Promise<GeneralItemWithRelations[]>,
      db.generalItem.count({ where: {
        ...filterWhere,
        donorOffer: {
          state: $Enums.DonorOfferState.ARCHIVED,
        },
        items: {
          some: {
            allocation: null,
          }
        }
      }, }),
    ]);

    const itemsWithFilteredRequests = generalItems.map((item) => {
      const archivedAt = item.donorOffer.archivedAt;

      const filteredRequests = archivedAt
        ? item.requests.filter((request) => request.createdAt >= archivedAt)
        : item.requests;

      return {
        ...item,
        requests: filteredRequests,
      };
    });

    return {
      items: itemsWithFilteredRequests,
      total: total,
    };
  }

  static async getExpiringItems(cutoff: Date) {
    const generalItems = await db.generalItem.findMany({
      where: {
        expirationDate: {
          not: null,
          lte: cutoff,
        },
        donorOffer: {
          state: {
            not: $Enums.DonorOfferState.ARCHIVED,
          },
        },
      },
      include: {
        donorOffer: true,
        items: {
          select: {
            quantity: true,
            allocation: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        expirationDate: "asc",
      },
    });

    return generalItems.map((item) => {
      const { allocatedQuantity, unallocatedQuantity } = item.items.reduce(
        (totals, lineItem) => {
          if (lineItem.allocation) {
            totals.allocatedQuantity += lineItem.quantity;
          } else {
            totals.unallocatedQuantity += lineItem.quantity;
          }
          return totals;
        },
        { allocatedQuantity: 0, unallocatedQuantity: 0 }
      );

      return {
        item,
        unallocatedQuantity,
        allocatedQuantity,
      } 
    });
  }

  static async getAvailableItemsForPartner(
    partnerId: number,
    filters?: Filters,
    page?: number,
    pageSize?: number,
    priorityIds?: number[])
  {
    const filterWhere = buildWhereFromFilters<Prisma.GeneralItemWhereInput>(
      Object.keys(Prisma.GeneralItemScalarFieldEnum),
      filters
    );

    const where: Prisma.GeneralItemWhereInput = {
      ...filterWhere,
      OR: [
        {
          donorOffer: {
            state: $Enums.DonorOfferState.UNFINALIZED,
            partnerVisibilities: {
              some: {
                id: partnerId,
              },
            },
          },
        },
        {
          donorOffer: {
            state: $Enums.DonorOfferState.ARCHIVED,
            partnerVisibilities: {
              some: {
                id: partnerId,
              },
            },
          },
          items: {
            some: {
              allocation: null,
            },
          },
        },
      ],
      requests: {
        none: {
          partnerId: partnerId,
        },
      },
    };

    const query: Prisma.GeneralItemFindManyArgs = {
      where,
      include: {
        donorOffer: {
          select: {
            id: true,
            offerName: true,
            donorName: true,
            state: true,
            archivedAt: true,
          },
        },
        items: {
          where: {
            allocation: null,
          },
          select: {
            id: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    };

    if (priorityIds && priorityIds.length > 0 && page && pageSize) {
      const offset = (page - 1) * pageSize;
      const hasFilters = filters && Object.keys(filters).length > 0;

      if (hasFilters) {
        const allMatchingItems = await db.generalItem.findMany({
          where,
          select: { id: true },
          orderBy: { id: 'asc' },
        });

        const priorityIdSet = new Set(priorityIds);
        const priorityItemIds: number[] = [];
        const regularItemIds: number[] = [];

        for (const item of allMatchingItems) {
          if (priorityIdSet.has(item.id)) {
            priorityItemIds.push(item.id);
          } else {
            regularItemIds.push(item.id);
          }
        }

        const orderedIds = [...priorityItemIds, ...regularItemIds];
        const paginatedIds = orderedIds.slice(offset, offset + pageSize);

        if (paginatedIds.length === 0) {
          return { items: [], total: 0 };
        }

        type ItemWithRelations = Prisma.GeneralItemGetPayload<{
          include: {
            donorOffer: {
              select: {
                id: true;
                offerName: true;
                donorName: true;
                state: true;
                archivedAt: true;
              };
            };
            items: {
              where: {
                allocation: null;
              };
              select: {
                id: true;
                quantity: true;
              };
            };
          };
        }>;
        const items = await db.generalItem.findMany({
          where: { id: { in: paginatedIds } },
          include: query.include,
        }) as ItemWithRelations[];

        const itemMap = new Map(items.map(item => [item.id, item]));
        const orderedItems = paginatedIds
          .map(id => itemMap.get(id))
          .filter((item): item is NonNullable<typeof item> => item !== undefined);

        const itemsWithQuantity = orderedItems.map((item) => {
          let availableQuantity = item.initialQuantity;
          if (item.donorOffer.state === $Enums.DonorOfferState.ARCHIVED) {
            availableQuantity = item.items.reduce((sum: number, lineItem: { id: number; quantity: number }) => sum + lineItem.quantity, 0);
          }
          return { ...item, availableQuantity };
        });

        return {
          items: itemsWithQuantity,
          total: orderedIds.length,
        };
      }

      const priorityIdsArray = Prisma.join(priorityIds.map(id => Prisma.sql`${id}`));

      const orderedIdsSql = Prisma.sql`
        WITH filtered_items AS (
          SELECT gi.id
          FROM "GeneralItem" gi
          INNER JOIN "DonorOffer" dof ON gi."donorOfferId" = dof.id
          INNER JOIN "_DonorOfferToUser" dotu ON dof.id = dotu."A"
          WHERE dotu."B" = ${partnerId}
            AND (
              (dof.state = 'UNFINALIZED'::"DonorOfferState")
              OR
              (dof.state = 'ARCHIVED'::"DonorOfferState" AND EXISTS (
                SELECT 1 FROM "LineItem" li
                WHERE li."generalItemId" = gi.id
                  AND NOT EXISTS (
                    SELECT 1 FROM "Allocation" a
                    WHERE a."lineItemId" = li.id
                  )
              ))
            )
            AND NOT EXISTS (
              SELECT 1 FROM "GeneralItemRequest" gir
              WHERE gir."generalItemId" = gi.id
                AND gir."partnerId" = ${partnerId}
            )
        )
        SELECT id
        FROM filtered_items
        ORDER BY
          CASE WHEN id = ANY(ARRAY[${priorityIdsArray}]) THEN 0 ELSE 1 END,
          id ASC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `;

      const orderedIds = await db.$queryRaw<{ id: number }[]>(orderedIdsSql);
      const orderedIdList = orderedIds.map(row => row.id);

      if (orderedIdList.length === 0) {
        return { items: [], total: 0 };
      }

      type ItemWithRelations = Prisma.GeneralItemGetPayload<{
        include: {
          donorOffer: {
            select: {
              id: true;
              offerName: true;
              donorName: true;
              state: true;
              archivedAt: true;
            };
          };
          items: {
            where: {
              allocation: null;
            };
            select: {
              id: true;
              quantity: true;
            };
          };
        };
      }>;
      const items = await db.generalItem.findMany({
        where: { id: { in: orderedIdList } },
        include: query.include,
      }) as ItemWithRelations[];

      const itemMap = new Map(items.map(item => [item.id, item]));
      const orderedItems = orderedIdList
        .map(id => itemMap.get(id))
        .filter((item): item is NonNullable<typeof item> => item !== undefined);

      const total = await db.generalItem.count({ where });

      const itemsWithQuantity = orderedItems.map((item) => {
        let availableQuantity = item.initialQuantity;
        if (item.donorOffer.state === $Enums.DonorOfferState.ARCHIVED) {
          availableQuantity = item.items.reduce((sum: number, lineItem: { id: number; quantity: number }) => sum + lineItem.quantity, 0);
        }
        return { ...item, availableQuantity };
      });

      return {
        items: itemsWithQuantity,
        total,
      };
    }

    buildQueryWithPagination(query, page, pageSize);

    type GeneralItemWithRelations = Prisma.GeneralItemGetPayload<{
      include: {
        donorOffer: {
          select: {
            id: true;
            offerName: true;
            donorName: true;
            state: true;
            archivedAt: true;
          };
        };
        items: {
          where: {
            allocation: null;
          };
          select: {
            id: true;
            quantity: true;
          };
        };
      };
    }>;

    const [generalItems, total] = await Promise.all([
      db.generalItem.findMany(query) as Promise<GeneralItemWithRelations[]>,
      db.generalItem.count({ where }),
    ]);

    const itemsWithQuantity = generalItems.map((item) => {
      let availableQuantity = item.initialQuantity;

      if (item.donorOffer.state === $Enums.DonorOfferState.ARCHIVED) {
        availableQuantity = item.items.reduce((sum: number, lineItem) => sum + lineItem.quantity, 0);
      }

      return {
        ...item,
        availableQuantity,
      };
    });

    return {
      items: itemsWithQuantity,
      total,
    };
  }

  static async getOrGenerateMetadata(
    items: DescribeItemInput[]
  ): Promise<GeneratedItemMetadata[]> {
    if (items.length === 0) return [];

    const metadata = await GeneralItemService.generateMetadata(items);

    return metadata.map((meta) => ({
      description: GeneralItemService.combineDescriptions(meta.description),
      type: meta.type,
      category: meta.category,
    }));
  }

  private static async generateMetadata(
    items: DescribeItemInput[]
  ): Promise<ItemMetadata[]> {
    if (items.length === 0) return [];

    const { client } = getOpenAIClient();
    if (!client) return items.map(GeneralItemService.defaultMetadata);

    const system = `You are a medical supply classification expert. For each item, you must:
1. Write practical medical descriptions explaining what the item is used for
2. Classify the item type as: MEDICATION, MEDICATION_SUPPLEMENT, or NON_MEDICATION
3. Assign the most appropriate category from the provided list

Description guidelines:
- Focus on what conditions/symptoms the item treats or what medical purposes it serves
- Produce one Haitian Creole sentence and one English sentence
- Keep language simple and direct - healthcare workers need to know what this helps with
- For medications: mention conditions treated, symptoms relieved, or medical uses
- For supplies: mention medical procedures or patient care situations where they're used
- Avoid complex medical jargon, but DO explain the practical medical use

Type classification:
- MEDICATION: Prescription drugs, over-the-counter medicines
- MEDICATION_SUPPLEMENT: Vitamins, minerals, dietary supplements
- NON_MEDICATION: Medical supplies, equipment, PPE, etc.

Category options:
NEEDLES_SYRINGES, ALZHEIMERS, ANTIBIOTIC, ANTIFUNGAL, ANTIVIRAL, BOOKS, CANCER,
CARDIOVASCULAR, CLOTHING_ACCESSORIES, DENTAL, DERMATOLOGY, DEWORMER, DIABETES,
EMERGENCY_RELIEF, ENT, FACILITY, FLUID_REPLENISHMENT, GASTROENTEROLOGY, GENERAL,
HIV, HORMONES, HYGIENE, LAB, NEUROLOGICAL, NUTRITION_SUPPLEMENTS, OB_GYN,
OFFICE_SUPPLIES, OPHTHALMOLOGY, ORTHO, PAIN_RELIEVERS, PEDIATRIC, PPE, PSYCHIATRIC,
RECREATION, RESPIRATORY, STEROID, SURGICAL, THYROID, URINARY_BOWEL, VACCINES, WASH,
WOUND_CARE, X_RAY`;

    const userLines = items
      .map(
        (item, index) =>
          `${index + 1}. title="${item.title}", unitType="${item.unitType}"`
      )
      .join("\n");

    const user = `Return a JSON object with an 'items' array. Each element must include:
- 'haitian': Haitian Creole description string
- 'english': English description string
- 'type': One of MEDICATION, MEDICATION_SUPPLEMENT, or NON_MEDICATION
- 'category': One of the category options listed above

IMPORTANT: Describe what each item DOES or what it's USED FOR medically, not just what it is.

Examples:
- Ibuprofen → type: MEDICATION, category: PAIN_RELIEVERS, description: "Used to treat pain, fever, and inflammation..."
- Vitamin D → type: MEDICATION_SUPPLEMENT, category: NUTRITION_SUPPLEMENTS, description: "Supports bone health and immune function..."
- Gauze → type: NON_MEDICATION, category: WOUND_CARE, description: "Used to protect wounds, absorb blood..."

Items to classify:
${userLines}`;

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "omni-moderate",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "item_metadata",
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    haitian: { type: "string" },
                    english: { type: "string" },
                    type: {
                      type: "string",
                      enum: [
                        "MEDICATION",
                        "MEDICATION_SUPPLEMENT",
                        "NON_MEDICATION",
                      ],
                    },
                    category: {
                      type: "string",
                      enum: [
                        "NEEDLES_SYRINGES",
                        "ALZHEIMERS",
                        "ANTIBIOTIC",
                        "ANTIFUNGAL",
                        "ANTIVIRAL",
                        "BOOKS",
                        "CANCER",
                        "CARDIOVASCULAR",
                        "CLOTHING_ACCESSORIES",
                        "DENTAL",
                        "DERMATOLOGY",
                        "DEWORMER",
                        "DIABETES",
                        "EMERGENCY_RELIEF",
                        "ENT",
                        "FACILITY",
                        "FLUID_REPLENISHMENT",
                        "GASTROENTEROLOGY",
                        "GENERAL",
                        "HIV",
                        "HORMONES",
                        "HYGIENE",
                        "LAB",
                        "NEUROLOGICAL",
                        "NUTRITION_SUPPLEMENTS",
                        "OB_GYN",
                        "OFFICE_SUPPLIES",
                        "OPHTHALMOLOGY",
                        "ORTHO",
                        "PAIN_RELIEVERS",
                        "PEDIATRIC",
                        "PPE",
                        "PSYCHIATRIC",
                        "RECREATION",
                        "RESPIRATORY",
                        "STEROID",
                        "SURGICAL",
                        "THYROID",
                        "URINARY_BOWEL",
                        "VACCINES",
                        "WASH",
                        "WOUND_CARE",
                        "X_RAY",
                      ],
                    },
                  },
                  required: ["haitian", "english", "type", "category"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const content = response.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.items)) {
        return parsed.items.map(
          (
            entry: {
              haitian: string;
              english: string;
              type: string;
              category: string;
            },
            index: number
          ) => GeneralItemService.normalizeMetadata(entry, items[index])
        );
      }
    } catch {
      // Fall through to deterministic fallback below.
    }

    return items.map(GeneralItemService.defaultMetadata);
  }

  private static normalizeMetadata(
    value:
      | Partial<{
          haitian: string;
          english: string;
          type: string;
          category: string;
        }>
      | undefined,
    item: DescribeItemInput
  ): ItemMetadata {
    const fallback = GeneralItemService.defaultMetadata(item);
    const haitian =
      GeneralItemService.cleanText(value?.haitian) ||
      fallback.description.haitian;
    const english =
      GeneralItemService.cleanText(value?.english) ||
      fallback.description.english;

    const type = (value?.type as $Enums.ItemType) || fallback.type;
    const category =
      (value?.category as $Enums.ItemCategory) || fallback.category;

    return {
      description: { haitian, english },
      type,
      category,
    };
  }

  private static defaultMetadata(item: DescribeItemInput): ItemMetadata {
    const lowerUnit = item.unitType.toLowerCase();
    const english = `Medical supply: ${item.title}. Consult medical staff for proper use and indications. Supplied in ${lowerUnit} units.`;
    const haitian = `Founiti medikal: ${item.title}. Konsilte pèsonèl medikal pou jan pou itilize l kòrèkteman. Disponib nan inite ${lowerUnit}.`;

    return {
      description: { haitian, english },
      type: $Enums.ItemType.NON_MEDICATION,
      category: $Enums.ItemCategory.GENERAL,
    };
  }

  private static combineDescriptions(value: BilingualDescription): string {
    const haitian = GeneralItemService.cleanText(value.haitian);
    const english = GeneralItemService.cleanText(value.english);
    return `${haitian} / ${english}`;
  }

  private static cleanText(value: string | undefined): string {
    return (value ?? "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
