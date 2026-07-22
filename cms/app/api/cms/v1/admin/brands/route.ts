import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { CreateBrandSchema } from '@/lib/zod-schemas'
import { createId } from '@paralleldrive/cuid2'
import { invalidateCache, CacheKeys } from '@/lib/cache'

export async function GET(_: NextRequest) {
  try {
    await requireCmsAdmin()
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { logo: { select: { id: true, publicUrl: true, thumbUrl: true, altText: true } }, _count: { select: { products: true } } },
    })
    return NextResponse.json(successResponse(brands))
  } catch (e) { return handleApiError(e) }
}

export async function POST(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const body = await req.json()
    const data = CreateBrandSchema.parse(body)
    const brand = await prisma.brand.create({
      data: {
        id: createId(),
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        website: data.website ?? null,
        isActive: data.isActive ?? true,
        logoId: data.logoId ?? null,
      },
    })
    await invalidateCache(CacheKeys.brands())
    return NextResponse.json(successResponse(brand), { status: 201 })
  } catch (e) { return handleApiError(e) }
}
