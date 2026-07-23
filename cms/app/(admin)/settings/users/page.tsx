import { clerkClient } from '@clerk/nextjs/server'
import { requireCmsAdminOnly } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UsersManager } from '@/components/users/UsersManager'

function roleOf(user: { publicMetadata: unknown }): string {
  return (user.publicMetadata as { role?: string } | null)?.role ?? 'viewer'
}

export default async function UsersPage() {
  try {
    await requireCmsAdminOnly()
  } catch {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Users &amp; Access</h1>
        <p className="text-sm text-slate-500">
          Only admins can manage users. Ask an existing admin for access.
        </p>
      </div>
    )
  }

  const client = await clerkClient()
  const [{ data: clerkUsers }, { data: invitations }, auditLog] = await Promise.all([
    client.users.getUserList({ limit: 200, orderBy: '-created_at' }),
    client.invitations.getInvitationList({ status: 'pending' }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ])

  const users = clerkUsers.map((u) => ({
    id: u.id,
    email: u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? '(no email)',
    firstName: u.firstName,
    lastName: u.lastName,
    imageUrl: u.imageUrl,
    role: roleOf(u),
    createdAt: u.createdAt,
    lastSignInAt: u.lastSignInAt,
  }))

  const pendingInvitations = invitations.map((i) => ({
    id: i.id,
    emailAddress: i.emailAddress,
    role: (i.publicMetadata as { role?: string } | null)?.role ?? 'viewer',
    createdAt: i.createdAt,
  }))

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users &amp; Access</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage who can sign in to TumiraCMS and what they can do. Shared with the shop&apos;s
          customer accounts — customers just won&apos;t have CMS access unless given a role here.
        </p>
      </div>
      <UsersManager
        users={users}
        invitations={pendingInvitations}
        auditLog={auditLog.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
      />
    </div>
  )
}
