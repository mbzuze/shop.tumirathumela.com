"use server";

import { getActiveSaleByCouponCode } from "@/lib/cms-client";

export async function validateCoupon(code: string) {
  try {
    const sale = await getActiveSaleByCouponCode(code);
    if (sale) {
      return {
        isValid: true,
        discountAmount: sale.discountAmount, // percentage
        minimumOrderValue: null,
        code: sale.couponCode,
        applicableProducts: sale.applicableProductIds || [],
      };
    }
    return { isValid: false, message: "Invalid or expired coupon code." };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { isValid: false, message: "Error validating coupon." };
  }
}
