import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";

const CMS_BASE = process.env.CMS_API_URL ?? 'https://cms.tumirathumela.com'
const CMS_API_KEY = process.env.CMS_API_KEY ?? ''

async function updateOrderStatus(orderNumber: string, status: string, paymentId: string) {
  // Find order by orderNumber then PATCH status via CMS admin API
  const findRes = await fetch(`${CMS_BASE}/api/cms/v1/orders/${orderNumber}`, {
    headers: { 'X-CMS-API-Key': CMS_API_KEY },
    cache: 'no-store',
  })
  if (!findRes.ok) return null
  const { data: order } = await findRes.json()

  const patchRes = await fetch(`${CMS_BASE}/api/cms/v1/admin/orders/${order.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-CMS-API-Key': CMS_API_KEY },
    body: JSON.stringify({ status, paymentId }),
  })
  return patchRes.ok ? order : null
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const id = request.headers.get("webhook-id") || "";
    const timestamp = request.headers.get("webhook-timestamp") || "";
    const signature = request.headers.get("webhook-signature") || "";

    if (!signature || !id || !timestamp) {
      return NextResponse.json({ error: "Missing headers" }, { status: 401 });
    }

    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("YOCO_WEBHOOK_SECRET not configured");

    const secretKey = webhookSecret.replace("whsec_", "");
    const secretBytes = Buffer.from(secretKey, "base64");
    const signedContent = `${id}.${timestamp}.${rawBody}`;
    const expectedSignature = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");
    const actualSignature = signature.startsWith("v1,") ? signature.slice(3) : signature;

    if (actualSignature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    if (body.type === "payment.succeeded") {
      const data = body.payload || body.data;
      const orderNumber = data?.metadata?.orderNumber;
      if (!orderNumber) {
        return NextResponse.json({ error: "Missing orderNumber" }, { status: 400 });
      }

      const paymentId = data.id || body.payload?.id || "unknown"
      const order = await updateOrderStatus(orderNumber, 'COMPLETED', paymentId)
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
