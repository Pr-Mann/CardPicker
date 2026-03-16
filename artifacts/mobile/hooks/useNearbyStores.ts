import { useEffect, useState } from "react";

export type StoreCategory =
  | "grocery"
  | "gas"
  | "pharmacy"
  | "restaurant"
  | "retail"
  | "gym"
  | "convenience"
  | "other";

export interface NearbyStore {
  id: string;
  name: string;
  address: string;
  distanceMeters: number;
  category: StoreCategory;
  isOpen?: boolean;
  rating?: number;
  lat: number;
  lng: number;
}

// Places API (New) type -> our category mapping
const TYPE_TO_CATEGORY: Record<string, StoreCategory> = {
  grocery_store: "grocery",
  supermarket: "grocery",
  gas_station: "gas",
  pharmacy: "pharmacy",
  drugstore: "pharmacy",
  restaurant: "restaurant",
  cafe: "restaurant",
  coffee_shop: "restaurant",
  bar: "restaurant",
  fast_food_restaurant: "restaurant",
  sandwich_shop: "restaurant",
  pizza_restaurant: "restaurant",
  gym: "gym",
  fitness_center: "gym",
  sports_club: "gym",
  yoga_studio: "gym",
  convenience_store: "convenience",
  clothing_store: "retail",
  shoe_store: "retail",
  electronics_store: "retail",
  shopping_mall: "retail",
  home_goods_store: "retail",
  furniture_store: "retail",
  hardware_store: "retail",
  book_store: "retail",
  department_store: "retail",
  pet_store: "retail",
};

const CATEGORY_KEYWORDS: Record<StoreCategory, string[]> = {
  grocery: ["grocery", "supermarket", "food", "market", "whole foods", "trader joe", "safeway", "kroger", "walmart", "costco", "aldi", "publix", "sprouts"],
  gas: ["gas", "fuel", "shell", "chevron", "bp", "exxon", "mobil", "76", "arco", "station", "petro"],
  pharmacy: ["pharmacy", "drug", "cvs", "walgreens", "rite aid", "duane reade"],
  restaurant: ["restaurant", "cafe", "coffee", "pizza", "burger", "sushi", "diner", "grill", "bar", "bistro", "starbucks", "mcdonald", "subway", "chipotle", "taco", "kitchen"],
  retail: ["store", "shop", "mall", "outlet", "boutique", "clothing", "electronics", "target", "best buy", "apple", "home depot", "lowe"],
  gym: ["gym", "fitness", "sport", "workout", "crossfit", "yoga", "pilates", "planet fitness", "24 hour"],
  convenience: ["7-eleven", "convenience", "mini mart", "corner store", "circle k", "wawa", "speedway"],
  other: [],
};

function detectCategory(types: string[], name: string): StoreCategory {
  // Check types first using Places API (New) type names
  for (const type of types) {
    if (type in TYPE_TO_CATEGORY) {
      return TYPE_TO_CATEGORY[type];
    }
  }

  // Fall back to name keyword matching
  const nameLower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [StoreCategory, string[]][]) {
    if (keywords.some((kw) => nameLower.includes(kw))) {
      return category;
    }
  }

  return "other";
}

export function useNearbyStores(
  lat: number | null,
  lng: number | null,
  radiusMeters: number = 1500
) {
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === null || lng === null) return;

    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    const fetchStores = async () => {
      setLoading(true);
      setError(null);

      if (!apiKey) {
        // Provide mock data so the UI can be tested without an API key!
        setTimeout(() => {
          setStores([
            { id: "1", name: "Whole Foods Market", address: "123 Organic Way", distanceMeters: 450, category: "grocery", isOpen: true, rating: 4.8, lat: lat, lng: lng },
            { id: "2", name: "Apple Store", address: "202 Tech Ave", distanceMeters: 650, category: "retail", isOpen: true, rating: 4.9, lat: lat, lng: lng },
            { id: "3", name: "Starbucks Reserve", address: "456 Espresso Ln", distanceMeters: 800, category: "restaurant", isOpen: true, rating: 4.6, lat: lat, lng: lng },
            { id: "4", name: "Equinox Fitness", address: "303 Iron St", distanceMeters: 850, category: "gym", isOpen: true, rating: 4.7, lat: lat, lng: lng },
            { id: "5", name: "Shell Station", address: "789 Fast Track Rd", distanceMeters: 1200, category: "gas", isOpen: true, rating: 3.9, lat: lat, lng: lng },
            { id: "6", name: "CVS Pharmacy", address: "101 Health Blvd", distanceMeters: 1400, category: "pharmacy", isOpen: false, rating: 4.2, lat: lat, lng: lng },
            { id: "7", name: "7-Eleven", address: "404 Midnight Rd", distanceMeters: 1550, category: "convenience", isOpen: true, rating: 4.1, lat: lat, lng: lng },
          ]);
          setLoading(false);
        }, 1200);
        return;
      }


      try {
        // Places API (New) — Nearby Search endpoint
        const url = "https://places.googleapis.com/v1/places:searchNearby";

        const body = {
          includedTypes: [
            "grocery_store",
            "supermarket",
            "gas_station",
            "pharmacy",
            "drugstore",
            "restaurant",
            "cafe",
            "coffee_shop",
            "fast_food_restaurant",
            "convenience_store",
            "clothing_store",
            "electronics_store",
            "shopping_mall",
            "department_store",
            "home_goods_store",
            "hardware_store",
            "gym",
            "fitness_center",
            "book_store",
            "pet_store",
          ],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: radiusMeters,
            },
          },
        };

        const fieldMask = [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.location",
          "places.types",
          "places.currentOpeningHours",
          "places.rating",
        ].join(",");

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": fieldMask,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const msg = (errData as any)?.error?.message || `HTTP ${response.status}`;
          if (response.status === 403 || response.status === 400) {
            setError("API key is invalid or Places API (New) is not enabled in Google Cloud Console.");
          } else {
            setError(`Failed to fetch stores: ${msg}`);
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        const places: any[] = data.places || [];

        const results: NearbyStore[] = places.map((place) => {
          const placeLat = place.location?.latitude ?? 0;
          const placeLng = place.location?.longitude ?? 0;
          const distanceMeters = haversineDistance(lat, lng, placeLat, placeLng);
          const types: string[] = place.types || [];
          const name: string = place.displayName?.text || "Unknown Store";
          const category = detectCategory(types, name);

          return {
            id: place.id,
            name,
            address: place.formattedAddress || "Address unavailable",
            distanceMeters,
            category,
            isOpen: place.currentOpeningHours?.openNow,
            rating: place.rating,
            lat: placeLat,
            lng: placeLng,
          };
        });

        results.sort((a, b) => a.distanceMeters - b.distanceMeters);
        setStores(results);
      } catch (err) {
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [lat, lng, radiusMeters]);

  return { stores, loading, error };
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceLabel(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
