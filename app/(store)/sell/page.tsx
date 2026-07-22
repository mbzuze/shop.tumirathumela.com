import Link from "next/link";

export const metadata = {
  title: "Sell on TumiraThumela",
  description: "Apply to sell your products on TumiraThumela, reaching customers across South Africa and Zimbabwe.",
};

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-tt-orange text-white flex items-center justify-center font-bold shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-bold text-[#0F1111] mb-1">{title}</h3>
        <p className="text-sm text-[#565959] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function SellPage() {
  return (
    <div className="bg-white">
      <div className="bg-tt-navy text-white px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Sell on TumiraThumela</h1>
        <p className="text-lg text-gray-200 max-w-2xl mx-auto">
          Reach customers across South Africa and Zimbabwe through our cross-border
          marketplace, with dual-currency pricing and local delivery handled for you.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="text-center">
            <p className="text-3xl font-bold text-tt-orange mb-1">2</p>
            <p className="text-sm text-[#565959]">Countries reached at launch</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-tt-orange mb-1">15+</p>
            <p className="text-sm text-[#565959]">Product categories live</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-tt-orange mb-1">ZAR / USD</p>
            <p className="text-sm text-[#565959]">Dual-currency checkout</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[#0F1111] mb-6">How it works</h2>
        <div className="space-y-6 mb-16">
          <StepCard
            number={1}
            title="Tell us about your products"
            description="Send us your product range, pricing, and stock levels using the form below. We review every application to make sure it's a good fit for our catalog."
          />
          <StepCard
            number={2}
            title="We onboard your catalog"
            description="Our team lists your products, sets up categories and imagery, and connects your inventory to our order and delivery pipeline."
          />
          <StepCard
            number={3}
            title="Start selling"
            description="Your products go live to shoppers across South Africa and Zimbabwe. Orders, payments, and customer service are handled through TumiraThumela."
          />
        </div>

        <div className="bg-[#f7fafa] border border-[#ddd] rounded p-8 text-center">
          <h2 className="text-xl font-bold text-[#0F1111] mb-2">Ready to apply?</h2>
          <p className="text-sm text-[#565959] mb-6 max-w-lg mx-auto">
            Email us with your business name, product categories, and a few photos of what
            you&apos;d like to sell, and our partnerships team will get back to you.
          </p>
          <a
            href="mailto:sell@tumirathumela.com?subject=Seller%20Application"
            className="inline-block bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm px-8 py-2.5 text-sm font-normal text-[#0F1111] transition-colors"
          >
            Email sell@tumirathumela.com
          </a>
          <p className="text-xs text-[#565959] mt-4">
            Or call us on{" "}
            <a href="tel:+27115680663" className="text-[#007185] hover:underline">
              +27 11 568 0663
            </a>{" "}
            (08:00–16:00, Mon–Sat).
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-[#007185] hover:underline">
            ← Back to shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
