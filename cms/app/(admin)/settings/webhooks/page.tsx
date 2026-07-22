import { prisma } from '@/lib/prisma'
import { WebhooksManager } from '@/components/webhooks/WebhooksManager'

export default async function WebhooksPage() {
  const webhooks = await prisma.webhook.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      logs: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  })

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Webhooks</h1>
        <p className="text-sm text-slate-500 mt-1">Notify external services when CMS events occur. Signed with HMAC-SHA256.</p>
      </div>
      <WebhooksManager
        webhooks={webhooks.map((w) => ({
          ...w,
          createdAt: w.createdAt.toISOString(),
          logs: w.logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
        }))}
      />
    </div>
  )
}
