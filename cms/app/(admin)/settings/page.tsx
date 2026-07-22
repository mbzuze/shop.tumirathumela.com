import { prisma } from '@/lib/prisma'
import { SettingsEditor } from '@/components/settings/SettingsEditor'

export default async function SettingsPage() {
  const settings = await prisma.siteSettings.findMany({ orderBy: { key: 'asc' } })

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Global key-value settings for the storefront.</p>
      </div>
      <SettingsEditor settings={settings.map((s) => ({ key: s.key, value: s.value as string }))} />
    </div>
  )
}
