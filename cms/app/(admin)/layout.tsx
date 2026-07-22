import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { Toaster } from 'react-hot-toast'
import { requireCmsUser } from '@/lib/auth'
import { ApiError } from '@/lib/api-response'

// Every page under (admin) is gated here, not just at the API layer — the
// Clerk middleware only checks "is signed in", not role, so any self-signed-up
// user could otherwise reach the full CMS dashboard and data.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let role: string
  try {
    ;({ role } = await requireCmsUser())
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/sign-in')
    throw e
  }

  if (role !== 'admin' && role !== 'editor') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account doesn&apos;t have admin or editor access to TumiraCMS. Contact an
            administrator if you believe this is a mistake.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
