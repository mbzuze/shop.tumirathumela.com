import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { UpdateWebhookSchema } from '@/lib/zod-schemas'
import { fireWebhooks } from '@/lib/webhooks'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()
    const data = UpdateWebhookSchema.parse(body)

    const webhook = await prisma.webhook.update({ where: { id }, data })
    return successResponse({ ...webhook, secret: '••••••••', createdAt: webhook.createdAt.toISOString() })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const webhook = await prisma.webhook.findUnique({ where: { id } })
    if (!webhook) return errorResponse('NOT_FOUND', 'Webhook not found', 404)
    await prisma.webhook.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}

