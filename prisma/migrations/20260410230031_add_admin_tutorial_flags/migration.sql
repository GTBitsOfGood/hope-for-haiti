-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminAccountManagementTutorial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminDashboardTutorial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminDistributionsTutorial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminDonorOffersTutorial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminSupportTutorial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminUnallocatedTutorial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminWishlistTutorial" BOOLEAN NOT NULL DEFAULT false;
