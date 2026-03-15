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
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import Colors from "@/constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SearchWidgetProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onLocationPress: () => void;
}

// ── Credit Card Placeholder ────────────────────────────────────────────────

function CreditCardPlaceholder() {
  const C = Colors.light;

  return (
    <View style={cardStyles.wrapper}>
      <Text style={[cardStyles.sectionLabel, { color: C.textSecondary }]}>
        RECOMMENDED FOR YOU
      </Text>

      {/* Phone mockup frame */}
      <View style={cardStyles.phoneMockup}>
        {/* Phone notch / speaker */}
        <View style={cardStyles.phoneTop}>
          <View style={cardStyles.phoneSpeaker} />
        </View>

        {/* Phone screen content */}
        <View style={cardStyles.phoneScreen}>
          {/* Credit card inside phone */}
          <View style={cardStyles.creditCardContainer}>
            <LinearGradient
              colors={["#1A1A2E", "#16213E", "#0F3460"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={cardStyles.creditCard}
            >
              {/* Top row: chip + recommended badge */}
              <View style={cardStyles.cardTopRow}>
                <View style={cardStyles.chip}>
                  <View style={cardStyles.chipInner} />
                </View>
                <View style={cardStyles.recommendedBadge}>
                  <Ionicons name="star" size={8} color="#FFD700" />
                  <Text style={cardStyles.recommendedText}>Recommended</Text>
                </View>
              </View>

              {/* Card number dots */}
              <View style={cardStyles.cardNumberRow}>
                {[0, 1, 2, 3].map((group) => (
                  <View key={group} style={cardStyles.dotGroup}>
                    {[0, 1, 2, 3].map((dot) => (
                      <View key={dot} style={cardStyles.dot} />
                    ))}
                  </View>
                ))}
              </View>

              {/* Card info row */}
              <View style={cardStyles.cardInfoRow}>
                <View style={cardStyles.cardInfoItem}>
                  <Text style={cardStyles.cardInfoLabel}>CARD NAME</Text>
                  <View style={cardStyles.cardInfoPlaceholder} />
                </View>
                <View style={cardStyles.cardInfoItem}>
                  <Text style={cardStyles.cardInfoLabel}>CASHBACK</Text>
                  <View style={[cardStyles.cardInfoPlaceholder, cardStyles.cashbackBadge]}>
                    <Text style={cardStyles.cashbackText}>5%</Text>
                  </View>
                </View>
              </View>

              {/* Bottom row: category + logo placeholder */}
              <View style={cardStyles.cardBottomRow}>
                <View style={cardStyles.categoryChip}>
                  <MaterialCommunityIcons name="gas-station" size={9} color="rgba(255,255,255,0.6)" />
                  <Text style={cardStyles.categoryChipText}>Grocery</Text>
                </View>
                <View style={cardStyles.cardLogoPlaceholder}>
                  <View style={[cardStyles.logoCircle, { backgroundColor: "rgba(255,180,0,0.8)" }]} />
                  <View style={[cardStyles.logoCircle, { backgroundColor: "rgba(255,80,0,0.6)", marginLeft: -8 }]} />
                </View>
              </View>
            </LinearGradient>

            {/* Glow effect under card */}
            <View style={cardStyles.cardGlow} />
          </View>

          {/* App-like UI elements below card inside phone */}
          <View style={cardStyles.phoneAppUI}>
            <View style={[cardStyles.uiRow, { backgroundColor: "rgba(26,111,255,0.08)" }]}>
              <View style={cardStyles.uiIconBox}>
                <Ionicons name="wallet-outline" size={12} color={C.tint} />
              </View>
              <View style={cardStyles.uiTextGroup}>
                <View style={[cardStyles.uiLine, { width: "60%" }]} />
                <View style={[cardStyles.uiLine, { width: "40%", height: 6, marginTop: 4 }]} />
              </View>
              <View style={cardStyles.uiTag}>
                <Text style={cardStyles.uiTagText}>Best</Text>
              </View>
            </View>

            <View style={[cardStyles.uiRow, { backgroundColor: "rgba(16,185,129,0.08)" }]}>
              <View style={[cardStyles.uiIconBox, { backgroundColor: "rgba(16,185,129,0.15)" }]}>
                <Ionicons name="trending-up" size={12} color={Colors.light.grocery} />
              </View>
              <View style={cardStyles.uiTextGroup}>
                <View style={[cardStyles.uiLine, { width: "50%" }]} />
                <View style={[cardStyles.uiLine, { width: "35%", height: 6, marginTop: 4 }]} />
              </View>
              <View style={[cardStyles.uiTag, { backgroundColor: "rgba(16,185,129,0.15)" }]}>
                <Text style={[cardStyles.uiTagText, { color: Colors.light.grocery }]}>2x</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Phone home indicator */}
        <View style={cardStyles.phoneBottom}>
          <View style={cardStyles.homeIndicator} />
        </View>
      </View>

      {/* Caption below phone */}
      <Text style={[cardStyles.caption, { color: C.textTertiary }]}>
        Card recommendations coming soon
      </Text>
    </View>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function SearchWidget({
  searchQuery,
  onSearchChange,
  onLocationPress,
}: SearchWidgetProps) {
  const C = Colors.light;
  const inputRef = useRef<TextInput>(null);
  const hasText = searchQuery.length > 0;

  const actionScale = useSharedValue(1);
  const actionBgProgress = useSharedValue(0);

  React.useEffect(() => {
    actionBgProgress.value = withTiming(hasText ? 1 : 0, { duration: 200 });
  }, [hasText]);

  const actionAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: actionScale.value }],
  }));

  const handleActionPressIn = () => {
    actionScale.value = withSpring(0.88, { damping: 20, stiffness: 300 });
  };

  const handleActionPressOut = () => {
    actionScale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handleActionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (hasText) {
      onSearchChange("");
      inputRef.current?.focus();
    } else {
      onLocationPress();
    }
  };

  const handleClear = () => {
    onSearchChange("");
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* ── Search Bar ── */}
      <View style={[styles.searchBar, { backgroundColor: C.backgroundCard }]}>
        <Ionicons
          name="search"
          size={18}
          color={hasText ? C.tint : C.textTertiary}
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          style={[styles.input, { color: C.text }]}
          placeholder="Search stores, categories..."
          placeholderTextColor={C.textTertiary}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {hasText && (
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
            <Pressable style={styles.clearButton} onPress={handleClear}>
              <View style={[styles.clearDot, { backgroundColor: C.textTertiary }]}>
                <Ionicons name="close" size={10} color="#fff" />
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Dynamic action button */}
        <AnimatedPressable
          style={[
            styles.actionButton,
            {
              backgroundColor: hasText ? C.tint : C.tintLight,
            },
            actionAnimStyle,
          ]}
          onPressIn={handleActionPressIn}
          onPressOut={handleActionPressOut}
          onPress={handleActionPress}
        >
          <Animated.View key={hasText ? "search-icon" : "location-icon"} entering={FadeIn.duration(180)}>
            {hasText ? (
              <Ionicons name="search" size={17} color="#fff" />
            ) : (
              <Ionicons name="navigate" size={17} color={C.tint} />
            )}
          </Animated.View>
        </AnimatedPressable>
      </View>

      {/* ── Credit Card Placeholder ── */}
      <CreditCardPlaceholder />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  clearButton: {
    padding: 4,
  },
  clearDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

const cardStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    alignSelf: "flex-start",
  },

  // Phone mockup
  phoneMockup: {
    width: 220,
    backgroundColor: "#0D0D14",
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#2A2A3A",
    shadowColor: "#1A6FFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  phoneTop: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D0D14",
  },
  phoneSpeaker: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2A2A3A",
  },
  phoneScreen: {
    backgroundColor: "#F5F7FA",
    padding: 12,
    gap: 10,
  },
  phoneBottom: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D0D14",
  },
  homeIndicator: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2A2A3A",
  },

  // Credit card
  creditCardContainer: {
    position: "relative",
  },
  creditCard: {
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardGlow: {
    position: "absolute",
    bottom: -6,
    left: 10,
    right: 10,
    height: 12,
    backgroundColor: "#1A6FFF",
    borderRadius: 14,
    opacity: 0.2,
    transform: [{ scaleX: 0.9 }],
  },

  // Card internals
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  chip: {
    width: 24,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
  },
  chipInner: {
    width: 16,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#A07830",
    backgroundColor: "transparent",
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
  },
  recommendedText: {
    fontSize: 7,
    fontFamily: "Inter_600SemiBold",
    color: "#FFD700",
    letterSpacing: 0.3,
  },
  cardNumberRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 2,
  },
  dotGroup: {
    flexDirection: "row",
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  cardInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardInfoItem: {
    gap: 3,
  },
  cardInfoLabel: {
    fontSize: 6,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.8,
  },
  cardInfoPlaceholder: {
    width: 60,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  cashbackBadge: {
    width: 36,
    height: 18,
    backgroundColor: "rgba(26,111,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  cashbackText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 7,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.6)",
  },
  cardLogoPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  // App UI inside phone
  phoneAppUI: {
    gap: 6,
  },
  uiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 10,
  },
  uiIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(26,111,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  uiTextGroup: {
    flex: 1,
    gap: 0,
  },
  uiLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  uiTag: {
    backgroundColor: "rgba(26,111,255,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  uiTagText: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: Colors.light.tint,
  },

  // Caption
  caption: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
  },
});
