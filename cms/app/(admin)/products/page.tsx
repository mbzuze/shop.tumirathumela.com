import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ProductsTable } from '@/components/products/ProductsTable'

interface ProductsPageProps {
  searchParams: Promise<{ status?: string; category?: string; q?: string; page?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const where = {
    ...(params.status ? { status: params.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } : {}),
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(params.q ? {
      OR: [
        { name: { contains: params.q, mode: 'insensitive' as const } },
        { sku: { contains: params.q, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { include: { media: true }, orderBy: { position: 'asc' }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">{total} product{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Link>
      </div>

      <ProductsTable
        products={products.map((p) => ({
          ...p,
          price: Number(p.price),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          publishedAt: p.publishedAt?.toISOString() ?? null,
        }))}
        total={total}
        page={page}
        pageSize={pageSize}
        categories={categories}
      />
    </div>
  )
}
