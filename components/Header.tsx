"use client";

import { ClerkLoaded, SignedIn, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Form from "next/form";
import { PackageIcon, TrolleyIcon } from "@sanity/icons";

function Header() {


    const { user } = useUser();

    return (
        <header className="flex flex-wrap justify-between items-center px-4 py-2">
            {/* Top Row*/}
            <div className="flex flex-wrap justify-between items-center w-full">
                <Link
                    href="/"
                    className="text-2xl font-bold text-blue-500 hover:text-blue-700 cursor-pointer mx-auto sm:mx-0"
                >
                    TumiraThumela
                </Link>
                <Form
                    action="/search"
                    className="w-full sm:w-auto sm:flex-1 sm:mx-4 mt-2 sm:mt-0"
                >
                    <input
                        type="text"
                        name="query"
                        placeholder="Search for products..."
                        className="border border-gray-300 rounded-md px-4 py-2 w-full max-w-4xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    />

                </Form>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0 flex-1 sm:flex-none">
                    <Link href="/login" className="text-gray-600"></Link>
                    <Link
                        href="/cart"
                        className="flex-1 relative flex justify-center sm:justify-start sm:flex-none items-center space-x-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                        <TrolleyIcon className="w-6 h-6" />
                        {/* count of items in cart */}
                        <span className="text-sm">My Cart</span>
                    </Link>


                    {/* User Area */}
                    <ClerkLoaded>
                        <SignedIn>
                            <Link
                                href="/orders"
                                className="flex-1 relative flex justify-center sm:justify-start sm:flex-none items-center space-x-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
                            >
                                <PackageIcon className="w-6 h-6" />
                                <span className="text-sm">My Orders</span>
                            </Link>
                        </SignedIn>

                        {user ? (
                            <div className="flex items-center space-x-4">
                                <UserButton />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Welcome</p>
                                    <p className="text-sm font-medium text-gray-500">{user.firstName}</p>
                                </div>
                            </div>
                        ) : (
                            <SignInButton mode="modal" />
                        )}
                    </ClerkLoaded>




                </div>
            </div>
        </header>
    );
}

export default Header;