/*
  Warnings:

  - The values [SUPER_ADMIN,ADMIN] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserType_new" AS ENUM ('STAFF', 'PARTNER');
ALTER TABLE "User" ALTER COLUMN "type" TYPE "UserType_new" USING ("type"::text::"UserType_new");
ALTER TYPE "UserType" RENAME TO "UserType_old";
ALTER TYPE "UserType_new" RENAME TO "UserType";
DROP TYPE "public"."UserType_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allocationRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allocationWrite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "distributionRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "distributionWrite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuper" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "itemNotify" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offerWrite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestWrite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shipmentRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shipmentWrite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signoffWrite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportNotify" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportWrite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userWrite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wishlistRead" BOOLEAN NOT NULL DEFAULT false;
