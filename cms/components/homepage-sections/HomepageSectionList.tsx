'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface SectionItem {
  id: string
  title: string | null
  subtitle: string | null
  linkUrl: string | null
  sortOrder: number
  media: { publicUrl: string; thumbUrl: string | null; altText: string | null } | null
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

function SortableSection({ section, onDelete }: { section: Section; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const [expanded, setExpanded] = useState(false)

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button {...attributes} {...listeners} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </button>
        <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1">
          <p className="font-medium text-slate-800 text-sm">{section.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded font-mono text-slate-500">{section.variant}</span>
            <span className="text-xs text-slate-400">{section.locale}</span>
            <span className="text-xs text-slate-400">{section.items.length} items</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${section.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {section.isActive ? 'Active' : 'Inactive'}
        </span>
        <div className="flex items-center gap-1.5">
          <Link href={`/homepage-sections/${section.id}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <Pencil className="w-4 h-4" />
          </Link>
          <button onClick={() => onDelete(section.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {expanded && section.items.length > 0 && (
        <div className="border-t border-slate-100 px-10 pb-3 pt-2 space-y-1.5">
          {section.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
              <span>{item.title ?? 'Untitled item'}</span>
              {item.linkUrl && <span className="text-slate-400 truncate">{item.linkUrl}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function HomepageSectionList({ sections: initial }: { sections: Section[] }) {
  const router = useRouter()
  const [sections, setSections] = useState(initial)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(sections, oldIndex, newIndex)
    setSections(reordered)
    await fetch('/api/cms/v1/admin/homepage-sections/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((s) => s.id) }),
    })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this section?')) return
    const res = await fetch(`/api/cms/v1/admin/homepage-sections/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); return }
    setSections((prev) => prev.filter((s) => s.id !== id))
    toast.success('Section deleted')
  }

  if (sections.length === 0) return <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400 text-sm">No sections yet.</div>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sections.map((s) => <SortableSection key={s.id} section={s} onDelete={handleDelete} />)}
        </div>
      </SortableContext>
    </DndContext>
  )
}
