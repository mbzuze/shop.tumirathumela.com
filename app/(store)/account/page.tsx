import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

export const metadata = {
  title: "Your Account — TumiraThumela",
  description: "Manage your TumiraThumela orders, addresses, and account settings.",
};

function AccountCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-[#ddd] rounded-sm p-5 bg-white hover:shadow-md hover:border-[#007185] transition-all"
    >
      <h2 className="font-bold text-[#0F1111] mb-1">{title}</h2>
      <p className="text-sm text-[#565959]">{description}</p>
    </Link>
  );
}

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const displayName =
    user.firstName ??
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ??
    "there";
  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <nav className="text-sm text-[#007185] mb-4">
        <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Your Account</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-1">
        Hello, {displayName}
      </h1>
      {email && <p className="text-sm text-[#565959] mb-6">{email}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AccountCard
          href="/orders"
          title="Your Orders"
          description="Track, return, or buy things again from your order history."
        />
        <AccountCard
          href="/account/addresses"
          title="Your Addresses"
          description="Add, edit, or remove delivery addresses for South Africa and Zimbabwe."
        />
        <AccountCard
          href="/cart"
          title="Your Cart"
          description="Review items you've added and continue checking out."
        />
        <AccountCard
          href="/customer-service"
          title="Customer Service"
          description="Get help with an order, a return, or a general question."
        />
        <AccountCard
          href="/returns"
          title="Returns & Refunds"
          description="Read our return policy and start a return."
        />
        <AccountCard
          href="/track-order"
          title="Track a Package"
          description="Check the delivery status of a recent order."
        />
      </div>

      <div className="mt-8 pt-6 border-t border-[#ddd] flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0F1111] mb-1">
            Login &amp; Security
          </h2>
          <p className="text-sm text-[#565959]">
            Signed in as {email ?? user.username ?? "your account"}.
          </p>
        </div>
        <SignOutButton redirectUrl="/">
          <button className="border border-[#888c8c] rounded-sm px-6 py-2 text-sm text-[#0F1111] hover:bg-[#f7f8f8] transition-colors cursor-pointer">
            Sign out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
