-- AlterTable
-- Both additive, no data migration, safe without downtime. Support
-- lib/inventory.ts's reserved-quantity query (filters OrderItem by
-- productId, driven from Order rows filtered by status + orderDate).
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "Order_status_orderDate_idx" ON "Order"("status", "orderDate");
