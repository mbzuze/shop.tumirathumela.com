import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LocationState {
  isInitialized: boolean;
  country: "ZA" | "ZW" | null;
  city: string | null;
  currency: "ZAR" | "USD";
  setLocation: (country: "ZA" | "ZW", city: string) => void;
  setCity: (city: string) => void;
  setCountry: (country: "ZA" | "ZW") => void;
  initLocation: () => Promise<void>;
}

// Fixed exchange conversion settings
export const EXCHANGE_COEFFICIENT = {
  ZAR_TO_USD: 0.054, // Approx Spot Rate: $1 USD = R18.50
  ZIMBABWE_MARKUP: 1.05, // 5% retail pricing safety buffer for USD settlements
};

const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      country: "ZA", // Default country
      city: "Johannesburg", // Default city
      currency: "ZAR", // Default currency
      setLocation: (country, city) => {
        const currency = country === "ZA" ? "ZAR" : "USD";
        set({ isInitialized: true, country, city, currency });
      },
      setCity: (city) => {
        set({ city });
      },
      setCountry: (country) => {
        const currency = country === "ZA" ? "ZAR" : "USD";
        set({ country, currency });
      },
      initLocation: async () => {
        if (get().isInitialized) return;

        try {
          const res = await fetch("https://ipapi.co/json/");
          const data = await res.json();

          if (data && data.country_code) {
            const isZW = data.country_code === "ZW";
            const country = isZW ? "ZW" : "ZA";
            const city = data.city || (isZW ? "Harare" : "Johannesburg");
            const currency = isZW ? "USD" : "ZAR";

            set({ isInitialized: true, country, city, currency });
          } else {
            // Fallback to ZA if request fails but mark as initialized to prevent infinite loops
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error("Failed to fetch IP location", error);
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: "location-store",
    }
  )
);

export default useLocationStore;

