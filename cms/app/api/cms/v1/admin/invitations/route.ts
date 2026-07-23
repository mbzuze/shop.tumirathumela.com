import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireCmsAdminOnly } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'
import { CreateInvitationSchema } from '@/lib/zod-schemas'
import { logAudit } from '@/lib/audit'

export async function GET(_req: NextRequest) {
  try {
    await requireCmsAdminOnly()
    const client = await clerkClient()
    const { data } = await client.invitations.getInvitationList({ status: 'pending' })
    const invitations = data.map((i) => ({
      id: i.id,
      emailAddress: i.emailAddress,
      role: (i.publicMetadata as { role?: string } | null)?.role ?? 'viewer',
      status: i.status,
      createdAt: new Date(i.createdAt).toISOString(),
    }))
    return NextResponse.json(successResponse(invitations))
  } catch (e) {
    return handleApiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireCmsAdminOnly()
    const body = await req.json()
    const { emailAddress, role } = CreateInvitationSchema.parse(body)

    const client = await clerkClient()
    const invitation = await client.invitations.createInvitation({
      emailAddress,
      publicMetadata: { role },
      notify: true,
    })

    await logAudit({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: 'user.invited',
      targetEmail: emailAddress,
      summary: `Invited ${emailAddress} as "${role}"`,
    })

    return NextResponse.json(
      successResponse({ id: invitation.id, emailAddress: invitation.emailAddress, status: invitation.status }),
      { status: 201 }
    )
  } catch (e) {
    return handleApiError(e)
  }
}
