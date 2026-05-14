"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAddress, setDefaultAddress } from "@/sanity/lib/addresses";

export async function addAddressAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const isDefault = formData.get("isDefault") === "on";

  const phonePrefix = (formData.get("phonePrefix") as string) || "+27";
  const phoneNumber = (formData.get("phoneNumber") as string) || "";

  const data = {
    clerkUserId: userId,
    fullName: formData.get("fullName") as string,
    phone: `${phonePrefix}${phoneNumber}`,
    streetAddress: formData.get("streetAddress") as string,
    buildingDetails: (formData.get("buildingDetails") as string) || undefined,
    suburb: (formData.get("suburb") as string) || undefined,
    city: formData.get("city") as string,
    province: (formData.get("province") as string) || undefined,
    postalCode: formData.get("postalCode") as string,
    country: formData.get("country") as "ZA" | "ZW",
    isDefault,
    addressType: formData.get("addressType") as
      | "Home/Residential"
      | "Office/Business",
    deliveryInstructions:
      (formData.get("deliveryInstructions") as string) || undefined,
  };

  const newId = await createAddress(data);

  if (isDefault) {
    await setDefaultAddress(newId, userId);
  }

  redirect("/account/addresses");
}
