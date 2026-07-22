'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Trash2, GripVertical, X, Image as ImageIcon, Upload } from 'lucide-react'
import type { JSONContent } from '@tiptap/core'
import type { MediaDto } from '@/types/cms'
import { cn } from '@/lib/utils'

interface Variant {
  id?: string
  name: string
  sku: string
  price: string
  stock: string
  imageId: string
  imageUrl: string
  options: Array<{ name: string; value: string }>
}

interface ProductImage {
  mediaId: string
  publicUrl: string
  thumbUrl: string | null
  altText: string
  position: number
}

interface ProductFormProps {
  product?: {
    id: string
    name: string
    slug: string
    status: string
    description: JSONContent
    shortDescription: string | null
    price: number
    compareAtPrice: number | null
    sku: string | null
    stock: number
    isActive: boolean
    isFeatured: boolean
    isBestSeller: boolean
    weight: number | null
    seoTitle: string | null
    seoDescription: string | null
    dealBadge: string | null
    dealPercent: number | null
    categoryId: string | null
    brandId: string | null
    tagIds: string[]
    images: ProductImage[]
    variants: Variant[]
  }
  categories: Array<{ id: string; name: string; slug: string; parentId: string | null }>
  brands: Array<{ id: string; name: string; slug: string }>
  tags: Array<{ id: string; name: string; slug: string }>
}

const emptyDescription: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }

export function ProductForm({ product, categories, brands, tags }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugManual, setSlugManual] = useState(isEdit)
  const [description, setDescription] = useState<JSONContent>(product?.description ?? emptyDescription)
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? '')
  const [price, setPrice] = useState(String(product?.price ?? ''))
  const [compareAtPrice, setCompareAtPrice] = useState(String(product?.compareAtPrice ?? ''))
  const [sku, setSku] = useState(product?.sku ?? '')
  const [stock, setStock] = useState(String(product?.stock ?? '0'))
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false)
  const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller ?? false)
  const [weight, setWeight] = useState(String(product?.weight ?? ''))
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription ?? '')
  const [dealBadge, setDealBadge] = useState(product?.dealBadge ?? '')
  const [dealPercent, setDealPercent] = useState(String(product?.dealPercent ?? ''))
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '')
  const [brandId, setBrandId] = useState(product?.brandId ?? '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(product?.tagIds ?? [])
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? [])
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? [])
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'general' | 'content' | 'media' | 'variants' | 'seo'>('general')

  const handleNameChange = useCallback((value: string) => {
    setName(value)
    if (!slugManual) setSlug(slugify(value))
  }, [slugManual])

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const addImageFromMedia = (media: MediaDto) => {
    setImages((prev) => [
      ...prev,
      {
        mediaId: media.id,
        publicUrl: media.publicUrl,
        thumbUrl: media.thumbUrl,
        altText: media.altText ?? '',
        position: prev.length,
      },
    ])
    setImagePickerOpen(false)
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, position: i })))
  }

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { name: '', sku: '', price: '', stock: '0', imageId: '', imageUrl: '', options: [{ name: 'Size', value: '' }] },
    ])
  }

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const buildPayload = () => ({
    name,
    slug,
    description,
    shortDescription: shortDescription || undefined,
    price: parseFloat(price),
    compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
    sku: sku || undefined,
    stock: parseInt(stock) || 0,
    isActive,
    isFeatured,
    isBestSeller,
    weight: weight ? parseFloat(weight) : undefined,
    seoTitle: seoTitle || undefined,
    seoDescription: seoDescription || undefined,
    dealBadge: dealBadge || undefined,
    dealPercent: dealPercent ? parseInt(dealPercent) : undefined,
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
    tagIds: selectedTagIds,
    imageIds: images.map((img) => ({ mediaId: img.mediaId, altText: img.altText, position: img.position })),
    variants: variants.map((v) => ({
      name: v.name,
      sku: v.sku || undefined,
      price: v.price ? parseFloat(v.price) : undefined,
      stock: parseInt(v.stock) || 0,
      imageId: v.imageId || undefined,
      options: v.options,
    })),
  })

  const handleSave = async (publish = false) => {
    if (!name || !price) { toast.error('Name and price are required'); return }
    if (publish) setPublishing(true); else setSaving(true)

    try {
      const method = isEdit ? 'PATCH' : 'POST'
      const url = isEdit ? `/api/cms/v1/admin/products/${product.id}` : '/api/cms/v1/admin/products'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message ?? 'Save failed')

      const savedId = isEdit ? product.id : json.data.id

      if (publish && savedId) {
        const pubRes = await fetch(`/api/cms/v1/admin/products/${savedId}/publish`, { method: 'POST' })
        if (!pubRes.ok) toast.error('Saved, but publish failed')
        else toast.success('Product published!')
      } else {
        toast.success(isEdit ? 'Product saved' : 'Product created')
      }

      router.push(`/products/${savedId}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'content', label: 'Content' },
    { key: 'media', label: 'Media' },
    { key: 'variants', label: `Variants (${variants.length})` },
    { key: 'seo', label: 'SEO' },
  ] as const

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
          {isEdit && (
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                product.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                product.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                'bg-slate-100 text-slate-600'
              )}>
                {product.status}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || publishing}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || publishing}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex border-b border-slate-200 px-2 pt-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors',
                activeSection === tab.key
                  ? 'bg-white border-b-2 border-orange-500 text-orange-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* GENERAL TAB */}
          {activeSection === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Field label="Product Name" required>
                  <input
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Men's Classic T-Shirt"
                    className={inputCls}
                  />
                </Field>

                <Field label="Slug" hint="URL-friendly identifier">
                  <div className="flex gap-2">
                    <input
                      value={slug}
                      onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
                      placeholder="mens-classic-t-shirt"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => { setSlug(slugify(name)); setSlugManual(false) }}
                      className="px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 whitespace-nowrap"
                    >
                      Auto
                    </button>
                  </div>
                </Field>

                <Field label="Short Description" hint="Max 500 characters, shown in product cards">
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={2}
                    maxLength={500}
                    className={inputCls}
                    placeholder="Brief product summary..."
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{shortDescription.length}/500</p>
                </Field>
              </div>

              <div className="space-y-4">
                <Field label="Category">
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Brand">
                  <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
                    <option value="">No brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price (ZAR)" required>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" className={inputCls} placeholder="0.00" />
                  </Field>
                  <Field label="Compare At">
                    <input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} min="0" step="0.01" className={inputCls} placeholder="0.00" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="SKU">
                    <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls} placeholder="SKU-001" />
                  </Field>
                  <Field label="Stock">
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" className={inputCls} />
                  </Field>
                </div>

                <Field label="Weight (grams)">
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min="0" className={inputCls} placeholder="0" />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Deal Badge">
                    <input value={dealBadge} onChange={(e) => setDealBadge(e.target.value)} className={inputCls} placeholder="SALE" />
                  </Field>
                  <Field label="Deal %">
                    <input type="number" value={dealPercent} onChange={(e) => setDealPercent(e.target.value)} min="0" max="100" className={inputCls} placeholder="0" />
                  </Field>
                </div>

                <div className="space-y-2">
                  <Toggle label="Active" checked={isActive} onChange={setIsActive} />
                  <Toggle label="Featured" checked={isFeatured} onChange={setIsFeatured} />
                  <Toggle label="Best Seller" checked={isBestSeller} onChange={setIsBestSeller} />
                </div>
              </div>
            </div>
          )}

          {/* CONTENT TAB */}
          {activeSection === 'content' && (
            <div className="space-y-4">
              <Field label="Description">
                <TiptapEditor value={description} onChange={setDescription} placeholder="Describe the product..." />
              </Field>

              <Field label="Tags">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
                        selectedTagIds.includes(tag.id)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {tags.length === 0 && <p className="text-sm text-slate-400">No tags yet. Create tags in settings.</p>}
                </div>
              </Field>
            </div>
          )}

          {/* MEDIA TAB */}
          {activeSection === 'media' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 font-medium">Product Images ({images.length})</p>
                <button
                  type="button"
                  onClick={() => setImagePickerOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Add Image
                </button>
              </div>

              {images.length === 0 ? (
                <div
                  onClick={() => setImagePickerOpen(true)}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center cursor-pointer hover:border-orange-300 transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Click to select images from the media library</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((img, index) => (
                    <div key={img.mediaId} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                      {/* eslint-disable-next-line @next/next-eslint/no-img-element */}
                      <img src={img.thumbUrl ?? img.publicUrl} alt={img.altText} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      {index === 0 && (
                        <span className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setImagePickerOpen(true)}
                    className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-orange-300 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
              )}

              <MediaPickerModal
                open={imagePickerOpen}
                onClose={() => setImagePickerOpen(false)}
                onSelect={addImageFromMedia}
                accept="image"
              />
            </div>
          )}

          {/* VARIANTS TAB */}
          {activeSection === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 font-medium">Product Variants</p>
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Variant
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-sm">No variants. Add variants for size, colour, etc.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                        <input
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          placeholder="Variant name (e.g. Large Blue)"
                          className={cn(inputCls, 'flex-1')}
                        />
                        <button type="button" onClick={() => removeVariant(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Field label="SKU">
                          <input value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} placeholder="SKU" className={inputCls} />
                        </Field>
                        <Field label="Price">
                          <input type="number" value={variant.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} placeholder="Price" className={inputCls} />
                        </Field>
                        <Field label="Stock">
                          <input type="number" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', e.target.value)} placeholder="0" className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEO TAB */}
          {activeSection === 'seo' && (
            <div className="space-y-4 max-w-2xl">
              <Field label="SEO Title" hint="Max 60 characters">
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} className={inputCls} placeholder={name || 'SEO title'} />
                <p className="text-xs text-right mt-1 text-slate-400">{seoTitle.length}/60</p>
              </Field>
              <Field label="SEO Description" hint="Max 160 characters">
                <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={165} rows={3} className={inputCls} placeholder={shortDescription || 'SEO description'} />
                <p className="text-xs text-right mt-1 text-slate-400">{seoDescription.length}/160</p>
              </Field>
              {(seoTitle || name) && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Search preview</p>
                  <p className="text-blue-600 text-base font-medium truncate">{seoTitle || name}</p>
                  <p className="text-green-700 text-sm">shop.tumirathumela.com/product/{slug}</p>
                  <p className="text-slate-600 text-sm mt-1 line-clamp-2">{seoDescription || shortDescription}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white'

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="text-slate-400 font-normal ml-2 text-xs">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors',
          checked ? 'bg-orange-500' : 'bg-slate-300'
        )}
      >
        <div className={cn(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )} />
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}
