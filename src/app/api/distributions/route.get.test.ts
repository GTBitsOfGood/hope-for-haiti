// import { dbMock } from "@/test/dbMock";
// import { testApiHandler } from "next-test-api-route-handler";
// import * as appHandler from "./route";
// import { expect, test, describe } from "@jest/globals";
// import { invalidateSession, validateSession } from "@/test/util/authMockUtils";
// import {
//   Distribution,
//   DonorOfferItemRequestAllocation,
//   Item,
//   ItemCategory,
//   Prisma,
//   ShipmentStatus,
//   ShippingStatus,
//   UnallocatedItemRequestAllocation,
//   UserType,
// } from "@prisma/client";
// import { DistributionItem } from "./types";

// describe("GET /api/distributions", () => {
//   test("Should return 400 if not authenticated", async () => {
//     await testApiHandler({
//       appHandler,
//       async test({ fetch }) {
//         invalidateSession();
//         const response = await fetch({ method: "GET" });
//         expect(response.status).toBe(401);
//       },
//     });
//   });

//   /* eslint-disable @typescript-eslint/no-explicit-any */
//   test("Should return 200 and distribution items for partner", async () => {
//     const session = await validateSession(UserType.PARTNER);
//     const partnerId = parseInt(session.user.id);
//     const distributions: Distribution[] = [
//       {
//         id: 1,
//         partnerId: partnerId,
//         unallocatedItemRequestAllocationId: 23,
//         donorOfferItemRequestAllocationId: null,
//         signOffId: 1,
//       },
//       {
//         id: 2,
//         partnerId: partnerId,
//         unallocatedItemRequestAllocationId: null,
//         donorOfferItemRequestAllocationId: 13,
//         signOffId: 1,
//       },
//       {
//         id: 3,
//         partnerId: partnerId,
//         unallocatedItemRequestAllocationId: 14,
//         donorOfferItemRequestAllocationId: null,
//         signOffId: 1,
//       },
//     ];
//     const unallocatedItemRequestAllocation: UnallocatedItemRequestAllocation = {
//       id: 23,
//       quantity: 10,
//       unallocatedItemRequestId: 1,
//       itemId: 13,
//       visible: true,
//     };
//     const donorOfferItemRequestAllocation: DonorOfferItemRequestAllocation = {
//       id: 13,
//       quantity: 5,
//       itemId: 17,
//       donorOfferItemRequestId: 29,
//       visible: true,
//     };
//     const badItemAllocation: UnallocatedItemRequestAllocation = {
//       id: 14,
//       quantity: 5,
//       itemId: 97,
//       unallocatedItemRequestId: 1,
//       visible: true,
//     };
//     const item: Item[] = [
//       {
//         title: "Advil",
//         type: "Pain Killer",
//         expirationDate: new Date(
//           new Date().setDate(new Date().getDate() + 30 * 3 + 15)
//         ),
//         unitSize: 10,
//         unitType: "Pills / Bottle",
//         category: ItemCategory.MEDICATION,
//         donorName: "Donor A",
//         quantity: 30,
//         lotNumber: 7,
//         palletNumber: 24,
//         boxNumber: 2000,
//         unitPrice: new Prisma.Decimal(10),
//         allowAllocations: true,
//         visible: true,
//         gik: false,
//         id: 13,
//         quantityPerUnit: null,
//         maxRequestLimit: null,
//         donorShippingNumber: "1093",
//         hfhShippingNumber: "1309",
//         datePosted: new Date(),
//         ndc: null,
//         notes: null,
//         donorOfferItemId: null,
//       },
//       {
//         title: "Tylenol",
//         type: "Pain Killer",
//         expirationDate: new Date(
//           new Date().setDate(new Date().getDate() + 30 * 3 + 15)
//         ),
//         unitSize: 10,
//         unitType: "Pills / Bottle",
//         category: ItemCategory.MEDICATION,
//         donorName: "Donor B",
//         quantity: 30,
//         lotNumber: 1,
//         palletNumber: 2,
//         boxNumber: 2003,
//         unitPrice: new Prisma.Decimal(4),
//         allowAllocations: true,
//         visible: true,
//         gik: false,
//         id: 17,
//         quantityPerUnit: null,
//         maxRequestLimit: null,
//         donorShippingNumber: "103912",
//         hfhShippingNumber: "10492",
//         datePosted: new Date(),
//         ndc: null,
//         notes: null,
//         donorOfferItemId: null,
//       },
//       {
//         title: "Buzz",
//         type: "Pain Healer",
//         expirationDate: new Date(
//           new Date().setDate(new Date().getDate() + 30 * 3 + 15)
//         ),
//         unitSize: 10,
//         unitType: "Pills / Bottle",
//         category: ItemCategory.MEDICATION,
//         donorName: "Donor B",
//         quantity: 30,
//         lotNumber: 1,
//         palletNumber: 2,
//         boxNumber: 2003,
//         unitPrice: new Prisma.Decimal(4),
//         allowAllocations: true,
//         visible: true,
//         gik: false,
//         id: 97,
//         quantityPerUnit: null,
//         maxRequestLimit: null,
//         donorShippingNumber: null,
//         hfhShippingNumber: "1034492",
//         datePosted: new Date(),
//         ndc: null,
//         notes: null,
//         donorOfferItemId: null,
//       },
//     ];
//     const shippingStatuses: ShippingStatus[] = [
//       {
//         id: 1,
//         hfhShippingNumber: "1309",
//         donorShippingNumber: "1093",
//         value: ShipmentStatus.ARRIVED_IN_HAITI,
//       },
//       {
//         id: 2,
//         hfhShippingNumber: "10492",
//         donorShippingNumber: "103912",
//         value: ShipmentStatus.CLEARED_CUSTOMS,
//       },
//     ];
//     dbMock.distribution.findMany.mockResolvedValue(distributions);
//     dbMock.unallocatedItemRequestAllocation.findUnique
//       .mockResolvedValueOnce(unallocatedItemRequestAllocation)
//       .mockResolvedValueOnce(badItemAllocation);
//     dbMock.donorOfferItemRequestAllocation.findUnique.mockResolvedValueOnce(
//       donorOfferItemRequestAllocation
//     );
//     dbMock.item.findUnique.mockImplementation((args) => {
//       if (args && args.where && args.where.id) {
//         const itemId = args.where.id;
//         return {
//           then: (resolve: any) => {
//             const itemFound = item.find((i) => i.id === itemId);
//             if (itemFound) {
//               resolve(itemFound);
//             } else {
//               resolve(null);
//             }
//           },
//         } as any;
//       }
//       return { then: (resolve: any) => resolve(null) } as any;
//     });
//     dbMock.shippingStatus.findFirst.mockImplementation((args) => {
//       if (
//         args &&
//         args.where &&
//         args.where.hfhShippingNumber &&
//         args.where.donorShippingNumber
//       ) {
//         const shippingStatus = shippingStatuses.find(
//           (status) =>
//             status.hfhShippingNumber === args.where?.hfhShippingNumber &&
//             status.donorShippingNumber === args.where.donorShippingNumber
//         );
//         return {
//           then: (resolve: any) => resolve(shippingStatus),
//         } as any;
//       }
//       return { then: (resolve: any) => resolve(null) } as any;
//     });

//     await testApiHandler({
//       appHandler,
//       test: async ({ fetch }) => {
//         const response = await fetch({
//           method: "GET",
//         });
//         expect(response.status).toBe(200);
//         const data = await response.json();

//         const expectedData: DistributionItem[] = [
//           {
//             id: item[0].id,
//             title: item[0].title,
//             type: item[0].type,
//             expirationDate: item[0].expirationDate,
//             unitSize: item[0].unitSize,
//             unitType: item[0].unitType,
//             category: item[0].category,
//             donorName: item[0].donorName,
//             quantity: item[0].quantity,
//             lotNumber: item[0].lotNumber,
//             palletNumber: item[0].palletNumber,
//             boxNumber: item[0].boxNumber,
//             unitPrice: item[0].unitPrice,
//             allowAllocations: item[0].allowAllocations,
//             visible: item[0].visible,
//             gik: item[0].gik,
//             quantityPerUnit: item[0].quantityPerUnit,
//             maxRequestLimit: item[0].maxRequestLimit,
//             donorShippingNumber: item[0].donorShippingNumber,
//             hfhShippingNumber: item[0].hfhShippingNumber,
//             datePosted: item[0].datePosted,
//             ndc: item[0].ndc,
//             notes: item[0].notes,
//             donorOfferItemId: item[0].donorOfferItemId,
//             shipmentStatus: shippingStatuses[0].value,
//             quantityAllocated: unallocatedItemRequestAllocation.quantity,
//           },
//           {
//             id: item[1].id,
//             title: item[1].title,
//             type: item[1].type,
//             expirationDate: item[1].expirationDate,
//             unitSize: item[1].unitSize,
//             unitType: item[1].unitType,
//             category: item[1].category,
//             donorName: item[1].donorName,
//             quantity: item[1].quantity,
//             lotNumber: item[1].lotNumber,
//             palletNumber: item[1].palletNumber,
//             boxNumber: item[1].boxNumber,
//             unitPrice: item[1].unitPrice,
//             allowAllocations: item[1].allowAllocations,
//             visible: item[1].visible,
//             gik: item[1].gik,
//             quantityPerUnit: item[1].quantityPerUnit,
//             maxRequestLimit: item[1].maxRequestLimit,
//             donorShippingNumber: item[1].donorShippingNumber,
//             hfhShippingNumber: item[1].hfhShippingNumber,
//             datePosted: item[1].datePosted,
//             ndc: item[1].ndc,
//             notes: item[1].notes,
//             donorOfferItemId: item[1].donorOfferItemId,
//             shipmentStatus: shippingStatuses[1].value,
//             quantityAllocated: donorOfferItemRequestAllocation.quantity,
//           },
//         ];

//         expect(data.distributionItems).toEqual(
//           expectedData.map((item) => {
//             return {
//               ...item,
//               expirationDate: item.expirationDate?.toISOString(),
//               datePosted: item.datePosted.toISOString(),
//               unitPrice: item.unitPrice.toString(),
//             };
//           })
//         );
//       },
//     });
//   });
// });
