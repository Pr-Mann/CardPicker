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

const CATEGORY_KEYWORDS: Record<StoreCategory, string[]> = {
  grocery: ["grocery", "supermarket", "food", "market", "whole foods", "trader joe", "safeway", "kroger", "walmart", "costco", "aldi", "publix"],
  gas: ["gas", "fuel", "shell", "chevron", "bp", "exxon", "mobil", "76", "arco", "station"],
  pharmacy: ["pharmacy", "drug", "cvs", "walgreens", "rite aid", "duane reade", "health"],
  restaurant: ["restaurant", "cafe", "coffee", "pizza", "burger", "sushi", "diner", "grill", "bar", "bistro", "starbucks", "mcdonald", "subway", "chipotle"],
  retail: ["store", "shop", "mall", "outlet", "boutique", "clothing", "electronics", "target", "best buy", "apple", "home depot", "lowe"],
  gym: ["gym", "fitness", "sport", "workout", "crossfit", "yoga", "pilates", "planet fitness", "24 hour"],
  convenience: ["7-eleven", "convenience", "mini mart", "corner store", "circle k", "wawa"],
  other: [],
};

function detectCategory(types: string[], name: string): StoreCategory {
  const nameLower = name.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [StoreCategory, string[]][]) {
    if (keywords.some((kw) => nameLower.includes(kw))) {
      return category;
    }
  }

  if (types.includes("grocery_or_supermarket") || types.includes("supermarket")) return "grocery";
  if (types.includes("gas_station")) return "gas";
  if (types.includes("pharmacy")) return "pharmacy";
  if (types.includes("restaurant") || types.includes("cafe") || types.includes("food")) return "restaurant";
  if (types.includes("gym") || types.includes("health")) return "gym";
  if (types.includes("convenience_store")) return "convenience";
  if (types.includes("store") || types.includes("shopping_mall") || types.includes("clothing_store") || types.includes("electronics_store")) return "retail";

  return "other";
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
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
    if (!apiKey) {
      setError("Google Maps API key not configured.");
      return;
    }

    const fetchStores = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=store&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "REQUEST_DENIED") {
          setError("API key is invalid or Places API is not enabled.");
          setLoading(false);
          return;
        }

        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
          setError(`Failed to fetch stores: ${data.status}`);
          setLoading(false);
          return;
        }

        const results: NearbyStore[] = (data.results || []).map((place: any) => {
          const placeLat = place.geometry.location.lat;
          const placeLng = place.geometry.location.lng;
          const distanceMeters = haversineDistance(lat, lng, placeLat, placeLng);
          const category = detectCategory(place.types || [], place.name);

          return {
            id: place.place_id,
            name: place.name,
            address: place.vicinity || "Address unavailable",
            distanceMeters,
            category,
            isOpen: place.opening_hours?.open_now,
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

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
