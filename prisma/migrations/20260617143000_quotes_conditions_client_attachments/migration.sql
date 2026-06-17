ALTER TABLE "Quote"
ADD COLUMN "quoteNumber" TEXT,
ADD COLUMN "conditions" TEXT;

CREATE UNIQUE INDEX "Quote_companyId_quoteNumber_key" ON "Quote"("companyId", "quoteNumber");

CREATE TABLE "ClientAttachment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "ClientAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientAttachment_companyId_createdAt_idx" ON "ClientAttachment"("companyId", "createdAt");
CREATE INDEX "ClientAttachment_clientId_idx" ON "ClientAttachment"("clientId");

ALTER TABLE "ClientAttachment" ADD CONSTRAINT "ClientAttachment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientAttachment" ADD CONSTRAINT "ClientAttachment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CrmClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
