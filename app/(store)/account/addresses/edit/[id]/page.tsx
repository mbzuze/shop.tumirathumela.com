import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getAddressById } from "@/lib/cms-client";
import { editAddressAction } from "@/actions/editAddressAction";

const ZA_PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape",
];

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const address = await getAddressById(id, userId);

  if (!address || address.clerkUserId !== userId) notFound();

  // Extract phone prefix and number
  let phonePrefix = "+27";
  let phoneNumber = address.phone;
  if (address.phone.startsWith("+263")) {
    phonePrefix = "+263";
    phoneNumber = address.phone.slice(4);
  } else if (address.phone.startsWith("+27")) {
    phonePrefix = "+27";
    phoneNumber = address.phone.slice(3);
  }

  const boundAction = editAddressAction.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-[#007185] mb-4">
        <Link href="/account" className="hover:underline hover:text-[#C7511F]">
          Your Account
        </Link>
        <span className="mx-1 text-[#565959]">›</span>
        <Link href="/account/addresses" className="hover:underline hover:text-[#C7511F]">
          Your Addresses
        </Link>
        <span className="mx-1 text-[#565959]">›</span>
        <span className="text-[#C7511F]">Edit Address</span>
      </nav>

      <h1 className="text-2xl font-normal text-[#0F1111] mb-6">
        Edit address
      </h1>

      <form action={boundAction} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-[#0F1111] mb-1">
            Full name <span className="text-red-600">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            defaultValue={address.fullName}
            className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[#0F1111] mb-1">
            Mobile number <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <select
              name="phonePrefix"
              defaultValue={phonePrefix}
              className="border border-[#888c8c] rounded-sm px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] bg-white"
            >
              <option value="+27">🇿🇦 +27</option>
              <option value="+263">🇿🇼 +263</option>
            </select>
            <input
              name="phoneNumber"
              type="tel"
              required
              defaultValue={phoneNumber}
              className="flex-1 border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
            />
          </div>
        </div>

        {/* Street Address */}
        <div>
          <label htmlFor="streetAddress" className="block text-sm font-medium text-[#0F1111] mb-1">
            Street address <span className="text-red-600">*</span>
          </label>
          <input
            id="streetAddress"
            name="streetAddress"
            type="text"
            required
            defaultValue={address.streetAddress}
            className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
          />
        </div>

        {/* Building Details */}
        <div>
          <label htmlFor="buildingDetails" className="block text-sm font-medium text-[#0F1111] mb-1">
            Building, apartment, unit (optional)
          </label>
          <input
            id="buildingDetails"
            name="buildingDetails"
            type="text"
            defaultValue={address.buildingDetails || ""}
            className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
          />
        </div>

        {/* Suburb */}
        <div>
          <label htmlFor="suburb" className="block text-sm font-medium text-[#0F1111] mb-1">
            Suburb (optional)
          </label>
          <input
            id="suburb"
            name="suburb"
            type="text"
            defaultValue={address.suburb || ""}
            className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
          />
        </div>

        {/* City + Postal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-[#0F1111] mb-1">
              City <span className="text-red-600">*</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              defaultValue={address.city}
              className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
            />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-[#0F1111] mb-1">
              Postal code <span className="text-red-600">*</span>
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              required
              defaultValue={address.postalCode}
              className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
            />
          </div>
        </div>

        {/* Province */}
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-[#0F1111] mb-1">
            Province (optional)
          </label>
          <select
            id="province"
            name="province"
            defaultValue={address.province || ""}
            className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] bg-white"
          >
            <option value="">— Select province —</option>
            {ZA_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-[#0F1111] mb-1">
            Country <span className="text-red-600">*</span>
          </label>
          <select
            id="country"
            name="country"
            defaultValue={address.country}
            required
            className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] bg-white"
          >
            <option value="ZA">South Africa</option>
            <option value="ZW">Zimbabwe</option>
          </select>
        </div>

        {/* Address Type */}
        <div>
          <span className="block text-sm font-medium text-[#0F1111] mb-2">Address type</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="addressType"
                value="Home/Residential"
                defaultChecked={address.addressType !== "Office/Business"}
                className="accent-[#e77600]"
              />
              Home / Residential
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="addressType"
                value="Office/Business"
                defaultChecked={address.addressType === "Office/Business"}
                className="accent-[#e77600]"
              />
              Office / Business
            </label>
          </div>
        </div>

        {/* Delivery Instructions */}
        <div>
          <label htmlFor="deliveryInstructions" className="block text-sm font-medium text-[#0F1111] mb-1">
            Delivery instructions (optional)
          </label>
          <textarea
            id="deliveryInstructions"
            name="deliveryInstructions"
            rows={3}
            defaultValue={address.deliveryInstructions || ""}
            className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600] resize-none"
          />
        </div>

        {/* Default toggle */}
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="isDefault"
              defaultChecked={address.isDefault}
              className="w-4 h-4 accent-[#e77600]"
            />
            Make this my default address
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm px-6 py-2 text-sm font-normal text-[#0F1111] cursor-pointer transition-colors"
          >
            Update address
          </button>
          <Link
            href="/account/addresses"
            className="border border-[#888c8c] rounded-sm px-6 py-2 text-sm text-[#0F1111] hover:bg-[#f7f8f8] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
