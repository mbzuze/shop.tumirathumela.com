"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import useUIStore from "@/store/uiStore";
import { ClerkLoaded, SignedIn, SignedOut, SignInButton, useUser, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import useLocationStore from "@/store/locationStore";
import { Category } from "@/sanity.types";
import { useState, useMemo } from "react";
import { ChevronRightIcon, ChevronLeftIcon } from "@sanity/icons";

interface DrawerMenuProps {
  categories: Category[];
}

const MAIN_DEPARTMENTS = ["Beauty", "Books", "Computer & Office", "Electronics", "Home & Kitchen"];

export default function DrawerMenu({ categories }: DrawerMenuProps) {
  const { drawerMenuOpen, setDrawerMenu } = useUIStore();
  const { user } = useUser();
  const { signOut } = useAuth();
  const { country, setLocation } = useLocationStore();

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [showAllDepartments, setShowAllDepartments] = useState(false);

  const handleClose = () => {
    setDrawerMenu(false);
    setTimeout(() => {
      setActiveCategory(null);
      setShowAllDepartments(false);
    }, 300); // Reset after transition
  };



  const toggleLocale = () => {
    setLocation(country === "ZA" ? "ZW" : "ZA", "City"); // Just flipping for now
  };

  return (
    <Sheet open={drawerMenuOpen} onOpenChange={setDrawerMenu}>
      <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0 bg-white overflow-y-auto">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        {/* Header - User Profile */}
        <div className="bg-tt-navy text-white p-4 py-6">
          <ClerkLoaded>
            <div className="flex items-center space-x-3">
              <SignedIn>
                <UserButton />
                <span className="font-bold text-lg">Hello, {user?.firstName}</span>
              </SignedIn>
              <SignedOut>
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <SignInButton mode="modal">
                  <span className="font-bold text-lg hover:underline cursor-pointer">Hello, sign in</span>
                </SignInButton>
              </SignedOut>
            </div>
          </ClerkLoaded>
        </div>

        {/* Menu Items */}
        {/* Menu Items */}
        <div className="flex flex-col text-sm text-gray-800 relative overflow-x-hidden">
          
          <div className={`transition-transform duration-300 ease-in-out ${activeCategory ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className="py-4 border-b border-gray-200">
              <h3 className="font-bold text-lg px-6 mb-2">Trending</h3>
              <Link href="/best-sellers" onClick={handleClose} className="block px-6 py-3 hover:bg-gray-100 font-medium">
                Best Sellers
              </Link>

              <Link href="/search?tag=new-arrival" onClick={handleClose} className="block px-6 py-3 hover:bg-gray-100 font-medium">
                New Releases
              </Link>
            </div>
  
            <div className="py-4 border-b border-gray-200">
              <h3 className="font-bold text-lg px-6 mb-2">Shop By Department</h3>
              {categories
                .filter(c => !c.parentCategory)
                .sort((a, b) => {
                  const aMain = MAIN_DEPARTMENTS.indexOf(a.name || "");
                  const bMain = MAIN_DEPARTMENTS.indexOf(b.name || "");
                  if (aMain !== -1 && bMain !== -1) return aMain - bMain;
                  if (aMain !== -1) return -1;
                  if (bMain !== -1) return 1;
                  return (a.name || "").localeCompare(b.name || "");
                })
                .slice(0, showAllDepartments ? undefined : 5)
                .map((cat) => (
                  <button 
                    key={cat._id} 
                    onClick={() => setActiveCategory(cat)}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-100 w-full text-left group"
                  >
                    <span className="group-hover:text-tt-orange transition-colors">{cat.name}</span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-tt-orange" />
                  </button>
                ))}
              
              {!showAllDepartments && categories.filter(c => !c.parentCategory).length > 5 && (
                <button 
                  onClick={() => setShowAllDepartments(true)}
                  className="flex items-center space-x-2 px-6 py-3 hover:bg-gray-100 w-full text-left font-medium group"
                >
                  <span className="group-hover:text-tt-orange transition-colors">See all</span>
                  <span className="text-gray-400 group-hover:text-tt-orange transition-colors">▾</span>
                </button>
              )}

              {showAllDepartments && (
                <button 
                  onClick={() => setShowAllDepartments(false)}
                  className="flex items-center space-x-2 px-6 py-3 hover:bg-gray-100 w-full text-left font-medium group"
                >
                  <span className="group-hover:text-tt-orange transition-colors">See less</span>
                  <span className="text-gray-400 group-hover:text-tt-orange transition-colors">▴</span>
                </button>
              )}
            </div>

  
            <div className="py-4 border-b border-gray-200">
              <h3 className="font-bold text-lg px-6 mb-2">Programs & Features</h3>
              <Link href="/gift-cards" onClick={handleClose} className="block px-6 py-3 hover:bg-gray-100">
                Gift Cards
              </Link>
              <Link href="/sell" onClick={handleClose} className="block px-6 py-3 hover:bg-gray-100">
                Sell on TumiraThumela
              </Link>
            </div>

            <div className="py-4 mb-8">
              <h3 className="font-bold text-lg px-6 mb-2">Help & Settings</h3>
              <Link href="/account" onClick={handleClose} className="block px-6 py-3 hover:bg-gray-100">
                Your Account
              </Link>
              
              <button onClick={toggleLocale} className="flex items-center space-x-2 px-6 py-3 hover:bg-gray-100 w-full text-left">
                <span>🌐</span>
                <span>{country === "ZW" ? "🇿🇼 Zimbabwe" : "🇿🇦 South Africa"}</span>
              </button>
              
              <Link href="/customer-service" onClick={handleClose} className="block px-6 py-3 hover:bg-gray-100">
                Customer Service
              </Link>

              <ClerkLoaded>
                <SignedIn>
                  <button onClick={() => { signOut(); handleClose(); }} className="block w-full text-left px-6 py-3 hover:bg-gray-100">
                    Sign out
                  </button>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button onClick={handleClose} className="block w-full text-left px-6 py-3 hover:bg-gray-100">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
              </ClerkLoaded>
            </div>
          </div>

          {/* Sub-menu (Layered) */}
          <div className={`absolute top-0 left-0 w-full min-h-full bg-white transition-transform duration-300 ease-in-out ${activeCategory ? 'translate-x-0' : 'translate-x-full'}`}>
            {activeCategory && (
              <div className="flex flex-col h-full">
                <button 
                  onClick={() => setActiveCategory(null)}
                  className="flex items-center space-x-2 px-6 py-4 border-b border-gray-200 hover:bg-gray-50 font-bold text-base"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                  <span>MAIN MENU</span>
                </button>

                <div className="py-4">
                  <h3 className="font-bold text-lg px-6 mb-4 uppercase text-gray-500 tracking-wider">
                    {activeCategory.name}
                  </h3>
                  
                  <Link 
                    href={`/categories/${activeCategory.slug}`} 
                    onClick={handleClose} 
                    className="block px-6 py-3 hover:bg-gray-100 font-medium"
                  >
                    All {activeCategory.name}
                  </Link>

                  {categories
                    .filter(c => (c.parentCategory as any)?._id === activeCategory._id)
                    .map((sub) => (
                      <Link 
                        key={sub._id} 
                        href={`/categories/${sub.slug}`} 
                        onClick={handleClose} 
                        className="block px-6 py-3 hover:bg-gray-100"
                      >
                        {sub.name}
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

          
      </SheetContent>
    </Sheet>
  );
}
