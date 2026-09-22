import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";
import { getOrderByNumber, markOrderPaid, CmsError } from "@/lib/cms-client";

// Standard Webhooks spec tolerance: bounds how long a captured but validly
// signed payload can be replayed against this endpoint.
const MAX_TIMESTAMP_AGE_SECONDS = 5 * 60;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const id = request.headers.get("webhook-id") || "";
    const timestamp = request.headers.get("webhook-timestamp") || "";
    const signature = request.headers.get("webhook-signature") || "";

    if (!signature || !id || !timestamp) {
      return NextResponse.json({ error: "Missing headers" }, { status: 401 });
    }

    const timestampSeconds = Number(timestamp);
    if (
      !Number.isFinite(timestampSeconds) ||
      Math.abs(Date.now() / 1000 - timestampSeconds) > MAX_TIMESTAMP_AGE_SECONDS
    ) {
      return NextResponse.json({ error: "Stale or invalid timestamp" }, { status: 401 });
    }

    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("YOCO_WEBHOOK_SECRET not configured");

    const secretKey = webhookSecret.replace("whsec_", "");
    const secretBytes = Buffer.from(secretKey, "base64");
    const signedContent = `${id}.${timestamp}.${rawBody}`;
    const expectedSignature = crypto.createHmac("sha256", secretBytes).update(signedContent).digest();
    const actualSignatureRaw = signature.startsWith("v1,") ? signature.slice(3) : signature;
    let actualSignature: Buffer;
    try {
      actualSignature = Buffer.from(actualSignatureRaw, "base64");
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Constant-time compare — a timing difference in a naive `!==` string
    // compare on a secret-derived value is itself a side channel.
    if (
      actualSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(actualSignature, expectedSignature)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    if (body.type === "payment.succeeded") {
      const data = body.payload || body.data;
      const orderNumber = data?.metadata?.orderNumber;
      if (!orderNumber) {
        return NextResponse.json({ error: "Missing orderNumber" }, { status: 400 });
      }
      const paymentId = data.id || body.payload?.id || "unknown";
      const paidAmountCents: number | undefined =
        typeof data.amount === "number" ? data.amount : undefined;

      let order;
      try {
        order = await getOrderByNumber(orderNumber);
      } catch (err) {
        if (err instanceof CmsError && err.status === 404) {
          // Genuinely doesn't exist — ack so Yoco stops retrying a payload
          // that will never resolve.
          console.error("[yoco webhook] order not found:", orderNumber);
          return NextResponse.json({ received: true });
        }
        throw err; // CMS unreachable/erroring — 500 so Yoco retries later
      }

      // Idempotent against duplicate or retried deliveries of the same
      // event, and a manually CANCELLED/REFUNDED order must never be flipped
      // back to COMPLETED by a late or replayed webhook.
      if (order.status === "COMPLETED") {
        return NextResponse.json({ received: true });
      }
      if (order.status === "CANCELLED" || order.status === "REFUNDED") {
        console.error(
          "[yoco webhook] payment.succeeded for a",
          order.status,
          "order — not reopening:",
          orderNumber
        );
        return NextResponse.json({ received: true });
      }

      if (paidAmountCents !== undefined && paidAmountCents !== Math.round(order.total * 100)) {
        // Genuine anomaly (bug or tampering) — don't silently mark this
        // COMPLETED. Acknowledge so Yoco stops retrying a payload that will
        // never match, and leave the order for manual review in the CMS.
        console.error(
          "[yoco webhook] amount mismatch for",
          orderNumber,
          "— paid",
          paidAmountCents,
          "expected",
          Math.round(order.total * 100)
        );
        return NextResponse.json({ received: true, warning: "amount mismatch, held for review" });
      }

      await markOrderPaid(order.id, paymentId);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("[yoco webhook]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
