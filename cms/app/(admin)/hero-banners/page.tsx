import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { HeroBannerList } from '@/components/hero-banners/HeroBannerList'

export default async function HeroBannersPage() {
  const banners = await prisma.heroBanner.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { media: { select: { publicUrl: true, thumbUrl: true, altText: true } } },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hero Banners</h1>
          <p className="text-sm text-slate-500 mt-1">Drag to reorder. {banners.length} banners total.</p>
        </div>
        <Link href="/hero-banners/new" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Banner
        </Link>
      </div>
      <HeroBannerList
        banners={banners.map((b) => ({
          ...b,
          startsAt: b.startsAt?.toISOString() ?? null,
          endsAt: b.endsAt?.toISOString() ?? null,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
        }))}
      />
    </div>
  )
}
