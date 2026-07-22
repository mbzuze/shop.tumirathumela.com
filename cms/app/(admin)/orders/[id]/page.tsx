import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { OrderStatusUpdater } from '@/components/orders/OrderStatusUpdater'
import { formatCurrency } from '@/lib/utils'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!order) notFound()

  const address = order.shippingAddress as Record<string, string>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500 mt-1">{order.orderDate.toLocaleString()}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[order.status]}`}>{order.status}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Customer</p>
          <p className="font-medium text-slate-800">{order.customerName}</p>
          <p className="text-sm text-slate-500">{order.customerEmail}</p>
          {order.customerPhone && <p className="text-sm text-slate-500">{order.customerPhone}</p>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Shipping Address</p>
          <p className="text-sm text-slate-700">{address.fullName}</p>
          <p className="text-sm text-slate-500">{address.streetAddress}</p>
          {address.buildingDetails && <p className="text-sm text-slate-500">{address.buildingDetails}</p>}
          <p className="text-sm text-slate-500">{address.city}{address.province ? `, ${address.province}` : ''}</p>
          <p className="text-sm text-slate-500">{address.country}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment</p>
          <p className="text-sm text-slate-700">{order.paymentProvider}</p>
          {order.paymentId && <p className="text-xs text-slate-400 break-all mt-1">{order.paymentId}</p>}
          {order.couponCode && <p className="text-sm text-green-600 mt-1">Coupon: {order.couponCode}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="font-semibold text-slate-800">Order Items</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-2 text-left text-slate-600 font-medium">Product</th>
              <th className="px-4 py-2 text-right text-slate-600 font-medium">Qty</th>
              <th className="px-4 py-2 text-right text-slate-600 font-medium">Price</th>
              <th className="px-4 py-2 text-right text-slate-600 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-700">{item.name}</p>
                  {item.sku && <p className="text-xs text-slate-400">SKU: {item.sku}</p>}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(Number(item.price), order.currency)}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(Number(item.price) * item.quantity, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatCurrency(Number(order.subtotal), order.currency)}</span></div>
          {Number(order.discountAmount) > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{formatCurrency(Number(order.discountAmount), order.currency)}</span></div>}
          {Number(order.shippingCost) > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Shipping</span><span>{formatCurrency(Number(order.shippingCost), order.currency)}</span></div>}
          <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100"><span>Total</span><span>{formatCurrency(Number(order.total), order.currency)}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Update Status</p>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
      </div>
    </div>
  )
}
