import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, handleApiError, paginationParams } from '@/lib/api-response'
import { CreateProductSchema } from '@/lib/zod-schemas'
import { fireWebhooks } from '@/lib/webhooks'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const { page, pageSize, skip } = paginationParams(req.nextUrl.searchParams)
    const status = req.nextUrl.searchParams.get('status') ?? undefined
    const search = req.nextUrl.searchParams.get('q') ?? undefined
    const category = req.nextUrl.searchParams.get('category') ?? undefined

    const where = {
      ...(status ? { status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { include: { media: true }, orderBy: { position: 'asc' }, take: 1 },
          tags: { include: { tag: true } },
          _count: { select: { variants: true, reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    return successResponse(
      products.map((p) => ({
        ...p,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        rating: p.rating ? Number(p.rating) : null,
        tags: p.tags.map((pt) => pt.tag),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        publishedAt: p.publishedAt?.toISOString() ?? null,
      })),
      { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    )
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireCmsAdmin()
    const body = await req.json()
    const data = CreateProductSchema.parse(body)

    const slug = data.slug || slugify(data.name)

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description as Prisma.InputJsonValue,
          shortDescription: data.shortDescription,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          sku: data.sku,
          stock: data.stock,
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false,
          isBestSeller: data.isBestSeller ?? false,
          weight: data.weight,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          dealBadge: data.dealBadge,
          dealPercent: data.dealPercent,
          categoryId: data.categoryId,
          brandId: data.brandId,
          createdBy: userId,
          updatedBy: userId,
        },
      })

      if (data.tagIds?.length) {
        await tx.productTag.createMany({
          data: data.tagIds.map((tagId) => ({ productId: p.id, tagId })),
        })
      }

      if (data.imageIds?.length) {
        await tx.productImage.createMany({
          data: data.imageIds.map((img) => ({
            productId: p.id,
            mediaId: img.mediaId,
            altText: img.altText,
            position: img.position,
          })),
        })
      }

      if (data.variants?.length) {
        await tx.productVariant.createMany({
          data: data.variants.map((v) => ({
            productId: p.id,
            name: v.name,
            options: v.options,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            imageId: v.imageId,
          })),
        })
      }

      return tx.product.findUniqueOrThrow({
        where: { id: p.id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { include: { media: true }, orderBy: { position: 'asc' } },
          variants: { include: { image: true } },
          tags: { include: { tag: true } },
        },
      })
    })

    await fireWebhooks('product.created', { id: product.id, slug: product.slug, type: 'product' })

    return successResponse({
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      tags: product.tags.map((pt) => pt.tag),
      variants: product.variants.map((v) => ({ ...v, price: v.price ? Number(v.price) : null })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      publishedAt: product.publishedAt?.toISOString() ?? null,
    }, undefined, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
