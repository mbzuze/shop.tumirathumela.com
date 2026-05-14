"use client";

import { ClerkLoaded, SignedIn, SignedOut, SignInButton, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function AccountMenu() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative border-2 border-transparent hover:border-white p-1 cursor-pointer flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <p className="text-xs">Hello, {user ? user.firstName : "sign in"}</p>
      <div className="flex items-center">
        <p className="font-bold text-sm">Account & Lists</p>
        <span className="ml-1 text-xs text-gray-400">▼</span>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white text-black shadow-lg rounded-md p-4 z-50 cursor-default" onClick={(e) => e.stopPropagation()}>
          <ClerkLoaded>
            <div className="flex flex-col items-center border-b border-gray-200 pb-4 mb-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-tt-orange hover:bg-tt-orange-hover text-black w-full py-2 rounded-md font-bold mb-2 shadow-sm">
                    Sign in
                  </button>
                </SignInButton>
                <p className="text-xs text-gray-600">
                  New customer?{" "}
                  <SignInButton mode="modal">
                    <span className="text-blue-600 hover:underline cursor-pointer">Start here.</span>
                  </SignInButton>
                </p>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center space-x-3 w-full">
                  <UserButton />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Hi, {user?.firstName}</span>
                    <span className="text-xs text-gray-500">{user?.emailAddresses[0]?.emailAddress}</span>
                  </div>
                </div>
              </SignedIn>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-bold mb-2">Your Lists</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-tt-orange hover:underline">
                      Create a List
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-tt-orange hover:underline">
                      Find a List or Registry
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <h3 className="font-bold mb-2">Your Account</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/account" className="hover:text-tt-orange hover:underline">
                      Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/orders" className="hover:text-tt-orange hover:underline">
                      Orders
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-tt-orange hover:underline">
                      Recommendations
                    </Link>
                  </li>
                  <SignedIn>
                    <li className="pt-2 mt-2 border-t border-gray-100">
                      {/* For Clerk sign out, it's generally handled by UserButton, but we can provide a manual link or just rely on UserButton */}
                      <span className="text-gray-500 text-xs italic">Use avatar to sign out</span>
                    </li>
                  </SignedIn>
                </ul>
              </div>
            </div>
          </ClerkLoaded>
        </div>
      )}
    </div>
  );
}
