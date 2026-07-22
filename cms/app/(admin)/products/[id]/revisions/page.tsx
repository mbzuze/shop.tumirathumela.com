import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { RevisionTimeline } from '@/components/products/RevisionTimeline'

export default async function RevisionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  })

  if (!product) notFound()

  const revisions = await prisma.productRevision.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Revision History</h1>
      <p className="text-sm text-slate-500 mb-6">{product.name}</p>
      <RevisionTimeline
        productId={id}
        revisions={revisions.map((r) => ({
          id: r.id,
          createdBy: r.createdBy,
          createdAt: r.createdAt.toISOString(),
          snapshot: r.snapshot as Record<string, unknown>,
        }))}
      />
    </div>
  )
}
