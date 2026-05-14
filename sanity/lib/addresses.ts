import { defineQuery } from "next-sanity";
import { sanityFetch } from "./live";
import { backendClient } from "./backendClient";

export interface CustomerAddress {
  _id: string;
  clerkUserId: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  buildingDetails?: string;
  suburb?: string;
  city: string;
  province?: string;
  postalCode: string;
  country: "ZA" | "ZW";
  isDefault: boolean;
  addressType?: "Home/Residential" | "Office/Business";
  deliveryInstructions?: string;
}

// ── Read queries ─────────────────────────────────────────────────────────────

export const getAddressesByUser = async (
  clerkUserId: string
): Promise<CustomerAddress[]> => {
  const QUERY = defineQuery(
    `*[_type == "customerAddress" && clerkUserId == $clerkUserId] | order(isDefault desc, _createdAt asc)`
  );
  const result = await sanityFetch({ query: QUERY, params: { clerkUserId } });
  return (result.data as CustomerAddress[]) || [];
};

export const getDefaultAddress = async (
  clerkUserId: string
): Promise<CustomerAddress | null> => {
  const QUERY = defineQuery(
    `*[_type == "customerAddress" && clerkUserId == $clerkUserId && isDefault == true][0]`
  );
  const result = await sanityFetch({ query: QUERY, params: { clerkUserId } });
  return (result.data as CustomerAddress) || null;
};

export const getAddressById = async (
  id: string
): Promise<CustomerAddress | null> => {
  const QUERY = defineQuery(`*[_type == "customerAddress" && _id == $id][0]`);
  const result = await sanityFetch({ query: QUERY, params: { id } });
  return (result.data as CustomerAddress) || null;
};

// ── Mutations (use backendClient — bypasses CDN cache) ────────────────────────

export const createAddress = async (
  data: Omit<CustomerAddress, "_id">
): Promise<string> => {
  const doc = await backendClient.create({ _type: "customerAddress", ...data });
  return doc._id;
};

export const updateAddress = async (
  id: string,
  data: Partial<Omit<CustomerAddress, "_id" | "clerkUserId">>
): Promise<void> => {
  await backendClient.patch(id).set(data).commit();
};

export const deleteAddress = async (id: string): Promise<void> => {
  await backendClient.delete(id);
};

/** Set one address as default and unset all others for this user. */
export const setDefaultAddress = async (
  id: string,
  clerkUserId: string
): Promise<void> => {
  const all = await getAddressesByUser(clerkUserId);
  const transaction = backendClient.transaction();
  for (const addr of all) {
    transaction.patch(addr._id, { set: { isDefault: addr._id === id } });
  }
  await transaction.commit();
};
