import { NextRequest, NextResponse } from "next/server";

const CMS_BASE = process.env.CMS_API_URL ?? 'https://admin.tumirathumela.com'
const CMS_API_KEY = process.env.CMS_API_KEY ?? ''

export async function POST(request: NextRequest) {
  try {
    const { orderNumber } = await request.json();
    if (!orderNumber) {
      return NextResponse.json({ error: "Order number required" }, { status: 400 });
    }

    // Fetch order from TumiraCMS
    const orderRes = await fetch(`${CMS_BASE}/api/cms/v1/orders/${orderNumber}`, {
      headers: { 'X-CMS-API-Key': CMS_API_KEY },
      cache: 'no-store',
    })

    if (!orderRes.ok) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: order } = await orderRes.json()

    if (order.status === "COMPLETED" || order.status === "PROCESSING") {
      return NextResponse.json({ success: true, status: order.status });
    }

    // Fall back to Yoco API verification if still pending
    if (order.paymentId) {
      const yocoRes = await fetch(`https://payments.yoco.com/api/checkouts/${order.paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}` },
      });

      if (yocoRes.ok) {
        const checkout = await yocoRes.json();
        if (checkout.status === "successful" || checkout.status === "paid") {
          // Update order via CMS admin API
          await fetch(`${CMS_BASE}/api/cms/v1/admin/orders/${order.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-CMS-API-Key': CMS_API_KEY },
            body: JSON.stringify({ status: 'COMPLETED' }),
          })
          return NextResponse.json({ success: true, status: "COMPLETED" });
        }
      }
    }

    return NextResponse.json({ success: false, status: order.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
