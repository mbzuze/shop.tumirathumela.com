import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-response'

// How long an unpaid order holds its items' stock before the hold lapses.
// Yoco doesn't document a checkout-link expiry, so this is a judgment call,
// not a derived number — 30 minutes is generous enough to cover a slow
// payment (3-D Secure, a hesitant shopper, a delayed webhook) without
// holding scarce stock hostage indefinitely. If a payment genuinely
// succeeds after this window, the order still completes (see the
// paid-after-lapse handling in the admin order PATCH route) — this TTL only
// governs how long stock stays held for someone who never pays.
//
// This assumes every order's hold is short-lived. The `MANUAL` payment
// provider in the schema (not wired into any live checkout flow today)
// would need a much longer window if it's ever activated — an EFT/bank
// transfer order can't complete in 30 minutes. Flagged for whoever builds
// that, not solved here.
export const RESERVATION_TTL_MINUTES = 30

type PrismaOrTx = PrismaClient | Prisma.TransactionClient

/**
 * Sum of OrderItem.quantity, per product, across orders that currently hold
 * a live reservation: unpaid, not cancelled/refunded, and created within
 * the TTL. A PENDING order older than the TTL simply stops being counted —
 * the hold lapses because this query stops including it, not because
 * anything writes to release it.
 *
 * Filtered on `paidAt: null` rather than `status: 'PENDING'` deliberately:
 * PROCESSING can apparently be set by an admin from any status with no
 * enforced state machine, and it's ambiguous from the code alone whether it
 * occurs before or after payment. paidAt is unambiguous either way — it's
 * set exactly once, at the moment stock is actually decremented, and never
 * cleared — so this is correct regardless of how PROCESSING gets used.
 *
 * Pass `tx` when calling this from inside the same transaction that's about
 * to reserve stock (see checkAndReserveStock), so the read is consistent
 * with the lock being held. Read-only callers (product display) can omit it
 * and use the plain client.
 */
export async function getReservedQuantities(
  productIds: string[],
  client: PrismaOrTx = prisma
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map()

  const cutoff = new Date(Date.now() - RESERVATION_TTL_MINUTES * 60_000)
  const rows = await client.orderItem.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
      order: {
        paidAt: null,
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        orderDate: { gt: cutoff },
      },
    },
    _sum: { quantity: true },
  })

  return new Map(
    rows
      .filter((r): r is typeof r & { productId: string } => r.productId !== null)
      .map((r) => [r.productId, r._sum.quantity ?? 0])
  )
}

/**
 * The actual oversell-proof guarantee. Must be called inside the same
 * transaction that will go on to create the order — locks the involved
 * product rows for the remainder of that transaction, checks availability
 * against them, and throws (rolling back everything, including the lock)
 * if any is short.
 *
 * FOR UPDATE here is doing something slightly non-obvious: this function
 * never writes to Product at all (stock is only ever decremented later, at
 * the COMPLETED transition, by the admin order PATCH route). The lock is
 * being used purely as a mutex, to serialize the "read how much is
 * reserved, then insert a new reservation" critical section across
 * concurrent checkouts — not to protect a row this function is about to
 * mutate. Don't "simplify" this away; without it, two concurrent
 * transactions can both read the same reserved total before either
 * commits, and both pass a check that only one of them should.
 *
 * Locks are acquired one product at a time, in sorted id order — not a
 * single `WHERE id IN (...) ORDER BY ... FOR UPDATE`. Postgres does not
 * guarantee that ORDER BY on a locked multi-row SELECT determines the
 * order locks are actually acquired in (the planner can choose a scan path
 * that acquires them in a different physical order); a loop of single-row
 * `FOR UPDATE` statements issued by our own code in sorted order is a real
 * guarantee, not a hope. This is what keeps two orders touching an
 * overlapping set of products from deadlocking against each other here.
 */
export async function checkAndReserveStock(
  tx: Prisma.TransactionClient,
  items: { productId?: string | null; quantity: number }[]
): Promise<void> {
  const requestedById = new Map<string, number>()
  for (const item of items) {
    if (!item.productId) continue // no product link — nothing to reserve
    requestedById.set(item.productId, (requestedById.get(item.productId) ?? 0) + item.quantity)
  }

  const productIds = [...requestedById.keys()].sort()
  if (productIds.length === 0) return

  const stockById = new Map<string, number>()
  for (const id of productIds) {
    const rows = await tx.$queryRaw<{ id: string; stock: number }[]>`
      SELECT id, stock FROM "Product" WHERE id = ${id} FOR UPDATE
    `
    if (rows[0]) stockById.set(rows[0].id, rows[0].stock)
  }

  const reserved = await getReservedQuantities(productIds, tx)

  const insufficient = productIds
    .map((productId) => ({
      productId,
      requested: requestedById.get(productId) ?? 0,
      available: Math.max(0, (stockById.get(productId) ?? 0) - (reserved.get(productId) ?? 0)),
    }))
    .filter((l) => l.requested > l.available)

  if (insufficient.length > 0) {
    throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Not enough stock available', {
      items: insufficient,
    })
  }
}
