-- AlterTable
-- Additive, nullable, with a unique index: safe to deploy without downtime.
-- Existing rows keep idempotencyKey = NULL, which the unique index allows
-- any number of (Postgres treats NULL as distinct from NULL for uniqueness).
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
