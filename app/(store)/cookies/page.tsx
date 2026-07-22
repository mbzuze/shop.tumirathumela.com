import Link from "next/link";

export const metadata = {
  title: "Cookies Notice — TumiraThumela",
  description: "How TumiraThumela uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Cookies Notice</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-2">Cookies Notice</h1>
      <p className="text-[#565959] text-sm mb-8">Last updated: July 2026</p>

      <div className="space-y-8 text-sm text-[#0F1111]">
        <section>
          <h2 className="text-base font-bold mb-2">What are cookies?</h2>
          <p className="text-[#565959] leading-relaxed">
            Cookies are small text files stored on your device that help websites remember
            information about your visit.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">How we use cookies</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-[#0F1111]">Essential cookies</h3>
              <p className="text-[#565959] leading-relaxed">
                Required for the site to work — keeping you signed in, remembering items in
                your cart, and securing checkout.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F1111]">Preference cookies</h3>
              <p className="text-[#565959] leading-relaxed">
                Remember your delivery country and currency (South Africa/ZAR or
                Zimbabwe/USD) so you don&apos;t need to reselect it on every visit.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F1111]">Analytics cookies</h3>
              <p className="text-[#565959] leading-relaxed">
                Help us understand how shoppers use the site so we can improve it.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Managing cookies</h2>
          <p className="text-[#565959] leading-relaxed">
            Most browsers let you control cookies through their settings. Blocking essential
            cookies may prevent parts of the site — like sign-in or checkout — from working
            correctly.
          </p>
        </section>

        <section className="border-t border-[#ddd] pt-6">
          <h2 className="text-base font-bold mb-2">Questions?</h2>
          <p className="text-[#565959]">
            See our{" "}
            <Link href="/privacy" className="text-[#007185] hover:underline">
              Privacy Notice
            </Link>{" "}
            or email{" "}
            <a href="mailto:privacy@tumirathumela.com" className="text-[#007185] hover:underline">
              privacy@tumirathumela.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
