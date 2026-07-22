'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Search, Plus } from 'lucide-react'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ProductMini {
  id: string
  name: string
  slug: string
  price: number
  images: Array<{ media: { publicUrl: string; thumbUrl: string | null } }>
}

interface CollectionEditorProps {
  collection: {
    id: string
    name: string
    slug: string
    status: string
    image: { publicUrl: string; thumbUrl: string | null } | null
    seoTitle: string | null
    seoDescription: string | null
    products: Array<{ position: number; product: ProductMini }>
  } | null
  allProducts: ProductMini[]
}

export function CollectionEditor({ collection, allProducts }: CollectionEditorProps) {
  const router = useRouter()
  const isEdit = !!collection

  const [name, setName] = useState(collection?.name ?? '')
  const [slug, setSlug] = useState(collection?.slug ?? '')
  const [seoTitle, setSeoTitle] = useState(collection?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(collection?.seoDescription ?? '')
  const [selectedProducts, setSelectedProducts] = useState<ProductMini[]>(
    collection?.products.map((cp) => cp.product) ?? []
  )
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  const filteredAvailable = allProducts.filter(
    (p) => !selectedProducts.find((sp) => sp.id === p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = selectedProducts.findIndex((p) => p.id === active.id)
    const newIndex = selectedProducts.findIndex((p) => p.id === over.id)
    setSelectedProducts(arrayMove(selectedProducts, oldIndex, newIndex))
  }

  const addProduct = (product: ProductMini) => {
    setSelectedProducts((prev) => [...prev, product])
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  const handleSave = async (publish = false) => {
    if (!name) { toast.error('Name required'); return }
    setSaving(true)
    try {
      const payload = {
        name,
        slug: slug || slugify(name),
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        products: selectedProducts.map((p, i) => ({ productId: p.id, position: i })),
      }

      const url = isEdit ? `/api/cms/v1/admin/collections/${collection.id}` : '/api/cms/v1/admin/collections'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message)

      const savedId = isEdit ? collection.id : json.data.id

      if (publish) {
        await fetch(`/api/cms/v1/admin/collections/${savedId}/publish`, { method: 'POST' })
        toast.success('Collection published!')
      } else {
        toast.success(isEdit ? 'Collection saved' : 'Collection created')
      }
      router.push('/collections')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Collection' : 'New Collection'}</h1>
        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} disabled={saving} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
            Save Draft
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
            Save & Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm">Collection Details</h2>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Name *</label>
              <input value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)) }} className={inputCls} placeholder="Summer Collection" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="summer-collection" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">SEO Title</label>
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">SEO Description</label>
              <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} className={inputCls} />
            </div>
          </div>

          {/* Available products */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-800 text-sm mb-3">Add Products</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredAvailable.slice(0, 30).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-lg hover:bg-orange-50 transition-colors group"
                >
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next-eslint/no-img-element
                    <img src={product.images[0].media.thumbUrl ?? product.images[0].media.publicUrl} alt="" className="w-7 h-7 rounded object-cover bg-slate-100" />
                  ) : <div className="w-7 h-7 rounded bg-slate-100" />}
                  <span className="flex-1 text-xs text-slate-700 truncate">{product.name}</span>
                  <Plus className="w-3 h-3 text-slate-400 group-hover:text-orange-500 transition-colors" />
                </button>
              ))}
              {filteredAvailable.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No products found</p>}
            </div>
          </div>
        </div>

        {/* Right: sorted products */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800 text-sm">Collection Products ({selectedProducts.length})</h2>
              <p className="text-xs text-slate-400">Drag to reorder</p>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-sm">Add products from the left panel</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={selectedProducts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {selectedProducts.map((product, index) => (
                      <SortableProductRow key={product.id} product={product} index={index} onRemove={() => removeProduct(product.id)} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SortableProductRow({ product, index, onRemove }: { product: ProductMini; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
    >
      <button {...attributes} {...listeners} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-xs font-bold text-slate-400 w-5 text-center">{index + 1}</span>
      {product.images[0] ? (
        // eslint-disable-next-line @next/next-eslint/no-img-element
        <img src={product.images[0].media.thumbUrl ?? product.images[0].media.publicUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
      ) : <div className="w-10 h-10 rounded-lg bg-slate-100" />}
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700">{product.name}</p>
        <p className="text-xs text-slate-400">R{product.price.toFixed(2)}</p>
      </div>
      <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
