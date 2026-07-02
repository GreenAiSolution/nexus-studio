-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('NDA', 'MSA', 'SOW', 'EMPLOYMENT', 'COMMERCIAL_LEASE', 'SAAS_AGREEMENT', 'VENDOR_AGREEMENT', 'INDEPENDENT_CONTRACTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'EXECUTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVE', 'REVISE', 'ESCALATE', 'REJECT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IntegrationProvider" ADD VALUE 'CLIO';
ALTER TYPE "IntegrationProvider" ADD VALUE 'IMANAGE';
ALTER TYPE "IntegrationProvider" ADD VALUE 'NETDOCUMENTS';

-- CreateTable
CREATE TABLE "LegalContract" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "jurisdiction" TEXT,
    "originalDocUrl" TEXT,
    "draftDocUrl" TEXT,
    "redlineDocUrl" TEXT,
    "finalDocUrl" TEXT,
    "clioMatterId" TEXT,
    "clioClientName" TEXT,
    "clioMatterName" TEXT,
    "threadId" TEXT,
    "playbookId" TEXT,
    "precedentIds" TEXT[],
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "matterValue" DOUBLE PRECISION,
    "dmsProvider" TEXT,
    "dmsDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractReview" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "decision" "ReviewDecision",
    "comments" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "redlineDocUrl" TEXT,
    "modelVersion" TEXT,
    "inputHash" TEXT,
    "outputHash" TEXT,

    CONSTRAINT "ContractReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPlaybook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "jurisdiction" TEXT,
    "rules" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalPlaybook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalAuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorModel" TEXT,
    "action" TEXT NOT NULL,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "changesSummary" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalContract_threadId_key" ON "LegalContract"("threadId");

-- CreateIndex
CREATE INDEX "LegalAuditEvent_organizationId_createdAt_idx" ON "LegalAuditEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "LegalAuditEvent_contractId_createdAt_idx" ON "LegalAuditEvent"("contractId", "createdAt");

-- AddForeignKey
ALTER TABLE "LegalContract" ADD CONSTRAINT "LegalContract_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractReview" ADD CONSTRAINT "ContractReview_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "LegalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalPlaybook" ADD CONSTRAINT "LegalPlaybook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAuditEvent" ADD CONSTRAINT "LegalAuditEvent_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "LegalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
