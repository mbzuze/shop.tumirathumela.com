'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function BrandActions({ brandId, productCount }: { brandId: string; productCount: number }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (productCount > 0) { toast.error(`Cannot delete — ${productCount} products use this brand`); return }
    if (!confirm('Delete this brand?')) return
    setDeleting(true)
    const res = await fetch(`/api/cms/v1/admin/brands/${brandId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); setDeleting(false); return }
    toast.success('Brand deleted')
    router.refresh()
  }

  return (
    <button onClick={handleDelete} disabled={deleting} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors disabled:opacity-50">
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
