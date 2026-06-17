CREATE TYPE "ServiceBillingStatus" AS ENUM ('PENDING_PAYMENT', 'INVOICED', 'PAID');

ALTER TABLE "ServiceJob"
ADD COLUMN "billingStatus" "ServiceBillingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT';

CREATE TABLE "PriceItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "PriceItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuoteLine"
ADD COLUMN "priceItemId" TEXT;

CREATE INDEX "ServiceJob_companyId_billingStatus_idx" ON "ServiceJob"("companyId", "billingStatus");
CREATE UNIQUE INDEX "PriceItem_companyId_name_key" ON "PriceItem"("companyId", "name");
CREATE INDEX "PriceItem_companyId_isActive_idx" ON "PriceItem"("companyId", "isActive");
CREATE INDEX "QuoteLine_priceItemId_idx" ON "QuoteLine"("priceItemId");

ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_priceItemId_fkey" FOREIGN KEY ("priceItemId") REFERENCES "PriceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
