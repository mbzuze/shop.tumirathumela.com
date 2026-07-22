'use client'

import { UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = [{ label: 'Dashboard', href: '/dashboard' }]

  const labelMap: Record<string, string> = {
    products: 'Products',
    categories: 'Categories',
    collections: 'Collections',
    brands: 'Brands',
    media: 'Media Library',
    orders: 'Orders',
    reviews: 'Reviews',
    sales: 'Sales',
    'hero-banners': 'Hero Banners',
    'homepage-sections': 'Homepage Sections',
    settings: 'Settings',
    webhooks: 'Webhooks',
    new: 'New',
    revisions: 'Revisions',
    dashboard: 'Dashboard',
  }

  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    const label = labelMap[segment] ?? (segment.length === 25 ? 'Edit' : segment)
    crumbs.push({ label, href: path })
  }

  return crumbs.filter((c, i) => i === 0 || c.href !== '/dashboard')
}

export function Topbar() {
  const pathname = usePathname()
  const crumbs = buildBreadcrumbs(pathname)

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <nav className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
            {i === crumbs.length - 1 ? (
              <span className="text-slate-800 font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-slate-500 hover:text-slate-700 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <a
          href={process.env.NEXT_PUBLIC_SHOP_URL ?? 'https://shop.tumirathumela.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-orange-500 transition-colors"
        >
          View Shop ↗
        </a>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  )
}
