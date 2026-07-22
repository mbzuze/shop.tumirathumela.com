import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { SaleActions } from '@/components/sales/SaleActions'

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { products: true } } },
  })

  const now = new Date()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales & Coupons</h1>
          <p className="text-sm text-slate-500 mt-1">{sales.length} campaigns</p>
        </div>
        <Link href="/sales/new" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Sale
        </Link>
      </div>

      <div className="space-y-3">
        {sales.map((sale) => {
          const isActive = sale.isActive && (!sale.startsAt || sale.startsAt <= now) && (!sale.endsAt || sale.endsAt >= now)
          return (
            <div key={sale.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">{sale.name}</span>
                  {sale.couponCode && (
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-600">{sale.couponCode}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{sale.discountType === 'PERCENTAGE' ? `${Number(sale.discountValue)}% off` : `${Number(sale.discountValue)} off`}</span>
                  {sale.startsAt && <span>from {sale.startsAt.toLocaleDateString()}</span>}
                  {sale.endsAt && <span>until {sale.endsAt.toLocaleDateString()}</span>}
                  {sale._count.products > 0 && <span>{sale._count.products} products</span>}
                  {sale.usageLimit && <span>Limit: {sale.usageCount}/{sale.usageLimit} uses</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/sales/${sale.id}`} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">Edit</Link>
                <SaleActions saleId={sale.id} />
              </div>
            </div>
          )
        })}
        {sales.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400 text-sm">
            No sales yet. <Link href="/sales/new" className="text-orange-500 hover:underline">Create one</Link>
          </div>
        )}
      </div>
    </div>
  )
}
