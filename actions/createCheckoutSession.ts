"use server";

import { BasketItem } from "@/store/store";
import { imageUrl } from "@/lib/imageUrl";

export type Metadata = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  clerkUserId: string;
  items: string; // Serialized items
  couponCode?: string;
  discountAmount?: number;
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
    if (metadata.discountAmount && metadata.discountAmount > 0) {
        // Assume discountAmount is a percentage (e.g., 20 for 20%)
        totalAmount = subtotal - (subtotal * metadata.discountAmount) / 100;
    }

    const payload = {
      amount: Math.round(totalAmount * 100), // Amount in cents
      currency: "ZAR",
      subtotalAmount: Math.round(subtotal * 100),
      totalDiscount: Math.round((subtotal * (metadata.discountAmount || 0)) / 100 * 100),
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
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success?order=${metadata.orderNumber}`,
      failureUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/failure`,
    };

    // console.log("Payload being sent:", JSON.stringify(payload, null, 2));
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
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
