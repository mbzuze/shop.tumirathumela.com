import Link from "next/link";

export const metadata = {
  title: "Supply to TumiraThumela",
  description: "Become a wholesale supplier for TumiraThumela's cross-border marketplace.",
};

export default function SupplyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Supply to TumiraThumela</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-6">Supply to TumiraThumela</h1>

      <div className="space-y-6 text-sm text-[#0F1111] leading-relaxed">
        <p>
          If you&apos;re a manufacturer, distributor, or wholesaler, TumiraThumela
          offers a direct route to shoppers across South Africa and Zimbabwe. We
          buy stock in bulk and manage listing, delivery, and customer service
          ourselves — unlike our marketplace sellers, who list and manage their
          own products.
        </p>

        <section>
          <h2 className="text-lg font-bold mb-2">What we&apos;re looking for</h2>
          <ul className="list-disc list-inside space-y-1 text-[#565959]">
            <li>Consistent stock availability and lead times</li>
            <li>Competitive wholesale pricing</li>
            <li>Products across our existing categories — electronics, home &amp; kitchen,
              fashion, beauty, groceries, and more</li>
            <li>Ability to deliver to a Johannesburg-based warehouse</li>
          </ul>
        </section>

        <section className="bg-[#f7fafa] border border-[#ddd] rounded p-6">
          <h2 className="text-base font-bold mb-2">Submit a supplier enquiry</h2>
          <p className="text-[#565959]">
            Email{" "}
            <a href="mailto:supply@tumirathumela.com" className="text-[#007185] hover:underline">
              supply@tumirathumela.com
            </a>{" "}
            with your company details, product catalog, and wholesale price list, and
            our buying team will follow up.
          </p>
        </section>

        <p className="text-xs text-[#565959]">
          Looking to sell your own products directly to shoppers instead?{" "}
          <Link href="/sell" className="text-[#007185] hover:underline">
            See Sell on TumiraThumela
          </Link>.
        </p>
      </div>
    </div>
  );
}
