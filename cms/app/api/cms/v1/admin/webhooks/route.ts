import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'
import { CreateWebhookSchema } from '@/lib/zod-schemas'

export async function GET(_req: NextRequest) {
  try {
    await requireCmsAdmin()
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        logs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    return successResponse(webhooks.map((w) => ({
      ...w,
      secret: '••••••••',
      createdAt: w.createdAt.toISOString(),
      logs: w.logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    })))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const body = await req.json()
    const data = CreateWebhookSchema.parse(body)

    const webhook = await prisma.webhook.create({ data })
    return successResponse({ ...webhook, secret: '••••••••', createdAt: webhook.createdAt.toISOString() }, undefined, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
