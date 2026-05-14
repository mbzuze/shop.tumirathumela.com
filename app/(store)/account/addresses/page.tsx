"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CustomerAddress } from "@/sanity/lib/addresses";
import { getMyAddressesAction, deleteMyAddressAction, setMyDefaultAddressAction } from "@/actions/addressActions";

// ── Country label helper ──────────────────────────────────────────────────────
const COUNTRY_LABELS: Record<string, string> = {
  ZA: "South Africa",
  ZW: "Zimbabwe",
};

// ── Single address card ───────────────────────────────────────────────────────
function AddressCard({
  address,
  onRemove,
  onSetDefault,
}: {
  address: CustomerAddress;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);

  const handleRemove = async () => {
    if (!confirm("Remove this address?")) return;
    setRemoving(true);
    await deleteMyAddressAction(address._id);
    onRemove(address._id);
  };

  const handleSetDefault = async () => {
    setSettingDefault(true);
    await setMyDefaultAddressAction(address._id);
    onSetDefault(address._id);
    setSettingDefault(false);
  };

  return (
    <div
      className={`relative border rounded-sm p-4 bg-white border-[#c8c8c8]`}
    >
      {address.isDefault && (
        <div className="text-xs text-[#565959] mb-2 flex items-center gap-1">
          <span className="font-semibold text-[#131921]">Default:</span>
          <span className="text-[#f90]">★</span>
        </div>
      )}

      <p className="font-bold text-sm text-[#0F1111]">{address.fullName}</p>
      <p className="text-sm text-[#0F1111]">{address.streetAddress}</p>
      {address.buildingDetails && (
        <p className="text-sm text-[#0F1111]">{address.buildingDetails}</p>
      )}
      {address.suburb && (
        <p className="text-sm text-[#0F1111]">{address.suburb}</p>
      )}
      <p className="text-sm text-[#0F1111]">
        {[address.city, address.province, address.postalCode]
          .filter(Boolean)
          .join(", ")}
      </p>
      <p className="text-sm text-[#0F1111]">
        {COUNTRY_LABELS[address.country] ?? address.country}
      </p>
      <p className="text-sm text-[#0F1111]">
        Phone number: {address.phone}
      </p>

      <div className="mt-3 flex items-center gap-0 text-sm">
        <Link
          href={`/account/addresses/edit/${address._id}`}
          className="text-[#007185] hover:text-[#C7511F] hover:underline pr-2 border-r border-[#c8c8c8]"
        >
          Edit
        </Link>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-[#007185] hover:text-[#C7511F] hover:underline px-2 border-r border-[#c8c8c8] disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
        {!address.isDefault && (
          <button
            onClick={handleSetDefault}
            disabled={settingDefault}
            className="text-[#007185] hover:text-[#C7511F] hover:underline pl-2 disabled:opacity-50"
          >
            {settingDefault ? "Setting…" : "Set as Default"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add address card ──────────────────────────────────────────────────────────
function AddAddressCard() {
  return (
    <Link
      href="/account/addresses/add"
      className="flex flex-col items-center justify-center border-2 border-dashed border-[#c8c8c8] rounded-sm p-8 hover:border-[#007185] hover:bg-[#f7fafa] transition-colors min-h-[160px] group"
    >
      <span className="text-4xl text-[#c8c8c8] group-hover:text-[#007185] mb-2 leading-none select-none">
        +
      </span>
      <span className="text-sm font-semibold text-[#0F1111] group-hover:text-[#007185]">
        Add address
      </span>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AddressesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    getMyAddressesAction().then((data) => {
      setAddresses(data);
      setLoading(false);
    });
  }, [isLoaded, user, router]);

  const handleRemove = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a._id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a._id === id }))
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-[#007185] mb-4">
        <Link href="/account" className="hover:underline hover:text-[#C7511F]">
          Your Account
        </Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Your Addresses</span>
      </nav>

      <h1 className="text-3xl font-normal text-[#0F1111] mb-6">
        Your Addresses
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-gray-100 rounded-sm animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AddAddressCard />
          {addresses.map((addr) => (
            <AddressCard
              key={addr._id}
              address={addr}
              onRemove={handleRemove}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Related links */}
      {!loading && (
        <div className="mt-8 pt-6 border-t border-[#ddd]">
          <h2 className="text-base font-semibold text-[#0F1111] mb-2">
            Related
          </h2>
          <ul className="space-y-1">
            <li>
              <Link
                href="/orders"
                className="text-sm text-[#007185] hover:underline hover:text-[#C7511F]"
              >
                Change address on an open order
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
