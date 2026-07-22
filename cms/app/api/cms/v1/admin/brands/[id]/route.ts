import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { invalidateCache, CacheKeys } from '@/lib/cache'
import { z } from 'zod'

const UpdateBrandSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  logoId: z.string().nullable().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()
    const data = UpdateBrandSchema.parse(body)
    const brand = await prisma.brand.update({ where: { id }, data })
    await invalidateCache(CacheKeys.brands())
    return NextResponse.json(successResponse(brand))
  } catch (e) { return handleApiError(e) }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const count = await prisma.product.count({ where: { brandId: id } })
    if (count > 0) throw new ApiError(409, 'BRAND_IN_USE', `Cannot delete — ${count} products use this brand`)
    await prisma.brand.delete({ where: { id } })
    await invalidateCache(CacheKeys.brands())
    return NextResponse.json(successResponse({ deleted: true }))
  } catch (e) { return handleApiError(e) }
}
