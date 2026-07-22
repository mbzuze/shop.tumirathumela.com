'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Banner {
  id: string
  title: string
  subtitle: string | null
  sortOrder: number
  isActive: boolean
  media: { publicUrl: string; thumbUrl: string | null; altText: string | null } | null
}

function SortableBanner({ banner, onDelete }: { banner: Banner; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-slate-200 flex items-center gap-3 p-3">
      <button {...attributes} {...listeners} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </button>
      {banner.media ? (
        <Image src={banner.media.thumbUrl ?? banner.media.publicUrl} alt={banner.media.altText ?? banner.title} width={80} height={48}
          className="w-20 h-12 object-cover rounded-lg flex-shrink-0" />
      ) : (
        <div className="w-20 h-12 rounded-lg bg-slate-100 flex-shrink-0" />
      )}
      <div className="flex-1">
        <p className="font-medium text-slate-800 text-sm">{banner.title}</p>
        {banner.subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{banner.subtitle}</p>}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
        {banner.isActive ? 'Active' : 'Inactive'}
      </span>
      <div className="flex items-center gap-1.5">
        <Link href={`/hero-banners/${banner.id}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
          <Pencil className="w-4 h-4" />
        </Link>
        <button onClick={() => onDelete(banner.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function HeroBannerList({ banners: initial }: { banners: Banner[] }) {
  const router = useRouter()
  const [banners, setBanners] = useState(initial)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = banners.findIndex((b) => b.id === active.id)
    const newIndex = banners.findIndex((b) => b.id === over.id)
    const reordered = arrayMove(banners, oldIndex, newIndex)
    setBanners(reordered)
    await fetch('/api/cms/v1/admin/hero-banners/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((b) => b.id) }),
    })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    const res = await fetch(`/api/cms/v1/admin/hero-banners/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); return }
    setBanners((prev) => prev.filter((b) => b.id !== id))
    toast.success('Banner deleted')
  }

  if (banners.length === 0) {
    return <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400 text-sm">No banners yet.</div>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {banners.map((banner) => <SortableBanner key={banner.id} banner={banner} onDelete={handleDelete} />)}
        </div>
      </SortableContext>
    </DndContext>
  )
}
