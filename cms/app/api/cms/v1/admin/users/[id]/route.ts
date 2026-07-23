import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireCmsAdminOnly } from '@/lib/auth'
import { handleApiError, successResponse, errorResponse } from '@/lib/api-response'
import { UpdateUserRoleSchema } from '@/lib/zod-schemas'
import { logAudit } from '@/lib/audit'

function roleOf(user: { publicMetadata: unknown }): string {
  return (user.publicMetadata as { role?: string } | null)?.role ?? 'viewer'
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = await requireCmsAdminOnly()
    const { id } = await params
    const body = await req.json()
    const { role } = UpdateUserRoleSchema.parse(body)

    const client = await clerkClient()
    const target = await client.users.getUser(id)
    const currentRole = roleOf(target)
    const targetEmail = target.primaryEmailAddress?.emailAddress ?? target.emailAddresses[0]?.emailAddress ?? id

    if (id === actor.userId && role !== 'admin') {
      return errorResponse('SELF_DEMOTE_FORBIDDEN', "You can't change your own role away from admin — ask another admin to do it.", 400)
    }

    if (currentRole === 'admin' && role !== 'admin') {
      const { data } = await client.users.getUserList({ limit: 200 })
      const adminCount = data.filter((u) => roleOf(u) === 'admin').length
      if (adminCount <= 1) {
        return errorResponse('LAST_ADMIN', 'This is the last admin — promote someone else first.', 400)
      }
    }

    const updated = await client.users.updateUserMetadata(id, {
      publicMetadata: { ...target.publicMetadata, role },
    })

    await logAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: 'user.role_updated',
      targetId: id,
      targetEmail,
      summary: `Set role to "${role}" for ${targetEmail} (was "${currentRole}")`,
    })

    return NextResponse.json(successResponse({ id: updated.id, role }))
  } catch (e) {
    return handleApiError(e)
  }
}
