/**
 * Shared geographic constants. Hoisted out of the address forms, which each
 * kept their own copy of this list.
 */

export const ZA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export type ZaProvince = (typeof ZA_PROVINCES)[number];
