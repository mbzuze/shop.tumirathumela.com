'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { UserPlus, X, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = ['admin', 'editor', 'viewer'] as const
type Role = (typeof ROLES)[number]

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-orange-100 text-orange-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-slate-100 text-slate-600',
}

interface CmsUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string
  role: string
  createdAt: number
  lastSignInAt: number | null
}

interface Invitation {
  id: string
  emailAddress: string
  role: string
  createdAt: number
}

interface AuditEntry {
  id: string
  actorEmail: string
  action: string
  summary: string
  createdAt: string
}

function UserRow({ user, isSelf, onRoleChange }: { user: CmsUser; isSelf: boolean; onRoleChange: (id: string, role: Role) => Promise<void> }) {
  const [role, setRole] = useState<Role>((user.role as Role) ?? 'viewer')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onRoleChange(user.id, role)
    setSaving(false)
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '(no name)'

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={user.imageUrl} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {name} {isSelf && <span className="text-xs text-slate-400 font-normal">(you)</span>}
        </p>
        <p className="text-xs text-slate-400 truncate">{user.email}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[(user.role as Role) ?? 'viewer']}`}>
        {user.role}
      </span>
      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          onClick={handleSave}
          disabled={saving || role === user.role}
          className="h-8 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving…' : 'Set'}
        </button>
      </div>
    </div>
  )
}

function InviteForm({ onInvited }: { onInvited: (inv: Invitation) => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [saving, setSaving] = useState(false)

  const handleInvite = async () => {
    if (!email.trim()) { toast.error('Email is required'); return }
    setSaving(true)
    const res = await fetch('/api/cms/v1/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAddress: email.trim(), role }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body?.error?.message ?? 'Invite failed')
      return
    }
    const body = await res.json()
    onInvited({ id: body.data.id, emailAddress: email.trim(), role, createdAt: Date.now() })
    setEmail('')
    toast.success(`Invited ${email}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 border-t border-slate-100">
      <div className="flex-1 min-w-48">
        <label className="block text-xs font-medium text-slate-500 mb-1">Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@example.com"
          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <button
        onClick={handleInvite}
        disabled={saving}
        className="h-9 flex items-center gap-1.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
      >
        <UserPlus className="w-4 h-4" /> {saving ? 'Sending…' : 'Send invite'}
      </button>
    </div>
  )
}

export function UsersManager({
  users: initialUsers,
  invitations: initialInvitations,
  auditLog,
}: {
  users: CmsUser[]
  invitations: Invitation[]
  auditLog: AuditEntry[]
}) {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const [users, setUsers] = useState(initialUsers)
  const [invitations, setInvitations] = useState(initialInvitations)

  const handleRoleChange = async (id: string, role: Role) => {
    const res = await fetch(`/api/cms/v1/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body?.error?.message ?? 'Update failed')
      return
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    toast.success('Role updated')
    router.refresh()
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this invitation?')) return
    const res = await fetch(`/api/cms/v1/admin/invitations/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Revoke failed'); return }
    setInvitations((prev) => prev.filter((i) => i.id !== id))
    toast.success('Invitation revoked')
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="font-semibold text-slate-800 text-sm">Users ({users.length})</p>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <UserRow key={u.id} user={u} isSelf={u.id === currentUser?.id} onRoleChange={handleRoleChange} />
          ))}
        </div>
        <InviteForm onInvited={(inv) => setInvitations((prev) => [inv, ...prev])} />
      </div>

      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-sm">Pending invitations ({invitations.length})</p>
          </div>
          <div className="divide-y divide-slate-100">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{inv.emailAddress}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[(inv.role as Role) ?? 'viewer']}`}>
                  {inv.role}
                </span>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Revoke invitation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {auditLog.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <p className="font-semibold text-slate-800 text-sm">Recent activity</p>
          </div>
          <div className="divide-y divide-slate-100">
            {auditLog.map((a) => (
              <div key={a.id} className="px-4 py-2.5 text-xs text-slate-600">
                <span className="text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
                {' — '}
                <span className="font-medium text-slate-700">{a.actorEmail}</span>{' '}
                {a.summary}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
