import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createOrder } from "@/lib/cms-client";

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { metadata, cancelUrl, failureUrl, successUrl, lineItems, orderItems, subtotalAmount, totalDiscount, amount } = requestBody;

    const idempotencyKey = uuidv4();
    const orderNumber = `ORD-${uuidv4().split('-')[0].toUpperCase()}`;
    const modifiedSuccessUrl = `${successUrl}?order=${orderNumber}`;

    // Call Yoco
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
        metadata: { ...metadata, orderNumber },
        successUrl: modifiedSuccessUrl,
        cancelUrl,
        failureUrl,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Yoco API error: ${errorText}`);
    }

    const json = await resp.json();

    // Build order items from orderItems (mapped from cart)
    const items = (orderItems || []).map((item: { _id?: string; name?: string; product?: { name?: string; sku?: string }; quantity?: number; price?: number; image?: string }) => ({
      productId: item._id ?? undefined,
      name: item.name ?? item.product?.name ?? 'Unknown',
      sku: item.product?.sku ?? undefined,
      quantity: item.quantity ?? 1,
      price: item.price ?? 0,
      image: item.image ?? undefined,
    }))

    const addressParts = metadata.shippingAddress?.split(', ') || []

    // Create order in TumiraCMS
    const order = await createOrder({
      orderNumber,
      customerEmail: metadata.customerEmail,
      customerName: metadata.customerName,
      customerPhone: metadata.shippingPhone || undefined,
      clerkUserId: metadata.userId || undefined,
      items,
      subtotal: subtotalAmount ? subtotalAmount / 100 : amount / 100,
      discountAmount: totalDiscount ? totalDiscount / 100 : 0,
      shippingCost: 0,
      total: amount / 100,
      currency: 'ZAR',
      paymentProvider: 'YOCO',
      paymentId: json.id,
      couponCode: metadata.couponCode || undefined,
      shippingAddress: {
        fullName: metadata.customerName,
        streetAddress: addressParts[0] ?? metadata.shippingAddress ?? '',
        city: addressParts[1] ?? 'Unknown',
        province: addressParts[addressParts.length - 1] ?? '',
        country: 'ZA',
        phone: metadata.shippingPhone ?? '',
      },
    })

    return NextResponse.json({ ...json, orderId: order.id, orderNumber: order.orderNumber })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
