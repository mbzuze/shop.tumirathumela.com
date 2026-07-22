import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrder } from "@/lib/cms-client";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { imageUrl } from "@/lib/imageUrl";

interface OrderPageProps {
  params: Promise<{
    orderNumber: string;
  }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/");
  }

  const { orderNumber } = await params;
  const order = await getOrder(orderNumber, userId);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
        <p className="text-gray-600 mt-2">
          The order you are looking for does not exist or you do not have
          permission to view it.
        </p>
      </div>
    );
  }

  const orderItems = order.items || [];
  const discountAmount = order.discountAmount || 0; // currency amount, not a percentage
  const currency = order.currency || "ZAR";
  const address = order.shippingAddress || {};

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Order Details
          </h1>
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
            Paid
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Order Information
            </h2>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Order Number:</span>{" "}
              {order.orderNumber}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Date:</span>{" "}
              {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Customer Information
            </h2>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Name:</span> {order.customerName}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {order.customerEmail}
            </p>
             {order.customerPhone && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {order.customerPhone}
                </p>
             )}
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Address:</span>
              <p>{address.streetAddress}</p>
              <p>
                {[address.city, address.province].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Items
          </h2>
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center space-x-4">
                  {item.image && (
                    <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200">
                      <Image
                        src={imageUrl(item.image).url()}
                        alt={item.name || "Product Image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.name || "Unknown Product"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 mt-8 flex justify-end">
          <div className="w-full md:w-1/3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(order.subtotal, currency)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">
                  Discount {order.couponCode ? `(${order.couponCode})` : ""}
                </span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(discountAmount, currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-t border-gray-200 mt-2">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(order.total, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
