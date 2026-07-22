'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'
import toast from 'react-hot-toast'
import { ImageIcon } from 'lucide-react'

interface Media { id: string; publicUrl: string; altText: string | null; thumbUrl: string | null }
interface Banner {
  id: string
  title: string
  subtitle: string | null
  ctaText: string | null
  ctaUrl: string | null
  overlayOpacity: number
  textColor: string
  isActive: boolean
  sortOrder: number
  startsAt: string | null
  endsAt: string | null
  media: Media | null
}

export function HeroBannerEditor({ banner }: { banner: Banner | null }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: banner?.title ?? '',
    subtitle: banner?.subtitle ?? '',
    ctaText: banner?.ctaText ?? '',
    ctaUrl: banner?.ctaUrl ?? '',
    overlayOpacity: banner?.overlayOpacity ?? 40,
    textColor: banner?.textColor ?? '#ffffff',
    isActive: banner?.isActive ?? true,
    sortOrder: banner?.sortOrder ?? 0,
    startsAt: banner?.startsAt ? banner.startsAt.slice(0, 16) : '',
    endsAt: banner?.endsAt ? banner.endsAt.slice(0, 16) : '',
  })
  const [mediaAsset, setMediaAsset] = useState<Media | null>(banner?.media ?? null)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const url = banner ? `/api/cms/v1/admin/hero-banners/${banner.id}` : '/api/cms/v1/admin/hero-banners'
    const method = banner ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        subtitle: form.subtitle || null,
        ctaText: form.ctaText || null,
        ctaUrl: form.ctaUrl || null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        mediaId: mediaAsset?.id ?? null,
      }),
    })
    if (!res.ok) { toast.error('Save failed'); setSaving(false); return }
    toast.success(banner ? 'Banner updated' : 'Banner created')
    router.push('/hero-banners')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{banner ? 'Edit Banner' : 'New Banner'}</h1>
        <button onClick={() => router.push('/hero-banners')} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Background Image</label>
          <div className="flex items-center gap-3">
            {mediaAsset ? (
              <Image src={mediaAsset.thumbUrl ?? mediaAsset.publicUrl} alt={mediaAsset.altText ?? 'Banner'} width={160} height={90}
                className="w-40 h-24 object-cover rounded-lg bg-slate-100 border border-slate-200" />
            ) : (
              <div className="w-40 h-24 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-300" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowPicker(true)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">
                {mediaAsset ? 'Change Image' : 'Select Image'}
              </button>
              {mediaAsset && <button onClick={() => setMediaAsset(null)} className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700">Remove</button>}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subtitle</label>
          <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">CTA Text</label>
            <input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop Now"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">CTA URL</label>
            <input value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="/collections/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Overlay Opacity</label>
            <input type="range" min="0" max="100" value={form.overlayOpacity} onChange={(e) => setForm({ ...form, overlayOpacity: parseInt(e.target.value) })}
              className="w-full accent-orange-500" />
            <span className="text-xs text-slate-500">{form.overlayOpacity}%</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Text Color</label>
            <input type="color" value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })}
              className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
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

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded accent-orange-500" />
          <span className="text-sm text-slate-700">Active</span>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.push('/hero-banners')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.title}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save Banner'}
        </button>
      </div>

      <MediaPickerModal
        open={showPicker}
        onSelect={(media) => { setMediaAsset({ id: media.id, publicUrl: media.publicUrl, altText: media.altText, thumbUrl: media.thumbUrl }); setShowPicker(false) }}
        onClose={() => setShowPicker(false)}
        accept="image"
      />
    </div>
  )
}
