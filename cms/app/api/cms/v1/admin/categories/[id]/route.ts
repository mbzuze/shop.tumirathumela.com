import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { UpdateCategorySchema } from '@/lib/zod-schemas'
import { invalidateCache, CacheKeys } from '@/lib/cache'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()
    const data = UpdateCategorySchema.parse(body)

    const category = await prisma.category.update({
      where: { id },
      data,
      include: { image: true, parent: { select: { id: true, name: true, slug: true } } },
    })

    await invalidateCache(CacheKeys.categories())
    await invalidateCache(CacheKeys.category(category.slug))
    return successResponse({ ...category, createdAt: category.createdAt.toISOString(), updatedAt: category.updatedAt.toISOString() })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params

    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) return errorResponse('NOT_FOUND', 'Category not found', 404)

    const productCount = await prisma.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return errorResponse('CONFLICT', `Cannot delete: ${productCount} products assigned to this category`, 409)
    }

    await prisma.category.delete({ where: { id } })
    await invalidateCache(CacheKeys.categories())
    await invalidateCache(CacheKeys.category(category.slug))
    return new Response(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
