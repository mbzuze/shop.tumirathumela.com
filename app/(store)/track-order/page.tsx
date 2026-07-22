"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { trackOrderAction } from "@/actions/trackOrderAction";
import { formatCurrency } from "@/lib/utils";

const STEPS = ["PENDING", "PROCESSING", "COMPLETED"] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Order Placed",
  PROCESSING: "Processing",
  COMPLETED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

type Result =
  | { found: true; order: { orderNumber: string; status: string; orderDate: string; total: number; currency: string; itemCount: number; shippingCity: string | null } }
  | { found: false };

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await trackOrderAction(orderNumber, email);
    setResult(res);
    setLoading(false);
  };

  const stepIndex = result?.found ? STEPS.indexOf(result.order.status as (typeof STEPS)[number]) : -1;
  const isTerminalIssue = result?.found && (result.order.status === "CANCELLED" || result.order.status === "REFUNDED");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Track a Package</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-2">Track a Package</h1>
      <p className="text-[#565959] text-sm mb-8">
        Enter your order number and the email address used to place the order.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-[#ddd] rounded p-6 mb-8">
        <div>
          <label htmlFor="orderNumber" className="block text-sm font-medium text-[#0F1111] mb-1">
            Order number <span className="text-red-600">*</span>
          </label>
          <input
            id="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            placeholder="e.g. TT-2026-00123"
            className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#0F1111] mb-1">
            Email address <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm px-6 py-2 text-sm font-normal text-[#0F1111] cursor-pointer transition-colors disabled:opacity-50"
        >
          {loading ? "Searching…" : "Track Package"}
        </button>
      </form>

      {result && !result.found && (
        <div className="bg-white border border-[#ddd] rounded p-6 text-sm text-[#0F1111]">
          <p className="font-semibold mb-1">We couldn&apos;t find that order.</p>
          <p className="text-[#565959]">
            Double-check the order number and email address, or{" "}
            <Link href="/customer-service" className="text-[#007185] hover:underline">
              contact customer service
            </Link>{" "}
            for help.
          </p>
        </div>
      )}

      {result?.found && (
        <div className="bg-white border border-[#ddd] rounded p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-[#565959]">Order</p>
              <p className="font-bold text-[#0F1111]">{result.order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#565959]">Placed</p>
              <p className="text-sm text-[#0F1111]">
                {new Date(result.order.orderDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isTerminalIssue ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800 mb-6">
              This order was {STATUS_LABEL[result.order.status].toLowerCase()}.
            </div>
          ) : (
            <div className="flex items-center mb-6">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i <= stepIndex ? "bg-tt-orange text-white" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {i < stepIndex ? "✓" : i + 1}
                    </div>
                    <span className="text-[10px] text-[#565959] mt-1 text-center w-16">
                      {STATUS_LABEL[step]}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? "bg-tt-orange" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          <dl className="text-sm space-y-1 border-t border-[#ddd] pt-4">
            <div className="flex justify-between">
              <dt className="text-[#565959]">Items</dt>
              <dd className="text-[#0F1111]">{result.order.itemCount}</dd>
            </div>
            {result.order.shippingCity && (
              <div className="flex justify-between">
                <dt className="text-[#565959]">Delivering to</dt>
                <dd className="text-[#0F1111]">{result.order.shippingCity}</dd>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <dt className="text-[#0F1111]">Total</dt>
              <dd className="text-[#0F1111]">{formatCurrency(result.order.total, result.order.currency)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
