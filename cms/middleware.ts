import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher([
  '/(admin)(.*)',
  '/api/cms/v1/admin(.*)',
])

const isPublicApiRoute = createRouteMatcher([
  '/api/cms/v1/products(.*)',
  '/api/cms/v1/categories(.*)',
  '/api/cms/v1/collections(.*)',
  '/api/cms/v1/search(.*)',
  '/api/cms/v1/settings(.*)',
  '/api/cms/v1/hero-banners(.*)',
  '/api/cms/v1/homepage(.*)',
  '/api/cms/v1/brands(.*)',
  '/api/cms/v1/sales(.*)',
  '/api/cms/v1/orders(.*)',
  '/api/cms/v1/addresses(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isCmsApiRoute = createRouteMatcher(['/api/cms/v1(.*)'])

// Trusted server-to-server callers (e.g. the shop's Yoco webhook) have no
// Clerk browser session — they authenticate with CMS_ADMIN_KEY instead. Only
// applies to the admin *API*, never the /(admin) browser UI.
function hasValidAdminApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-cms-api-key')
  return !!key && !!process.env.CMS_ADMIN_KEY && key === process.env.CMS_ADMIN_KEY
}

const ALLOWED_ORIGINS = new Set([
  'https://admin.tumirathumela.com',
  'https://shop.tumirathumela.com',
])

function applyCorsHeaders(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get('origin')
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Vary', 'Origin')
  }
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-CMS-API-Key, Authorization')
  return res
}

export default clerkMiddleware(async (auth, req) => {
  if (isCmsApiRoute(req) && req.method === 'OPTIONS') {
    return applyCorsHeaders(req, new NextResponse(null, { status: 204 }))
  }

  if (isPublicApiRoute(req)) {
    return applyCorsHeaders(req, NextResponse.next())
  }

  if (isAdminRoute(req)) {
    const bypassForTrustedServer = isCmsApiRoute(req) && hasValidAdminApiKey(req)
    if (!bypassForTrustedServer) {
      await auth.protect()
    }
  }

  const res = NextResponse.next()
  return isCmsApiRoute(req) ? applyCorsHeaders(req, res) : res
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
