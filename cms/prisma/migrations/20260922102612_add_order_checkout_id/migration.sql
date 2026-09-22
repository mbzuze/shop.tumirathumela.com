-- AlterTable
-- Additive, nullable: safe to deploy without downtime. Do not roll back —
-- a DROP COLUMN would discard checkout ids for orders taken in the interim.
ALTER TABLE "Order" ADD COLUMN "checkoutId" TEXT;
