import Link from "next/link";

export const metadata = {
  title: "TumiraThumela App",
  description: "The TumiraThumela mobile app is on the way.",
};

export default function AppPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#EAEDED]">
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="text-6xl mb-6">📱</div>
        <h1 className="text-3xl font-bold text-[#131921] mb-4">
          The TumiraThumela App — Coming Soon
        </h1>
        <p className="text-[#565959] text-base mb-6 leading-relaxed">
          We&apos;re building a mobile app for faster shopping, order tracking, and
          notifications on the go — for both South Africa and Zimbabwe. In the
          meantime, shop.tumirathumela.com works great in your mobile browser.
        </p>
        <Link
          href="/"
          className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm px-8 py-2.5 text-sm font-normal text-[#0F1111] transition-colors inline-block"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
