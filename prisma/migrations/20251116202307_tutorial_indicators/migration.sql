-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dashboardTutorial" BOOLEAN DEFAULT false,
ADD COLUMN     "itemsTutorial" BOOLEAN DEFAULT false,
ADD COLUMN     "requestsTutorial" BOOLEAN DEFAULT false,
ADD COLUMN     "wishlistsTutorial" BOOLEAN DEFAULT false;
