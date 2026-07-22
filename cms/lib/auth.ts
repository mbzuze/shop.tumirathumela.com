import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { ApiError } from './api-response'

export async function requireCmsUser(): Promise<{ userId: string; role: string }> {
  const { userId, sessionClaims } = await auth()
  if (!userId) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication required')
  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role ?? 'viewer'
  return { userId, role }
}

export async function requireCmsAdmin(): Promise<{ userId: string; role: string }> {
  const { userId, role } = await requireCmsUser()
  if (role !== 'admin' && role !== 'editor') {
    throw new ApiError(403, 'FORBIDDEN', 'Admin or editor role required')
  }
  return { userId, role }
}

export async function requireCmsAdminOnly(): Promise<{ userId: string; role: string }> {
  const { userId, role } = await requireCmsUser()
  if (role !== 'admin') {
    throw new ApiError(403, 'FORBIDDEN', 'Admin role required')
  }
  return { userId, role }
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

export async function requireCmsAdminOrApiKey(req: NextRequest): Promise<{ userId: string; role: string }> {
  if (isValidAdminApiKey(req)) return { userId: 'system:cms-admin-key', role: 'admin' }
  return requireCmsAdmin()
}
