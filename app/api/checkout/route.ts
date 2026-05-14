import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { backendClient } from "@/sanity/lib/backendClient";

export async function POST(request: NextRequest) {
  console.log("=== Webhook POST started ===");
  try {
    const requestBody = await request.json();
    console.log(
      "Full request body received:",
      JSON.stringify(requestBody, null, 2),
    );

    const { metadata, cancelUrl, failureUrl, successUrl, lineItems, sanityOrderItems, subtotalAmount, totalDiscount, amount } = requestBody;

    const idempotencyKey = uuidv4();
    const orderNumber = `ORD-${uuidv4().split('-')[0].toUpperCase()}`;
    const modifiedSuccessUrl = `${successUrl}?order=${orderNumber}`;

    console.log("Idempotency key:", idempotencyKey);

    // Call Yoco
    console.log("Calling YOCO API...");
    const resp = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        amount,
        currency: "ZAR",
        metadata: {
          ...metadata,
          orderNumber,
        },
        successUrl: modifiedSuccessUrl,
        cancelUrl,
        failureUrl,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("YOCO error response:", errorText);
      throw new Error(`Yoco API error: ${errorText}`);
    }

    const json = await resp.json();
    console.log("YOCO API response:", json);

    // Create Sanity Order Document
    const addressParts = metadata.shippingAddress?.split(', ') || [];

    // Create the order
    const order = await backendClient.create({
      _type: 'order',
      orderNumber,
      yocoPaymentId: json.id, // Yoco checkout ID
      clerkUserId: metadata.userId,
      customerName: metadata.customerName,
      customerEmail: metadata.customerEmail,
      customerPhone: metadata.shippingPhone || '000000000',
      customerAddress: metadata.shippingAddress,
      customerCity: addressParts[1] || 'Unknown',
      customerState: addressParts[addressParts.length - 1] || 'Unknown',
      orderDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD for type: 'date'
      orderItems: sanityOrderItems || [], // Now securely passed from the frontend
      total: amount / 100,
      discountAmount: totalDiscount / 100,
      status: 'pending',
    });

    console.log("Sanity order created:", order._id);
    console.log("=== Webhook POST completed successfully ===");
    
    return NextResponse.json({
      ...json,
      orderId: order._id,
      orderNumber: order.orderNumber
    });
  } catch (err: any) {
    console.error("=== Webhook POST error ===");
    console.error("Error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
