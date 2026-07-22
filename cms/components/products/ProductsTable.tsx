'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Edit2, Trash2, Eye, EyeOff, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  slug: string
  status: string
  price: number
  compareAtPrice: number | null
  sku: string | null
  stock: number
  isFeatured: boolean
  isBestSeller: boolean
  category: { id: string; name: string; slug: string } | null
  brand: { id: string; name: string; slug: string } | null
  images: Array<{ media: { publicUrl: string; thumbUrl: string | null } }>
  updatedAt: string
  publishedAt: string | null
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-slate-100 text-slate-600',
}

export function ProductsTable({
  products,
  total,
  page,
  pageSize,
  categories,
}: {
  products: Product[]
  total: number
  page: number
  pageSize: number
  categories: Array<{ id: string; name: string; slug: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') ?? '')

  function applyFilters() {
    const params = new URLSearchParams()
    if (searchValue) params.set('q', searchValue)
    if (statusFilter) params.set('status', statusFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    params.set('page', '1')
    startTransition(() => router.push(`/products?${params.toString()}`))
  }

  async function handlePublish(id: string, action: 'publish' | 'unpublish') {
    try {
      const res = await fetch(`/api/cms/v1/admin/products/${id}/${action}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success(action === 'publish' ? 'Product published' : 'Product unpublished')
      router.refresh()
    } catch {
      toast.error('Action failed')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/cms/v1/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Product deleted')
      router.refresh()
    } catch {
      toast.error('Delete failed')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      {/* Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={applyFilters}
          disabled={isPending}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600 w-12"></th>
              <th className="px-4 py-3 font-medium text-slate-600">Product</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600">Price</th>
              <th className="px-4 py-3 font-medium text-slate-600">Stock</th>
              <th className="px-4 py-3 font-medium text-slate-600">Category</th>
              <th className="px-4 py-3 font-medium text-slate-600">Updated</th>
              <th className="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next-eslint/no-img-element
                      <img
                        src={product.images[0].media.thumbUrl ?? product.images[0].media.publicUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <Link href={`/products/${product.id}`} className="font-medium text-slate-800 hover:text-orange-500 transition-colors">
                      {product.name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {product.sku ? `SKU: ${product.sku}` : product.slug}
                      {product.isFeatured && <span className="ml-2 text-orange-500">★ Featured</span>}
                      {product.isBestSeller && <span className="ml-2 text-blue-500">↑ Best seller</span>}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-1 rounded-full font-medium', statusColors[product.status])}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">
                  R{product.price.toFixed(2)}
                  {product.compareAtPrice && (
                    <span className="text-slate-400 line-through text-xs ml-1">R{product.compareAtPrice.toFixed(2)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-sm font-medium', product.stock < 5 ? 'text-red-500' : product.stock < 20 ? 'text-yellow-500' : 'text-slate-700')}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{product.category?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {product.status !== 'PUBLISHED' ? (
                      <button
                        onClick={() => handlePublish(product.id, 'publish')}
                        title="Publish"
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(product.id, 'unpublish')}
                        title="Unpublish"
                        className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      href={`/products/${product.id}`}
                      className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No products found</p>
            <Link href="/products/new" className="text-orange-500 text-sm mt-2 inline-block hover:underline">
              Create your first product
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/products?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}`}
              className={cn('p-1.5 rounded-lg border text-slate-600 hover:bg-slate-50 transition-colors', page === 1 && 'pointer-events-none opacity-30')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm text-slate-600">{page} / {totalPages}</span>
            <Link
              href={`/products?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}`}
              className={cn('p-1.5 rounded-lg border text-slate-600 hover:bg-slate-50 transition-colors', page >= totalPages && 'pointer-events-none opacity-30')}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
