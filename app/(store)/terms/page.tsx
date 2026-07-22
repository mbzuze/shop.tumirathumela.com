import Link from "next/link";

export const metadata = {
  title: "Conditions of Use & Sale — TumiraThumela",
  description: "Terms and conditions for using TumiraThumela and purchasing products.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Conditions of Use &amp; Sale</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-2">Conditions of Use &amp; Sale</h1>
      <p className="text-[#565959] text-sm mb-8">Last updated: July 2026</p>

      <div className="space-y-8 text-sm text-[#0F1111]">
        <section>
          <h2 className="text-base font-bold mb-2">1. Acceptance of terms</h2>
          <p className="text-[#565959] leading-relaxed">
            By accessing or using shop.tumirathumela.com (&ldquo;TumiraThumela&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;), you agree to these Conditions of Use &amp; Sale. If you do not agree,
            please do not use this site.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">2. Accounts</h2>
          <p className="text-[#565959] leading-relaxed">
            You must provide accurate information when creating an account and are responsible
            for keeping your login credentials secure. You must be at least 18 years old, or
            have a parent or guardian&apos;s permission, to make a purchase.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">3. Orders &amp; pricing</h2>
          <p className="text-[#565959] leading-relaxed">
            All prices are shown in ZAR (South Africa) or USD (Zimbabwe) and include applicable
            taxes unless stated otherwise. We reserve the right to correct pricing errors and to
            cancel orders placed at an incorrect price before dispatch. Placing an order does not
            guarantee acceptance — we will confirm by email once your order is processed.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">4. Payment</h2>
          <p className="text-[#565959] leading-relaxed">
            Payments are processed securely via Yoco or PayFast. See{" "}
            <Link href="/payment-methods" className="text-[#007185] hover:underline">
              Payment Methods
            </Link>{" "}
            for details. We do not store your full card details.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">5. Delivery</h2>
          <p className="text-[#565959] leading-relaxed">
            Delivery estimates are provided in good faith and are not guaranteed. See{" "}
            <Link href="/shipping" className="text-[#007185] hover:underline">
              Shipping &amp; Delivery
            </Link>{" "}
            for typical timeframes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">6. Returns &amp; refunds</h2>
          <p className="text-[#565959] leading-relaxed">
            Our return policy is set out in full at{" "}
            <Link href="/returns" className="text-[#007185] hover:underline">
              Returns &amp; Refunds
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">7. Product listings</h2>
          <p className="text-[#565959] leading-relaxed">
            We aim to display product information, including images and pricing, as accurately
            as possible. We do not warrant that product descriptions are error-free.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">8. Limitation of liability</h2>
          <p className="text-[#565959] leading-relaxed">
            To the extent permitted by law, TumiraThumela is not liable for indirect or
            consequential loss arising from use of this site or delayed delivery, except where
            such liability cannot be excluded under South African or Zimbabwean law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">9. Governing law</h2>
          <p className="text-[#565959] leading-relaxed">
            These terms are governed by the laws of the Republic of South Africa.
          </p>
        </section>

        <section className="border-t border-[#ddd] pt-6">
          <h2 className="text-base font-bold mb-2">Contact</h2>
          <p className="text-[#565959]">
            Questions about these terms? Email{" "}
            <a href="mailto:support@tumirathumela.com" className="text-[#007185] hover:underline">
              support@tumirathumela.com
            </a>{" "}
            or see our{" "}
            <Link href="/legal-notice" className="text-[#007185] hover:underline">
              Legal Notice
            </Link>{" "}
            for company details.
          </p>
        </section>
      </div>
    </div>
  );
}
