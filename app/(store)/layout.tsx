import type { Metadata } from "next";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/layout/Navbar";
import SecondaryNav from "@/components/layout/SecondaryNav";
import DrawerMenu from "@/components/layout/DrawerMenu";
import CartDrawer from "@/components/layout/CartDrawer";
import LocationModal from "@/components/layout/LocationModal";
import Footer from "@/components/layout/Footer";
import { getAllCategories } from "@/sanity/lib/products/getAllCategories";
import { SanityLive } from "@/sanity/lib/live";

export const metadata: Metadata = {
  title: "Tumira Thumela",
  description: "Homepage",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getAllCategories();

  return (
    <ClerkProvider dynamic>
      <html lang="en">
        <body>
          <main className="min-h-screen flex flex-col bg-gray-50">
            <Navbar categories={categories} />
            <SecondaryNav />
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
          </main>

          <DrawerMenu categories={categories} />

          <CartDrawer />
          <LocationModal />

          <SanityLive />
        </body>
      </html>
    </ClerkProvider>
  );
}
