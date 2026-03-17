import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { NearbyStore, formatDistanceLabel, StoreCategory, haversineDistance, detectCategory } from "@/hooks/useNearbyStores";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  StoreCategory,
  { icon: string; iconSet: "ionicons" | "mci"; color: string; bg: string }
> = {
  grocery:     { icon: "storefront-outline", iconSet: "ionicons", color: "#22C55E", bg: "#052E16" },
  gas:         { icon: "gas-station",         iconSet: "mci",      color: "#F59E0B", bg: "#2D1B00" },
  pharmacy:    { icon: "medkit-outline",      iconSet: "ionicons", color: "#EF4444", bg: "#2D0A0A" },
  restaurant:  { icon: "restaurant-outline", iconSet: "ionicons", color: "#F97316", bg: "#2D1000" },
  retail:      { icon: "bag-handle-outline", iconSet: "ionicons", color: "#8B5CF6", bg: "#1B0840" },
  gym:         { icon: "barbell-outline",     iconSet: "ionicons", color: "#06B6D4", bg: "#002D33" },
  convenience: { icon: "basket-outline",      iconSet: "ionicons", color: "#EC4899", bg: "#2D0020" },
  other:       { icon: "location-outline",    iconSet: "ionicons", color: "#94A3B8", bg: "#1E293B" },
};

// ── Card recommendation per category ────────────────────────────────────────

interface CardRec {
  name: string;
  cashback: string;
  benefit: string;
  gradient: [string, string, string];
  glowColor: string;
  network: "VISA" | "MASTERCARD" | "AMEX";
  networkColors: [string, string];
}

const CARD_REC: Record<StoreCategory, CardRec> = {
  grocery: {
    name: "Green Rewards",
    cashback: "6%",
    benefit: "Grocery & Supermarkets",
    gradient: ["#064E3B", "#065F46", "#047857"],
    glowColor: "#22C55E",
    network: "VISA",
    networkColors: ["#1A3C8F", "#1E4DB7"],
  },
  gas: {
    name: "Fuel Plus",
    cashback: "5%",
    benefit: "Gas Stations & Fuel",
    gradient: ["#78350F", "#92400E", "#B45309"],
    glowColor: "#F59E0B",
    network: "MASTERCARD",
    networkColors: ["#EB001B", "#F79E1B"],
  },
  pharmacy: {
    name: "Health Care",
    cashback: "3%",
    benefit: "Pharmacy & Drugstores",
    gradient: ["#7F1D1D", "#991B1B", "#B91C1C"],
    glowColor: "#EF4444",
    network: "VISA",
    networkColors: ["#1A3C8F", "#1E4DB7"],
  },
  restaurant: {
    name: "Dining Elite",
    cashback: "4%",
    benefit: "Restaurants & Cafés",
    gradient: ["#7C2D12", "#9A3412", "#C2410C"],
    glowColor: "#F97316",
    network: "AMEX",
    networkColors: ["#2E86DE", "#54A0FF"],
  },
  retail: {
    name: "Shopping Pro",
    cashback: "2%",
    benefit: "Retail & Shopping",
    gradient: ["#4C1D95", "#5B21B6", "#6D28D9"],
    glowColor: "#8B5CF6",
    network: "VISA",
    networkColors: ["#1A3C8F", "#1E4DB7"],
  },
  gym: {
    name: "Active Life",
    cashback: "3%",
    benefit: "Gyms & Fitness",
    gradient: ["#0C4A6E", "#075985", "#0369A1"],
    glowColor: "#06B6D4",
    network: "MASTERCARD",
    networkColors: ["#EB001B", "#F79E1B"],
  },
  convenience: {
    name: "Everyday",
    cashback: "2%",
    benefit: "Convenience Stores",
    gradient: ["#881337", "#9F1239", "#BE123C"],
    glowColor: "#EC4899",
    network: "VISA",
    networkColors: ["#1A3C8F", "#1E4DB7"],
  },
  other: {
    name: "Universal",
    cashback: "1.5%",
    benefit: "All Purchases",
    gradient: ["#1E3A5F", "#1E40AF", "#1D4ED8"],
    glowColor: "#1A6FFF",
    network: "VISA",
    networkColors: ["#1A3C8F", "#1E4DB7"],
  },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function CategoryIcon({ category }: { category: StoreCategory }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
  return (
    <View style={[iconSt.box, { backgroundColor: meta.bg }]}>
      {meta.iconSet === "mci" ? (
        <MaterialCommunityIcons name={meta.icon as any} size={14} color={meta.color} />
      ) : (
        <Ionicons name={meta.icon as any} size={14} color={meta.color} />
      )}
    </View>
  );
}

const iconSt = StyleSheet.create({
  box: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={rating >= i ? "star" : rating >= i - 0.5 ? "star-half" : "star-outline"}
          size={9}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

// ── Store Row — tappable with selection state ────────────────────────────────

function StoreRow({
  store,
  rank,
  isSelected,
  onSelect,
}: {
  store: NearbyStore;
  rank: number;
  isSelected: boolean;
  onSelect: (store: NearbyStore) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const categoryLabel = store.category.charAt(0).toUpperCase() + store.category.slice(1);
  const accent = CATEGORY_META[store.category]?.color ?? "#1A6FFF";

  return (
    <Animated.View entering={FadeInDown.delay(rank * 45).duration(200)} style={animStyle}>
      <AnimatedPressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 20 }); }}
        onPress={() => {
          Haptics.selectionAsync();
          onSelect(store);
        }}
        style={[
          rowSt.row,
          rank > 0 && rowSt.rowBorder,
          isSelected && rowSt.rowSelected,
        ]}
      >
        {/* Left accent bar when selected */}
        {isSelected && (
          <View style={[rowSt.accentBar, { backgroundColor: accent }]} />
        )}

        <CategoryIcon category={store.category} />

        <View style={rowSt.textCol}>
          <Text style={[rowSt.name, isSelected && { color: "#FFFFFF" }]} numberOfLines={1}>
            {store.name}
          </Text>
          <View style={rowSt.metaRow}>
            {store.rating != null && (
              <>
                <StarRating rating={store.rating} />
                <Text style={rowSt.sep}>·</Text>
              </>
            )}
            <Text style={rowSt.catLabel}>{categoryLabel}</Text>
          </View>
        </View>

        <View style={rowSt.rightCol}>
          <Text style={[rowSt.distance, isSelected && { color: accent }]}>
            {formatDistanceLabel(store.distanceMeters)}
          </Text>
          {isSelected ? (
            <View style={[rowSt.selectedBadge, { backgroundColor: accent + "22" }]}>
              <Ionicons name="checkmark-circle" size={11} color={accent} />
              <Text style={[rowSt.selectedText, { color: accent }]}>Selected</Text>
            </View>
          ) : store.isOpen === true ? (
            <View style={rowSt.openBadge}>
              <Text style={rowSt.openText}>Open</Text>
            </View>
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const rowSt = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    position: "relative",
    overflow: "hidden",
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  rowSelected: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderTopWidth: 0,
    marginHorizontal: 6,
    borderRadius: 10,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
  },
  textCol: { flex: 1, gap: 3 },
  name: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#CBD5E1",
    letterSpacing: -0.1,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sep: { fontSize: 9, color: "#334155" },
  catLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#64748B" },
  rightCol: { alignItems: "flex-end", gap: 3, flexShrink: 0 },
  distance: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#1A6FFF" },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  selectedText: { fontSize: 8, fontFamily: "Inter_600SemiBold" },
  openBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  openText: { fontSize: 8, fontFamily: "Inter_600SemiBold", color: "#22C55E" },
});

// ── Credit Card — driven by selected store ───────────────────────────────────

function CreditCard({ store }: { store: NearbyStore | null }) {
  const rec = store ? CARD_REC[store.category] : CARD_REC.other;

  // Animate opacity on card swap
  const opacity = useSharedValue(1);
  const cardAnim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    opacity.value = withTiming(0.4, { duration: 120 }, () => {
      opacity.value = withTiming(1, { duration: 220 });
    });
  }, [store?.id]);

  const isVisa = rec.network === "VISA";
  const isAmex = rec.network === "AMEX";

  return (
    <Animated.View style={[{ marginHorizontal: 10, marginBottom: 2 }, cardAnim]}>
      <LinearGradient
        colors={rec.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[ccSt.card, { shadowColor: rec.glowColor }]}
      >
        {/* Top row: chip + network logo */}
        <View style={ccSt.topRow}>
          <View style={ccSt.chip}>
            <View style={ccSt.chipH} />
            <View style={ccSt.chipV} />
          </View>

          {/* Cashback badge */}
          <View style={ccSt.cashbackBadge}>
            <Text style={ccSt.cashbackValue}>{rec.cashback}</Text>
            <Text style={ccSt.cashbackLabel}>BACK</Text>
          </View>

          {/* Network logo */}
          <View style={ccSt.logoRow}>
            <View style={[ccSt.circle, { backgroundColor: rec.networkColors[0], marginRight: isVisa || isAmex ? 0 : -7 }]} />
            {!isVisa && !isAmex && (
              <View style={[ccSt.circle, { backgroundColor: rec.networkColors[1], opacity: 0.9 }]} />
            )}
          </View>
        </View>

        {/* Card number */}
        <Text style={ccSt.number}>4512  8765  4321  0987</Text>

        {/* Card name + benefit */}
        <View style={ccSt.midRow}>
          <Text style={ccSt.cardName}>{rec.name}</Text>
          <Text style={ccSt.benefit} numberOfLines={1}>{rec.benefit}</Text>
        </View>

        {/* Bottom: store name it's recommended for */}
        <View style={ccSt.bottomRow}>
          <View>
            <Text style={ccSt.label}>RECOMMENDED FOR</Text>
            <Text style={ccSt.value} numberOfLines={1}>
              {store ? store.name : "All Purchases"}
            </Text>
          </View>
          <Text style={[ccSt.network, { letterSpacing: isAmex ? 1.5 : 2.5 }]}>
            {rec.network}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const ccSt = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 15,
    gap: 11,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chip: {
    width: 28, height: 21, borderRadius: 4, backgroundColor: "#C9A84C",
    alignItems: "center", justifyContent: "center",
  },
  chipH: { position: "absolute", width: "100%", height: 1, backgroundColor: "#A07830", top: "50%" },
  chipV: { position: "absolute", width: 1, height: "100%", backgroundColor: "#A07830", left: "50%" },
  cashbackBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cashbackValue: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 16 },
  cashbackLabel: { fontSize: 7, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  logoRow: { flexDirection: "row", alignItems: "center" },
  circle: { width: 22, height: 22, borderRadius: 11 },
  number: { fontFamily: "Inter_700Bold", fontSize: 13, color: "rgba(255,255,255,0.9)", letterSpacing: 1.8 },
  midRow: { gap: 2 },
  cardName: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.3 },
  benefit: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 2 },
  label: { fontSize: 7, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", letterSpacing: 0.8, marginBottom: 2 },
  value: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#E2E8F0", letterSpacing: 0.2, maxWidth: 160 },
  network: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#E2E8F0", alignSelf: "flex-end" },
});

// ── Main Widget ──────────────────────────────────────────────────────────────

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.currentOpeningHours",
  "places.rating",
].join(",");

async function textSearchPlaces(
  query: string,
  lat: number,
  lng: number
): Promise<NearbyStore[]> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 10000,
        },
      },
      maxResultCount: 10,
    }),
  });

  if (!response.ok) return [];
  const data = await response.json();
  const places: any[] = data.places ?? [];

  return places
    .map((place) => {
      const pLat = place.location?.latitude ?? 0;
      const pLng = place.location?.longitude ?? 0;
      const name: string = place.displayName?.text ?? "Unknown";
      return {
        id: place.id,
        name,
        address: place.formattedAddress ?? "",
        distanceMeters: haversineDistance(lat, lng, pLat, pLng),
        category: detectCategory(place.types ?? [], name),
        isOpen: place.currentOpeningHours?.openNow,
        rating: place.rating,
        lat: pLat,
        lng: pLng,
      } satisfies NearbyStore;
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export interface SearchWidgetProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onLocationPress: () => void;
  stores: NearbyStore[];
  coords: { lat: number; lng: number } | null;
}

export function SearchWidget({
  searchQuery,
  onSearchChange,
  onLocationPress,
  stores,
  coords,
}: SearchWidgetProps) {
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textResults, setTextResults] = useState<NearbyStore[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Run Places Text Search
  const runTextSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !coords) return;
      setIsSearching(true);
      try {
        const results = await textSearchPlaces(query, coords.lat, coords.lng);
        setTextResults(results);
      } catch {
        // silently keep previous results
      } finally {
        setIsSearching(false);
      }
    },
    [coords]
  );

  // Debounce auto-search as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTextResults(null);
      setIsSearching(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runTextSearch(searchQuery), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, runTextSearch]);

  // What to show: text search results (when available) or nearest stores
  const displayed = (textResults ?? stores).slice(0, 3);

  // Auto-select first result whenever list changes
  useEffect(() => {
    const key = displayed.map((s) => s.id).join(",");
    if (displayed.length > 0) {
      setSelectedId((prev) =>
        displayed.some((s) => s.id === prev) ? prev : displayed[0].id
      );
    } else {
      setSelectedId(null);
    }
  }, [displayed.map((s) => s.id).join(",")]);

  const selectedStore = displayed.find((s) => s.id === selectedId) ?? displayed[0] ?? null;

  const findScale = useSharedValue(1);
  const findAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: findScale.value }] }));

  const handleFind = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (searchQuery.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      runTextSearch(searchQuery);
    } else {
      onLocationPress();
    }
    inputRef.current?.blur();
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={wSt.container}>

      {/* ── Search Bar ── */}
      <View style={wSt.searchRow}>
        <View style={wSt.searchBar}>
          <Ionicons name="search" size={14} color="#64748B" style={{ marginLeft: 10 }} />
          <TextInput
            ref={inputRef}
            style={wSt.input}
            placeholder="Search stores, services, or locations..."
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor="#1A6FFF"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { onSearchChange(""); inputRef.current?.focus(); }} style={{ padding: 6 }}>
              <Ionicons name="close-circle" size={14} color="#334155" />
            </Pressable>
          )}
        </View>
        <AnimatedPressable
          style={[
            wSt.findButton,
            findAnimStyle,
            searchQuery.trim() && { backgroundColor: "#7C3AED" },
          ]}
          onPressIn={() => { findScale.value = withSpring(0.88, { damping: 20 }); }}
          onPressOut={() => { findScale.value = withSpring(1, { damping: 20 }); }}
          onPress={handleFind}
        >
          {searchQuery.trim() ? (
            <Ionicons name="search" size={16} color="#fff" />
          ) : (
            <Ionicons name="navigate" size={16} color="#fff" />
          )}
        </AnimatedPressable>
      </View>

      {/* ── Results ── */}
      <View style={wSt.sectionHeader}>
        <Ionicons
          name={isSearching ? "sync" : searchQuery.trim() ? "search" : "location"}
          size={10}
          color={isSearching ? "#1A6FFF" : "#475569"}
        />
        <Text style={[wSt.sectionLabel, isSearching && { color: "#1A6FFF" }]}>
          {isSearching ? "SEARCHING..." : searchQuery.trim() ? "RESULTS NEAR YOU" : "TOP 3 NEARBY"}
        </Text>
        {!isSearching && <Text style={wSt.sectionHint}>Tap to select</Text>}
      </View>

      {isSearching ? (
        <View style={wSt.emptyRow}>
          <Ionicons name="ellipsis-horizontal" size={16} color="#334155" />
          <Text style={wSt.emptyText}>Finding "{searchQuery}" near you...</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={wSt.emptyRow}>
          <Ionicons name="search-outline" size={16} color="#1E293B" />
          <Text style={wSt.emptyText}>
            {searchQuery.trim() ? `No results for "${searchQuery}"` : "No nearby stores found"}
          </Text>
        </View>
      ) : (
        <View style={{ paddingBottom: 6 }}>
          {displayed.map((store, i) => (
            <StoreRow
              key={store.id}
              store={store}
              rank={i}
              isSelected={store.id === selectedId}
              onSelect={(s) => setSelectedId(s.id)}
            />
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={wSt.divider} />

      {/* ── Credit Card — updates with selection ── */}
      <View style={wSt.sectionHeader}>
        <MaterialCommunityIcons name="credit-card-outline" size={10} color="#475569" />
        <Text style={wSt.sectionLabel}>RECOMMENDED CARD</Text>
        {selectedStore && (
          <Text style={wSt.sectionHint} numberOfLines={1}>for {selectedStore.name}</Text>
        )}
      </View>

      <View style={{ paddingBottom: 14 }}>
        <CreditCard store={selectedStore} />
      </View>

    </Animated.View>
  );
}

// ── Widget container styles ──────────────────────────────────────────────────

const wSt = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: "#0F172A",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.07)",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.07)",
    height: 38,
    gap: 6,
  },
  input: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#CBD5E1",
    paddingVertical: Platform.OS === "ios" ? 0 : 2,
    height: "100%",
  },
  findButton: {
    backgroundColor: "#1A6FFF",
    borderRadius: 9,
    height: 38,
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
    letterSpacing: 1.1,
  },
  sectionHint: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#334155",
    marginLeft: 4,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 4,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emptyText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#334155" },
});
