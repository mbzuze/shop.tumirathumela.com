"use client";

import { ClerkLoaded, SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function PersonalisedRecommendations() {
  const { user } = useUser();

  return (
    <div className="bg-white border-t border-b border-gray-200 py-10 my-8 w-full">
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 flex flex-col items-center justify-center text-center">
        <ClerkLoaded>
          
          {/* Guest State */}
          <SignedOut>
            <div className="space-y-3 max-w-sm">
              <p className="text-sm font-semibold text-gray-900">
                See personalized recommendations
              </p>
              <SignInButton mode="modal">
                <button className="w-full bg-tt-orange hover:bg-tt-orange-hover text-black py-2 rounded font-bold text-sm shadow-sm transition-colors cursor-pointer">
                  Sign in
                </button>
              </SignInButton>
              <p className="text-xs text-gray-500">
                New customer?{" "}
                <SignInButton mode="modal">
                  <span className="text-blue-600 hover:underline cursor-pointer">Start here.</span>
                </SignInButton>
              </p>
            </div>
          </SignedOut>

          {/* Authenticated State */}
          <SignedIn>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h2>
              <p className="text-sm text-gray-600">
                Based on your shopping history, we've curated custom departments for you.
              </p>
              <div className="flex gap-4 justify-center mt-6">
                <Link href="/orders">
                  <button className="border border-gray-300 hover:bg-gray-50 px-6 py-2 rounded text-sm font-medium">
                    Your Orders
                  </button>
                </Link>
                <Link href="/search?query=deals">
                  <button className="bg-tt-navy hover:bg-[#232F3E] text-white px-6 py-2 rounded text-sm font-medium">
                    Today's Deals
                  </button>
                </Link>
              </div>
            </div>
          </SignedIn>

        </ClerkLoaded>
      </div>
    </div>
  );
}
