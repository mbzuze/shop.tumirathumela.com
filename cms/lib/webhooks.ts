import crypto from 'crypto'
import { prisma } from './prisma'

export type WebhookEvent =
  | 'product.created'
  | 'product.updated'
  | 'product.published'
  | 'product.unpublished'
  | 'product.deleted'
  | 'category.created'
  | 'category.updated'
  | 'category.deleted'
  | 'collection.published'
  | 'collection.unpublished'
  | 'order.created'
  | 'order.updated'
  | 'media.uploaded'
  | 'media.deleted'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
}

function signPayload(payload: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
  attempt = 1
): Promise<void> {
  const body = JSON.stringify(payload)
  const signature = signPayload(body, secret)

  let statusCode: number | null = null
  let responseText: string | null = null
  let success = false

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CMS-Signature': signature,
        'X-CMS-Event': payload.event,
        'User-Agent': 'TumiraCMS-Webhook/1.0',
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })
    statusCode = res.status
    responseText = await res.text().catch(() => null)
    success = res.ok
  } catch (err) {
    responseText = err instanceof Error ? err.message : 'Unknown error'
  }

  await prisma.webhookLog.create({
    data: {
      webhookId,
      event: payload.event,
      payload: payload as object,
      statusCode,
      response: responseText?.slice(0, 1000) ?? null,
      success,
    },
  })

  if (!success && attempt < 3) {
    const delay = Math.pow(2, attempt) * 1000
    setTimeout(() => deliverWebhook(webhookId, url, secret, payload, attempt + 1), delay)
  }
}

export async function fireWebhooks(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: true, events: { has: event } },
  })

  if (webhooks.length === 0) return

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  for (const webhook of webhooks) {
    deliverWebhook(webhook.id, webhook.url, webhook.secret, payload)
  }
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret)
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
