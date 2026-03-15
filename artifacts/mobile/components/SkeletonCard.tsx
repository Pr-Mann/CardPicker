import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import Colors from "@/constants/colors";

function SkeletonBox({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.4, { duration: 700 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.light.border,
        },
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBox width={48} height={48} borderRadius={14} />
      <View style={styles.info}>
        <SkeletonBox width="70%" height={15} />
        <SkeletonBox width="50%" height={12} />
        <SkeletonBox width={80} height={20} borderRadius={6} />
      </View>
      <SkeletonBox width={44} height={15} />
    </View>
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
    backgroundColor: Colors.light.backgroundCard,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 6,
  },
});
