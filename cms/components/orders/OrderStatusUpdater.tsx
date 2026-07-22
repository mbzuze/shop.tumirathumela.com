'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'] as const

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/cms/v1/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: notes || undefined }),
      })
      if (!res.ok) throw new Error()
      toast.success('Order updated')
      router.refresh()
    } catch {
      toast.error('Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add a note (optional)..."
        className="flex-1 min-w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      />
      <button
        onClick={handleSave}
        disabled={saving || status === currentStatus}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Update'}
      </button>
    </div>
  )
}
