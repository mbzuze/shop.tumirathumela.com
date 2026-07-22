import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

interface Props {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const where = {
    ...(params.status ? { status: params.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' } : {}),
    ...(params.q ? {
      OR: [
        { orderNumber: { contains: params.q, mode: 'insensitive' as const } },
        { customerEmail: { contains: params.q, mode: 'insensitive' as const } },
        { customerName: { contains: params.q, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, skip, take: pageSize, orderBy: { orderDate: 'desc' } }),
    prisma.order.count({ where }),
  ])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">{total} orders</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-2 flex-wrap">
          {['', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'].map((s) => (
            <Link
              key={s}
              href={s ? `/orders?status=${s}` : '/orders'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${params.status === s || (!params.status && s === '') ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s || 'All'}
            </Link>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Order</th>
              <th className="px-4 py-3 font-medium text-slate-600">Customer</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600">Total</th>
              <th className="px-4 py-3 font-medium text-slate-600">Date</th>
              <th className="px-4 py-3 font-medium text-slate-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700">{order.orderNumber}</td>
                <td className="px-4 py-3">
                  <p className="text-slate-700">{order.customerName}</p>
                  <p className="text-xs text-slate-400">{order.customerEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status]}`}>{order.status}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700">{formatCurrency(Number(order.total), order.currency)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{order.orderDate.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/orders/${order.id}`} className="text-xs text-orange-500 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No orders found.</div>}
      </div>
    </div>
  )
}
