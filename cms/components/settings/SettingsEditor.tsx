'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Setting { key: string; value: string }

const DEFAULT_KEYS = [
  { key: 'site.name', description: 'Store name displayed on the site' },
  { key: 'site.tagline', description: 'Short tagline below the logo' },
  { key: 'site.email', description: 'Contact email address' },
  { key: 'site.phone', description: 'Contact phone number' },
  { key: 'site.address', description: 'Physical store address' },
  { key: 'shipping.freeThreshold', description: 'Free shipping above this order total (ZAR)' },
  { key: 'shipping.standardRate', description: 'Standard shipping rate (ZAR)' },
  { key: 'social.instagram', description: 'Instagram URL' },
  { key: 'social.facebook', description: 'Facebook URL' },
  { key: 'social.tiktok', description: 'TikTok URL' },
  { key: 'announcement.enabled', description: 'Show announcement bar (true/false)' },
  { key: 'announcement.message', description: 'Announcement bar message' },
]

export function SettingsEditor({ settings: initial }: { settings: Setting[] }) {
  const [settings, setSettings] = useState<Setting[]>(initial)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  const upsert = async (key: string, value: string) => {
    setSaving(key)
    const res = await fetch('/api/cms/v1/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSaving(null)
    if (!res.ok) { toast.error('Save failed'); return }
    toast.success('Saved')
  }

  const addNew = async () => {
    if (!newKey.trim() || !newValue.trim()) { toast.error('Key and value are required'); return }
    await upsert(newKey.trim(), newValue.trim())
    if (!settings.find((s) => s.key === newKey.trim())) {
      setSettings((prev) => [...prev, { key: newKey.trim(), value: newValue.trim() }])
    } else {
      setSettings((prev) => prev.map((s) => s.key === newKey.trim() ? { ...s, value: newValue.trim() } : s))
    }
    setNewKey('')
    setNewValue('')
  }

  const suggestionKeys = DEFAULT_KEYS.filter((d) => !settings.find((s) => s.key === d.key))

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-50">
        {settings.map((setting) => (
          <SettingRow key={setting.key} setting={setting} saving={saving === setting.key} onSave={upsert}
            onChange={(value) => setSettings((prev) => prev.map((s) => s.key === setting.key ? { ...s, value } : s))} />
        ))}
        {settings.length === 0 && (
          <div className="py-8 text-center text-slate-400 text-sm">No settings yet. Add one below or use a suggested key.</div>
        )}
      </div>

      {suggestionKeys.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Suggested Keys</p>
          <div className="flex flex-wrap gap-2">
            {suggestionKeys.map((d) => (
              <button key={d.key} onClick={() => setNewKey(d.key)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono text-slate-600 transition-colors">
                {d.key}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-600 mb-3">Add New Setting</p>
        <div className="flex items-center gap-2">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="setting.key"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="value"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          <button onClick={addNew} className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingRow({ setting, saving, onSave, onChange }: { setting: Setting; saving: boolean; onSave: (key: string, value: string) => Promise<void>; onChange: (value: string) => void }) {
  const [localValue, setLocalValue] = useState(setting.value)
  const dirty = localValue !== setting.value

  const handleSave = async () => {
    await onSave(setting.key, localValue)
    onChange(localValue)
  }

  const description = DEFAULT_KEYS.find((d) => d.key === setting.key)?.description ?? null

  return (
    <div className="flex items-center gap-3 p-3">
      <div className="w-64 flex-shrink-0">
        <p className="text-sm font-mono text-slate-700">{setting.key}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <input value={localValue} onChange={(e) => setLocalValue(e.target.value)}
        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
      <button onClick={handleSave} disabled={saving || !dirty}
        className="px-3 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-default bg-slate-800 text-white hover:bg-slate-700">
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
