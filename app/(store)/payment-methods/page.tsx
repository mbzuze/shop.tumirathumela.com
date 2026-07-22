import Link from "next/link";

export const metadata = {
  title: "Payment Methods — TumiraThumela",
  description: "Payment methods accepted on TumiraThumela: Yoco and PayFast.",
};

export default function PaymentMethodsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Payment Methods</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-2">Payment Methods</h1>
      <p className="text-[#565959] text-sm mb-8">
        We process checkout securely through two payment gateways:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="border border-[#ddd] rounded p-5 bg-white">
          <h2 className="font-bold text-[#0F1111] mb-1">Yoco</h2>
          <p className="text-sm text-[#565959] leading-relaxed">
            Card and instant EFT payments processed by Yoco, a leading South African
            payment processor.
          </p>
        </div>
        <div className="border border-[#ddd] rounded p-5 bg-white">
          <h2 className="font-bold text-[#0F1111] mb-1">PayFast</h2>
          <p className="text-sm text-[#565959] leading-relaxed">
            Card and EFT payments processed by PayFast, South Africa&apos;s established
            online payment gateway.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-sm text-[#0F1111]">
        <section>
          <h2 className="text-base font-bold mb-2">Is my payment secure?</h2>
          <p className="text-[#565959] leading-relaxed">
            Yes. All payments are processed through Yoco or PayFast, both PCI-DSS
            compliant payment processors. TumiraThumela never stores your full card
            details.
          </p>
        </section>
        <section>
          <h2 className="text-base font-bold mb-2">Which currency will I be charged in?</h2>
          <p className="text-[#565959] leading-relaxed">
            Orders delivered within South Africa are charged in ZAR. Orders delivered to
            Zimbabwe are charged in USD, calculated at checkout using current exchange rates.
          </p>
        </section>
        <section className="border-t border-[#ddd] pt-4">
          <p className="text-[#565959]">
            Questions about a payment?{" "}
            <Link href="/customer-service" className="text-[#007185] hover:underline">
              Contact customer service
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
