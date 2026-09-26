-- CreateTable
CREATE TABLE "ItemPrice" (
    "id" SERIAL NOT NULL,
    "ndc" TEXT NOT NULL,
    "unitPrice" MONEY NOT NULL,
    "enteredById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemPrice_ndc_key" ON "ItemPrice"("ndc");

-- AddForeignKey
ALTER TABLE "ItemPrice" ADD CONSTRAINT "ItemPrice_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
