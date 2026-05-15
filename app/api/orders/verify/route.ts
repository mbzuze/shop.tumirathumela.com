import { NextRequest, NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";

export async function POST(request: NextRequest) {
  try {
    const { orderNumber } = await request.json();

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number required" }, { status: 400 });
    }

    console.log(`Manually verifying order: ${orderNumber}`);

    // Fetch the order from Sanity
    const order = await backendClient.fetch(
      `*[_type == "order" && orderNumber == $orderNumber][0]`,
      { orderNumber }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "completed" || order.status === "paid") {
      return NextResponse.json({ success: true, status: order.status });
    }

    // If it's still pending, we assume the webhook failed (common on localhost)
    // In a real app, we would call Yoco API to check the actual payment status here.
    // For now, since we are on the SUCCESS page, we can be reasonably sure the user paid
    // (though in production you MUST verify with the payment provider API).
    
    // Let's call Yoco to be safe if we have the payment ID
    if (order.yocoPaymentId) {
        const resp = await fetch(`https://payments.yoco.com/api/checkouts/${order.yocoPaymentId}`, {
            headers: {
                Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
            },
        });
        
        if (resp.ok) {
            const checkout = await resp.json();
            if (checkout.status === "successful" || checkout.status === "paid") {
                console.log(`Yoco confirms payment for ${orderNumber}. Updating status...`);
                await backendClient
                    .patch(order._id)
                    .set({ 
                        status: "completed",
                        paidAt: new Date().toISOString(),
                    })
                    .commit();
                return NextResponse.json({ success: true, status: "completed" });
            }
        }
    }

    return NextResponse.json({ success: false, status: order.status });
  } catch (error: any) {
    console.error("Order verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
