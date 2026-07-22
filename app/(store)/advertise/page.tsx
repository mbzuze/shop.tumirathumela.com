import Link from "next/link";

export const metadata = {
  title: "Advertise Your Products — TumiraThumela",
  description: "Advertise your products on TumiraThumela and reach shoppers across South Africa and Zimbabwe.",
};

export default function AdvertisePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Advertise Your Products</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-6">Advertise Your Products</h1>

      <div className="space-y-6 text-sm text-[#0F1111] leading-relaxed">
        <p>
          Put your products in front of shoppers across South Africa and Zimbabwe
          with featured placement on TumiraThumela&apos;s homepage, category pages,
          and search results.
        </p>

        <section>
          <h2 className="text-lg font-bold mb-2">Advertising options</h2>
          <ul className="list-disc list-inside space-y-1 text-[#565959]">
            <li>Homepage banner placements</li>
            <li>Featured &amp; best-seller badge placement</li>
            <li>Sponsored search results within relevant categories</li>
            <li>Deal-of-the-day promotions</li>
          </ul>
        </section>

        <section className="bg-[#f7fafa] border border-[#ddd] rounded p-6">
          <h2 className="text-base font-bold mb-2">Get started</h2>
          <p className="text-[#565959]">
            Email{" "}
            <a href="mailto:advertise@tumirathumela.com" className="text-[#007185] hover:underline">
              advertise@tumirathumela.com
            </a>{" "}
            with your brand, the products you&apos;d like to promote, and your
            target market (South Africa, Zimbabwe, or both), and our team will get
            back to you with options and pricing.
          </p>
        </section>
      </div>
    </div>
  );
}
