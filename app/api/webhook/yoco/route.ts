import { NextResponse, NextRequest } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";

export async function POST(request: NextRequest) {
  console.log("=== Yoco Webhook Received ===");
  try {
    const payload = await request.json();
    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    const { type, payload: eventData } = payload;

    // We are only interested in successful payments for now
    if (type === "payment.succeeded") {
      const orderNumber = eventData?.metadata?.orderNumber;

      if (!orderNumber) {
        console.error("No orderNumber found in webhook metadata!");
        return NextResponse.json({ error: "Missing orderNumber" }, { status: 400 });
      }

      console.log(`Payment succeeded for order: ${orderNumber}. Updating Sanity...`);

      // Find the order document in Sanity by orderNumber
      const orderQuery = `*[_type == "order" && orderNumber == $orderNumber][0]`;
      const order = await backendClient.fetch(orderQuery, { orderNumber });

      if (order) {
        // Update the order status to "completed" (or "processing")
        await backendClient
          .patch(order._id)
          .set({ status: 'completed' }) // Using 'completed' as defined in our schema
          .commit();
        
        console.log(`Order ${orderNumber} successfully marked as completed.`);
      } else {
        console.error(`Order ${orderNumber} not found in Sanity!`);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
