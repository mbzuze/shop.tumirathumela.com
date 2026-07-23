'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Layers,
  Image,
  ShoppingCart,
  Star,
  Tag,
  Megaphone,
  LayoutGrid,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Users,
} from 'lucide-react'
import { useState } from 'react'

const navGroups = [
  {
    label: 'Content',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/products', label: 'Products', icon: Package },
      { href: '/categories', label: 'Categories', icon: FolderOpen },
      { href: '/collections', label: 'Collections', icon: Layers },
      { href: '/brands', label: 'Brands', icon: Building2 },
      { href: '/media', label: 'Media Library', icon: Image },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/reviews', label: 'Reviews', icon: Star },
      { href: '/sales', label: 'Sales & Coupons', icon: Tag },
    ],
  },
  {
    label: 'Homepage',
    items: [
      { href: '/hero-banners', label: 'Hero Banners', icon: Megaphone },
      { href: '/homepage-sections', label: 'Homepage Sections', icon: LayoutGrid },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/settings/webhooks', label: 'Webhooks', icon: Zap },
      { href: '/settings/users', label: 'Users & Access', icon: Users },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-none">TumiraCMS</p>
            <p className="text-slate-400 text-xs mt-0.5">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            {!collapsed && (
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-slate-300" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-slate-300" />
        )}
      </button>
    </aside>
  )
}
