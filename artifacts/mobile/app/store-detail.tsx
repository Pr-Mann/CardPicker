import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

export default function StoreDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    address: string;
    distanceMeters: string;
    category: string;
    isOpen: string;
    rating: string;
    lat: string;
    lng: string;
  }>();

  const insets = useSafeAreaInsets();
  const C = Colors.light;
  const distMeters = parseFloat(params.distanceMeters || "0");
  const distLabel = distMeters < 1000
    ? `${Math.round(distMeters)} m away`
    : `${(distMeters / 1000).toFixed(1)} km away`;

  const rating = params.rating ? parseFloat(params.rating) : null;
  const isOpen = params.isOpen === "true" ? true : params.isOpen === "false" ? false : null;

  const openInMaps = () => {
    const lat = params.lat;
    const lng = params.lng;
    const label = encodeURIComponent(params.name || "Store");
    const url = Platform.OS === "ios"
      ? `maps:?q=${label}&ll=${lat},${lng}`
      : `geo:${lat},${lng}?q=${label}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={[C.tintLight, C.background]}
        style={styles.headerGradient}
      />

      <View
        style={[
          styles.topBar,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 8,
          },
        ]}
      >
        <Pressable
          style={[styles.backButton, { backgroundColor: C.backgroundCard }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
            paddingTop: Platform.OS === "web" ? 67 + 60 : insets.top + 68,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: C.backgroundCard }]}>
          <Text style={[styles.storeName, { color: C.text }]}>{params.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={C.textSecondary} />
            <Text style={[styles.address, { color: C.textSecondary }]}>{params.address}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: C.border }]} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.tint }]}>{distLabel}</Text>
              <Text style={[styles.statLabel, { color: C.textTertiary }]}>Distance</Text>
            </View>
            {rating !== null && (
              <View style={styles.statItem}>
                <View style={styles.ratingValue}>
                  <Ionicons name="star" size={16} color={C.warning} />
                  <Text style={[styles.statValue, { color: C.text }]}>{rating.toFixed(1)}</Text>
                </View>
                <Text style={[styles.statLabel, { color: C.textTertiary }]}>Rating</Text>
              </View>
            )}
            {isOpen !== null && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: isOpen ? C.success : C.error }]}>
                  {isOpen ? "Open" : "Closed"}
                </Text>
                <Text style={[styles.statLabel, { color: C.textTertiary }]}>Status</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.directionsButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={openInMaps}
        >
          <LinearGradient
            colors={[C.tint, C.tintDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.directionsGradient}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.directionsText}>Get Directions</Text>
          </LinearGradient>
        </Pressable>

        <View style={[styles.privacyCard, { backgroundColor: C.backgroundCard }]}>
          <Ionicons name="shield-checkmark" size={20} color={C.tint} />
          <Text style={[styles.privacyText, { color: C.textSecondary }]}>
            Location data is only used to find nearby stores and is never stored or shared.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  storeName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  address: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
  },
  statItem: {
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  ratingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  directionsButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  directionsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
  },
  directionsText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 14,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
