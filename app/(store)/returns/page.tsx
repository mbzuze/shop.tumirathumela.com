import Link from "next/link";

export const metadata = {
  title: "Returns & Refunds — TumiraThumela",
  description: "Information about our returns and refund policy for South Africa and Zimbabwe.",
};

export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Returns &amp; Refunds</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-2">
        Returns &amp; Refunds
      </h1>
      <p className="text-[#565959] text-sm mb-8">
        Last updated: May 2025
      </p>

      <div className="space-y-8 text-sm text-[#0F1111]">
        <section>
          <h2 className="text-base font-bold mb-2">30-Day Return Policy</h2>
          <p className="text-[#565959] leading-relaxed">
            Most items sold by TumiraThumela can be returned within 30 days of delivery 
            for a full refund, provided they are in their original condition and packaging. 
            Items must be unused and include all original accessories and documentation.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">How to Return an Item</h2>
          <ol className="list-decimal list-inside space-y-2 text-[#565959]">
            <li>Sign in to your account and navigate to <Link href="/orders" className="text-[#007185] hover:underline">Your Orders</Link>.</li>
            <li>Select the order containing the item you wish to return.</li>
            <li>Click &ldquo;Return or Replace Items&rdquo; and follow the instructions.</li>
            <li>Print the return label and drop the parcel at the nearest courier point.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Refund Timeline</h2>
          <p className="text-[#565959] leading-relaxed">
            Once we receive and inspect your return, we will process your refund within 
            5–10 business days. Refunds are credited back to your original payment method.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Non-Returnable Items</h2>
          <ul className="list-disc list-inside space-y-1 text-[#565959]">
            <li>Perishable goods</li>
            <li>Digital downloads and software</li>
            <li>Personalized or custom-made items</li>
            <li>Hazardous materials</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Contact Us</h2>
          <p className="text-[#565959]">
            Need help with a return? Email us at{" "}
            <a
              href="mailto:support@tumirathumela.com"
              className="text-[#007185] hover:underline"
            >
              support@tumirathumela.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
