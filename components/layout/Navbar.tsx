"use client";

import Link from "next/link";
import Form from "next/form";
import { Search as SearchIcon, MapPin as PinIcon, Menu as MenuIcon, ShoppingCart as TrolleyIcon } from "lucide-react";
import useBasketStore from "@/store/store";
import useUIStore from "@/store/uiStore";
import useLocationStore from "@/store/locationStore";
import { ClerkLoaded, SignedIn } from "@clerk/nextjs";
import AccountMenu from "./AccountMenu";
import { useEffect, useState } from "react";
import { Category } from "@/lib/cms-types";

export default function Navbar({ categories }: { categories: Category[] }) {
  const [selectedDept, setSelectedDept] = useState("all");
  
  const itemCount = useBasketStore((state) =>

    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  
  const toggleDrawerMenu = useUIStore((state) => state.toggleDrawerMenu);
  const toggleCartDrawer = useUIStore((state) => state.toggleCartDrawer);
  const toggleLocationModal = useUIStore((state) => state.toggleLocationModal);
  
  const { city, initLocation } = useLocationStore();

  useEffect(() => {
    initLocation();
  }, [initLocation]);

  return (
    <nav className="bg-tt-navy text-white sticky top-0 z-50">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 space-x-2 sm:space-x-4">
        
        {/* Mobile Hamburger & Logo */}
        <div className="flex items-center">
          <button 
            onClick={toggleDrawerMenu}
            className="sm:hidden p-2 border border-transparent hover:border-white rounded cursor-pointer"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold text-white hover:text-tt-orange cursor-pointer border border-transparent hover:border-white p-1 rounded whitespace-nowrap"
          >
            TumiraThumela
          </Link>
        </div>

        {/* Delivery Location (Desktop Only) */}
        <div 
          onClick={toggleLocationModal}
          className="hidden md:flex items-center space-x-1 border border-transparent hover:border-white p-1 cursor-pointer rounded whitespace-nowrap"
        >
          <PinIcon className="w-5 h-5 self-end mb-1" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-300 leading-tight">Delivering to</span>
            <span className="font-bold text-sm leading-tight">{city || "Select Location"}</span>
          </div>
        </div>

        {/* Search Bar (Hidden on very small mobile, takes remaining space) */}
        <Form action="/search" className="hidden sm:flex flex-grow items-center relative rounded-md bg-white">
          <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] py-2 px-2 border-r border-gray-300 rounded-l-md cursor-pointer flex items-center min-w-[60px] justify-between relative group">
            <span className="truncate max-w-[80px]">
              {selectedDept === "all" ? "All" : (categories.find(c => c.slug?.current === selectedDept)?.name || "All")}
            </span>
            <span className="ml-1 text-[10px] opacity-70">▼</span>
            <select 
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              name="category"
            >
              <option value="all">All Departments</option>
              {categories
                .filter(c => !c.parentCategory)
                .map((cat) => (
                  <option key={cat._id} value={cat.slug?.current}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
          <input
            type="text"
            name="query"
            placeholder="Search TumiraThumela..."
            className="flex-grow h-10 px-4 focus:outline-none text-black w-full"
          />

          <button
            type="submit"
            className="bg-tt-orange hover:bg-tt-orange-hover h-10 w-12 flex items-center justify-center rounded-r-md transition-colors"
          >
            <SearchIcon className="w-6 h-6 text-black" />
          </button>
        </Form>

        {/* Mobile Search Icon */}
        <button className="sm:hidden p-2 text-white hover:text-tt-orange">
          <SearchIcon className="w-6 h-6" />
        </button>

        {/* Right side items */}
        <div className="flex items-center space-x-1 sm:space-x-4">
          
          {/* Account & Lists (Desktop Only) */}
          <div className="hidden sm:block">
            <AccountMenu />
          </div>

          <ClerkLoaded>
            <SignedIn>
              {/* Returns & Orders (Desktop Only) */}
              <Link
                href="/orders"
                className="hidden lg:flex flex-col border border-transparent hover:border-white p-1 cursor-pointer rounded"
              >
                <span className="text-xs text-gray-300 leading-tight">Returns</span>
                <span className="font-bold text-sm leading-tight">& Orders</span>
              </Link>
            </SignedIn>
          </ClerkLoaded>

          {/* Basket */}
          <div
            onClick={toggleCartDrawer}
            className="relative flex items-end border border-transparent hover:border-white p-1 sm:px-2 cursor-pointer rounded"
          >
            <TrolleyIcon className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="hidden sm:inline font-bold text-sm mb-1">Cart</span>
            <span className="absolute top-0 right-1 sm:right-6 bg-tt-orange text-black font-bold text-sm rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar (Shows below on mobile) */}
      <div className="sm:hidden px-2 pb-2">
         <Form action="/search" className="flex flex-grow items-center relative rounded-md bg-white w-full">
          <input
            type="text"
            name="query"
            placeholder="Search TumiraThumela..."
            className="flex-grow h-10 px-4 focus:outline-none text-black w-full rounded-l-md"
          />
          <button
            type="submit"
            className="bg-tt-orange hover:bg-tt-orange-hover h-10 w-12 flex items-center justify-center rounded-r-md transition-colors"
          >
            <SearchIcon className="w-6 h-6 text-black" />
          </button>
        </Form>
      </div>
    </nav>
  );
}
