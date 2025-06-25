"use server";

import { BasketItem } from "@/store/store";
import stripe from "@/lib/stripe";
import { imageUrl } from "@/lib/imageUrl";

export type Metadata = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  clerkUserId: string;
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
    const customers = await stripe.customers.list({
      email: metadata.customerEmail,
      limit: 1,
    });

    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const payload = {
      amount: Math.round(
        items.reduce(
          (acc, item) => acc + item.product.price! * item.quantity,
          0,
        ) * 100,
      ),
      currency: "ZAR",
      metadata,
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
