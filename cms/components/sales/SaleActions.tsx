'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function SaleActions({ saleId }: { saleId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this sale/coupon?')) return
    setDeleting(true)
    const res = await fetch(`/api/cms/v1/admin/sales/${saleId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); setDeleting(false); return }
    toast.success('Sale deleted')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
