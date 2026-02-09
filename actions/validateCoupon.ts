"use server";

import { getActiveSaleByCouponCode } from "@/sanity/lib/sales/getActiveSaleByCouponCode";

export async function validateCoupon(code: string) {
  try {
    const sale = await getActiveSaleByCouponCode(code);
    if (sale) {
      return {
        isValid: true,
        discountAmount: sale.discountAmount,
        code: sale.couponCode,
        applicableProducts: sale.products?.map((p: any) => p._id) || [],
      };
    }
    return { isValid: false, message: "Invalid or expired coupon code." };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { isValid: false, message: "Error validating coupon." };
  }
}
