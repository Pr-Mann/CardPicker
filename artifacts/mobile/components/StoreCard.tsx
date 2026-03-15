import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { NearbyStore, StoreCategory, formatDistanceLabel } from "@/hooks/useNearbyStores";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CATEGORY_CONFIG: Record<
  StoreCategory,
  { icon: string; iconSet: "Ionicons" | "MaterialCommunityIcons"; label: string; colorKey: keyof typeof Colors.light }
> = {
  grocery: { icon: "cart", iconSet: "Ionicons", label: "Grocery", colorKey: "grocery" },
  gas: { icon: "gas-station", iconSet: "MaterialCommunityIcons", label: "Gas Station", colorKey: "gas" },
  pharmacy: { icon: "medkit", iconSet: "Ionicons", label: "Pharmacy", colorKey: "pharmacy" },
  restaurant: { icon: "restaurant", iconSet: "Ionicons", label: "Restaurant", colorKey: "restaurant" },
  retail: { icon: "bag-handle", iconSet: "Ionicons", label: "Retail", colorKey: "retail" },
  gym: { icon: "barbell", iconSet: "Ionicons", label: "Gym", colorKey: "gym" },
  convenience: { icon: "storefront", iconSet: "Ionicons", label: "Convenience", colorKey: "convenience" },
  other: { icon: "business", iconSet: "Ionicons", label: "Store", colorKey: "other" },
};

function CategoryIcon({
  category,
  size = 18,
  color,
}: {
  category: StoreCategory;
  size?: number;
  color: string;
}) {
  const config = CATEGORY_CONFIG[category];
  if (config.iconSet === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={config.icon as any} size={size} color={color} />;
  }
  return <Ionicons name={config.icon as any} size={size} color={color} />;
}

interface StoreCardProps {
  store: NearbyStore;
  onPress?: (store: NearbyStore) => void;
}

export function StoreCard({ store, onPress }: StoreCardProps) {
  const colorScheme = useColorScheme();
  const C = Colors.light;
  const scale = useSharedValue(1);
  const config = CATEGORY_CONFIG[store.category];
  const categoryColor = C[config.colorKey] as string;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(store);
  };

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={[styles.card, { backgroundColor: C.backgroundCard, shadowColor: C.shadow }]}>
        <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}18` }]}>
          <CategoryIcon category={store.category} size={22} color={categoryColor} />
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
            {store.name}
          </Text>
          <Text style={[styles.address, { color: C.textSecondary }]} numberOfLines={1}>
            {store.address}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
              <Text style={[styles.categoryLabel, { color: categoryColor }]}>
                {config.label}
              </Text>
            </View>
            {store.rating !== undefined && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={11} color={C.warning} />
                <Text style={[styles.ratingText, { color: C.textSecondary }]}>
                  {store.rating.toFixed(1)}
                </Text>
              </View>
            )}
            {store.isOpen !== undefined && (
              <View style={styles.openBadge}>
                <View style={[styles.openDot, { backgroundColor: store.isOpen ? C.success : C.error }]} />
                <Text style={[styles.openText, { color: store.isOpen ? C.success : C.error }]}>
                  {store.isOpen ? "Open" : "Closed"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.distanceContainer}>
          <Text style={[styles.distance, { color: C.tint }]}>
            {formatDistanceLabel(store.distanceMeters)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  address: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  distanceContainer: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 2,
    flexShrink: 0,
  },
  distance: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
});
