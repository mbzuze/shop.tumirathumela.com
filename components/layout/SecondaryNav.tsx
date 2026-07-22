"use client";

import Link from "next/link";
import { Menu as MenuIcon } from "lucide-react";
import useLocationStore from "@/store/locationStore";
import useUIStore from "@/store/uiStore";

export default function SecondaryNav() {
  const { country } = useLocationStore();
  const toggleDrawerMenu = useUIStore((state) => state.toggleDrawerMenu);

  return (
    <div className="bg-tt-navy-light text-white px-2 sm:px-4 py-1 text-sm flex items-center overflow-x-auto whitespace-nowrap no-scrollbar border-b border-gray-700 shadow-sm">
      <button 
        onClick={toggleDrawerMenu}
        className="flex items-center space-x-1 font-bold border border-transparent hover:border-white p-1 rounded cursor-pointer mr-2"
      >
        <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        <span>All</span>
      </button>
      
      <div className="flex items-center space-x-1 sm:space-x-3">
        <Link href="/customer-service" className="hover:border-white border border-transparent p-1 rounded">
          Customer Service
        </Link>
        <Link href="/deals" className="hover:border-white border border-transparent p-1 rounded">
          Today's Deals
        </Link>
        <Link href="/categories/everyday-essentials" className="hover:border-white border border-transparent p-1 rounded hidden sm:block">
          Everyday Essentials
        </Link>
        <Link href="/best-sellers" className="hover:border-white border border-transparent p-1 rounded">
          Best Sellers
        </Link>

        
        {/* Dynamic Locale Link */}
        <Link 
          href={country === "ZW" ? "/search?query=zimbabwe" : "/search?query=south+africa"} 
          className="hover:border-white border border-transparent p-1 rounded font-semibold text-tt-orange"
        >
          {country === "ZW" ? "Shop Zim" : "Shop Mzansi"}
        </Link>
        
        <Link href="/gift-cards" className="hover:border-white border border-transparent p-1 rounded hidden md:block">
          Gift Cards
        </Link>
        <Link href="/sell" className="hover:border-white border border-transparent p-1 rounded hidden md:block">
          Sell
        </Link>
        <Link href="/welcome" className="hover:border-white border border-transparent p-1 rounded hidden lg:block">
          Welcome to TumiraThumela
        </Link>
      </div>
    </div>
  );
}
