'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, RotateCcw, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Revision {
  id: string
  createdBy: string
  createdAt: string
  snapshot: Record<string, unknown>
}

export function RevisionTimeline({
  productId,
  revisions,
}: {
  productId: string
  revisions: Revision[]
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)

  const handleRestore = async (revisionId: string) => {
    if (!confirm('Restore this revision? Current changes will be saved as a new revision.')) return
    setRestoring(revisionId)
    try {
      const res = await fetch(
        `/api/cms/v1/admin/products/${productId}/revisions/${revisionId}/restore`,
        { method: 'POST' }
      )
      if (!res.ok) throw new Error('Restore failed')
      toast.success('Revision restored')
      router.push(`/products/${productId}`)
      router.refresh()
    } catch {
      toast.error('Restore failed')
    } finally {
      setRestoring(null)
    }
  }

  if (revisions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No revisions yet. Revisions are created when you save a published product.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
      {revisions.map((revision, index) => {
        const snapshot = revision.snapshot as Record<string, unknown>
        return (
          <div key={revision.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {index === 0 ? 'Latest revision' : `Revision ${revisions.length - index}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(revision.createdAt).toLocaleString()} · by {revision.createdBy.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpanded(expanded === revision.id ? null : revision.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <ChevronDown className={cn('w-4 h-4 transition-transform', expanded === revision.id && 'rotate-180')} />
                </button>
                <button
                  onClick={() => handleRestore(revision.id)}
                  disabled={restoring === revision.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  {restoring === revision.id ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            </div>

            {expanded === revision.id && (
              <div className="mt-4 bg-slate-50 rounded-lg p-4 text-xs font-mono text-slate-600 overflow-x-auto">
                <div className="space-y-1">
                  <p><span className="text-slate-400">name:</span> {String(snapshot.name)}</p>
                  <p><span className="text-slate-400">price:</span> R{Number(snapshot.price).toFixed(2)}</p>
                  <p><span className="text-slate-400">status:</span> {String(snapshot.status)}</p>
                  <p><span className="text-slate-400">stock:</span> {String(snapshot.stock)}</p>
                  {Boolean(snapshot.sku) && <p><span className="text-slate-400">sku:</span> {String(snapshot.sku)}</p>}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
