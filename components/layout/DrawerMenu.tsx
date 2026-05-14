"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import useUIStore from "@/store/uiStore";
import { ClerkLoaded, SignedIn, SignedOut, SignInButton, useUser, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import useLocationStore from "@/store/locationStore";

export default function DrawerMenu() {
  const { drawerMenuOpen, setDrawerMenu } = useUIStore();
  const { user } = useUser();
  const { signOut } = useAuth();
  const { country, setLocation } = useLocationStore();

  const handleClose = () => setDrawerMenu(false);

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
        <div className="flex flex-col text-sm text-gray-800">
          
          <div className="py-4 border-b border-gray-200">
            <h3 className="font-bold text-lg px-6 mb-2">Trending</h3>
            <Link href="/category/best-sellers" onClick={handleClose} className="block px-6 py-3 hover:bg-gray-100">
              Best Sellers
            </Link>
            <Link href="#" onClick={handleClose} className="block px-6 py-3 hover:bg-gray-100">
              New Releases
            </Link>
          </div>

          <div className="py-4 border-b border-gray-200">
            <h3 className="font-bold text-lg px-6 mb-2">Shop By Department</h3>
            {["Beauty", "Books", "Computer & Office", "Electronics", "Home & Kitchen"].map((dept) => (
              <Link key={dept} href={`/search?query=${dept}`} onClick={handleClose} className="flex items-center justify-between px-6 py-3 hover:bg-gray-100">
                <span>{dept}</span>
                <span className="text-gray-400">›</span>
              </Link>
            ))}
            <button className="flex items-center space-x-2 px-6 py-3 hover:bg-gray-100 w-full text-left">
              <span>See all</span>
              <span className="text-gray-400">▾</span>
            </button>
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
      </SheetContent>
    </Sheet>
  );
}
