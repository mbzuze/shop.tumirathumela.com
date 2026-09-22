"use client";
import { Button } from "@/components/ui/button";
import useBasketStore from "@/store/store";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function SuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const clearBasket = useBasketStore((state) => state.clearBasket);
  const hasVerified = useRef(false);
  const [verifying, setVerifying] = useState(!!orderNumber);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!orderNumber || hasVerified.current) {
      setVerifying(false);
      return;
    }
    hasVerified.current = true;

    // Backup for the webhook: confirm the order actually reached a paid
    // status before clearing the basket or telling the customer it's
    // confirmed. Landing on this URL only means Yoco redirected here — it
    // is not, by itself, proof of payment (e.g. hitting it directly).
    fetch("/api/orders/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          clearBasket();
          setPaid(true);
        }
      })
      .catch((err) => console.error("Order verification failed:", err))
      .finally(() => setVerifying(false));
  }, [orderNumber, clearBasket]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-12 rounded-xl shadow-lg max-w-2xl w-full mx-4">
        {verifying ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-green-600" />
            <p className="text-lg text-gray-700">Confirming your payment…</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-8">
              <div
                className={`h-16 w-16 rounded-full flex items-center justify-center ${
                  paid ? "bg-green-100" : "bg-yellow-100"
                }`}
              >
                <svg
                  className={`h-8 w-8 ${paid ? "text-green-600" : "text-yellow-600"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {paid ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  )}
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-6 text-center">
              {paid ? "Thank You for Your Order!" : "Payment Still Processing"}
            </h1>

            <div className="border-t border-b border-gray-200 py-6 mb-6">
              <p className="text-lg text-gray-700 mb-4">
                {paid
                  ? "Your order has been confirmed and will be shipped shortly."
                  : "We're still confirming your payment with the gateway — this can take a minute. Refresh this page, or check your order status below."}
              </p>
              <div className="space-y-2">
                {orderNumber && (
                  <p className="text-gray-700 flex items-center space-x-5">
                    <span>Order Number:</span>
                    <span className="font-mono text-sm text-green-600">
                      {orderNumber}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  <Link href={orderNumber ? `/orders/${orderNumber}` : "/orders"}>
                    View Order Details
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SuccessPage;
