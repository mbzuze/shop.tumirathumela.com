'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'
import { Plus, Trash2, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const VARIANTS = ['FEATURED_PRODUCTS', 'COLLECTION_GRID', 'BANNER_ROW', 'PROMO_TILES', 'TESTIMONIALS', 'BRANDS', 'TEXT_BANNER']
const LOCALES = ['ZA', 'ZW', 'BOTH']

interface Media { id: string; publicUrl: string; altText: string | null; thumbUrl: string | null }
interface SectionItem {
  id?: string
  title: string | null
  subtitle: string | null
  linkUrl: string | null
  linkText: string | null
  sortOrder: number
  referenceId: string | null
  referenceType: string | null
  media: Media | null
  mediaId?: string | null
}
interface Section {
  id: string
  title: string
  variant: string
  locale: string
  isActive: boolean
  sortOrder: number
  items: SectionItem[]
}

export function HomepageSectionEditor({ section }: { section: Section | null }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: section?.title ?? '',
    variant: section?.variant ?? 'FEATURED_PRODUCTS',
    locale: section?.locale ?? 'BOTH',
    isActive: section?.isActive ?? true,
    sortOrder: section?.sortOrder ?? 0,
  })
  const [items, setItems] = useState<SectionItem[]>(section?.items ?? [])
  const [saving, setSaving] = useState(false)
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)

  const addItem = () => setItems((prev) => [...prev, { title: '', subtitle: null, linkUrl: null, linkText: null, sortOrder: prev.length, referenceId: null, referenceType: null, media: null, mediaId: null }])

  const updateItem = (index: number, data: Partial<SectionItem>) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, ...data } : item))
  }

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index))

  const handleSave = async () => {
    setSaving(true)
    const url = section ? `/api/cms/v1/admin/homepage-sections/${section.id}` : '/api/cms/v1/admin/homepage-sections'
    const method = section ? 'PATCH' : 'POST'
    const body = {
      ...form,
      items: items.map((item, i) => ({
        id: item.id,
        title: item.title || null,
        subtitle: item.subtitle || null,
        linkUrl: item.linkUrl || null,
        linkText: item.linkText || null,
        sortOrder: i,
        referenceId: item.referenceId || null,
        referenceType: item.referenceType || null,
        mediaId: item.media?.id ?? item.mediaId ?? null,
      })),
    }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { toast.error('Save failed'); setSaving(false); return }
    toast.success(section ? 'Section updated' : 'Section created')
    router.push('/homepage-sections')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{section ? 'Edit Section' : 'New Section'}</h1>
        <button onClick={() => router.push('/homepage-sections')} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Section Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Variant</label>
            <select value={form.variant} onChange={(e) => setForm({ ...form, variant: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
              {VARIANTS.map((v) => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Locale</label>
            <select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
              {LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded accent-orange-500" />
          <span className="text-sm text-slate-700">Active</span>
        </label>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-700">Items ({items.length})</p>
          <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-slate-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Item {i + 1}</span>
                <button onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={item.title ?? ''} onChange={(e) => updateItem(i, { title: e.target.value })} placeholder="Title"
                  className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                <input value={item.subtitle ?? ''} onChange={(e) => updateItem(i, { subtitle: e.target.value })} placeholder="Subtitle"
                  className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                <input value={item.linkUrl ?? ''} onChange={(e) => updateItem(i, { linkUrl: e.target.value })} placeholder="Link URL"
                  className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                <input value={item.linkText ?? ''} onChange={(e) => updateItem(i, { linkText: e.target.value })} placeholder="Link Text"
                  className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div className="flex items-center gap-2">
                {item.media ? (
                  <Image src={item.media.thumbUrl ?? item.media.publicUrl} alt={item.media.altText ?? ''} width={48} height={48} className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-300" /></div>
                )}
                <button onClick={() => setPickerIndex(i)} className="px-2 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 transition-colors">
                  {item.media ? 'Change' : 'Select'} image
                </button>
                {item.media && <button onClick={() => updateItem(i, { media: null })} className="text-xs text-red-500">Remove</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.push('/homepage-sections')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.title}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save Section'}
        </button>
      </div>

      <MediaPickerModal
        open={pickerIndex !== null}
        onSelect={(media) => { if (pickerIndex !== null) updateItem(pickerIndex, { media: { id: media.id, publicUrl: media.publicUrl, altText: media.altText, thumbUrl: media.thumbUrl } }); setPickerIndex(null) }}
        onClose={() => setPickerIndex(null)}
        accept="image"
      />
    </div>
  )
}
