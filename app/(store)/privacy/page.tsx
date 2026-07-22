import Link from "next/link";

export const metadata = {
  title: "Privacy Notice — TumiraThumela",
  description: "How TumiraThumela collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Privacy Notice</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-2">Privacy Notice</h1>
      <p className="text-[#565959] text-sm mb-8">Last updated: July 2026</p>

      <div className="space-y-8 text-sm text-[#0F1111]">
        <section>
          <h2 className="text-base font-bold mb-2">Information we collect</h2>
          <ul className="list-disc list-inside space-y-1 text-[#565959]">
            <li>Account details: name, email address, phone number</li>
            <li>Delivery addresses and order history</li>
            <li>Payment confirmation data from our payment processors (we do not store full card numbers)</li>
            <li>Basic usage data such as pages visited and device/browser type</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">How we use it</h2>
          <p className="text-[#565959] leading-relaxed">
            We use your information to process and deliver orders, provide customer support,
            secure your account, and improve our products and services. We do not sell your
            personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Who we share it with</h2>
          <ul className="list-disc list-inside space-y-1 text-[#565959]">
            <li><strong>Clerk</strong> — authentication and account management</li>
            <li><strong>Yoco &amp; PayFast</strong> — payment processing</li>
            <li>Delivery couriers — to fulfil your order</li>
          </ul>
          <p className="text-[#565959] leading-relaxed mt-2">
            We share only the information each provider needs to perform their service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Your rights</h2>
          <p className="text-[#565959] leading-relaxed">
            You can access, update, or delete your account information at any time from{" "}
            <Link href="/account" className="text-[#007185] hover:underline">Your Account</Link>,
            or by contacting us directly.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">Data retention</h2>
          <p className="text-[#565959] leading-relaxed">
            We retain order and account information for as long as needed to provide our
            services and to meet legal, tax, and accounting requirements.
          </p>
        </section>

        <section className="border-t border-[#ddd] pt-6">
          <h2 className="text-base font-bold mb-2">Contact us</h2>
          <p className="text-[#565959]">
            For privacy questions or requests, email{" "}
            <a href="mailto:privacy@tumirathumela.com" className="text-[#007185] hover:underline">
              privacy@tumirathumela.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
