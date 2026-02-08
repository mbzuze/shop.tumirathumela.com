import { defineQuery } from "next-sanity";
import { sanityFetch } from "../live";

export async function getOrder(orderNumber: string) {
  if (!orderNumber) {
    throw new Error("Order Number is required");
  }

  const ORDER_QUERY = defineQuery(`
    *[_type == "order" && orderNumber == $orderNumber][0] {
      ...,
      orderItems[] {
        ...,
        product->
      }
    }
  `);

  try {
    const order = await sanityFetch({
      query: ORDER_QUERY,
      params: { orderNumber },
    });

    return order.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}
