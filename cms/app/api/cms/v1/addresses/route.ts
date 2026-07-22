import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'

const CreateAddressSchema = z.object({
  clerkUserId: z.string().min(1),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  streetAddress: z.string().min(1),
  buildingDetails: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().min(1),
  province: z.string().optional(),
  postalCode: z.string().min(1),
  country: z.enum(['ZA', 'ZW']),
  isDefault: z.boolean().optional(),
  addressType: z.string().optional(),
  deliveryInstructions: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) throw new ApiError(400, 'MISSING_PARAM', 'userId is required')

    const addresses = await prisma.customerAddress.findMany({
      where: { clerkUserId: userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json(successResponse({ addresses }))
  } catch (e) { return handleApiError(e) }
}

export async function POST(req: NextRequest) {
  try {
    validateApiKey(req)
    await rateLimit(getClientIp(req), 100, 60)
    const body = await req.json()
    const data = CreateAddressSchema.parse(body)

    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.customerAddress.updateMany({
          where: { clerkUserId: data.clerkUserId },
          data: { isDefault: false },
        })
      }
      return tx.customerAddress.create({
        data: {
          id: createId(),
          clerkUserId: data.clerkUserId,
          fullName: data.fullName,
          phone: data.phone,
          streetAddress: data.streetAddress,
          buildingDetails: data.buildingDetails ?? null,
          suburb: data.suburb ?? null,
          city: data.city,
          province: data.province ?? null,
          postalCode: data.postalCode,
          country: data.country,
          isDefault: data.isDefault ?? false,
          addressType: (data.addressType as 'HOME' | 'BUSINESS' | 'OTHER' | undefined) ?? 'HOME',
          deliveryInstructions: data.deliveryInstructions ?? null,
        },
      })
    })

    return NextResponse.json(successResponse(address), { status: 201 })
  } catch (e) { return handleApiError(e) }
}
