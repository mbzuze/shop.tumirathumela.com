"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import useUIStore from "@/store/uiStore";
import useBasketStore from "@/store/store";
import useLocationStore from "@/store/locationStore";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { imageUrl } from "@/lib/imageUrl";
import Link from "next/link";
import { TrolleyIcon } from "@sanity/icons";

export default function CartDrawer() {
  const { cartDrawerOpen, setCartDrawer } = useUIStore();
  const { items, removeItem, addItem, getTotalPrice } = useBasketStore();
  const { currency } = useLocationStore();

  const handleClose = () => setCartDrawer(false);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawer}>
      <SheetContent side="right" className="w-[90vw] sm:w-[400px] p-0 bg-white flex flex-col">
        <SheetHeader className="p-4 bg-gray-50 border-b border-gray-200 text-left">
          <SheetTitle className="flex items-center space-x-2 text-xl">
            <TrolleyIcon className="w-6 h-6" />
            <span>Your Cart ({itemCount})</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500">
              <TrolleyIcon className="w-16 h-16 opacity-50" />
              <p>Your TumiraThumela Cart is empty</p>
              <button onClick={handleClose} className="text-tt-orange hover:underline font-medium">
                Continue shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product._id} className="flex space-x-4 border-b border-gray-100 pb-4">
                <div className="relative w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                  {item.product.images?.[0] && (
                    <Image
                      src={imageUrl(item.product.images[0]).url()}
                      alt={item.product.name || "Product"}
                      fill
                      className="object-contain p-1"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                    <p className="font-bold mt-1 text-black">
                      {formatPrice(item.product.price ?? 0, currency)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2 border border-gray-300 rounded overflow-hidden">
                      <button 
                        onClick={() => removeItem(item.product._id)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => addItem(item.product)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold text-lg">{formatPrice(getTotalPrice(), currency)}</span>
            </div>
            <Link href="/cart" onClick={handleClose}>
              <button className="w-full bg-tt-orange hover:bg-tt-orange-hover text-black font-bold py-3 rounded-md transition-colors shadow-sm mb-2">
                Go to Cart
              </button>
            </Link>
            <Link href="/checkout" onClick={handleClose}>
              <button className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-black font-bold py-3 rounded-md transition-colors shadow-sm">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
