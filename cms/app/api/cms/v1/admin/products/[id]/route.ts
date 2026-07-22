import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { UpdateProductSchema } from '@/lib/zod-schemas'
import { fireWebhooks } from '@/lib/webhooks'
import { invalidateCache, CacheKeys } from '@/lib/cache'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { include: { media: true }, orderBy: { position: 'asc' } },
        variants: { include: { image: true } },
        tags: { include: { tag: true } },
        revisions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    if (!product) return errorResponse('NOT_FOUND', 'Product not found', 404)

    return successResponse({
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
      rating: product.rating ? Number(product.rating) : null,
      tags: product.tags.map((pt) => pt.tag),
      variants: product.variants.map((v) => ({ ...v, price: v.price ? Number(v.price) : null })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      publishedAt: product.publishedAt?.toISOString() ?? null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()
    const data = UpdateProductSchema.parse(body)

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return errorResponse('NOT_FOUND', 'Product not found', 404)

    const product = await prisma.$transaction(async (tx) => {
      // Save revision if currently published
      if (existing.status === 'PUBLISHED') {
        await tx.productRevision.create({
          data: {
            productId: id,
            snapshot: { ...existing, price: Number(existing.price) } as object,
            createdBy: userId,
          },
        })
      }

      const updateData: Prisma.ProductUncheckedUpdateInput = {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.description !== undefined ? { description: data.description as Prisma.InputJsonValue } : {}),
          ...(data.shortDescription !== undefined ? { shortDescription: data.shortDescription } : {}),
          ...(data.price !== undefined ? { price: data.price } : {}),
          ...(data.compareAtPrice !== undefined ? { compareAtPrice: data.compareAtPrice } : {}),
          ...(data.sku !== undefined ? { sku: data.sku } : {}),
          ...(data.stock !== undefined ? { stock: data.stock } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
          ...(data.isBestSeller !== undefined ? { isBestSeller: data.isBestSeller } : {}),
          ...(data.weight !== undefined ? { weight: data.weight } : {}),
          ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle } : {}),
          ...(data.seoDescription !== undefined ? { seoDescription: data.seoDescription } : {}),
          ...(data.dealBadge !== undefined ? { dealBadge: data.dealBadge } : {}),
          ...(data.dealPercent !== undefined ? { dealPercent: data.dealPercent } : {}),
          ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
          ...(data.brandId !== undefined ? { brandId: data.brandId } : {}),
          updatedBy: userId,
      }

      const updated = await tx.product.update({ where: { id }, data: updateData })

      if (data.tagIds !== undefined) {
        await tx.productTag.deleteMany({ where: { productId: id } })
        if (data.tagIds.length > 0) {
          await tx.productTag.createMany({
            data: data.tagIds.map((tagId) => ({ productId: id, tagId })),
          })
        }
      }

      if (data.imageIds !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } })
        if (data.imageIds.length > 0) {
          await tx.productImage.createMany({
            data: data.imageIds.map((img) => ({
              productId: id,
              mediaId: img.mediaId,
              altText: img.altText,
              position: img.position,
            })),
          })
        }
      }

      if (data.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } })
        if (data.variants.length > 0) {
          await tx.productVariant.createMany({
            data: data.variants.map((v) => ({
              productId: id,
              name: v.name,
              options: v.options,
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              imageId: v.imageId,
            })),
          })
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { include: { media: true }, orderBy: { position: 'asc' } },
          variants: { include: { image: true } },
          tags: { include: { tag: true } },
        },
      })
    })

    await invalidateCache(CacheKeys.product(product.slug))
    await fireWebhooks('product.updated', { id: product.id, slug: product.slug, type: 'product' })

    return successResponse({
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      tags: product.tags.map((pt) => pt.tag),
      variants: product.variants.map((v) => ({ ...v, price: v.price ? Number(v.price) : null })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      publishedAt: product.publishedAt?.toISOString() ?? null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return errorResponse('NOT_FOUND', 'Product not found', 404)

    await prisma.product.delete({ where: { id } })
    await invalidateCache(CacheKeys.product(product.slug))
    await invalidateCache('cms:products:*')
    await fireWebhooks('product.deleted', { id, slug: product.slug, type: 'product' })

    return new Response(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
