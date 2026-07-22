import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { SaleEditor } from '@/components/sales/SaleEditor'

export default async function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === 'new') {
    return <SaleEditor sale={null} allProducts={[]} />
  }

  const [sale, allProducts] = await Promise.all([
    prisma.sale.findUnique({
      where: { id },
      include: {
        products: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    }),
    prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, name: true, sku: true },
      orderBy: { name: 'asc' },
    }),
  ])
  if (!sale) notFound()

  return (
    <SaleEditor
      sale={{
        ...sale,
        discountValue: Number(sale.discountValue),
        minimumOrderValue: sale.minimumOrderValue ? Number(sale.minimumOrderValue) : null,
        startsAt: sale.startsAt?.toISOString() ?? null,
        endsAt: sale.endsAt?.toISOString() ?? null,
        products: sale.products.map((sp) => ({ ...sp, product: sp.product })),
      }}
      allProducts={allProducts}
    />
  )
}
