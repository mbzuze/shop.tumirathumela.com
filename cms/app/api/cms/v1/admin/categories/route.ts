import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { CreateCategorySchema } from '@/lib/zod-schemas'
import { invalidateCache, CacheKeys } from '@/lib/cache'
import { slugify } from '@/lib/utils'

export async function GET(_req: NextRequest) {
  try {
    await requireCmsAdmin()
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        image: true,
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    })
    return successResponse(categories.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const body = await req.json()
    const data = CreateCategorySchema.parse(body)
    const slug = data.slug || slugify(data.name)

    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      return successResponse(null, undefined, 409)
    }

    const category = await prisma.category.create({
      data: { ...data, slug },
      include: { image: true, parent: { select: { id: true, name: true, slug: true } } },
    })

    await invalidateCache(CacheKeys.categories())
    return successResponse({ ...category, createdAt: category.createdAt.toISOString(), updatedAt: category.updatedAt.toISOString() }, undefined, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
