import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

type Ctx = { params: Promise<{ orderNumber: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const { orderNumber } = await params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    })
    if (!order) throw new ApiError(404, 'NOT_FOUND', 'Order not found')
    if (userId && order.clerkUserId !== userId) throw new ApiError(403, 'FORBIDDEN', 'Access denied')

    return NextResponse.json(successResponse({
      ...order,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      orderDate: order.orderDate.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((i) => ({ ...i, price: Number(i.price) })),
    }))
  } catch (e) { return handleApiError(e) }
}
