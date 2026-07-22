import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-response'
import { createId } from '@paralleldrive/cuid2'
import crypto from 'crypto'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_: NextRequest, { params }: Ctx) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const hook = await prisma.webhook.findUnique({ where: { id } })
    if (!hook) throw new ApiError(404, 'NOT_FOUND', 'Webhook not found')

    const payload = JSON.stringify({ event: 'webhook.test', data: { timestamp: new Date().toISOString() } })
    const sig = hook.secret ? `sha256=${crypto.createHmac('sha256', hook.secret).update(payload).digest('hex')}` : undefined

    let statusCode: number | null = null
    let success = false
    let response: string | null = null

    try {
      const res = await fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CMS-Event': 'webhook.test',
          ...(sig ? { 'X-CMS-Signature': sig } : {}),
        },
        body: payload,
        signal: AbortSignal.timeout(10000),
      })
      statusCode = res.status
      response = await res.text().then((t) => t.slice(0, 500))
      success = res.ok
    } catch (err) {
      response = err instanceof Error ? err.message : 'Unknown error'
    }

    await prisma.webhookLog.create({
      data: {
        id: createId(),
        webhookId: id,
        event: 'webhook.test',
        payload,
        statusCode,
        response,
        success,
      },
    })

    return NextResponse.json(successResponse({ success, statusCode, response }))
  } catch (e) { return handleApiError(e) }
}
