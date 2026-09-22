import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber, markOrderPaid, CmsError } from "@/lib/cms-client";

export async function POST(request: NextRequest) {
  try {
    const { orderNumber } = await request.json();
    if (!orderNumber) {
      return NextResponse.json({ error: "Order number required" }, { status: 400 });
    }

    let order;
    try {
      order = await getOrderByNumber(orderNumber);
    } catch (err) {
      if (err instanceof CmsError && err.status === 404) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      throw err;
    }

    if (order.status === "COMPLETED" || order.status === "PROCESSING") {
      return NextResponse.json({ success: true, status: order.status });
    }

    // Fall back to asking Yoco directly if the webhook hasn't landed yet.
    // checkoutId is the id created by /api/checkout; paymentId falls back
    // for orders placed before that column existed.
    const checkoutId = order.checkoutId ?? order.paymentId;
    if (checkoutId) {
      const yocoRes = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
        headers: { Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}` },
      });

      if (yocoRes.ok) {
        const checkout = await yocoRes.json();
        // Confirmed against Yoco's Checkout API docs: status is one of
        // created/started/processing/completed — not "successful"/"paid",
        // which the previous version of this check compared against and
        // could never have matched.
        if (checkout.status === "completed") {
          await markOrderPaid(order.id, checkout.paymentId ?? checkoutId);
          return NextResponse.json({ success: true, status: "COMPLETED" });
        }
      }
    }

    return NextResponse.json({ success: false, status: order.status });
  } catch (error: unknown) {
    console.error("[orders/verify]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
