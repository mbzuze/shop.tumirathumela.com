import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      image: true,
      _count: { select: { products: true } },
    },
  })

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-700',
    PUBLISHED: 'bg-green-100 text-green-700',
    ARCHIVED: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Collections</h1>
        <Link href="/collections/new" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Collection
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {collections.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No collections yet.</div>
        )}
        {collections.map((col) => (
          <div key={col.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/60 transition-colors">
            {col.image ? (
              // eslint-disable-next-line @next/next-eslint/no-img-element
              <img src={col.image.thumbUrl ?? col.image.publicUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-100" />
            )}
            <div className="flex-1">
              <p className="font-medium text-slate-800">{col.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">/{col.slug} · {col._count.products} products</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[col.status]}`}>{col.status}</span>
            <Link href={`/collections/${col.id}`} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
