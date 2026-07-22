import Link from "next/link";

export const metadata = {
  title: "Customer Service — TumiraThumela",
  description: "Get help with orders, returns, deliveries, and payments on TumiraThumela.",
};

function HelpCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-[#ddd] rounded-sm p-5 bg-white hover:shadow-md hover:border-[#007185] transition-all"
    >
      <h3 className="font-bold text-[#0F1111] mb-1">{title}</h3>
      <p className="text-sm text-[#565959]">{description}</p>
    </Link>
  );
}

export default function CustomerServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Customer Service</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-2">Customer Service</h1>
      <p className="text-[#565959] text-sm mb-8">
        We&apos;re here to help with orders across South Africa and Zimbabwe.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <HelpCard
          href="/orders"
          title="Track or manage an order"
          description="View order status, delivery updates, and order history."
        />
        <HelpCard
          href="/track-order"
          title="Track a package"
          description="Look up delivery status for a recent order."
        />
        <HelpCard
          href="/returns"
          title="Returns & refunds"
          description="Start a return or read our 30-day return policy."
        />
        <HelpCard
          href="/payment-methods"
          title="Payment methods"
          description="Cards, EFT, and in-store payment options we accept."
        />
      </div>

      <div className="space-y-8 text-sm text-[#0F1111]">
        <section>
          <h2 className="text-lg font-bold mb-3">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[#0F1111]">How long does delivery take?</h3>
              <p className="text-[#565959] leading-relaxed">
                Orders placed before 14:00 are typically dispatched the same day, with delivery
                within 1–2 business days for South African addresses and 3–5 business days for
                cross-border delivery to Zimbabwe. See{" "}
                <Link href="/shipping" className="text-[#007185] hover:underline">
                  Shipping &amp; Delivery
                </Link>{" "}
                for full details.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F1111]">Which currencies can I pay in?</h3>
              <p className="text-[#565959] leading-relaxed">
                Prices are shown in ZAR for South African delivery and USD for Zimbabwe delivery,
                calculated at checkout using current exchange rates.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F1111]">Can I change or cancel my order?</h3>
              <p className="text-[#565959] leading-relaxed">
                Contact us as soon as possible after placing your order — we can usually amend or
                cancel an order before it&apos;s dispatched. Once dispatched, please use our{" "}
                <Link href="/returns" className="text-[#007185] hover:underline">
                  returns process
                </Link>{" "}
                instead.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F1111]">Do you deliver outside major cities?</h3>
              <p className="text-[#565959] leading-relaxed">
                Yes — we deliver across South Africa and Zimbabwe. Delivery times may be longer for
                addresses outside Johannesburg, Cape Town, Durban, and Harare.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#f7fafa] border border-[#ddd] rounded p-6">
          <h2 className="text-lg font-bold mb-3">Still need help? Contact us</h2>
          <dl className="space-y-2">
            <div className="flex gap-2">
              <dt className="font-semibold w-24 shrink-0">Phone</dt>
              <dd className="text-[#565959]">
                <a href="tel:+27115680663" className="text-[#007185] hover:underline">+27 11 568 0663</a>
                {" "}·{" "}
                <a href="tel:+27781663816" className="text-[#007185] hover:underline">+27 78 166 3816</a>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold w-24 shrink-0">Email</dt>
              <dd className="text-[#565959]">
                <a href="mailto:support@tumirathumela.com" className="text-[#007185] hover:underline">
                  support@tumirathumela.com
                </a>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold w-24 shrink-0">Hours</dt>
              <dd className="text-[#565959]">08:00–16:00, Monday–Saturday</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold w-24 shrink-0">Address</dt>
              <dd className="text-[#565959]">222 Smit Street, Braamfontein, Johannesburg, 2001, South Africa</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
