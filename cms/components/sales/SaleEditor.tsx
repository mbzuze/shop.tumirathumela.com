'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

interface Product { id: string; name: string; sku: string | null }
interface SaleProduct { productId: string; product: Product }
interface Sale {
  id: string
  name: string
  couponCode: string | null
  discountType: string
  discountValue: number
  minimumOrderValue: number | null
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  usageLimit: number | null
  usageCount: number
  products: SaleProduct[]
}

export function SaleEditor({ sale, allProducts }: { sale: Sale | null; allProducts: Product[] }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: sale?.name ?? '',
    couponCode: sale?.couponCode ?? '',
    discountType: sale?.discountType ?? 'PERCENTAGE',
    discountValue: sale?.discountValue ?? 10,
    minimumOrderValue: sale?.minimumOrderValue ?? '',
    isActive: sale?.isActive ?? true,
    startsAt: sale?.startsAt ? sale.startsAt.slice(0, 16) : '',
    endsAt: sale?.endsAt ? sale.endsAt.slice(0, 16) : '',
    usageLimit: sale?.usageLimit ?? '',
  })
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(
    sale?.products.map((sp) => sp.product) ?? []
  )
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredProducts = allProducts.filter(
    (p) => !selectedProducts.find((s) => s.id === p.id) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.includes(search))
  )

  const addProduct = (p: Product) => setSelectedProducts((prev) => [...prev, p])
  const removeProduct = (id: string) => setSelectedProducts((prev) => prev.filter((p) => p.id !== id))

  const handleSave = async () => {
    setSaving(true)
    const url = sale ? `/api/cms/v1/admin/sales/${sale.id}` : '/api/cms/v1/admin/sales'
    const method = sale ? 'PATCH' : 'POST'
    const body = {
      ...form,
      discountValue: Number(form.discountValue),
      minimumOrderValue: form.minimumOrderValue ? Number(form.minimumOrderValue) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      productIds: selectedProducts.map((p) => p.id),
    }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { toast.error('Save failed'); setSaving(false); return }
    toast.success(sale ? 'Sale updated' : 'Sale created')
    router.push('/sales')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{sale ? 'Edit Sale' : 'New Sale'}</h1>
        <button onClick={() => router.push('/sales')} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sale Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Coupon Code</label>
          <input value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
            placeholder="e.g. SUMMER20"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Discount Type</label>
            <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Discount Value *</label>
            <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Starts At</label>
            <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ends At</label>
            <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Minimum Order Value</label>
            <input type="number" value={form.minimumOrderValue} onChange={(e) => setForm({ ...form, minimumOrderValue: e.target.value })}
              placeholder="No minimum"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Usage Limit</label>
            <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              placeholder="Unlimited"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded accent-orange-500" />
          <span className="text-sm text-slate-700">Active</span>
        </label>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Applies to products (leave empty for all)</p>
        {selectedProducts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedProducts.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg text-xs font-medium text-orange-700">
                {p.name}
                <button onClick={() => removeProduct(p.id)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filteredProducts.slice(0, 20).map((p) => (
            <button key={p.id} onClick={() => addProduct(p)}
              className="w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 text-slate-700 transition-colors">
              {p.name} {p.sku && <span className="text-slate-400 text-xs">({p.sku})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.push('/sales')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.name}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save Sale'}
        </button>
      </div>
    </div>
  )
}
