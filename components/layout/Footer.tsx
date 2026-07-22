"use client";

import Link from "next/link";
import useLocationStore from "@/store/locationStore";

export default function Footer() {
  const { country } = useLocationStore();
  
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full text-sm">
      {/* Section 1: Back to top */}
      <button 
        onClick={handleScrollToTop}
        className="w-full bg-[#37475A] hover:bg-[#485769] text-white py-4 text-center cursor-pointer transition-colors"
      >
        Back to top
      </button>

      {/* Section 2: Links Grid */}
      <div className="bg-tt-navy text-white py-10 px-4 md:px-10 lg:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Get to Know Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/careers" className="hover:underline">Careers</Link></li>
              <li><Link href="/legal-notice" className="hover:underline">Legal Notice</Link></li>
              <li><Link href="/about" className="hover:underline">About TumiraThumela</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Make Money with Us</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/advertise" className="hover:underline">Advertise Your Products</Link></li>
              <li><Link href="/sell" className="hover:underline">Sell on TumiraThumela</Link></li>
              <li><Link href="/supply" className="hover:underline">Supply to TumiraThumela</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Payment Methods</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/payment-methods" className="hover:underline">Payment Methods Help</Link></li>
              <li><Link href="/payment-methods" className="hover:underline">Yoco &amp; PayFast Information</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Let Us Help You</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/track-order" className="hover:underline">Track Packages</Link></li>
              <li><Link href="/shipping" className="hover:underline">Shipping & Delivery</Link></li>
              <li><Link href="/returns" className="hover:underline">Returns & Replacements</Link></li>
              <li><Link href="/customer-service" className="hover:underline">Customer Service</Link></li>
              <li><Link href="/app" className="hover:underline">TumiraThumela App</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3: Logo & Locale */}
      <div className="bg-tt-navy text-white border-t border-gray-700 py-8 px-4 flex flex-col items-center">
        <Link href="/" className="text-2xl font-bold hover:text-tt-orange mb-6">
          TumiraThumela
        </Link>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
          <button className="border border-gray-400 rounded px-3 py-1 hover:border-white text-gray-300 flex items-center gap-2 text-xs">
             🌐 English
          </button>
          <button className="border border-gray-400 rounded px-3 py-1 hover:border-white text-gray-300 flex items-center gap-2 text-xs font-bold text-white">
             {country === "ZW" ? "🇿🇼 Zimbabwe" : "🇿🇦 South Africa"}
          </button>
        </div>
      </div>

      {/* Section 4 & 5: Legal & Copyright */}
      <div className="bg-[#131A22] text-white py-8 px-4 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-300 mb-4">
          <Link href="/terms" className="hover:underline">Conditions of Use & Sale</Link>
          <Link href="/privacy" className="hover:underline">Privacy Notice</Link>
          <Link href="/cookies" className="hover:underline">Cookies Notice</Link>
          <Link href="/legal-notice" className="hover:underline">Legal Notice</Link>
        </div>
        <p className="text-xs text-gray-400">
          © 2025–2026, TumiraThumela.com, Inc. or its affiliates
        </p>
      </div>
    </footer>
  );
}
