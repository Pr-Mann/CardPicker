import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "location" as const,
    iconBg: Colors.light.tintLight,
    iconColor: Colors.light.tint,
    title: "Find Stores Near You",
    subtitle: "Instantly discover grocery stores, pharmacies, gas stations, and more right around your location.",
  },
  {
    id: "2",
    icon: "list" as const,
    iconBg: "#E8FFF5",
    iconColor: Colors.light.grocery,
    title: "Smart Sorted List",
    subtitle: "Stores are sorted by distance so you always know what's closest. Filter by category to find exactly what you need.",
  },
  {
    id: "3",
    icon: "shield-checkmark" as const,
    iconBg: "#F0EEFF",
    iconColor: Colors.light.pharmacy,
    title: "Privacy First",
    subtitle: "Your location is only used to find nearby stores. We never store or share your location data.",
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const C = Colors.light;
  const buttonScale = useSharedValue(1);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleGetStarted = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem("onboarding_complete", "true");
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex((prev) => prev + 1);
      Haptics.selectionAsync();
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: C.background,
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom,
        },
      ]}
    >
      <LinearGradient
        colors={["#EBF3FF", "#F5F7FA"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={56} color={item.iconColor} />
            </View>
            <Text style={[styles.title, { color: C.text }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === currentIndex ? C.tint : C.border,
                width: i === currentIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        {isLast ? (
          <AnimatedPressable
            style={buttonAnimStyle}
            onPressIn={() => { buttonScale.value = withSpring(0.96, { damping: 20, stiffness: 300 }); }}
            onPressOut={() => { buttonScale.value = withSpring(1, { damping: 20, stiffness: 300 }); }}
            onPress={handleGetStarted}
          >
            <LinearGradient
              colors={[C.tint, C.tintDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </AnimatedPressable>
        ) : (
          <AnimatedPressable
            style={buttonAnimStyle}
            onPressIn={() => { buttonScale.value = withSpring(0.96, { damping: 20, stiffness: 300 }); }}
            onPressOut={() => { buttonScale.value = withSpring(1, { damping: 20, stiffness: 300 }); }}
            onPress={handleNext}
          >
            <LinearGradient
              colors={[C.tint, C.tintDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 24,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
});
