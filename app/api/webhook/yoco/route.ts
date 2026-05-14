import { NextResponse, NextRequest } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  console.log("=== Yoco Webhook Received ===");
  try {
    // 1. Extract raw body and signature header
    const rawBody = await request.text();
    const signature = request.headers.get("yoco-signature");
    
    if (!signature) {
      console.error("Missing yoco-signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }
    
    // 2. Verify HMAC signature
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("YOCO_WEBHOOK_SECRET not configured");
    }
    
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    
    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    
    // 3. Parse body only after verification
    const body = JSON.parse(rawBody);
    console.log("Webhook payload:", JSON.stringify(body, null, 2));
    
    // 4. Process payment.succeeded event
    if (body.type === "payment.succeeded") {
      const orderNumber = body.payload?.metadata?.orderNumber;
      
      if (!orderNumber) {
        console.error("Missing orderNumber in webhook payload");
        return NextResponse.json(
          { error: "Missing orderNumber" },
          { status: 400 }
        );
      }
      
      console.log(`Payment succeeded for order: ${orderNumber}. Updating Sanity...`);
      
      // 5. Update order status in Sanity
      const result = await backendClient
        .patch({
          query: `*[_type == "order" && orderNumber == $orderNumber][0]`,
          params: { orderNumber }
        })
        .set({ 
          status: "paid",
          paidAt: new Date().toISOString(),
          paymentProvider: "yoco",
          paymentId: body.payload.id
        })
        .commit();
      
      if (!result) {
        console.error(`Order not found: ${orderNumber}`);
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }
      
      console.log(`Order ${orderNumber} marked as paid`);
      return NextResponse.json({ received: true });
    }
    
    // Other webhook events can be handled here
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
