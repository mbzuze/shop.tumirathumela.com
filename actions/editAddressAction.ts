"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAddressesByUser, updateAddress, setDefaultAddress } from "@/lib/cms-client";

export async function editAddressAction(id: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Verify ownership
  const addresses = await getAddressesByUser(userId);
  const existing = addresses.find((a) => a.id === id);
  if (!existing || existing.clerkUserId !== userId) {
    redirect("/account/addresses");
  }

  const isDefault = formData.get("isDefault") === "on";
  const phonePrefix = (formData.get("phonePrefix") as string) || "+27";
  const phoneNumber = (formData.get("phoneNumber") as string) || "";

  await updateAddress(id, {
    fullName: formData.get("fullName") as string,
    phone: `${phonePrefix}${phoneNumber}`,
    streetAddress: formData.get("streetAddress") as string,
    buildingDetails: (formData.get("buildingDetails") as string) || null,
    suburb: (formData.get("suburb") as string) || null,
    city: formData.get("city") as string,
    province: (formData.get("province") as string) || null,
    postalCode: formData.get("postalCode") as string,
    country: formData.get("country") as "ZA" | "ZW",
    isDefault,
    addressType: formData.get("addressType") as string,
    deliveryInstructions: (formData.get("deliveryInstructions") as string) || null,
  });

  if (isDefault) {
    await setDefaultAddress(id, userId);
  }

  redirect("/account/addresses");
}
