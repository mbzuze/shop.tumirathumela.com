'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ImageIcon } from 'lucide-react'

interface Media { id: string; publicUrl: string; altText: string | null; thumbUrl: string | null }
interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  website: string | null
  isActive: boolean
  logo: Media | null
}

export function BrandEditor({ brand }: { brand: Brand | null }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: brand?.name ?? '',
    slug: brand?.slug ?? '',
    description: brand?.description ?? '',
    website: brand?.website ?? '',
    isActive: brand?.isActive ?? true,
  })
  const [logoMedia, setLogoMedia] = useState<Media | null>(brand?.logo ?? null)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [slugManual, setSlugManual] = useState(!!brand)

  const setName = (v: string) => {
    setForm((prev) => ({ ...prev, name: v, slug: slugManual ? prev.slug : slugify(v) }))
  }

  const handleSave = async () => {
    setSaving(true)
    const url = brand ? `/api/cms/v1/admin/brands/${brand.id}` : '/api/cms/v1/admin/brands'
    const method = brand ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, logoId: logoMedia?.id ?? null }),
    })
    if (!res.ok) { toast.error('Save failed'); setSaving(false); return }
    toast.success(brand ? 'Brand updated' : 'Brand created')
    router.push('/brands')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{brand ? 'Edit Brand' : 'New Brand'}</h1>
        <button onClick={() => router.push('/brands')} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Brand Name *</label>
          <input value={form.name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Slug</label>
          <input value={form.slug} onChange={(e) => { setSlugManual(true); setForm({ ...form, slug: e.target.value }) }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website</label>
          <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Logo</label>
          <div className="flex items-center gap-3">
            {logoMedia ? (
              <Image src={logoMedia.thumbUrl ?? logoMedia.publicUrl} alt={logoMedia.altText ?? 'Brand logo'} width={80} height={80}
                className="w-20 h-20 object-contain rounded-lg bg-slate-100 border border-slate-200" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-300" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowPicker(true)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">
                {logoMedia ? 'Change Logo' : 'Select Logo'}
              </button>
              {logoMedia && <button onClick={() => setLogoMedia(null)} className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700">Remove</button>}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded accent-orange-500" />
          <span className="text-sm text-slate-700">Active</span>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.push('/brands')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.name || !form.slug}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save Brand'}
        </button>
      </div>

      <MediaPickerModal
        open={showPicker}
        onSelect={(media) => { setLogoMedia({ id: media.id, publicUrl: media.publicUrl, altText: media.altText, thumbUrl: media.thumbUrl }); setShowPicker(false) }}
        onClose={() => setShowPicker(false)}
        accept="image"
      />
    </div>
  )
}
