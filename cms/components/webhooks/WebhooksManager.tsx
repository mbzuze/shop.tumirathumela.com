'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronRight, Zap, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const ALL_EVENTS = [
  'product.created', 'product.updated', 'product.deleted', 'product.published',
  'order.created', 'order.updated', 'order.completed', 'order.cancelled',
  'review.approved', 'review.created',
]

interface WebhookLog { id: string; event: string; statusCode: number | null; success: boolean; createdAt: string }
interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret: string | null
  createdAt: string
  logs: WebhookLog[]
}

function WebhookRow({ webhook, onDelete }: { webhook: Webhook; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    const res = await fetch(`/api/cms/v1/admin/webhooks/${webhook.id}/test`, { method: 'POST' })
    setTesting(false)
    if (res.ok) toast.success('Test delivery sent')
    else toast.error('Test failed')
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => setExpanded(!expanded)} className="p-1 text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1">
          <p className="font-medium text-slate-800 text-sm">{webhook.name}</p>
          <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{webhook.url}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {webhook.events.slice(0, 3).map((e) => <span key={e} className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{e}</span>)}
          {webhook.events.length > 3 && <span className="text-xs text-slate-400">+{webhook.events.length - 3}</span>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${webhook.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {webhook.isActive ? 'Active' : 'Inactive'}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={handleTest} disabled={testing || !webhook.isActive} title="Send test event"
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-slate-400 hover:text-blue-500 disabled:opacity-40">
            <Zap className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(webhook.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Events</p>
            <div className="flex flex-wrap gap-1.5">
              {webhook.events.map((e) => <span key={e} className="text-xs px-2 py-1 bg-orange-50 border border-orange-100 rounded text-orange-700 font-mono">{e}</span>)}
            </div>
          </div>
          {webhook.logs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Deliveries</p>
              <div className="space-y-1.5">
                {webhook.logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-xs">
                    {log.success ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                    <span className="font-mono text-slate-600">{log.event}</span>
                    {log.statusCode && <span className={cn('px-1.5 py-0.5 rounded font-mono', log.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>{log.statusCode}</span>}
                    <span className="text-slate-400 ml-auto">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NewWebhookForm({ onCreated }: { onCreated: (w: Webhook) => void }) {
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[], isActive: true })
  const [saving, setSaving] = useState(false)

  const toggleEvent = (e: string) => setForm((prev) => ({ ...prev, events: prev.events.includes(e) ? prev.events.filter((x) => x !== e) : [...prev.events, e] }))

  const handleSave = async () => {
    if (!form.name || !form.url || form.events.length === 0) { toast.error('Name, URL, and at least one event required'); return }
    setSaving(true)
    const res = await fetch('/api/cms/v1/admin/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) { toast.error('Create failed'); return }
    const data = await res.json()
    onCreated(data.data)
    setForm({ name: '', url: '', events: [], isActive: true })
    toast.success('Webhook created')
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <p className="font-semibold text-slate-800 text-sm">New Webhook</p>
      <div className="grid grid-cols-2 gap-3">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name"
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
        <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..."
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">Events</p>
        <div className="flex flex-wrap gap-2">
          {ALL_EVENTS.map((e) => (
            <button key={e} onClick={() => toggleEvent(e)}
              className={cn('text-xs px-2.5 py-1 rounded-lg border transition-colors font-mono', form.events.includes(e) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300')}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded accent-orange-500" />
        <span className="text-sm text-slate-700">Active</span>
      </label>
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
        <Plus className="w-4 h-4" /> {saving ? 'Creating...' : 'Create Webhook'}
      </button>
    </div>
  )
}

export function WebhooksManager({ webhooks: initial }: { webhooks: Webhook[] }) {
  const router = useRouter()
  const [webhooks, setWebhooks] = useState(initial)
  const [showNew, setShowNew] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook?')) return
    const res = await fetch(`/api/cms/v1/admin/webhooks/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); return }
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
    toast.success('Webhook deleted')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> {showNew ? 'Cancel' : 'Add Webhook'}
        </button>
      </div>
      {showNew && <NewWebhookForm onCreated={(w) => { setWebhooks((prev) => [w, ...prev]); setShowNew(false) }} />}
      {webhooks.length === 0 && !showNew ? (
        <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400 text-sm">No webhooks configured.</div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((w) => <WebhookRow key={w.id} webhook={w} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}
