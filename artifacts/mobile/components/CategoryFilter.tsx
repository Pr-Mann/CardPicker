import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { StoreCategory } from "@/hooks/useNearbyStores";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type FilterOption = StoreCategory | "all";

const FILTERS: { id: FilterOption; label: string; icon: string; iconSet: "Ionicons" | "MaterialCommunityIcons" }[] = [
  { id: "all", label: "All", icon: "apps", iconSet: "Ionicons" },
  { id: "grocery", label: "Grocery", icon: "cart", iconSet: "Ionicons" },
  { id: "gas", label: "Gas", icon: "gas-station", iconSet: "MaterialCommunityIcons" },
  { id: "pharmacy", label: "Pharmacy", icon: "medkit", iconSet: "Ionicons" },
  { id: "restaurant", label: "Food", icon: "restaurant", iconSet: "Ionicons" },
  { id: "retail", label: "Retail", icon: "bag-handle", iconSet: "Ionicons" },
  { id: "gym", label: "Gym", icon: "barbell", iconSet: "Ionicons" },
  { id: "convenience", label: "Convenience", icon: "storefront", iconSet: "Ionicons" },
];

const CATEGORY_COLORS: Record<FilterOption, string> = {
  all: Colors.light.tint,
  grocery: Colors.light.grocery,
  gas: Colors.light.gas,
  pharmacy: Colors.light.pharmacy,
  restaurant: Colors.light.restaurant,
  retail: Colors.light.retail,
  gym: Colors.light.gym,
  convenience: Colors.light.convenience,
  other: Colors.light.other,
};

function FilterChip({
  filter,
  selected,
  onPress,
}: {
  filter: (typeof FILTERS)[0];
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const C = Colors.light;
  const color = CATEGORY_COLORS[filter.id];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View
        style={[
          styles.chip,
          selected
            ? { backgroundColor: color, borderColor: color }
            : { backgroundColor: C.backgroundCard, borderColor: C.border },
        ]}
      >
        {filter.iconSet === "MaterialCommunityIcons" ? (
          <MaterialCommunityIcons
            name={filter.icon as any}
            size={14}
            color={selected ? "#fff" : color}
          />
        ) : (
          <Ionicons
            name={filter.icon as any}
            size={14}
            color={selected ? "#fff" : color}
          />
        )}
        <Text
          style={[
            styles.chipLabel,
            { color: selected ? "#fff" : C.textSecondary },
          ]}
        >
          {filter.label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

interface CategoryFilterProps {
  selected: FilterOption;
  onSelect: (filter: FilterOption) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => (
        <FilterChip
          key={filter.id}
          filter={filter}
          selected={selected === filter.id}
          onPress={() => onSelect(filter.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  chipLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
