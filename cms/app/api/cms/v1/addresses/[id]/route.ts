import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const UpdateSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  streetAddress: z.string().optional(),
  buildingDetails: z.string().nullable().optional(),
  suburb: z.string().nullable().optional(),
  city: z.string().optional(),
  province: z.string().nullable().optional(),
  postalCode: z.string().optional(),
  country: z.enum(['ZA', 'ZW']).optional(),
  isDefault: z.boolean().optional(),
  addressType: z.string().nullable().optional(),
  deliveryInstructions: z.string().nullable().optional(),
  clerkUserId: z.string().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const { id } = await params
    const body = await req.json()
    const data = UpdateSchema.parse(body)

    const address = await prisma.$transaction(async (tx) => {
      const existing = await tx.customerAddress.findUnique({ where: { id } })
      if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Address not found')

      if (data.isDefault) {
        const userId = data.clerkUserId ?? existing.clerkUserId
        await tx.customerAddress.updateMany({
          where: { clerkUserId: userId, id: { not: id } },
          data: { isDefault: false },
        })
      }

      return tx.customerAddress.update({
        where: { id },
        data: {
          ...data,
          clerkUserId: undefined,
          addressType: (data.addressType ?? undefined) as 'HOME' | 'BUSINESS' | 'OTHER' | undefined,
        },
      })
    })

    return NextResponse.json(successResponse(address))
  } catch (e) { return handleApiError(e) }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const { id } = await params
    const addr = await prisma.customerAddress.findUnique({ where: { id } })
    if (!addr) throw new ApiError(404, 'NOT_FOUND', 'Address not found')
    await prisma.customerAddress.delete({ where: { id } })
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (e) { return handleApiError(e) }
}
