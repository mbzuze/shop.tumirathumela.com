"use client";

import { useEffect, useState, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import useLocationStore from "@/store/locationStore";
import useUIStore from "@/store/uiStore";
import type { CustomerAddress } from "@/sanity/lib/addresses";
import { getMyAddressesAction } from "@/actions/addressActions";

const ZA_CITIES = [
  "Beaufort West","Bloemfontein","Cape Town","Durban","East London",
  "George","Gqeberha","Johannesburg","Kimberley","Klerksdorp",
  "Mahikeng","Mbombela","Newcastle","Paarl","Pietermaritzburg",
  "Polokwane","Pretoria","Richards Bay","Springbok","Stellenbosch",
  "Upington","Welkom",
];

const ZW_CITIES = [
  "Harare", "Bulawayo", "Mutare", "Gweru"
];

export default function LocationModal() {
  const { locationModalOpen, setLocationModal } = useUIStore();
  const { user, isLoaded } = useUser();
  const { city, country, setLocation } = useLocationStore();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState(city || "");
  const [isPending, startTransition] = useTransition();

  // Fetch saved addresses when user is logged in
  useEffect(() => {
    if (!isLoaded || !user || !locationModalOpen) return;
    setLoadingAddresses(true);
    getMyAddressesAction().then((data) => {
      setAddresses(data);
      // Pre-select default address if one exists
      const def = data.find((a) => a.isDefault);
      if (def) setSelectedAddressId(def._id);
      setLoadingAddresses(false);
    });
  }, [isLoaded, user, locationModalOpen]);

  if (!locationModalOpen) return null;

  const handleDone = () => {
    if (user && selectedAddressId) {
      const addr = addresses.find((a) => a._id === selectedAddressId);
      if (addr) {
        startTransition(() => {
          setLocation(addr.country as any, addr.city);
        });
      }
    } else if (!user && selectedCity) {
      const isZim = ZW_CITIES.includes(selectedCity);
      setLocation(isZim ? "ZW" : "ZA", selectedCity);
    }
    setLocationModal(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setLocationModal(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-sm shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h2
              id="location-modal-title"
              className="text-lg font-semibold text-[#0F1111]"
            >
              Choose your location
            </h2>
            <p className="text-sm text-[#565959] mt-1">
              Delivery options and delivery speeds may vary for different
              locations
            </p>
          </div>
          <button
            onClick={() => setLocationModal(false)}
            aria-label="Close location modal"
            className="text-[#0F1111] hover:text-[#565959] text-xl leading-none mt-0.5 ml-4"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {/* ── Logged-in: saved addresses ─────────────────────────────── */}
          {isLoaded && user ? (
            <>
              {loadingAddresses ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-100 rounded-sm animate-pulse"
                    />
                  ))}
                </div>
              ) : addresses.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {addresses.map((addr) => (
                    <button
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`w-full text-left border rounded-sm p-3 text-sm transition-colors ${
                        selectedAddressId === addr._id
                          ? "border-[#e77600] ring-1 ring-[#e77600] bg-[#fffbf0]"
                          : "border-[#c8c8c8] hover:border-[#007185]"
                      }`}
                    >
                      <p className="font-bold text-[#0F1111]">
                        {addr.fullName}
                        {addr.isDefault && (
                          <span className="ml-2 text-xs font-normal text-[#565959]">
                            Default address
                          </span>
                        )}
                      </p>
                      <p className="text-[#565959] text-xs mt-0.5">
                        {[
                          addr.streetAddress,
                          addr.suburb,
                          addr.city,
                          addr.province,
                          addr.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#565959]">
                  No saved addresses.{" "}
                  <Link
                    href="/account/addresses/add"
                    className="text-[#007185] hover:underline"
                    onClick={() => setLocationModal(false)}
                  >
                    Add one
                  </Link>
                </p>
              )}

              <Link
                href="/account/addresses"
                onClick={() => setLocationModal(false)}
                className="block text-sm text-[#007185] hover:underline hover:text-[#C7511F]"
              >
                Manage address book
              </Link>
            </>
          ) : (
            /* ── Guest: sign-in prompt + city dropdown ──────────────── */
            <>
              <p className="text-sm text-[#565959]">
                <Link
                  href="/sign-in"
                  className="text-[#007185] hover:underline font-semibold"
                >
                  Sign in
                </Link>{" "}
                to see your saved addresses, or select a city below:
              </p>

              <div className="relative">
                <span className="text-xs text-[#565959] absolute -top-2 left-2 bg-white px-1">
                  or
                </span>
                <div className="border-t border-[#e7e7e7] pt-4">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600]"
                  >
                    <option value="">Select a city nearest to you</option>
                    <optgroup label="South Africa (ZAR)">
                      {ZA_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Zimbabwe (USD)">
                      {ZW_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Done button */}
          <div className="pt-2">
            <button
              onClick={handleDone}
              disabled={isPending}
              className="bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#F0C000] border border-[#FCD200] rounded-sm px-8 py-2 text-sm font-normal text-[#0F1111] cursor-pointer transition-colors disabled:opacity-60 w-full"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
