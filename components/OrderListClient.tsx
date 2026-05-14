"use client";

import { useState } from "react";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import useBasketStore from "@/store/store";
import { formatCurrency } from "@/lib/utils";
import { imageUrl } from "@/lib/imageUrl";
import Image from "next/image";

export function OrderListClient({ orders }: { orders: any[] }) {
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const addItem = useBasketStore((state) => state.addItem);

  const activeOrders = orders.filter((o) =>
    ["pending", "paid", "processing", "shipped"].includes(o.status?.toLowerCase())
  );
  const pastOrders = orders.filter((o) =>
    ["delivered", "cancelled", "completed"].includes(o.status?.toLowerCase()) || !o.status
  );

  const currentOrders = activeTab === "active" ? activeOrders : pastOrders;

  const handleReorder = (order: any) => {
    if (order.orderItems && order.orderItems.length > 0) {
      order.orderItems.forEach((item: any) => {
        if (item.product) {
          // Add item to cart
          for (let i = 0; i < (item.quantity || 1); i++) {
            addItem(item.product);
          }
        }
      });
      window.location.href = "/cart";
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-4">
        <button
          onClick={() => setActiveTab("active")}
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "active"
              ? "border-[#e77600] text-[#e77600]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "past"
              ? "border-[#e77600] text-[#e77600]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Past Orders ({pastOrders.length})
        </button>
      </div>

      {currentOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No {activeTab} orders found.
        </div>
      ) : (
        <div className="space-y-6">
          {currentOrders.map((order) => (
            <div key={order.orderNumber} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">
                    Placed on {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      order.total ??
                        (order.orderItems || []).reduce(
                          (acc: number, item: any) => acc + (item.product?.price ?? 0) * (item.quantity || 1),
                          0
                        ),
                      order.currency || "ZAR"
                    )}
                  </span>
                  <OrderStatusBadge status={order.status || "completed"} />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {(order.orderItems || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    {item.product?.images?.[0] && (
                      <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden border shrink-0">
                        <Image
                          src={imageUrl(item.product.images[0]).url()}
                          alt={item.product?.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.product?.name || "Unknown Product"}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Link href={`/orders/${order.orderNumber}`} className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded hover:bg-gray-50 transition-colors text-gray-700">
                  View Details
                </Link>
                <button
                  onClick={() => handleReorder(order)}
                  className="px-4 py-2 text-sm font-semibold bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] rounded transition-colors cursor-pointer"
                >
                  Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
