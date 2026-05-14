import Link from "next/link";

export const metadata = {
  title: "Welcome to TumiraThumela — Cross-Border Shopping for Southern Africa",
  description: "TumiraThumela is your gateway to cross-border e-commerce across South Africa and Zimbabwe.",
};

export default function WelcomePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <div className="bg-[#131921] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to TumiraThumela
          </h1>
          <p className="text-xl text-[#FEBD69] font-medium mb-3">
            Southern Africa&apos;s Cross-Border Marketplace
          </p>
          <p className="text-[#a4a9b6] text-base max-w-2xl mx-auto leading-relaxed">
            Shop quality products delivered across South Africa and Zimbabwe. 
            We bridge the gap between the two nations so you can access the 
            products you need — wherever you are.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: "🛍️",
            title: "Wide Product Selection",
            body: "From electronics to everyday essentials — curated products available for delivery to South Africa and Zimbabwe.",
          },
          {
            icon: "🚚",
            title: "Cross-Border Delivery",
            body: "Seamless delivery logistics between Johannesburg and Harare. Order from SA, delivered to ZW, and vice versa.",
          },
          {
            icon: "💱",
            title: "Dual Currency Support",
            body: "Prices displayed in ZAR for South Africa and USD for Zimbabwe — with real-time exchange rate calculations.",
          },
        ].map((f) => (
          <div key={f.title} className="text-center p-6 border border-[#ddd] rounded">
            <div className="text-4xl mb-3">{f.icon}</div>
            <h2 className="text-base font-bold text-[#0F1111] mb-2">{f.title}</h2>
            <p className="text-sm text-[#565959] leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#EAEDED] py-10 px-4 text-center">
        <h2 className="text-xl font-bold text-[#0F1111] mb-4">Ready to start shopping?</h2>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/"
            className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm px-8 py-2.5 text-sm font-normal text-[#0F1111] transition-colors"
          >
            Shop Now
          </Link>
          <Link
            href="/search?query=best+sellers"
            className="border border-[#888c8c] rounded-sm px-8 py-2.5 text-sm text-[#0F1111] hover:bg-white transition-colors"
          >
            View Best Sellers
          </Link>
        </div>
      </div>
    </div>
  );
}
