import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CollectionEditor } from '@/components/collections/CollectionEditor'

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === 'new') {
    const allProducts = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, name: true, slug: true, price: true, images: { include: { media: true }, take: 1 } },
      orderBy: { name: 'asc' },
    })
    return <CollectionEditor collection={null} allProducts={allProducts.map((p) => ({ ...p, price: Number(p.price) }))} />
  }

  const [collection, allProducts] = await Promise.all([
    prisma.collection.findUnique({
      where: { id },
      include: {
        image: true,
        products: {
          orderBy: { position: 'asc' },
          include: { product: { select: { id: true, name: true, slug: true, price: true, images: { include: { media: true }, take: 1 } } } },
        },
      },
    }),
    prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, name: true, slug: true, price: true, images: { include: { media: true }, take: 1 } },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!collection) notFound()

  return (
    <CollectionEditor
      collection={{
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        status: collection.status,
        image: collection.image,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        products: collection.products.map((cp) => ({
          position: cp.position,
          product: { ...cp.product, price: Number(cp.product.price) },
        })),
      }}
      allProducts={allProducts.map((p) => ({ ...p, price: Number(p.price) }))}
    />
  )
}
