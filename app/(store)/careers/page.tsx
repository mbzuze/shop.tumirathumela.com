import Link from "next/link";

export const metadata = {
  title: "Careers — TumiraThumela",
  description: "Join the team building Southern Africa's cross-border marketplace.",
};

export default function CareersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-[#007185] mb-6">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Careers</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-6">Careers at TumiraThumela</h1>

      <div className="space-y-6 text-sm text-[#0F1111] leading-relaxed">
        <p>
          We&apos;re a growing cross-border marketplace connecting shoppers across
          South Africa and Zimbabwe. As we expand our catalog, logistics, and
          technology, we&apos;re always interested in hearing from people who want
          to help build that.
        </p>

        <section>
          <h2 className="text-lg font-bold mb-2">Areas we typically hire for</h2>
          <ul className="list-disc list-inside space-y-1 text-[#565959]">
            <li>Warehouse &amp; fulfilment</li>
            <li>Customer service</li>
            <li>Logistics &amp; cross-border delivery</li>
            <li>Software engineering</li>
            <li>Merchandising &amp; category management</li>
          </ul>
        </section>

        <section className="bg-[#f7fafa] border border-[#ddd] rounded p-6">
          <h2 className="text-base font-bold mb-2">No open roles listed right now?</h2>
          <p className="text-[#565959]">
            Send your CV and a short note about what you&apos;re looking for to{" "}
            <a href="mailto:careers@tumirathumela.com" className="text-[#007185] hover:underline">
              careers@tumirathumela.com
            </a>{" "}
            and we&apos;ll keep it on file for when a relevant role opens up.
          </p>
        </section>
      </div>
    </div>
  );
}
