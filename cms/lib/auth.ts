import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { ApiError } from './api-response'

export interface CmsActor {
  userId: string
  role: string
  email: string
}

export async function requireCmsUser(): Promise<CmsActor> {
  const { userId } = await auth()
  if (!userId) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication required')
  // Read live from Clerk rather than the session token's sessionClaims —
  // publicMetadata only appears there if the Clerk Dashboard's session token
  // is explicitly customized to include it, which this instance isn't. A
  // role change via the Backend API would otherwise silently never take
  // effect until the user's session token happened to be reissued with that
  // custom claim configured.
  const user = await currentUser()
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role ?? 'viewer'
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? ''
  return { userId, role, email }
}

export async function requireCmsAdmin(): Promise<CmsActor> {
  const actor = await requireCmsUser()
  if (actor.role !== 'admin' && actor.role !== 'editor') {
    throw new ApiError(403, 'FORBIDDEN', 'Admin or editor role required')
  }
  return actor
}

export async function requireCmsAdminOnly(): Promise<CmsActor> {
  const actor = await requireCmsUser()
  if (actor.role !== 'admin') {
    throw new ApiError(403, 'FORBIDDEN', 'Admin role required')
  }
  return actor
}

export function validateApiKey(req: NextRequest): void {
  const key = req.headers.get('x-cms-api-key')
  if (!key || key !== process.env.CMS_API_KEY) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid or missing API key')
  }
}

// Trusted server-to-server callers (e.g. the shop's Yoco webhook, which has
// no Clerk browser session) authenticate with CMS_ADMIN_KEY instead.
export function isValidAdminApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-cms-api-key')
  return !!key && !!process.env.CMS_ADMIN_KEY && key === process.env.CMS_ADMIN_KEY
}

export async function requireCmsAdminOrApiKey(req: NextRequest): Promise<CmsActor> {
  if (isValidAdminApiKey(req)) return { userId: 'system:cms-admin-key', role: 'admin', email: 'system' }
  return requireCmsAdmin()
}
