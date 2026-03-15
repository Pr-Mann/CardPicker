import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { CategoryFilter, FilterOption } from "@/components/CategoryFilter";
import { SearchWidget } from "@/components/SearchWidget";
import { SkeletonCard } from "@/components/SkeletonCard";
import { StoreCard } from "@/components/StoreCard";
import { NearbyStore, useNearbyStores } from "@/hooks/useNearbyStores";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const C = Colors.light;

  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { stores, loading, error } = useNearbyStores(
    coords?.lat ?? null,
    coords?.lng ?? null,
    1500
  );

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const done = await AsyncStorage.getItem("onboarding_complete");
    if (!done) {
      router.replace("/onboarding");
      return;
    }
    requestLocation();
  };

  const requestLocation = async () => {
    setLocationStatus("requesting");
    try {
      if (Platform.OS === "web") {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocationStatus("granted");
          },
          () => setLocationStatus("denied")
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationStatus("denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      setLocationStatus("granted");
    } catch {
      setLocationStatus("denied");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS !== "web") {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch {}
    }
    setRefreshing(false);
  }, []);

  // Filter stores by category then by search query
  const filteredStores = stores
    .filter((s) => selectedFilter === "all" || s.category === selectedFilter)
    .filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });

  const handleStorePress = (store: NearbyStore) => {
    router.push({
      pathname: "/store-detail",
      params: {
        id: store.id,
        name: store.name,
        address: store.address,
        distanceMeters: store.distanceMeters.toString(),
        category: store.category,
        isOpen: store.isOpen?.toString() ?? "",
        rating: store.rating?.toString() ?? "",
        lat: store.lat.toString(),
        lng: store.lng.toString(),
      },
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 100;

  // Widget shown above the store list (always visible once location is granted or loading)
  const showWidget = locationStatus === "granted" || loading;

  const ListHeader = (
    <View>
      {/* Page title */}
      <View style={[styles.headerTop, { paddingTop: topPad + 12 }]}>
        <LinearGradient
          colors={[C.backgroundHeader + "FF", C.backgroundHeader + "00"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.headerTitle, { color: C.text }]}>Nearby Stores</Text>
            {coords && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color={C.tint} />
                <Text style={[styles.locationLabel, { color: C.textSecondary }]}>
                  Using your current location
                </Text>
              </View>
            )}
          </View>
          <Pressable
            style={[styles.refreshButton, { backgroundColor: C.tintLight }]}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={18} color={C.tint} />
          </Pressable>
        </View>
      </View>

      {/* Search widget + top 3 + credit card */}
      {showWidget && (
        <SearchWidget
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLocationPress={onRefresh}
          stores={stores}
        />
      )}

      {/* Category filter chips */}
      {locationStatus === "granted" && (
        <CategoryFilter selected={selectedFilter} onSelect={setSelectedFilter} />
      )}

      {/* Section label */}
      {locationStatus === "granted" && !loading && stores.length > 0 && (
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            {searchQuery ? "Search Results" : "Closest to You"}
          </Text>
          <View style={[styles.countPill, { backgroundColor: C.tintLight }]}>
            <Text style={[styles.countText, { color: C.tint }]}>
              {filteredStores.length}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // Loading skeletons
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          ListHeaderComponent={ListHeader}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // Non-list states: idle, requesting, denied, error
  if (locationStatus !== "granted" || error) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <View style={[styles.headerTop, { paddingTop: topPad + 12 }]}>
          <LinearGradient
            colors={[C.backgroundHeader + "FF", C.backgroundHeader + "00"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitle, { color: C.text }]}>Nearby Stores</Text>
          </View>
        </View>

        {(locationStatus === "idle" || locationStatus === "requesting") && (
          <View style={styles.centeredState}>
            <View style={[styles.stateIcon, { backgroundColor: C.tintLight }]}>
              <Ionicons name="location" size={40} color={C.tint} />
            </View>
            <Text style={[styles.stateTitle, { color: C.text }]}>Finding Your Location</Text>
            <Text style={[styles.stateSubtitle, { color: C.textSecondary }]}>
              Please allow location access to discover nearby stores.
            </Text>
          </View>
        )}

        {locationStatus === "denied" && !error && (
          <View style={styles.centeredState}>
            <View style={[styles.stateIcon, { backgroundColor: "#FFF0F0" }]}>
              <Ionicons name="location-outline" size={40} color={C.error} />
            </View>
            <Text style={[styles.stateTitle, { color: C.text }]}>Location Access Required</Text>
            <Text style={[styles.stateSubtitle, { color: C.textSecondary }]}>
              NearbyStores needs your location to find stores near you. Please enable location access in your settings.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: C.tint, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={requestLocation}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {error && (
          <View style={styles.centeredState}>
            <View style={[styles.stateIcon, { backgroundColor: "#FFF8E8" }]}>
              <Ionicons name="warning-outline" size={40} color={C.warning} />
            </View>
            <Text style={[styles.stateTitle, { color: C.text }]}>Something Went Wrong</Text>
            <Text style={[styles.stateSubtitle, { color: C.textSecondary }]}>{error}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: C.tint, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={onRefresh}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // Empty state (after filtering)
  if (filteredStores.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <FlatList
          data={[]}
          keyExtractor={(item: any) => item}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.centeredState}>
              <View style={[styles.stateIcon, { backgroundColor: C.tintLight }]}>
                <Ionicons name="search-outline" size={40} color={C.tint} />
              </View>
              <Text style={[styles.stateTitle, { color: C.text }]}>No Stores Found</Text>
              <Text style={[styles.stateSubtitle, { color: C.textSecondary }]}>
                {searchQuery
                  ? `No results for "${searchQuery}". Try a different search.`
                  : selectedFilter !== "all"
                  ? "No stores of this category nearby. Try a different filter."
                  : "No stores found within 1.5 km. Pull to refresh or try again."}
              </Text>
            </View>
          }
          renderItem={() => null}
          contentContainerStyle={{ paddingBottom: bottomPad, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // Main store list
  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <FlatList
        data={filteredStores}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 35).duration(280)}>
            <StoreCard store={item} onPress={handleStorePress} />
          </Animated.View>
        )}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTop: {
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 16,
  },
  stateIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  stateSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
