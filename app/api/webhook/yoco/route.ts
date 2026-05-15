import { NextResponse, NextRequest } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  console.log("=== Yoco Webhook Received ===");
  try {
    // 1. Extract body and headers
    const rawBody = await request.text();
    const id = request.headers.get("webhook-id") || "";
    const timestamp = request.headers.get("webhook-timestamp") || "";
    const signature = request.headers.get("webhook-signature") || "";
    
    if (!signature || !id || !timestamp) {
      console.error("Missing webhook headers:", { signature, id, timestamp });
      return NextResponse.json(
        { error: "Missing headers" },
        { status: 401 }
      );
    }
    
    // 2. Verify HMAC signature
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("YOCO_WEBHOOK_SECRET not configured");
    }
    
    // Yoco sends secrets as 'whsec_BASE64_KEY'
    const secretKey = webhookSecret.replace("whsec_", "");
    const secretBytes = Buffer.from(secretKey, "base64");
    
    const signedContent = `${id}.${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", secretBytes)
      .update(signedContent)
      .digest("base64");
    
    // Strip 'v1,' if present in signature header
    const actualSignature = signature.startsWith("v1,") ? signature.slice(3) : signature;

    if (actualSignature !== expectedSignature) {
      console.error("Invalid webhook signature mismatch");
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
      const data = body.payload || body.data;
      const orderNumber = data?.metadata?.orderNumber;

      
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
          status: "completed",
          paidAt: new Date().toISOString(),
          paymentProvider: "yoco",
          paymentId: data.id || body.payload?.id || "unknown"
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
