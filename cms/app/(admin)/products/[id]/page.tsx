import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/products/ProductForm'
import Link from 'next/link'
import { History } from 'lucide-react'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [product, categories, brands, tags] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { include: { media: true }, orderBy: { position: 'asc' } },
        variants: { include: { image: true } },
        tags: { include: { tag: true } },
      },
    }),
    prisma.category.findMany({ select: { id: true, name: true, slug: true, parentId: true }, orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!product) notFound()

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Link
          href={`/products/${id}/revisions`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-orange-500 transition-colors"
        >
          <History className="w-4 h-4" />
          View revision history
        </Link>
      </div>
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          status: product.status,
          description: product.description as object,
          shortDescription: product.shortDescription,
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          sku: product.sku,
          stock: product.stock,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isBestSeller: product.isBestSeller,
          weight: product.weight ? Number(product.weight) : null,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          dealBadge: product.dealBadge,
          dealPercent: product.dealPercent,
          categoryId: product.categoryId,
          brandId: product.brandId,
          tagIds: product.tags.map((pt) => pt.tagId),
          images: product.images.map((pi) => ({
            mediaId: pi.mediaId,
            publicUrl: pi.media.publicUrl,
            thumbUrl: pi.media.thumbUrl,
            altText: pi.altText ?? '',
            position: pi.position,
          })),
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku ?? '',
            price: v.price ? String(Number(v.price)) : '',
            stock: String(v.stock),
            imageId: v.imageId ?? '',
            imageUrl: v.image?.publicUrl ?? '',
            options: v.options as Array<{ name: string; value: string }>,
          })),
        }}
        categories={categories}
        brands={brands}
        tags={tags}
      />
    </div>
  )
}
