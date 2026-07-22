import Link from "next/link";

export const metadata = {
  title: "Legal Notice — TumiraThumela",
  description: "Company and registration details for TumiraThumela.",
};

export default function LegalNoticePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Legal Notice</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-6">Legal Notice</h1>

      <div className="space-y-6 text-sm text-[#0F1111]">
        <section>
          <h2 className="text-base font-bold mb-2">Operator</h2>
          <p className="text-[#565959] leading-relaxed">
            This site is operated by Tumira Thumela Online, a company operating in South
            Africa and Zimbabwe.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Registered address</h2>
          <p className="text-[#565959]">222 Smit Street, Braamfontein, Johannesburg, 2001, South Africa</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Contact</h2>
          <dl className="space-y-1 text-[#565959]">
            <div className="flex gap-2">
              <dt className="font-medium w-16 shrink-0">Phone</dt>
              <dd>
                <a href="tel:+27115680663" className="text-[#007185] hover:underline">+27 11 568 0663</a>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium w-16 shrink-0">Email</dt>
              <dd>
                <a href="mailto:support@tumirathumela.com" className="text-[#007185] hover:underline">
                  support@tumirathumela.com
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Related policies</h2>
          <ul className="list-disc list-inside space-y-1 text-[#007185]">
            <li><Link href="/terms" className="hover:underline">Conditions of Use &amp; Sale</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy Notice</Link></li>
            <li><Link href="/cookies" className="hover:underline">Cookies Notice</Link></li>
            <li><Link href="/returns" className="hover:underline">Returns &amp; Refunds</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
