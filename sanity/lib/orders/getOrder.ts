import { defineQuery } from "next-sanity";
import { sanityFetch } from "../live";

export async function getOrder(orderNumber: string, userId: string) {
  if (!orderNumber) {
    throw new Error("Order Number is required");
  }
  if (!userId) {
    throw new Error("User ID is required");
  }

  const ORDER_QUERY = defineQuery(`
    *[_type == "order" && orderNumber == $orderNumber && clerkUserId == $userId][0] {
      ...,
      orderItems[] {
        ...,
        product->
      },
      applicableProducts[]->
    }
  `);

  try {
    const order = await sanityFetch({
      query: ORDER_QUERY,
      params: { orderNumber, userId },
    });

    return order.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}
