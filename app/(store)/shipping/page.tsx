import Link from "next/link";

export const metadata = {
  title: "Shipping & Delivery — TumiraThumela",
  description: "Delivery times, areas served, and shipping costs for TumiraThumela orders in South Africa and Zimbabwe.",
};

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Shipping &amp; Delivery</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-6">Shipping &amp; Delivery</h1>

      <div className="space-y-8 text-sm text-[#0F1111]">
        <section>
          <h2 className="text-base font-bold mb-2">Order cutoff time</h2>
          <p className="text-[#565959] leading-relaxed">
            Orders placed before 14:00 are dispatched the same day. Orders placed after
            14:00 are dispatched the next business day.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Delivery times by region</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F7F8F8] text-left">
                  <th className="py-2 px-3 font-medium">Region</th>
                  <th className="py-2 px-3 font-medium">Estimated delivery</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#ddd]">
                  <td className="py-2 px-3">Johannesburg, Pretoria, Cape Town, Durban</td>
                  <td className="py-2 px-3 text-[#565959]">1–2 business days</td>
                </tr>
                <tr className="border-t border-[#ddd]">
                  <td className="py-2 px-3">Other South African cities &amp; towns</td>
                  <td className="py-2 px-3 text-[#565959]">2–4 business days</td>
                </tr>
                <tr className="border-t border-[#ddd]">
                  <td className="py-2 px-3">Harare, Bulawayo (Zimbabwe)</td>
                  <td className="py-2 px-3 text-[#565959]">3–5 business days</td>
                </tr>
                <tr className="border-t border-[#ddd]">
                  <td className="py-2 px-3">Other Zimbabwean towns</td>
                  <td className="py-2 px-3 text-[#565959]">5–7 business days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Delivery costs</h2>
          <p className="text-[#565959] leading-relaxed">
            Delivery costs are calculated at checkout based on your address and order size.
            Free delivery thresholds and promotions, when running, are shown on the homepage
            and at checkout.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Tracking your order</h2>
          <p className="text-[#565959] leading-relaxed">
            Once dispatched, you can follow your order&apos;s status from{" "}
            <Link href="/orders" className="text-[#007185] hover:underline">Your Orders</Link>{" "}
            (signed in) or via{" "}
            <Link href="/track-order" className="text-[#007185] hover:underline">Track a Package</Link>{" "}
            using your order number and email.
          </p>
        </section>

        <section className="border-t border-[#ddd] pt-6">
          <h2 className="text-base font-bold mb-2">Questions about a delivery?</h2>
          <p className="text-[#565959]">
            Contact{" "}
            <Link href="/customer-service" className="text-[#007185] hover:underline">
              Customer Service
            </Link>{" "}
            and we&apos;ll look into it.
          </p>
        </section>
      </div>
    </div>
  );
}
