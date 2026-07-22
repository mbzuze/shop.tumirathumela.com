import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ReviewModerator } from '@/components/reviews/ReviewModerator'

interface Props {
  searchParams: Promise<{ approved?: string; page?: string }>
}

export default async function ReviewsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const pageSize = 25
  const skip = (page - 1) * pageSize
  const approved = params.approved === 'true' ? true : params.approved === 'false' ? false : undefined

  const where = { ...(approved !== undefined ? { isApproved: approved } : {}) }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.review.count({ where }),
  ])

  const pendingCount = await prisma.review.count({ where: { isApproved: false } })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">{pendingCount > 0 && <span className="text-orange-500 font-medium">{pendingCount} pending approval · </span>}{total} total</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[{ label: 'All', href: '/reviews' }, { label: 'Pending', href: '/reviews?approved=false' }, { label: 'Approved', href: '/reviews?approved=true' }].map((tab) => (
          <Link key={tab.href} href={tab.href} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            (tab.href === '/reviews' && !params.approved) || (tab.href.includes(params.approved ?? '')) ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>{tab.label}</Link>
        ))}
      </div>

      <ReviewModerator
        reviews={reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }))}
      />
    </div>
  )
}
