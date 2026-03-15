import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
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
} from "react-native-reanimated";

import { NearbyStore, formatDistanceLabel } from "@/hooks/useNearbyStores";
import { StoreCategory } from "@/hooks/useNearbyStores";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Category icon + color mapping ───────────────────────────────────────────

const CATEGORY_META: Record<
  StoreCategory,
  { icon: string; iconSet: "ionicons" | "mci"; color: string; bg: string }
> = {
  grocery: { icon: "storefront-outline", iconSet: "ionicons", color: "#22C55E", bg: "#052E16" },
  gas:     { icon: "gas-station",        iconSet: "mci",      color: "#F59E0B", bg: "#2D1B00" },
  pharmacy:{ icon: "medkit-outline",     iconSet: "ionicons", color: "#EF4444", bg: "#2D0A0A" },
  restaurant:{ icon: "restaurant-outline", iconSet: "ionicons", color: "#F97316", bg: "#2D1000" },
  retail:  { icon: "bag-handle-outline", iconSet: "ionicons", color: "#8B5CF6", bg: "#1B0840" },
  gym:     { icon: "barbell-outline",    iconSet: "ionicons", color: "#06B6D4", bg: "#002D33" },
  convenience:{ icon: "basket-outline", iconSet: "ionicons", color: "#EC4899", bg: "#2D0020" },
  other:   { icon: "location-outline",  iconSet: "ionicons", color: "#94A3B8", bg: "#1E293B" },
};

function CategoryIcon({ category, size = 18 }: { category: StoreCategory; size?: number }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
  const icon = meta.iconSet === "mci" ? (
    <MaterialCommunityIcons name={meta.icon as any} size={size} color={meta.color} />
  ) : (
    <Ionicons name={meta.icon as any} size={size} color={meta.color} />
  );
  return (
    <View style={[iconStyles.box, { backgroundColor: meta.bg, width: size + 16, height: size + 16, borderRadius: (size + 16) / 4 }]}>
      {icon}
    </View>
  );
}

const iconStyles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
});

// ── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={rating >= i ? "star" : rating >= i - 0.5 ? "star-half" : "star-outline"}
          size={10}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

// ── Store Row ────────────────────────────────────────────────────────────────

function StoreRow({
  store,
  rank,
  onPress,
}: {
  store: NearbyStore;
  rank: number;
  onPress?: (store: NearbyStore) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const categoryLabel =
    store.category.charAt(0).toUpperCase() + store.category.slice(1);

  return (
    <Animated.View entering={FadeInDown.delay(rank * 50).duration(220)} style={animStyle}>
      <AnimatedPressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 20 }); }}
        onPress={() => { Haptics.selectionAsync(); onPress?.(store); }}
        style={[
          rowStyles.row,
          rank === 0 && rowStyles.rowFirst,
        ]}
      >
        {/* Icon */}
        <CategoryIcon category={store.category} size={18} />

        {/* Text */}
        <View style={rowStyles.textCol}>
          <Text style={rowStyles.name} numberOfLines={1}>{store.name}</Text>
          <View style={rowStyles.metaRow}>
            {store.rating != null && (
              <>
                <StarRating rating={store.rating} />
                <Text style={rowStyles.ratingNum}>({store.rating.toFixed(1)})</Text>
                <Text style={rowStyles.dot}>·</Text>
              </>
            )}
            <Text style={rowStyles.categoryLabel}>{categoryLabel}</Text>
          </View>
        </View>

        {/* Distance + open */}
        <View style={rowStyles.rightCol}>
          <Text style={rowStyles.distance}>{formatDistanceLabel(store.distanceMeters)}</Text>
          {store.isOpen === true && (
            <View style={rowStyles.openBadge}>
              <Text style={rowStyles.openText}>Open</Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  rowFirst: {
    borderTopWidth: 0,
    backgroundColor: "rgba(26,111,255,0.10)",
    borderRadius: 10,
    marginHorizontal: 4,
    marginTop: 2,
    paddingHorizontal: 10,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#F1F5F9",
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingNum: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
  },
  dot: {
    fontSize: 10,
    color: "#475569",
  },
  categoryLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  distance: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#1A6FFF",
  },
  openBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  openText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "#22C55E",
  },
});

// ── Credit Card ──────────────────────────────────────────────────────────────

function CreditCard() {
  return (
    <LinearGradient
      colors={["#1C3A6B", "#0D1F3C", "#0A1628"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={ccStyles.card}
    >
      {/* Top row */}
      <View style={ccStyles.topRow}>
        {/* Chip */}
        <View style={ccStyles.chip}>
          <View style={ccStyles.chipH} />
          <View style={ccStyles.chipV} />
        </View>
        {/* Network logo */}
        <View style={ccStyles.logoRow}>
          <View style={[ccStyles.logoCircle, { backgroundColor: "#EB001B", marginRight: -8 }]} />
          <View style={[ccStyles.logoCircle, { backgroundColor: "#F79E1B", opacity: 0.9 }]} />
        </View>
      </View>

      {/* Card number */}
      <Text style={ccStyles.cardNumber}>4512  8765  4321  0987</Text>

      {/* Bottom row */}
      <View style={ccStyles.bottomRow}>
        <View>
          <Text style={ccStyles.label}>CARD HOLDER</Text>
          <Text style={ccStyles.value}>JOHN A. DOE</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={ccStyles.label}>EXP DATE</Text>
          <Text style={ccStyles.value}>11/27</Text>
        </View>
        <Text style={ccStyles.networkName}>VISA</Text>
      </View>
    </LinearGradient>
  );
}

const ccStyles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    borderRadius: 14,
    padding: 18,
    gap: 16,
    shadowColor: "#1A6FFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chip: {
    width: 34,
    height: 26,
    borderRadius: 5,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  chipH: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "#A07830",
    top: "50%",
  },
  chipV: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "#A07830",
    left: "50%",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  cardNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#E2E8F0",
    letterSpacing: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  label: {
    fontSize: 8,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1,
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#E2E8F0",
    letterSpacing: 0.5,
  },
  networkName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#E2E8F0",
    letterSpacing: 3,
    alignSelf: "flex-end",
  },
});

// ── Main Widget ──────────────────────────────────────────────────────────────

export interface SearchWidgetProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onLocationPress: () => void;
  /** All stores fetched from the hook — widget shows top 5 filtered */
  stores: NearbyStore[];
  /** Called when a result row is tapped */
  onStorePress?: (store: NearbyStore) => void;
}

export function SearchWidget({
  searchQuery,
  onSearchChange,
  onLocationPress,
  stores,
  onStorePress,
}: SearchWidgetProps) {
  const inputRef = useRef<TextInput>(null);

  const findScale = useSharedValue(1);
  const findStyle = useAnimatedStyle(() => ({ transform: [{ scale: findScale.value }] }));

  const handleFind = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLocationPress();
    inputRef.current?.blur();
  };

  // Top 5 filtered by search query
  const displayed = stores
    .filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    })
    .slice(0, 5);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={widgetStyles.container}>
      {/* ── Search Bar ── */}
      <View style={widgetStyles.searchRow}>
        <View style={widgetStyles.searchBar}>
          <Ionicons name="search" size={16} color="#94A3B8" style={{ marginLeft: 12 }} />
          <TextInput
            ref={inputRef}
            style={widgetStyles.input}
            placeholder="Search stores, services, or locations..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor="#1A6FFF"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => { onSearchChange(""); inputRef.current?.focus(); }}
              style={{ padding: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="#475569" />
            </Pressable>
          )}
        </View>

        <AnimatedPressable
          style={[widgetStyles.findButton, findStyle]}
          onPressIn={() => { findScale.value = withSpring(0.9, { damping: 20 }); }}
          onPressOut={() => { findScale.value = withSpring(1, { damping: 20 }); }}
          onPress={handleFind}
        >
          <Text style={widgetStyles.findText}>FIND</Text>
        </AnimatedPressable>
      </View>

      {/* ── Top 5 Results ── */}
      <View style={widgetStyles.section}>
        <View style={widgetStyles.sectionHeader}>
          <Ionicons name="location" size={12} color="#475569" />
          <Text style={widgetStyles.sectionLabel}>
            {searchQuery ? "SEARCH RESULTS" : "TOP 5 RESULTS"}
          </Text>
        </View>

        {displayed.length === 0 ? (
          <View style={widgetStyles.emptyRow}>
            <Ionicons name="search-outline" size={22} color="#334155" />
            <Text style={widgetStyles.emptyText}>
              {searchQuery ? `No results for "${searchQuery}"` : "No nearby stores found"}
            </Text>
          </View>
        ) : (
          <View>
            {displayed.map((store, i) => (
              <StoreRow key={store.id} store={store} rank={i} onPress={onStorePress} />
            ))}
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={widgetStyles.divider} />

      {/* ── Credit Card Information ── */}
      <View style={widgetStyles.section}>
        <View style={widgetStyles.sectionHeader}>
          <MaterialCommunityIcons name="credit-card-outline" size={12} color="#475569" />
          <Text style={widgetStyles.sectionLabel}>CREDIT CARD INFORMATION</Text>
        </View>
        <View style={{ paddingBottom: 14 }}>
          <CreditCard />
        </View>
      </View>
    </Animated.View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const widgetStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#111827",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    height: 42,
    gap: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#E2E8F0",
    paddingVertical: Platform.OS === "ios" ? 0 : 4,
    height: "100%",
  },
  findButton: {
    backgroundColor: "#1A6FFF",
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  findText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.8,
  },
  section: {
    gap: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
    letterSpacing: 1.2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 4,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#334155",
  },
});
