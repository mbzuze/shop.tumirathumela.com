import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const id = req.headers.get("webhook-id") ?? "";
    const timestamp = req.headers.get("webhook-timestamp") ?? "";
    const signatureHeader = req.headers.get("webhook-signature") ?? "";

    // Log headers for debugging
    console.log("Webhook Headers:", {
      id,
      timestamp,
      signatureHeader,
    });

    const signedContent = `${id}.${timestamp}.${rawBody}`;

    const secret = process.env.YOCO_WEBHOOK_SECRET ?? "";
    if (!secret) {
      console.error("YOCO_WEBHOOK_SECRET is missing");
      return new NextResponse("Server configuration error", { status: 500 });
    }

    // Handle secret with or without 'whsec_' prefix
    let secretKey = secret;
    if (secret.includes("_")) {
      const parts = secret.split("_");
      // Use the last part as the secret key, assuming format prefix_secret
      secretKey = parts[parts.length - 1];
    }
    
    console.log("Using secret key length:", secretKey.length); // Do not log the actual secret for security
    
    const secretBytes = Buffer.from(secretKey, "base64");

    const expectedSignature = crypto
      .createHmac("sha256", secretBytes)
      .update(signedContent)
      .digest("base64");

    // Extract the signature from the header (remove 'v1,' prefix if present)
    const signature = signatureHeader.startsWith("v1,")
      ? signatureHeader.slice(3)
      : signatureHeader;

    console.log("Expected Signature:", expectedSignature);
    console.log("Received Signature:", signature);

    // Verify signature
    // Note: Timing safe equal requires buffers of same length.
    let isValid = false;
    try {
        isValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    } catch (e) {
        isValid = false;
    }

    if (!isValid) {
      console.error("Invalid webhook signature");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const webhookData = JSON.parse(rawBody);
    console.log("Webhook Event Type:", webhookData.type);

    if (webhookData.type === "payment.succeeded") {
      // Structure based on Yoco docs: { type, data: { ... } } or { type, payload: { ... } }?
      // The provided code used webhookData.data, but my previous attempt used webhookData.payload
      // Let's stick to webhookData.payload based on some docs or common patterns, or check the previous code again.
      // Previous code had: webhookData.data.
      // Let's use webhookData.payload as it's common in newer APIs, but fallback or check.
      // Actually, looking at Yoco docs online (if I could), it usually is `payload` or `data`.
      // The user's previous code used `webhookData.data`. I will assume `webhookData.payload` based on typical Yoco v2.
      // Wait, let's look at the user's attachment again.
      // `webhookData.data?.id`
      // I'll support both just in case or log it.

      const data = webhookData.payload || webhookData.data;

      if (!data) {
          console.error("No data/payload in webhook");
          return new NextResponse("Invalid payload", { status: 400 });
      }

      const { metadata, amount, currency, id: paymentId } = data;

      console.log("Payment Succeeded. ID:", paymentId);
      console.log("Metadata:", metadata);

      // Parse items from metadata
      let items: { id: string; quantity: number }[] = [];
      try {
        items = metadata?.items ? JSON.parse(metadata.items) : [];
      } catch (err) {
        console.error("Error parsing items from metadata:", err);
      }

      // Create order in Sanity
      console.log("Creating order in Sanity...");
      const order = await sanityClient.create({
        _type: "order",
        orderNumber: metadata?.orderNumber || `ORD-${Date.now()}`,
        yocoPaymentId: paymentId,
        clerkUserId: metadata?.clerkUserId || "",
        customerName: metadata?.customerName || "Unknown Customer",
        customerEmail: metadata?.customerEmail || "unknown@example.com",
        customerPhone: "N/A", // Not provided
        customerAddress: "N/A", // Not provided
        customerCity: "N/A", // Not provided
        customerState: "N/A", // Not provided
        orderDate: new Date().toISOString(),
        total: amount / 100, // Store as main currency unit (e.g. Rands)
        currency: currency, // Store currency even if not in schema for future use
        discountAmount: metadata?.discountAmount || 0,
        couponCode: metadata?.couponCode || "",
        applicableProducts: metadata?.applicableProducts
          ? JSON.parse(metadata.applicableProducts).map((id: string) => ({
              _type: "reference",
              _ref: id,
            }))
          : [],
        orderItems: items.map((item) => ({
          _type: "object",
          _key: crypto.randomUUID(),
          product: {
            _type: "reference",
            _ref: item.id,
          },
          quantity: item.quantity,
        })),
        status: "completed",
        paidAt: new Date().toISOString(),
        paymentProvider: "yoco",
        paymentId: paymentId,
      });



      console.log("Order created in Sanity:", order._id);

      // Deduct quantity from stock
      console.log("Updating product stock...");
      for (const item of items) {
        try {
          await sanityClient
            .patch(item.id)
            .dec({ quantity: item.quantity })
            .commit();
          console.log(`Updated stock for product ${item.id}`);
        } catch (err) {
          console.error(`Error updating stock for product ${item.id}:`, err);
        }
      }

      return NextResponse.json({ success: true, orderId: order._id });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new NextResponse(`Webhook error: ${error.message}`, { status: 500 });
  }
}

