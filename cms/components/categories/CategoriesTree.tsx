'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Plus, Edit2, Trash2, ChevronRight, ChevronDown,
} from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  image: { publicUrl: string; thumbUrl: string | null } | null
  _count: { products: number }
}

interface Props { categories: Category[] }

export function CategoriesTree({ categories: initial }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState(initial)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState<{ parentId: string | null } | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', sortOrder: '0', isActive: true })
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const roots = categories.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder)

  const handleDragEnd = async (event: DragEndEvent, parentId: string | null) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const list = parentId ? getChildren(parentId) : roots
    const oldIndex = list.findIndex((c) => c.id === active.id)
    const newIndex = list.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(list, oldIndex, newIndex)

    setCategories((prev) => {
      const others = prev.filter((c) => c.parentId !== parentId && (!parentId ? c.parentId !== null : true))
      return [...others, ...reordered.map((c, i) => ({ ...c, sortOrder: i }))]
    })

    // Persist order
    try {
      await Promise.all(
        reordered.map((c, i) =>
          fetch(`/api/cms/v1/admin/categories/${c.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: i }),
          })
        )
      )
    } catch {
      toast.error('Failed to save order')
    }
  }

  const startEdit = (cat: Category) => {
    setEditing(cat.id)
    setCreating(null)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? '', sortOrder: String(cat.sortOrder), isActive: cat.isActive })
  }

  const startCreate = (parentId: string | null) => {
    setCreating({ parentId })
    setEditing(null)
    setForm({ name: '', slug: '', description: '', sortOrder: '0', isActive: true })
  }

  const saveCategory = async () => {
    if (!form.name) { toast.error('Name required'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || undefined,
        sortOrder: parseInt(form.sortOrder) || 0,
        isActive: form.isActive,
        ...(creating ? { parentId: creating.parentId ?? undefined } : {}),
      }
      const url = editing
        ? `/api/cms/v1/admin/categories/${editing}`
        : '/api/cms/v1/admin/categories'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(editing ? 'Category updated' : 'Category created')
      setEditing(null)
      setCreating(null)
      router.refresh()
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string, name: string, productCount: number) => {
    if (productCount > 0) {
      toast.error(`Cannot delete: ${productCount} products in this category`)
      return
    }
    if (!confirm(`Delete "${name}"?`)) return
    try {
      const res = await fetch(`/api/cms/v1/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? 'Delete failed')
      }
      toast.success('Category deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const CategoryRow = ({ cat, depth = 0 }: { cat: Category; depth?: number }) => {
    const children = getChildren(cat.id)
    const isExpanded = expanded.has(cat.id)
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })

    return (
      <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 group',
            depth > 0 && 'ml-6'
          )}
        >
          <button {...attributes} {...listeners} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </button>

          {children.length > 0 ? (
            <button
              onClick={() => setExpanded((prev) => {
                const next = new Set(prev)
                if (next.has(cat.id)) next.delete(cat.id)
                else next.add(cat.id)
                return next
              })}
              className="text-slate-400 hover:text-slate-600"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {cat.image ? (
            // eslint-disable-next-line @next/next-eslint/no-img-element
            <img src={cat.image.thumbUrl ?? cat.image.publicUrl} alt="" className="w-7 h-7 rounded object-cover bg-slate-100" />
          ) : (
            <div className="w-7 h-7 rounded bg-slate-100" />
          )}

          <span className="flex-1 text-sm font-medium text-slate-700">{cat.name}</span>
          <span className="text-xs text-slate-400">/{cat.slug}</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded-full', cat.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
            {cat.isActive ? 'Active' : 'Hidden'}
          </span>
          <span className="text-xs text-slate-400">{cat._count.products} products</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => startCreate(cat.id)}
              className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="Add subcategory"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => startEdit(cat)}
              className="p-1 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteCategory(cat.id, cat.name, cat._count.products)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline edit form */}
        {editing === cat.id && <CategoryForm onSave={saveCategory} onCancel={() => setEditing(null)} form={form} setForm={setForm} saving={saving} title="Edit category" />}

        {/* Inline create form for subcategory */}
        {creating?.parentId === cat.id && (
          <CategoryForm onSave={saveCategory} onCancel={() => setCreating(null)} form={form} setForm={setForm} saving={saving} title="New subcategory" depth={1} />
        )}

        {/* Children */}
        {isExpanded && children.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, cat.id)}>
            <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {children.map((child) => (
                <CategoryRow key={child.id} cat={child} depth={depth + 1} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => startCreate(null)}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {creating?.parentId === null && (
        <CategoryForm onSave={saveCategory} onCancel={() => setCreating(null)} form={form} setForm={setForm} saving={saving} title="New category" />
      )}

      {roots.length === 0 && !creating && (
        <div className="text-center py-12 text-slate-400 text-sm">No categories yet.</div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, null)}>
        <SortableContext items={roots.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {roots.map((cat) => (
            <CategoryRow key={cat.id} cat={cat} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

function CategoryForm({
  onSave, onCancel, form, setForm, saving, title, depth = 0,
}: {
  onSave: () => void
  onCancel: () => void
  form: { name: string; slug: string; description: string; sortOrder: string; isActive: boolean }
  setForm: (f: typeof form) => void
  saving: boolean
  title: string
  depth?: number
}) {
  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20'

  return (
    <div className={cn('bg-orange-50/60 border border-orange-200 rounded-xl p-4 mb-3', depth > 0 && 'ml-6')}>
      <p className="text-sm font-semibold text-slate-700 mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
            className={inputCls}
            placeholder="Category name"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={inputCls}
            placeholder="category-slug"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-slate-600 block mb-1">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={onSave} disabled={saving} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-600 ml-auto cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-orange-500" />
          Active
        </label>
      </div>
    </div>
  )
}
