import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireCmsAdminOnly } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { logAudit } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const actor = await requireCmsAdminOnly()
    const { id } = await params
    const client = await clerkClient()
    const revoked = await client.invitations.revokeInvitation(id)

    await logAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: 'user.invitation_revoked',
      targetEmail: revoked.emailAddress,
      summary: `Revoked invitation for ${revoked.emailAddress}`,
    })

    return NextResponse.json(successResponse({ id: revoked.id }))
  } catch (e) {
    return handleApiError(e)
  }
}
