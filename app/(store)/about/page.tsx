import Link from "next/link";

export const metadata = {
  title: "About TumiraThumela",
  description: "TumiraThumela is Southern Africa's cross-border marketplace, connecting shoppers and their loved ones between South Africa and Zimbabwe.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">About TumiraThumela</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-6">About TumiraThumela</h1>

      <div className="space-y-6 text-sm text-[#0F1111] leading-relaxed">
        <p>
          TumiraThumela began as a way to help people send goods, airtime, and bill
          payments to family and friends in Zimbabwe from wherever they were in the
          world. That same idea — bridging the gap between South Africa and
          Zimbabwe — is now the foundation of TumiraThumela&apos;s online marketplace.
        </p>
        <p>
          We ship a wide range of products, from electronics and home essentials to
          fashion and everyday groceries, with delivery to South Africa and Zimbabwe
          and prices shown in both ZAR and USD so there are no surprises at checkout.
        </p>

        <section>
          <h2 className="text-lg font-bold mb-2">What we offer</h2>
          <ul className="list-disc list-inside space-y-1 text-[#565959]">
            <li>A wide product selection across 15+ categories</li>
            <li>Cross-border delivery logistics between South Africa and Zimbabwe</li>
            <li>Dual-currency pricing with real-time exchange rate calculations</li>
            <li>Secure card and EFT payments</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Where we&apos;re based</h2>
          <p className="text-[#565959]">
            222 Smit Street, Braamfontein, Johannesburg, 2001, South Africa.
          </p>
        </section>

        <section className="border-t border-[#ddd] pt-6">
          <h2 className="text-lg font-bold mb-2">Get in touch</h2>
          <p className="text-[#565959]">
            Have a question about an order, a product, or a partnership? Visit our{" "}
            <Link href="/customer-service" className="text-[#007185] hover:underline">
              Customer Service
            </Link>{" "}
            page or email{" "}
            <a href="mailto:support@tumirathumela.com" className="text-[#007185] hover:underline">
              support@tumirathumela.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
