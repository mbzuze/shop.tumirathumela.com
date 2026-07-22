import { prisma } from '@/lib/prisma'
import { statfs } from 'fs/promises'
import { formatBytes, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  HardDrive,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

async function getDashboardStats() {
  const [
    productStats,
    orderStats,
    reviewStats,
    categoryCount,
    brandCount,
    recentProducts,
    recentOrders,
    mediaCount,
  ] = await Promise.all([
    prisma.product.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.order.aggregate({
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.review.aggregate({
      _count: { id: true },
      where: {},
    }),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, slug: true, status: true, price: true, updatedAt: true },
    }),
    prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        orderDate: true,
      },
    }),
    prisma.media.aggregate({ _count: { id: true } }),
  ])

  const pendingReviews = await prisma.review.count({ where: { isApproved: false } })
  const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } })

  let diskUsageBytes = 0
  try {
    const stats = await statfs(process.env.MEDIA_ROOT ?? require('path').join(process.cwd(), 'public', 'media'))
    const usedBlocks = stats.blocks - stats.bfree
    diskUsageBytes = usedBlocks * stats.bsize
  } catch {
    diskUsageBytes = 0
  }

  const productStatusMap = Object.fromEntries(
    productStats.map((s) => [s.status, s._count.id])
  )

  return {
    products: {
      total: (productStatusMap.DRAFT ?? 0) + (productStatusMap.PUBLISHED ?? 0) + (productStatusMap.ARCHIVED ?? 0),
      published: productStatusMap.PUBLISHED ?? 0,
      drafts: productStatusMap.DRAFT ?? 0,
      archived: productStatusMap.ARCHIVED ?? 0,
    },
    orders: {
      total: orderStats._count.id,
      pending: pendingOrders,
      revenue: Number(orderStats._sum.total ?? 0),
    },
    reviews: {
      total: reviewStats._count.id,
      pending: pendingReviews,
    },
    media: {
      total: mediaCount._count.id,
      diskUsageBytes,
    },
    categoryCount,
    brandCount,
    recentProducts,
    recentOrders,
  }
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">TumiraThumela Shop — Content Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Products"
          value={stats.products.total}
          subtitle={`${stats.products.published} published · ${stats.products.drafts} drafts`}
          icon={<Package className="w-5 h-5 text-orange-500" />}
          href="/products"
          accent="orange"
        />
        <StatCard
          title="Orders"
          value={stats.orders.total}
          subtitle={`${formatCurrency(stats.orders.revenue)} revenue`}
          icon={<ShoppingCart className="w-5 h-5 text-blue-500" />}
          href="/orders"
          accent="blue"
          badge={stats.orders.pending > 0 ? { count: stats.orders.pending, label: 'pending' } : undefined}
        />
        <StatCard
          title="Reviews"
          value={stats.reviews.total}
          subtitle={`${stats.reviews.pending} awaiting approval`}
          icon={<Star className="w-5 h-5 text-yellow-500" />}
          href="/reviews"
          accent="yellow"
          badge={stats.reviews.pending > 0 ? { count: stats.reviews.pending, label: 'pending' } : undefined}
        />
        <StatCard
          title="Media Files"
          value={stats.media.total}
          subtitle={formatBytes(stats.media.diskUsageBytes)}
          icon={<HardDrive className="w-5 h-5 text-purple-500" />}
          href="/media"
          accent="purple"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="Categories" value={stats.categoryCount} href="/categories" />
        <MiniStat label="Brands" value={stats.brandCount} href="/brands" />
        <MiniStat label="Published" value={stats.products.published} href="/products?status=PUBLISHED" />
        <MiniStat label="Drafts" value={stats.products.drafts} href="/products?status=DRAFT" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Recent Products
            </h2>
            <Link href="/products" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {stats.recentProducts.map((p) => (
              <li key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <Link href={`/products/${p.id}`} className="text-sm font-medium text-slate-700 hover:text-orange-500 transition-colors">
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(Number(p.price))}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              Recent Orders
            </h2>
            <Link href="/orders" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {stats.recentOrders.map((o) => (
              <li key={o.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <Link href={`/orders/${o.id}`} className="text-sm font-medium text-slate-700 hover:text-orange-500 transition-colors">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">{o.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(Number(o.total))}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status]}`}>
                    {o.status}
                  </span>
                </div>
              </li>
            ))}
            {stats.recentOrders.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-400">No orders yet</li>
            )}
          </ul>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/products/new" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Package className="w-4 h-4" /> New Product
          </Link>
          <Link href="/media" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Upload Media
          </Link>
          <Link href="/reviews?approved=false" className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <AlertCircle className="w-4 h-4" /> Approve Reviews ({stats.reviews.pending})
          </Link>
          <Link href="/orders?status=PENDING" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <CheckCircle2 className="w-4 h-4" /> Process Orders ({stats.orders.pending})
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title, value, subtitle, icon, href, accent, badge,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  href: string
  accent: 'orange' | 'blue' | 'yellow' | 'purple'
  badge?: { count: number; label: string }
}) {
  const accentMap = {
    orange: 'bg-orange-50 border-orange-100',
    blue: 'bg-blue-50 border-blue-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    purple: 'bg-purple-50 border-purple-100',
  }

  return (
    <Link href={href} className={`relative block rounded-xl border p-5 hover:shadow-md transition-shadow ${accentMap[accent]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      {badge && (
        <span className="absolute top-4 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {badge.count}
        </span>
      )}
    </Link>
  )
}

function MiniStat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
      <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </Link>
  )
}
