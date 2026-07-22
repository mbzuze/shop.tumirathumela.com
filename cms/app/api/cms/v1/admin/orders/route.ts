import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, handleApiError, paginationParams } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const { page, pageSize, skip } = paginationParams(req.nextUrl.searchParams)
    const status = req.nextUrl.searchParams.get('status') ?? undefined
    const search = req.nextUrl.searchParams.get('q') ?? undefined

    const where = {
      ...(status ? { status: status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' } : {}),
      ...(search ? {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' as const } },
          { customerEmail: { contains: search, mode: 'insensitive' as const } },
          { customerName: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { orderDate: 'desc' },
        include: {
          items: { include: { product: { select: { id: true, name: true, slug: true } } } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return successResponse(
      orders.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discountAmount),
        shippingCost: Number(o.shippingCost),
        total: Number(o.total),
        orderDate: o.orderDate.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        paidAt: o.paidAt?.toISOString() ?? null,
      })),
      { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    )
  } catch (err) {
    return handleApiError(err)
  }
}
