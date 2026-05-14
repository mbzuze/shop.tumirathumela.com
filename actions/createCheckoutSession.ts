"use server";

import { BasketItem } from "@/store/store";
import { imageUrl } from "@/lib/imageUrl";
import { headers } from "next/headers";

export type Metadata = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  clerkUserId: string;
  items?: string; // Serialized items
  couponCode?: string;
  discountAmount?: number;
  applicableProducts?: string;
};

export type GroupedBasketItem = {
  product: BasketItem["product"];
  quantity: number;
};

export async function createCheckoutSession(
  items: GroupedBasketItem[],
  metadata: Metadata,
) {
  try {
    const itemsWithoutPrice = items.filter((item) => !item.product.price);
    if (itemsWithoutPrice.length > 0) {
      throw new Error("One or more items do not have a price.");
    }

    const subtotal = items.reduce(
      (acc, item) => acc + item.product.price! * item.quantity,
      0,
    );

    let totalAmount = subtotal;
    let totalDiscount = 0;

    if (metadata.discountAmount && metadata.discountAmount > 0) {
      let applicableIds: string[] = [];
      if (metadata.applicableProducts) {
        try {
          applicableIds = JSON.parse(metadata.applicableProducts);
        } catch (e) {
          console.error("Could not parse applicableProducts JSON", e);
          // Fallback to global discount if JSON is invalid
          applicableIds = [];
        }
      }

      if (applicableIds && applicableIds.length > 0) {
        // --- Specific product discount logic ---
        const discountableAmount = items.reduce((acc, item) => {
          if (applicableIds.includes(item.product._id)) {
            return acc + item.product.price! * item.quantity;
          }
          return acc;
        }, 0);
        totalDiscount = (discountableAmount * metadata.discountAmount) / 100;
      } else {
        // --- Global discount logic ---
        totalDiscount = (subtotal * metadata.discountAmount) / 100;
      }
      totalAmount = Math.max(0, subtotal - totalDiscount);
    }

    const headersList = await headers();
    const host = headersList.get("host");
    const isLocalhost = host?.includes("localhost");
    const protocol = headersList.get("x-forwarded-proto") || (isLocalhost ? "http" : "https");
    const baseUrl = `${protocol}://${host}`;

    const payload = {
      amount: Math.round(totalAmount * 100), // Amount in cents
      currency: "ZAR",
      subtotalAmount: Math.round(subtotal * 100),
      totalDiscount: Math.round(totalDiscount * 100),
      metadata: {
        ...metadata,
        items: JSON.stringify(
          items.map((item) => ({
            id: item.product._id,
            quantity: item.quantity,
          })),
        ),
      },
      // items, // Make sure this line is included
      lineItems: items.map((item) => ({
        displayName: item.product.name || "Unnamed Product",
        description: `Product ID: ${item.product._id}`,
        quantity: item.quantity,
        pricingDetails: {
          price: Math.round(item.product.price! * item.quantity * 100),
        },
      })),
      cancelUrl: `${baseUrl}/cart`,
      successUrl: `${baseUrl}/success?order=${metadata.orderNumber}`,
      failureUrl: `${baseUrl}/checkout/failure`,
    };

    // console.log("Payload being sent:", JSON.stringify(payload, null, 2));
    try {
      const response = await fetch(
        `${baseUrl}/api/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const responseData = await response.json();
      console.log("Webhook response:", responseData);

      const { redirectUrl } = responseData;
      return redirectUrl;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create checkout session.");
  }
}
