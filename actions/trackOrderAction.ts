"use server";

import { trackOrder } from "@/lib/cms-client";

export async function trackOrderAction(orderNumber: string, email: string) {
  const order = await trackOrder(orderNumber, email);
  if (!order) {
    return { found: false as const };
  }
  return {
    found: true as const,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      orderDate: order.orderDate,
      total: order.total,
      currency: order.currency,
      itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      shippingCity: (order.shippingAddress?.city as string) ?? null,
    },
  };
}
