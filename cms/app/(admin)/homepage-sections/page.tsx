import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { HomepageSectionList } from '@/components/homepage-sections/HomepageSectionList'

interface Props {
  searchParams: Promise<{ locale?: string }>
}

export default async function HomepageSectionsPage({ searchParams }: Props) {
  const params = await searchParams
  const locale = (params.locale as 'ZA' | 'ZW' | undefined) ?? undefined

  const sections = await prisma.homepageSection.findMany({
    where: locale ? { locale: { in: [locale, 'BOTH'] } } : undefined,
    orderBy: { sortOrder: 'asc' },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: { media: { select: { publicUrl: true, thumbUrl: true, altText: true } } },
      },
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Homepage Sections</h1>
          <p className="text-sm text-slate-500 mt-1">{sections.length} sections</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[undefined, 'ZA', 'ZW'].map((l) => (
              <Link key={l ?? 'all'} href={l ? `/homepage-sections?locale=${l}` : '/homepage-sections'}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${locale === l || (!locale && !l) ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {l ?? 'All'}
              </Link>
            ))}
          </div>
          <Link href="/homepage-sections/new" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Section
          </Link>
        </div>
      </div>
      <HomepageSectionList sections={sections} />
    </div>
  )
}
