import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  createOrder,
  getAddressById,
  getProductsByIds,
  getActiveSaleByCouponCode,
  attachCheckoutId,
  cancelOrder,
  CmsError,
} from "@/lib/cms-client";
import { imageUrl } from "@/lib/imageUrl";
import { shippingCentsFor, isSpeedAvailable, type Country, type DeliverySpeed } from "@/lib/shipping";

// The client sends ids, quantities, and choices only — never prices. Every
// amount charged is computed here from the CMS's current data, never from
// the request body. This closes the hole where a forged body could pay R1
// for a full-price basket (the old route trusted a client-supplied `amount`
// and per-item `price` outright).
const AddressInputSchema = z
  .object({
    // Optional: the checkout page has never collected a separate recipient
    // name for a one-off (not-saved-to-address-book) address — it reuses the
    // signed-in account's name, filled in below from currentUser().
    fullName: z.string().trim().min(1).max(200).optional(),
    phone: z.string().trim().min(1).max(40),
    streetAddress: z.string().trim().min(1).max(300),
    buildingDetails: z.string().trim().max(200).optional(),
    suburb: z.string().trim().max(120).optional(),
    city: z.string().trim().min(1).max(120),
    province: z.string().trim().max(120).optional(),
    postalCode: z.string().trim().min(1).max(20),
    country: z.enum(["ZA", "ZW"]),
    deliveryInstructions: z.string().trim().max(500).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.country === "ZA" && !val.province) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["province"],
        message: "Province is required for South African addresses",
      });
    }
  });

const CheckoutBodySchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().min(1).max(99),
        })
      )
      .min(1)
      .max(50),
    addressId: z.string().min(1).optional(),
    address: AddressInputSchema.optional(),
    deliverySpeed: z.enum(["standard", "express"]),
    couponCode: z.string().trim().max(50).optional(),
    // One per distinct checkout attempt — the client regenerates it only
    // when the cart/address/coupon actually changes, not on every click.
    // Lets a retried or double-submitted request return the same order
    // instead of creating a second one (enforced by a DB unique constraint
    // on the CMS side, not just this check).
    idempotencyKey: z.string().min(1).max(200).optional(),
  })
  .refine((b) => Boolean(b.addressId) !== Boolean(b.address), {
    message: "Provide exactly one of addressId or address",
    path: ["addressId"],
  });

type ResolvedAddress = {
  fullName: string;
  phone: string;
  streetAddress: string;
  buildingDetails?: string;
  suburb?: string;
  city: string;
  province?: string;
  postalCode: string;
  country: Country;
  deliveryInstructions?: string;
};

function generateOrderNumber(): string {
  return `ORD-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to check out" }, { status: 401 });
    }
    const me = await currentUser();
    const customerEmail = me?.primaryEmailAddress?.emailAddress ?? me?.emailAddresses[0]?.emailAddress;
    if (!customerEmail) {
      return NextResponse.json({ error: "Your account has no email address on file" }, { status: 400 });
    }
    const customerName = `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim() || "Customer";

    const parsed = CheckoutBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Resolve the shipping address. addressId is already ownership-scoped by
    // getAddressById (it only searches this user's own addresses), so it
    // doubles as the authorisation check — an id belonging to someone else
    // simply won't be found.
    let address: ResolvedAddress;
    if (body.addressId) {
      const saved = await getAddressById(body.addressId, userId);
      if (!saved) {
        return NextResponse.json({ error: "Address not found" }, { status: 403 });
      }
      address = {
        fullName: saved.fullName,
        phone: saved.phone,
        streetAddress: saved.streetAddress,
        buildingDetails: saved.buildingDetails ?? undefined,
        suburb: saved.suburb ?? undefined,
        city: saved.city,
        province: saved.province ?? undefined,
        postalCode: saved.postalCode,
        country: saved.country === "ZW" ? "ZW" : "ZA",
        deliveryInstructions: saved.deliveryInstructions ?? undefined,
      };
    } else {
      address = { ...body.address!, fullName: body.address!.fullName || customerName };
    }

    const deliverySpeed = body.deliverySpeed as DeliverySpeed;
    if (!isSpeedAvailable(address.country, deliverySpeed)) {
      return NextResponse.json(
        { error: `${deliverySpeed} delivery is not available for ${address.country}` },
        { status: 400 }
      );
    }

    // Reprice entirely from trusted CMS data. Any id the CMS doesn't return
    // (unpublished, deleted, or never existed) fails the whole checkout
    // rather than silently pricing that line at 0.
    const ids = [...new Set(body.items.map((i) => i.productId))];
    const products = await getProductsByIds(ids);
    const byId = new Map(products.map((p) => [p._id, p]));
    const missingProductIds = ids.filter((id) => !byId.has(id));
    if (missingProductIds.length > 0) {
      return NextResponse.json(
        { error: "CART_STALE", missingProductIds },
        { status: 409 }
      );
    }

    // Advisory, not a reservation: this reduces the racy window without
    // holding stock for the duration of checkout. Two concurrent checkouts
    // can still both pass this check for the same last unit — the
    // COMPLETED-transition stock decrement is the actual source of truth
    // and can go negative in that case (see the admin order PATCH route).
    const outOfStock = body.items
      .map((item) => ({
        productId: item.productId,
        requested: item.quantity,
        available: byId.get(item.productId)!.stockCount ?? 0,
      }))
      .filter((l) => l.requested > l.available);
    if (outOfStock.length > 0) {
      return NextResponse.json({ error: "OUT_OF_STOCK", items: outOfStock }, { status: 409 });
    }

    const lines = body.items.map((item) => {
      const p = byId.get(item.productId)!;
      const unitCents = Math.round((p.price ?? 0) * 100);
      return {
        productId: p._id,
        name: p.name || "Product",
        sku: p.sku,
        image: p.images?.[0] ? imageUrl(p.images[0]).url() : undefined,
        quantity: item.quantity,
        unitCents,
        lineCents: unitCents * item.quantity,
      };
    });
    const subtotalCents = lines.reduce((sum, l) => sum + l.lineCents, 0);

    // Coupon: recomputed here from discountType/discountValue, never from a
    // client-supplied amount. A code that was valid when added to the cart
    // but has since expired or been exhausted is dropped rather than
    // blocking the purchase over a marketing discount.
    let discountCents = 0;
    let couponCode: string | undefined;
    if (body.couponCode) {
      const sale = await getActiveSaleByCouponCode(body.couponCode);
      if (sale) {
        const applicable = sale.applicableProductIds ?? [];
        const baseCents =
          applicable.length === 0
            ? subtotalCents
            : lines.reduce((sum, l) => (applicable.includes(l.productId) ? sum + l.lineCents : sum), 0);
        const meetsMinimum =
          !sale.minimumOrderValue || subtotalCents / 100 >= sale.minimumOrderValue;
        if (meetsMinimum) {
          discountCents =
            sale.discountType === "FIXED"
              ? Math.min(Math.round(sale.discountValue * 100), baseCents)
              : Math.round((baseCents * sale.discountValue) / 100);
          couponCode = sale.couponCode ?? body.couponCode;
        }
      }
    }

    const shippingCents = shippingCentsFor(address.country, deliverySpeed);
    const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

    // Order first, then Yoco. A failure below leaves a recoverable CANCELLED
    // order rather than a customer charged with no order on file.
    const createOrderWith = (num: string) =>
      createOrder({
        orderNumber: num,
        customerEmail,
        customerName,
        customerPhone: address.phone,
        clerkUserId: userId,
        items: lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          sku: l.sku,
          quantity: l.quantity,
          price: l.unitCents / 100,
          image: l.image,
        })),
        subtotal: subtotalCents / 100,
        discountAmount: discountCents / 100,
        shippingCost: shippingCents / 100,
        total: totalCents / 100,
        currency: "ZAR",
        paymentProvider: "YOCO",
        couponCode,
        shippingAddress: address,
        idempotencyKey: body.idempotencyKey,
      });

    let order;
    try {
      order = await createOrderWith(generateOrderNumber());
    } catch (err) {
      // orderNumber collision — regenerate once. Safe to retry because no
      // payment has been created yet.
      if (err instanceof CmsError && err.status === 409) {
        order = await createOrderWith(generateOrderNumber());
      } else {
        throw err;
      }
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL;

    // Idempotent replay: this order already exists and already has a Yoco
    // checkout attached (createOrder returned the pre-existing row instead
    // of a new one). Don't open a second checkout for it. Note that even a
    // genuinely concurrent pair of requests racing past this exact check is
    // still safe: both send Yoco's own Idempotency-Key as order.id, and
    // Yoco's API (confirmed against its docs) returns the identical
    // checkout for repeated requests with the same key for 24 hours, rather
    // than creating a second one.
    if (order.checkoutId) {
      if (order.status === "COMPLETED") {
        return NextResponse.json({
          redirectUrl: `${base}/success?order=${order.orderNumber}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
        });
      }
      try {
        const resp = await fetch(`https://payments.yoco.com/api/checkouts/${order.checkoutId}`, {
          headers: { Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}` },
        });
        if (resp.ok) {
          const existingCheckout = await resp.json();
          if (existingCheckout.status === "completed") {
            return NextResponse.json({
              redirectUrl: `${base}/success?order=${order.orderNumber}`,
              orderId: order.id,
              orderNumber: order.orderNumber,
            });
          }
          if (existingCheckout.status !== "expired" && existingCheckout.redirectUrl) {
            return NextResponse.json({
              redirectUrl: existingCheckout.redirectUrl,
              orderId: order.id,
              orderNumber: order.orderNumber,
            });
          }
          // status === "expired" (or no redirectUrl for some other reason)
          // — fall through and open a fresh checkout for this same order.
        } else if (resp.status !== 404) {
          // Yoco is erroring, not just "doesn't recognise this id" — don't
          // risk opening a second checkout while we can't see the existing
          // one's real state.
          throw new Error(`Could not verify existing checkout: ${resp.status}`);
        }
        // 404: Yoco has no record of this checkout id — safe to open a new
        // one for this same order below.
      } catch (err) {
        console.error("[checkout] could not resume existing checkout for", order.orderNumber, err);
        return NextResponse.json(
          { error: "We could not resume your payment. Please try again shortly." },
          { status: 502 }
        );
      }
    }

    let yocoJson: { id: string; redirectUrl?: string };
    try {
      const resp = await fetch("https://payments.yoco.com/api/checkouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
          // Stable per order, not a fresh uuid per request — a retried or
          // double-clicked submission returns the same Yoco checkout instead
          // of minting a second one for the same order.
          "Idempotency-Key": order.id,
        },
        body: JSON.stringify({
          amount: totalCents,
          currency: "ZAR",
          // Metadata values must be strings for Yoco. The webhook reads
          // metadata.orderNumber — keep that key exactly.
          metadata: { orderNumber: order.orderNumber, orderId: order.id, clerkUserId: userId },
          successUrl: `${base}/success?order=${order.orderNumber}`,
          cancelUrl: `${base}/checkout`,
          failureUrl: `${base}/checkout`,
        }),
      });
      if (!resp.ok) {
        throw new Error(`Yoco API error: ${await resp.text()}`);
      }
      yocoJson = await resp.json();
      if (!yocoJson.redirectUrl) {
        throw new Error("Yoco returned no redirectUrl");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[checkout] yoco failed after order", order.orderNumber, err);
      await cancelOrder(order.id, `Payment initiation failed: ${message}`).catch((compErr) =>
        console.error("[checkout] COMPENSATION FAILED for", order.orderNumber, compErr)
      );
      return NextResponse.json(
        { error: "We could not start the payment. Please try again." },
        { status: 502 }
      );
    }

    // Not worth failing an already-payable checkout over — the webhook keys
    // off metadata.orderNumber and doesn't need this; only the /api/orders/verify
    // fallback does.
    await attachCheckoutId(order.id, yocoJson.id).catch((err) =>
      console.error("[checkout] failed to attach checkoutId for", order.orderNumber, err)
    );

    return NextResponse.json({
      redirectUrl: yocoJson.redirectUrl,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err: unknown) {
    console.error("[checkout]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
