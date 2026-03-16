import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
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
} from "react-native-reanimated";

import { NearbyStore, formatDistanceLabel, StoreCategory } from "@/hooks/useNearbyStores";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Category icon mapping ────────────────────────────────────────────────────

const CATEGORY_META: Record<
  StoreCategory,
  { icon: string; iconSet: "ionicons" | "mci"; color: string; bg: string }
> = {
  grocery:     { icon: "storefront-outline",  iconSet: "ionicons", color: "#22C55E", bg: "#052E16" },
  gas:         { icon: "gas-station",          iconSet: "mci",      color: "#F59E0B", bg: "#2D1B00" },
  pharmacy:    { icon: "medkit-outline",       iconSet: "ionicons", color: "#EF4444", bg: "#2D0A0A" },
  restaurant:  { icon: "restaurant-outline",  iconSet: "ionicons", color: "#F97316", bg: "#2D1000" },
  retail:      { icon: "bag-handle-outline",  iconSet: "ionicons", color: "#8B5CF6", bg: "#1B0840" },
  gym:         { icon: "barbell-outline",      iconSet: "ionicons", color: "#06B6D4", bg: "#002D33" },
  convenience: { icon: "basket-outline",       iconSet: "ionicons", color: "#EC4899", bg: "#2D0020" },
  other:       { icon: "location-outline",     iconSet: "ionicons", color: "#94A3B8", bg: "#1E293B" },
};

function CategoryIcon({ category }: { category: StoreCategory }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
  const icon =
    meta.iconSet === "mci" ? (
      <MaterialCommunityIcons name={meta.icon as any} size={14} color={meta.color} />
    ) : (
      <Ionicons name={meta.icon as any} size={14} color={meta.color} />
    );
  return (
    <View style={[iconStyles.box, { backgroundColor: meta.bg }]}>
      {icon}
    </View>
  );
}

const iconStyles = StyleSheet.create({
  box: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

// ── Star Rating ──────────────────────────────────────────────────────────────

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

// ── Store Row (non-interactive, display only) ────────────────────────────────

function StoreRow({ store, rank }: { store: NearbyStore; rank: number }) {
  const categoryLabel =
    store.category.charAt(0).toUpperCase() + store.category.slice(1);

  return (
    <Animated.View
      entering={FadeInDown.delay(rank * 45).duration(200)}
      style={[rowStyles.row, rank === 0 && rowStyles.rowFirst]}
    >
      <CategoryIcon category={store.category} />

      <View style={rowStyles.textCol}>
        <Text style={rowStyles.name} numberOfLines={1}>
          {store.name}
        </Text>
        <View style={rowStyles.metaRow}>
          {store.rating != null && (
            <>
              <StarRating rating={store.rating} />
              <Text style={rowStyles.sep}>·</Text>
            </>
          )}
          <Text style={rowStyles.categoryLabel}>{categoryLabel}</Text>
        </View>
      </View>

      <View style={rowStyles.rightCol}>
        <Text style={rowStyles.distance}>
          {formatDistanceLabel(store.distanceMeters)}
        </Text>
        {store.isOpen === true && (
          <View style={rowStyles.openBadge}>
            <Text style={rowStyles.openText}>Open</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  rowFirst: {
    borderTopWidth: 0,
    backgroundColor: "rgba(26,111,255,0.10)",
    borderRadius: 10,
    marginHorizontal: 8,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#E2E8F0",
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sep: {
    fontSize: 9,
    color: "#334155",
  },
  categoryLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 3,
    flexShrink: 0,
  },
  distance: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#1A6FFF",
  },
  openBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  openText: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
    color: "#22C55E",
  },
});

// ── Credit Card ──────────────────────────────────────────────────────────────

function CreditCard() {
  return (
    <LinearGradient
      colors={["#4F46E5", "#7C3AED", "#DB2777"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={ccStyles.card}
    >
      <View style={ccStyles.topRow}>
        <View style={ccStyles.chip}>
          <View style={ccStyles.chipH} />
          <View style={ccStyles.chipV} />
        </View>
        <View style={ccStyles.logoRow}>
          <View style={[ccStyles.circle, { backgroundColor: "#EB001B", marginRight: -7 }]} />
          <View style={[ccStyles.circle, { backgroundColor: "#F79E1B", opacity: 0.9 }]} />
        </View>
      </View>

      <Text style={ccStyles.number}>4512  8765  4321  0987</Text>

      <View style={ccStyles.bottomRow}>
        <View>
          <Text style={ccStyles.label}>CARD HOLDER</Text>
          <Text style={ccStyles.value}>JOHN A. DOE</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={ccStyles.label}>EXP DATE</Text>
          <Text style={ccStyles.value}>11/27</Text>
        </View>
        <Text style={ccStyles.network}>VISA</Text>
      </View>
    </LinearGradient>
  );
}

const ccStyles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: "#1A6FFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chip: {
    width: 28,
    height: 21,
    borderRadius: 4,
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
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  number: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#E2E8F0",
    letterSpacing: 1.8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  label: {
    fontSize: 7,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#E2E8F0",
    letterSpacing: 0.3,
  },
  network: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#E2E8F0",
    letterSpacing: 2.5,
    alignSelf: "flex-end",
  },
});

// ── Main Widget ──────────────────────────────────────────────────────────────

export interface SearchWidgetProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onLocationPress: () => void;
  stores: NearbyStore[];
}

export function SearchWidget({
  searchQuery,
  onSearchChange,
  onLocationPress,
  stores,
}: SearchWidgetProps) {
  const inputRef = useRef<TextInput>(null);

  const findScale = useSharedValue(1);
  const findAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: findScale.value }],
  }));

  const handleFind = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLocationPress();
    inputRef.current?.blur();
  };

  // Top 3 filtered by search query
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
    .slice(0, 3);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={widgetStyles.container}>

      {/* ── Search Bar ── */}
      <View style={widgetStyles.searchRow}>
        <View style={widgetStyles.searchBar}>
          <Ionicons name="search" size={14} color="#64748B" style={{ marginLeft: 10 }} />
          <TextInput
            ref={inputRef}
            style={widgetStyles.input}
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
            <Pressable
              onPress={() => { onSearchChange(""); inputRef.current?.focus(); }}
              style={{ padding: 6 }}
            >
              <Ionicons name="close-circle" size={14} color="#334155" />
            </Pressable>
          )}
        </View>

        <AnimatedPressable
          style={[widgetStyles.findButton, findAnimStyle]}
          onPressIn={() => { findScale.value = withSpring(0.88, { damping: 20 }); }}
          onPressOut={() => { findScale.value = withSpring(1, { damping: 20 }); }}
          onPress={handleFind}
        >
          <Text style={widgetStyles.findText}>FIND</Text>
        </AnimatedPressable>
      </View>

      {/* ── Top 3 Results ── */}
      <View style={widgetStyles.sectionHeader}>
        <Ionicons name="location" size={10} color="#475569" />
        <Text style={widgetStyles.sectionLabel}>
          {searchQuery.trim() ? "SEARCH RESULTS" : "TOP 3 NEARBY"}
        </Text>
      </View>

      {displayed.length === 0 ? (
        <View style={widgetStyles.emptyRow}>
          <Ionicons name="search-outline" size={16} color="#1E293B" />
          <Text style={widgetStyles.emptyText}>
            {searchQuery.trim()
              ? `No results for "${searchQuery}"`
              : "No nearby stores found"}
          </Text>
        </View>
      ) : (
        <View style={{ paddingBottom: 4 }}>
          {displayed.map((store, i) => (
            <StoreRow key={store.id} store={store} rank={i} />
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={widgetStyles.divider} />

      {/* ── Credit Card ── */}
      <View style={widgetStyles.sectionHeader}>
        <MaterialCommunityIcons name="credit-card-outline" size={10} color="#475569" />
        <Text style={widgetStyles.sectionLabel}>CREDIT CARD</Text>
      </View>
      <View style={{ paddingBottom: 12 }}>
        <CreditCard />
      </View>

    </Animated.View>
  );
}

// ── Widget Styles ────────────────────────────────────────────────────────────

const widgetStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#0B0F19",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    height: 48,
    gap: 8,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#CBD5E1",
    paddingVertical: Platform.OS === "ios" ? 0 : 2,
    height: "100%",
  },
  findButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  findText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#64748B",
    letterSpacing: 1.2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginTop: 8,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#475569",
  },
});
