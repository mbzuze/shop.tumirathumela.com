import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { requireCmsAdminOnly } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-response'

function roleOf(user: { publicMetadata: unknown }): string {
  return (user.publicMetadata as { role?: string } | null)?.role ?? 'viewer'
}

export async function GET(_req: NextRequest) {
  try {
    await requireCmsAdminOnly()
    const client = await clerkClient()
    const { data } = await client.users.getUserList({ limit: 200, orderBy: '-created_at' })

    const users = data.map((u) => ({
      id: u.id,
      email: u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? null,
      firstName: u.firstName,
      lastName: u.lastName,
      imageUrl: u.imageUrl,
      role: roleOf(u),
      createdAt: new Date(u.createdAt).toISOString(),
      lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : null,
    }))

    return NextResponse.json(successResponse(users))
  } catch (e) {
    return handleApiError(e)
  }
}
