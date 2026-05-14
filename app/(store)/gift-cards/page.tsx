import Link from "next/link";

export const metadata = {
  title: "Gift Cards — TumiraThumela",
  description: "Give the gift of choice with TumiraThumela gift cards. Coming soon to South Africa and Zimbabwe.",
};

export default function GiftCardsPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#EAEDED]">
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="text-6xl mb-6">🎁</div>
        <h1 className="text-3xl font-bold text-[#131921] mb-4">
          Gift Cards — Coming Soon
        </h1>
        <p className="text-[#565959] text-base mb-6 leading-relaxed">
          We&apos;re working on a digital gift card system for South Africa and Zimbabwe. 
          Soon you&apos;ll be able to send the perfect gift to anyone, anywhere across 
          Southern Africa — redeemable on thousands of products.
        </p>
        <div className="bg-white border border-[#ddd] rounded p-4 text-sm text-[#565959] mb-8">
          <p className="font-bold text-[#0F1111] mb-1">Want to be notified first?</p>
          <p>Sign in and we&apos;ll email you when gift cards launch.</p>
        </div>
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
