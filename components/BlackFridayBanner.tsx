import { COUPON_CODES } from "@/sanity/lib/sales/couponCodes";
import { getActiveSaleByCouponCode } from "@/sanity/lib/sales/getActiveSaleByCouponCode";

async function BlackFridayBanner() {
    
    const sale = await getActiveSaleByCouponCode(COUPON_CODES.BLACK_FRIDAY);

    if (!sale?.isActive) {
        return null;
    }
    
    return (
       
            <div className="w-full p-4 bg-yellow-300 text-black rounded shadow-md flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-2 md:mb-0 text-center md:text-left">
                <h2 className="text-xl font-bold">{sale.title}</h2>
                <p className="mt-1">{sale.description}</p>
                </div>
                <div className="flex flex-col items-center md:items-end mt-4 md:mt-0">
                <div className="text-lg font-semibold">Coupon Code: <span className="font-mono bg-white px-2 py-1 rounded">{sale.couponCode}</span></div>
                <div className="mt-2 text-xl font-bold">Save {sale.discountAmount}% on your purchase!</div>
                </div>
            </div>                
    );
}
export default BlackFridayBanner;