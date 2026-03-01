# George App — Feature Implementation Guide

> **For Trae:** This file contains ready-to-implement features for the George app. Each feature includes component code, logic, and integration points. Wire these in after the base build is complete.

---

## Feature 1: 60-Second Quote Timer

When a user describes a problem or sends a photo, a visible countdown timer appears while George processes. If George returns a price before 60 seconds, the timer stops and celebrates.

### Component: `src/components/chat/QuoteTimer.tsx`

```tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface QuoteTimerProps {
  isActive: boolean;
  onComplete?: (seconds: number) => void;
}

export function QuoteTimer({ isActive, onComplete }: QuoteTimerProps) {
  const elapsed = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      elapsed.value = 0;
      opacity.value = withTiming(1, { duration: 200 });
      // Start counting
      const interval = setInterval(() => {
        elapsed.value += 0.1;
      }, 100);
      return () => clearInterval(interval);
    } else if (elapsed.value > 0) {
      // Quote came back — celebrate
      scale.value = withSpring(1.3, { damping: 8, stiffness: 200 }, () => {
        scale.value = withSpring(1);
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onComplete) runOnJS(onComplete)(elapsed.value);
      // Fade out after 3 seconds
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
      }, 3000);
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const timerText = useAnimatedStyle(() => {
    const secs = Math.floor(elapsed.value);
    const tenths = Math.floor((elapsed.value % 1) * 10);
    return { text: `${secs}.${tenths}s` };
  });

  if (!isActive && elapsed.value === 0) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.label}>Getting your price</Text>
      <View style={styles.timerRow}>
        <Animated.Text style={styles.timer}>
          {Math.floor(elapsed.value)}.{Math.floor((elapsed.value % 1) * 10)}s
        </Animated.Text>
        <Text style={styles.target}> / 60s</Text>
      </View>
      {!isActive && elapsed.value > 0 && (
        <Text style={styles.success}>
          Fair price in {Math.floor(elapsed.value)} seconds
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "rgba(244, 124, 32, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 124, 32, 0.2)",
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  timerRow: { flexDirection: "row", alignItems: "baseline" },
  timer: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
  },
  target: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  success: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 4,
  },
});
```

### Integration
In `GeorgeChatScreen.tsx`, when user sends a message that triggers a quote (service request, photo), set `isQuoting=true`. When George responds with a price card, set `isQuoting=false`. The timer renders inline in the chat above the typing indicator.

---

## Feature 2: "Do This Again" Card

After a job completes and the user submits a rating, George sends a "Do This Again" card offering to schedule recurring service.

### Component: `src/components/chat/cards/DoThisAgainCard.tsx`

```tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInUp, withSpring, useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface DoThisAgainCardProps {
  serviceName: string;
  proName: string;
  price: number;
  onScheduleRecurring: (frequency: string) => void;
  onScheduleOnce: () => void;
  onDismiss: () => void;
}

const FREQUENCIES = [
  { label: "Every 2 weeks", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Every 3 months", value: "quarterly" },
  { label: "Every 6 months", value: "biannual" },
];

export function DoThisAgainCard({
  serviceName,
  proName,
  price,
  onScheduleRecurring,
  onScheduleOnce,
  onDismiss,
}: DoThisAgainCardProps) {
  const [selectedFreq, setSelectedFreq] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleFreqSelect = (freq: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFreq(freq);
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmed(true);
    if (selectedFreq) {
      onScheduleRecurring(selectedFreq);
    } else {
      onScheduleOnce();
    }
  };

  if (confirmed) {
    return (
      <Animated.View entering={FadeInUp.springify()} style={[styles.card, styles.confirmedCard]}>
        <Text style={styles.confirmedText}>
          Scheduled! {proName} will be back {selectedFreq || "soon"}.
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.springify().damping(15).stiffness(150)} style={styles.card}>
      <Text style={styles.title}>{proName} did a great job.</Text>
      <Text style={styles.subtitle}>Want to schedule {serviceName.toLowerCase()} again?</Text>

      <View style={styles.freqGrid}>
        {FREQUENCIES.map((freq) => (
          <Pressable
            key={freq.value}
            onPress={() => handleFreqSelect(freq.value)}
            style={[
              styles.freqChip,
              selectedFreq === freq.value && styles.freqChipActive,
            ]}
          >
            <Text
              style={[
                styles.freqText,
                selectedFreq === freq.value && styles.freqTextActive,
              ]}
            >
              {freq.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.priceNote}>
        Same price: ${price} per visit. Same pro.
      </Text>

      <View style={styles.actions}>
        <Pressable onPress={handleConfirm} style={styles.confirmButton}>
          <Text style={styles.confirmText}>
            {selectedFreq ? `Schedule ${FREQUENCIES.find(f => f.value === selectedFreq)?.label}` : "Book One More Time"}
          </Text>
        </Pressable>
        <Pressable onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>Not now</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  confirmedCard: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    alignItems: "center",
    paddingVertical: 16,
  },
  confirmedText: {
    color: "#10B981",
    fontWeight: "700",
    fontSize: 15,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  freqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  freqChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  freqChipActive: {
    backgroundColor: "rgba(244, 124, 32, 0.15)",
    borderColor: colors.primary,
  },
  freqText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  freqTextActive: {
    color: colors.primary,
  },
  priceNote: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  actions: {
    gap: 8,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  dismissButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  dismissText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
```

### Integration
After a rating card is submitted in the chat, George sends this card automatically. The `onScheduleRecurring` handler calls `POST /api/service-requests` with a `recurring` field specifying frequency.

---

## Feature 3: Predictive Booking

George remembers past service patterns and proactively suggests rebooking when the time is right.

### Component: `src/components/chat/cards/PredictiveBookingCard.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface PredictiveBookingCardProps {
  serviceName: string;
  proName: string;
  lastDate: string; // "October 15"
  suggestedDate: string; // "March 8"
  price: number;
  reason: string; // "Based on your biweekly schedule last summer"
  onBook: () => void;
  onAdjust: () => void;
  onDismiss: () => void;
}

export function PredictiveBookingCard({
  serviceName,
  proName,
  lastDate,
  suggestedDate,
  price,
  reason,
  onBook,
  onAdjust,
  onDismiss,
}: PredictiveBookingCardProps) {
  return (
    <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Time for {serviceName.toLowerCase()}?</Text>
        <Text style={styles.reason}>{reason}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last done</Text>
          <Text style={styles.detailValue}>{lastDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Suggested</Text>
          <Text style={[styles.detailValue, { color: colors.primary }]}>{suggestedDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pro</Text>
          <Text style={styles.detailValue}>{proName} (same as last time)</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price</Text>
          <Text style={styles.detailValue}>${price} (same price)</Text>
        </View>
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onBook();
        }}
        style={styles.bookButton}
      >
        <Text style={styles.bookText}>Book {suggestedDate} with {proName}</Text>
      </Pressable>

      <View style={styles.secondaryActions}>
        <Pressable onPress={onAdjust}>
          <Text style={styles.linkText}>Pick a different date</Text>
        </Pressable>
        <Pressable onPress={onDismiss}>
          <Text style={styles.dismissText}>Skip this time</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(244, 124, 32, 0.2)",
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  header: { marginBottom: 16 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  reason: { color: colors.textSecondary, fontSize: 13, fontStyle: "italic" },
  details: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: { color: colors.textSecondary, fontSize: 13 },
  detailValue: { color: "#fff", fontSize: 13, fontWeight: "600" },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  bookText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  dismissText: { color: colors.textSecondary, fontSize: 13 },
});
```

### Integration
George's backend checks `service_requests` for recurring patterns per customer. When a pattern is detected (e.g., biweekly lawn care that stopped in November), George proactively sends this card in early spring. Logic lives server-side in the George agent tools; the card is rendered client-side when `cards` array in the chat response contains `type: "predictive_booking"`.

---

## Feature 4: "Just Fix It" Button

A single panic button on the George chat screen. No description needed. George asks one clarifying question max.

### Component: `src/components/chat/JustFixItButton.tsx`

```tsx
import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface JustFixItButtonProps {
  onPress: () => void;
  visible: boolean; // Only show when chat is empty or idle
}

export function JustFixItButton({ onPress, visible }: JustFixItButtonProps) {
  const scale = useSharedValue(1);

  if (!visible) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = withSequence(
      withSpring(0.92, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable onPress={handlePress} style={styles.button}>
        <Text style={styles.text}>Just Fix It</Text>
        <Text style={styles.subtext}>Something's wrong. George will figure it out.</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "rgba(244, 124, 32, 0.12)",
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    borderStyle: "dashed",
  },
  text: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
```

### Integration
Show this button centered in the George chat when the conversation is empty (new session or no recent messages). When tapped, it sends a system message to George: `"The customer pressed 'Just Fix It'. Ask them ONE simple question to understand the problem, then take it from there. Be direct."` George responds with something like: "What's going on? Describe it in a few words or just snap a photo."

---

## Feature 5: George's Ambient Presence

George's avatar floats in the top-right corner of every screen (except the chat screen where he's already present). The avatar subtly reacts to context.

### Component: `src/components/common/GeorgeAmbient.tsx`

```tsx
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface GeorgeAmbientProps {
  state: "idle" | "thinking" | "watching-map" | "sleeping" | "alert";
  onPress: () => void; // Navigate to George chat
  hasNotification?: boolean;
}

export function GeorgeAmbient({ state, onPress, hasNotification }: GeorgeAmbientProps) {
  const breathe = useSharedValue(1);
  const glow = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Idle breathing animation
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    if (state === "thinking") {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      );
    } else if (state === "alert") {
      glow.value = 1;
    } else {
      glow.value = withTiming(0, { duration: 300 });
    }

    if (state === "watching-map") {
      rotate.value = withSpring(-15);
    } else if (state === "sleeping") {
      rotate.value = withSpring(10);
    } else {
      rotate.value = withSpring(0);
    }
  }, [state]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathe.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.glowRing, glowStyle]} />
      <Animated.View style={[styles.container, containerStyle]}>
        <Image
          source={require("@/assets/images/george-avatar.png")}
          style={styles.avatar}
        />
      </Animated.View>
      {hasNotification && <Animated.View style={styles.notifDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 60,
    right: 16,
    zIndex: 100,
    width: 48,
    height: 48,
  },
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(244, 124, 32, 0.4)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  glowRing: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0,
  },
  notifDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: colors.background,
  },
});
```

### Integration
Add `<GeorgeAmbient />` to the root navigator layout so it appears on My Home, Jobs, and Account tabs. Hide it on the George Chat tab. Pass `state` based on context:
- `"idle"` — default
- `"thinking"` — when George is processing something in background
- `"watching-map"` — when a live job is in progress
- `"sleeping"` — between 11pm and 7am
- `"alert"` — when George has a proactive message waiting

---

## Feature 6: Home Value Impact Ticker

Shows estimated home value and how each completed service impacts it.

### Component: `src/components/home/HomeValueTicker.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { colors } from "@/theme/colors";

interface HomeValueTickerProps {
  estimatedValue: number; // e.g. 450000
  lastServiceImpact?: {
    service: string;
    valueAdded: number; // e.g. 1200
  };
}

export function HomeValueTicker({ estimatedValue, lastServiceImpact }: HomeValueTickerProps) {
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(estimatedValue);

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <Text style={styles.label}>Estimated Home Value</Text>
        <Animated.Text entering={FadeIn.duration(500)} style={styles.value}>
          {formattedValue}
        </Animated.Text>
      </View>
      {lastServiceImpact && (
        <Animated.View entering={SlideInRight.springify()} style={styles.impactRow}>
          <Text style={styles.impactText}>
            {lastServiceImpact.service}: +${lastServiceImpact.valueAdded.toLocaleString()} curb appeal
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  value: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  impactRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  impactText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "600",
  },
});
```

### Integration
Place at the top of `MyHomeScreen.tsx`, above the Home Health Score. Pull estimated value from the property API data stored in the home profile. After each completed job, calculate a curb appeal impact estimate based on service type:
- Pressure Washing: +$800-1,500
- Landscaping: +$1,000-2,500
- Exterior Paint: +$3,000-8,000
- Gutter Cleaning: +$200-500
- Home Cleaning: +$100-300

---

## Feature 7: Proactive George Interrupts (Push Notification Cards)

When George has a proactive suggestion, it appears as a special card at the top of the chat.

### Component: `src/components/chat/cards/ProactiveAlertCard.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown, SlideInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface ProactiveAlertCardProps {
  type: "weather" | "maintenance" | "seasonal" | "neighborhood" | "savings";
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  weather: "Storm Alert",
  maintenance: "Maintenance Due",
  seasonal: "Seasonal Tip",
  neighborhood: "Neighborhood Deal",
  savings: "Money Saved",
};

export function ProactiveAlertCard({
  type,
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
}: ProactiveAlertCardProps) {
  return (
    <Animated.View entering={SlideInUp.springify().damping(14)} style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{TYPE_ICONS[type] || "George Says"}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAction();
          }}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
        <Pressable onPress={onDismiss}>
          <Text style={styles.dismissText}>Got it</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: "rgba(244, 124, 32, 0.25)",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(244, 124, 32, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  dismissText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
```

### Example Triggers
```
// Weather alert
{
  type: "weather",
  title: "Storm system in 4 days",
  message: "Your gutters haven't been cleaned since October. Getting them cleared before heavy rain prevents water damage and foundation issues.",
  actionLabel: "Schedule Gutter Clean",
}

// Neighborhood deal
{
  type: "neighborhood",
  title: "Your neighbor just booked pressure washing",
  message: "A pro is already coming to your street on March 12. Book the same day for $10 neighborhood credit.",
  actionLabel: "Get Neighborhood Credit",
}

// Maintenance due
{
  type: "maintenance",
  title: "Pool filter check overdue",
  message: "It's been 6 weeks since your last pool service. Florida heat means algae builds fast.",
  actionLabel: "Book Pool Service",
}
```

---

## Feature 8: Receipt Killer (Spending Dashboard)

Accessible via Account tab or by asking George "What did I spend on home maintenance this year?"

### Component: `src/components/account/SpendingDashboard.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors } from "@/theme/colors";

interface SpendingItem {
  date: string;
  service: string;
  pro: string;
  amount: number;
  category: "maintenance" | "repair" | "improvement" | "cleaning";
}

interface SpendingDashboardProps {
  year: number;
  items: SpendingItem[];
  onExport: () => void;
}

export function SpendingDashboard({ year, items, onExport }: SpendingDashboardProps) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const byCategory = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels: Record<string, string> = {
    maintenance: "Maintenance",
    repair: "Repairs",
    improvement: "Improvements",
    cleaning: "Cleaning",
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.totalCard}>
        <Text style={styles.totalLabel}>{year} Home Spending</Text>
        <Text style={styles.totalAmount}>${total.toLocaleString()}</Text>
        <Text style={styles.totalSub}>{items.length} services completed</Text>
      </Animated.View>

      {/* Category breakdown */}
      <View style={styles.categoryGrid}>
        {Object.entries(byCategory).map(([cat, amount], i) => (
          <Animated.View
            key={cat}
            entering={FadeInUp.delay(200 + i * 100)}
            style={styles.categoryCard}
          >
            <Text style={styles.categoryAmount}>${amount.toLocaleString()}</Text>
            <Text style={styles.categoryLabel}>{categoryLabels[cat] || cat}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Line items */}
      <View style={styles.itemsList}>
        <Text style={styles.sectionTitle}>All Services</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <View>
              <Text style={styles.itemService}>{item.service}</Text>
              <Text style={styles.itemMeta}>{item.date} with {item.pro}</Text>
            </View>
            <Text style={styles.itemAmount}>${item.amount}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={onExport} style={styles.exportButton}>
        <Text style={styles.exportText}>Export for Tax Filing</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    margin: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  totalLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 4 },
  totalAmount: { color: "#fff", fontSize: 36, fontWeight: "800" },
  totalSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  categoryCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  categoryAmount: { color: colors.primary, fontSize: 20, fontWeight: "800" },
  categoryLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  itemsList: { marginTop: 8 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  itemService: { color: "#fff", fontSize: 15, fontWeight: "600" },
  itemMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  itemAmount: { color: "#fff", fontSize: 15, fontWeight: "700" },
  exportButton: {
    margin: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  exportText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
});
```

### Integration
Add as a screen accessible from Account tab ("Spending Dashboard") or triggered when user asks George about spending. The `onExport` function generates a CSV with date, service, category, amount, pro name and triggers the share sheet.

---

## Feature 9: Neighborhood Activity Feed

Real-time anonymized view of jobs happening nearby. Creates FOMO and social proof.

### Component: `src/components/chat/cards/NeighborhoodActivityCard.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface NearbyJob {
  service: string;
  distance: string; // "0.3 mi"
  timeAgo: string; // "2 hours ago"
  hasGroupDiscount: boolean;
}

interface NeighborhoodActivityCardProps {
  jobs: NearbyJob[];
  onBookSame: (service: string) => void;
}

export function NeighborhoodActivityCard({ jobs, onBookSame }: NeighborhoodActivityCardProps) {
  return (
    <Animated.View entering={FadeInUp.springify()} style={styles.card}>
      <Text style={styles.title}>Happening Near You</Text>
      {jobs.map((job, i) => (
        <View key={i} style={styles.jobRow}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobService}>{job.service}</Text>
            <Text style={styles.jobMeta}>{job.distance} away, {job.timeAgo}</Text>
          </View>
          {job.hasGroupDiscount ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onBookSame(job.service);
              }}
              style={styles.discountButton}
            >
              <Text style={styles.discountText}>$10 neighborhood credit</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => onBookSame(job.service)}
              style={styles.bookButton}
            >
              <Text style={styles.bookText}>Book</Text>
            </Pressable>
          )}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  jobRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  jobInfo: {},
  jobService: { color: "#fff", fontSize: 14, fontWeight: "600" },
  jobMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  discountButton: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  discountText: { color: "#10B981", fontSize: 12, fontWeight: "700" },
  bookButton: {
    backgroundColor: "rgba(244, 124, 32, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bookText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});
```

### Integration
George periodically checks for active/recent jobs near the customer's address. If a pro is already in the neighborhood, George shows this card with a group discount option. The $10 neighborhood credit applies when a pro can do back-to-back jobs in the same area (reduced travel = savings passed to customer).

---

## Theme Constants

Make sure `src/theme/colors.ts` exports:

```tsx
export const colors = {
  primary: "#F47C20",
  background: "#0A0E1A",
  surface: "#111827",
  surfaceElevated: "#1F2937",
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  success: "#10B981",
  error: "#EF4444",
  border: "rgba(255,255,255,0.06)",
};
```

---

## Card Type Registry

When George responds with action cards, the chat renderer should map `card.type` to components:

```tsx
const CARD_COMPONENTS: Record<string, React.ComponentType<any>> = {
  service_quote: ServiceQuoteCard,
  scheduling: SchedulingCard,
  payment: PaymentCard,
  photo_analysis: PhotoAnalysisCard,
  rating: RatingCard,
  job_status: JobStatusCard,
  map_preview: MapPreviewCard,
  do_this_again: DoThisAgainCard,
  predictive_booking: PredictiveBookingCard,
  proactive_alert: ProactiveAlertCard,
  neighborhood_activity: NeighborhoodActivityCard,
  quote_timer: QuoteTimer,
};
```

In the chat message renderer:
```tsx
{message.cards?.map((card, i) => {
  const CardComponent = CARD_COMPONENTS[card.type];
  if (!CardComponent) return null;
  return <CardComponent key={i} {...card.props} />;
})}
```

---

## Feature 10: Reorder Bar (Top of Chat)

Pin the customer's last 2-3 completed services at the top of the George chat screen. One tap to rebook.

### Component: `src/components/chat/ReorderBar.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface PastService {
  id: string;
  serviceName: string;
  proName: string;
  price: number;
  lastDate: string;
}

interface ReorderBarProps {
  services: PastService[];
  onRebook: (service: PastService) => void;
}

export function ReorderBar({ services, onRebook }: ReorderBarProps) {
  if (services.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.container}>
      <Text style={styles.label}>REBOOK</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {services.slice(0, 3).map((svc) => (
          <Pressable
            key={svc.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onRebook(svc);
            }}
            style={styles.chip}
          >
            <Text style={styles.chipService}>{svc.serviceName}</Text>
            <Text style={styles.chipMeta}>{svc.proName} - ${svc.price}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  scroll: { gap: 8 },
  chip: {
    backgroundColor: "rgba(244, 124, 32, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 124, 32, 0.2)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipService: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  chipMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
```

### Integration
Place at the top of `GeorgeChatScreen.tsx`, above the message list. Fetch from `GET /api/service-requests?status=completed&limit=3&sort=completedAt:desc`. When tapped, send a message to George: "I want to rebook [service] with [pro]" and George handles scheduling.

---

## Feature 11: Home Health Score + Streak + Trend Graph

Gamified home maintenance tracking with streak counter and trend visualization.

### Component: `src/components/home/HomeHealthScore.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, useSharedValue, useAnimatedProps, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/theme/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface HomeHealthScoreProps {
  score: number; // 0-100
  previousScore?: number;
  streak: number; // weeks maintained
  trend: number[]; // last 12 weeks of scores
}

export function HomeHealthScore({ score, previousScore, streak, trend }: HomeHealthScoreProps) {
  const progress = useSharedValue(0);
  
  React.useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1200 });
  }, [score]);

  const circumference = 2 * Math.PI * 60;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const scoreColor = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  const scoreLabel = score >= 80 ? "Great" : score >= 60 ? "Fair" : "Needs Attention";
  const delta = previousScore ? score - previousScore : 0;

  return (
    <View style={styles.container}>
      {/* Score Ring */}
      <View style={styles.ringContainer}>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          <Circle cx="70" cy="70" r="60" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
          <AnimatedCircle
            cx="70" cy="70" r="60"
            stroke={scoreColor}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform="rotate(-90 70 70)"
          />
        </Svg>
        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score}</Text>
          <Text style={styles.scoreLabel}>{scoreLabel}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Week Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: delta >= 0 ? "#10B981" : "#EF4444" }]}>
            {delta >= 0 ? "+" : ""}{delta}
          </Text>
          <Text style={styles.statLabel}>vs Last Month</Text>
        </View>
      </View>

      {/* Mini Trend Graph */}
      <View style={styles.trendContainer}>
        <Text style={styles.trendLabel}>12-Week Trend</Text>
        <View style={styles.trendBars}>
          {trend.map((val, i) => (
            <Animated.View
              key={i}
              entering={FadeIn.delay(i * 50)}
              style={[
                styles.trendBar,
                {
                  height: (val / 100) * 40,
                  backgroundColor: val >= 80 ? "#10B981" : val >= 60 ? "#F59E0B" : "#EF4444",
                  opacity: i === trend.length - 1 ? 1 : 0.5,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  ringContainer: { position: "relative", width: 140, height: 140, marginBottom: 16 },
  scoreCenter: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreNumber: { fontSize: 36, fontWeight: "800" },
  scoreLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stat: { alignItems: "center", paddingHorizontal: 20 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.08)" },
  trendContainer: { width: "100%" },
  trendLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: "600", marginBottom: 8 },
  trendBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 40,
  },
  trendBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 4,
  },
});
```

### Score Calculation
Score starts at 50 for new users. Adjustments:
- Completed service: +5 to +15 depending on how overdue it was
- On-time maintenance (before due date): +3 bonus
- Overdue item: -2 per week overdue
- Home DNA Scan completed: +10 (one-time)
- Streak bonus: +1 per 4 consecutive weeks

### Streak Rules
- Streak increments each week the home has no RED (overdue) items
- Streak resets to 0 when any maintenance item goes 2+ weeks overdue
- George warns at 1 week overdue: "Your streak is at risk. Gutters are a week overdue."
- Streak milestones (4, 12, 26, 52 weeks) trigger celebration animations + haptic

---

## Feature 12: Seasonal Care Calendar

Visual month-by-month calendar showing what's due when, color-coded by status.

### Component: `src/components/home/SeasonalCalendar.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface MaintenanceItem {
  service: string;
  month: number; // 1-12
  status: "done" | "upcoming" | "overdue";
  dueDate?: string;
}

interface SeasonalCalendarProps {
  items: MaintenanceItem[];
  onBookItem: (item: MaintenanceItem) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_COLORS = {
  done: "#10B981",
  upcoming: "#F59E0B",
  overdue: "#EF4444",
};

// Florida-specific default schedule
const FL_DEFAULTS: MaintenanceItem[] = [
  { service: "AC Service", month: 3, status: "upcoming" },
  { service: "Pool Ramp-Up", month: 4, status: "upcoming" },
  { service: "Hurricane Prep", month: 5, status: "upcoming" },
  { service: "Gutter Clean", month: 6, status: "upcoming" },
  { service: "Pressure Wash", month: 7, status: "upcoming" },
  { service: "Roof Inspection", month: 9, status: "upcoming" },
  { service: "Gutter Clean", month: 10, status: "upcoming" },
  { service: "Landscaping Trim", month: 11, status: "upcoming" },
  { service: "Holiday Lights", month: 12, status: "upcoming" },
  { service: "Deep Home Clean", month: 1, status: "upcoming" },
];

export function SeasonalCalendar({ items, onBookItem }: SeasonalCalendarProps) {
  const currentMonth = new Date().getMonth() + 1;
  const allItems = items.length > 0 ? items : FL_DEFAULTS;

  // Group by month
  const byMonth: Record<number, MaintenanceItem[]> = {};
  allItems.forEach((item) => {
    if (!byMonth[item.month]) byMonth[item.month] = [];
    byMonth[item.month].push(item);
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seasonal Care Plan</Text>
      <Text style={styles.subtitle}>Tap any item to book it</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {MONTHS.map((label, i) => {
          const month = i + 1;
          const monthItems = byMonth[month] || [];
          const isCurrent = month === currentMonth;

          return (
            <View key={month} style={[styles.monthCol, isCurrent && styles.currentMonth]}>
              <Text style={[styles.monthLabel, isCurrent && styles.currentMonthLabel]}>{label}</Text>
              {monthItems.map((item, j) => (
                <Pressable
                  key={j}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onBookItem(item);
                  }}
                  style={[styles.itemChip, { borderLeftColor: STATUS_COLORS[item.status] }]}
                >
                  <Text style={styles.itemText}>{item.service}</Text>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
                </Pressable>
              ))}
              {monthItems.length === 0 && <View style={styles.emptyMonth} />}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#10B981" }]} /><Text style={styles.legendText}>Done</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} /><Text style={styles.legendText}>Upcoming</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} /><Text style={styles.legendText}>Overdue</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginBottom: 16 },
  scroll: { gap: 4, paddingBottom: 8 },
  monthCol: {
    width: 80,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  currentMonth: {
    backgroundColor: "rgba(244, 124, 32, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(244, 124, 32, 0.2)",
  },
  monthLabel: { fontSize: 12, fontWeight: "700", color: colors.textSecondary, marginBottom: 4 },
  currentMonthLabel: { color: colors.primary },
  itemChip: {
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    borderLeftWidth: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: { fontSize: 10, color: "#fff", fontWeight: "600", flex: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  emptyMonth: { height: 30 },
  legend: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textSecondary },
});
```

### Integration
Place in `MyHomeScreen.tsx` below the Home Health Score. Florida defaults are pre-populated for new users. As George gathers data about the home (appliances, roof age, pool, etc.), the calendar personalizes. Tapping any item sends the user to George chat with a pre-filled booking request.

---

## Feature 13: Before/After Gallery

Scrollable gallery of all job photos organized by service.

### Component: `src/components/home/BeforeAfterGallery.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors } from "@/theme/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - 64;

interface JobPhotos {
  id: string;
  service: string;
  date: string;
  proName: string;
  beforeUrl: string;
  afterUrl: string;
}

interface BeforeAfterGalleryProps {
  jobs: JobPhotos[];
  onShare: (job: JobPhotos) => void;
}

export function BeforeAfterGallery({ jobs, onShare }: BeforeAfterGalleryProps) {
  if (jobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Photos Yet</Text>
        <Text style={styles.emptyText}>After your first job, before and after photos will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Before and After</Text>
        <Text style={styles.count}>{jobs.length} jobs</Text>
      </View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      >
        {jobs.map((job, i) => (
          <Animated.View key={job.id} entering={FadeIn.delay(i * 100)} style={styles.card}>
            <View style={styles.photoRow}>
              <View style={styles.photoContainer}>
                <Text style={styles.photoLabel}>BEFORE</Text>
                <Image source={{ uri: job.beforeUrl }} style={styles.photo} />
              </View>
              <View style={styles.photoContainer}>
                <Text style={styles.photoLabel}>AFTER</Text>
                <Image source={{ uri: job.afterUrl }} style={styles.photo} />
              </View>
            </View>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.serviceName}>{job.service}</Text>
                <Text style={styles.jobMeta}>{job.date} with {job.proName}</Text>
              </View>
              <Pressable onPress={() => onShare(job)} style={styles.shareButton}>
                <Text style={styles.shareText}>Share</Text>
              </Pressable>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  emptyTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 4 },
  emptyText: { color: colors.textSecondary, fontSize: 13, textAlign: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  count: { color: colors.textSecondary, fontSize: 12 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    overflow: "hidden",
  },
  photoRow: { flexDirection: "row" },
  photoContainer: { flex: 1 },
  photoLabel: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 1,
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 1,
  },
  photo: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceElevated },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  serviceName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  jobMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  shareButton: {
    backgroundColor: "rgba(244, 124, 32, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  shareText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});
```

### Integration
Place in `MyHomeScreen.tsx` or as a dedicated section in the Jobs tab. Photos come from the pro's before/after captures during job flow. Share button triggers the native share sheet with both images composited side-by-side.

---

## Feature 14: Savings Counter

Persistent display showing how much George has saved the customer vs. market average prices.

### Component: `src/components/common/SavingsCounter.tsx`

```tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from "react-native-reanimated";
import { colors } from "@/theme/colors";

interface SavingsCounterProps {
  totalSaved: number;
  jobCount: number;
  year: number;
}

export function SavingsCounter({ totalSaved, jobCount, year }: SavingsCounterProps) {
  const displayValue = useSharedValue(0);

  useEffect(() => {
    displayValue.value = withTiming(totalSaved, { duration: 1500 });
  }, [totalSaved]);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Saved with George in {year}</Text>
        <Text style={styles.amount}>${totalSaved.toLocaleString()}</Text>
      </View>
      <Text style={styles.sub}>Across {jobCount} services vs. market average pricing</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { color: "#10B981", fontSize: 12, fontWeight: "600" },
  amount: { color: "#10B981", fontSize: 22, fontWeight: "800" },
  sub: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
});
```

### Integration
Show on the George chat home screen below the reorder bar, or on My Home tab. Calculate savings by comparing George's price per service against average market rates from pricing intelligence data. Updates after each completed job.

---

## Feature 15: George's Daily Tip

One contextual tip per day waiting in the chat when the user opens the app.

### Component: `src/components/chat/DailyTip.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors } from "@/theme/colors";

interface DailyTipProps {
  tip: string;
  category: string; // "energy", "maintenance", "seasonal", "savings"
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

export function DailyTip({ tip, category, actionLabel, onAction, onDismiss }: DailyTipProps) {
  return (
    <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>{category.toUpperCase()} TIP</Text>
        <Pressable onPress={onDismiss}>
          <Text style={styles.dismiss}>Got it</Text>
        </Pressable>
      </View>
      <Text style={styles.tipText}>{tip}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(244, 124, 32, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(244, 124, 32, 0.12)",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1,
  },
  dismiss: { fontSize: 12, color: colors.textSecondary },
  tipText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "rgba(244, 124, 32, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
});
```

### Example Tips (Florida-specific)
```
{ tip: "Florida humidity tip: check your AC filter this week. A clogged filter costs $15-30/month in wasted energy.", category: "energy", actionLabel: "Order a new filter", onAction: openAmazonFilter }
{ tip: "After heavy rain, check your gutters for debris buildup. Standing water attracts mosquitoes and can damage fascia boards.", category: "seasonal", actionLabel: "Book gutter check", onAction: bookGutterClean }
{ tip: "Pool pH should be 7.2-7.6. Testing weekly during summer prevents algae and saves on chemicals.", category: "maintenance" }
{ tip: "Your smoke detector batteries should be replaced every 6 months. Set a reminder or let George handle it.", category: "maintenance", actionLabel: "Order batteries", onAction: openAmazonBatteries }
```

---

## Feature 16: Home Product Tracker + Amazon Affiliate Purchases

George learns about the products in your home (filters, bulbs, batteries, water filters, etc.), tracks replacement cycles, and offers to purchase replacements through Amazon affiliate links.

### Component: `src/components/home/ProductTracker.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";

interface TrackedProduct {
  id: string;
  name: string; // "AC Filter 20x25x1"
  category: string; // "HVAC", "Water", "Lighting", "Safety", "Pool"
  lastReplaced: string; // "2026-01-15"
  replacementCycleDays: number; // 90
  daysUntilDue: number; // calculated
  amazonUrl: string; // with uptend20-20 affiliate tag
  estimatedPrice: string; // "$12.99"
}

interface ProductTrackerProps {
  products: TrackedProduct[];
  onAddProduct: () => void;
}

export function ProductTracker({ products, onAddProduct }: ProductTrackerProps) {
  const overdue = products.filter((p) => p.daysUntilDue <= 0);
  const upcoming = products.filter((p) => p.daysUntilDue > 0 && p.daysUntilDue <= 14);
  const healthy = products.filter((p) => p.daysUntilDue > 14);

  const handleBuy = (product: TrackedProduct) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(product.amazonUrl);
  };

  const renderProduct = (product: TrackedProduct) => {
    const isOverdue = product.daysUntilDue <= 0;
    const isUpcoming = product.daysUntilDue > 0 && product.daysUntilDue <= 14;

    return (
      <View key={product.id} style={styles.productRow}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={[
            styles.productStatus,
            isOverdue && { color: "#EF4444" },
            isUpcoming && { color: "#F59E0B" },
          ]}>
            {isOverdue
              ? `${Math.abs(product.daysUntilDue)} days overdue`
              : `Due in ${product.daysUntilDue} days`}
          </Text>
        </View>
        <Pressable onPress={() => handleBuy(product)} style={styles.buyButton}>
          <Text style={styles.buyText}>Buy {product.estimatedPrice}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Animated.View entering={FadeInUp.springify()} style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Home Products</Text>
          <Text style={styles.subtitle}>George tracks what you need, when you need it</Text>
        </View>
        <Pressable onPress={onAddProduct} style={styles.addButton}>
          <Text style={styles.addText}>+ Add</Text>
        </Pressable>
      </View>

      {overdue.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: "#EF4444" }]}>NEEDS REPLACEMENT</Text>
          {overdue.map(renderProduct)}
        </View>
      )}

      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: "#F59E0B" }]}>COMING UP</Text>
          {upcoming.map(renderProduct)}
        </View>
      )}

      {healthy.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL GOOD</Text>
          {healthy.map(renderProduct)}
        </View>
      )}

      {products.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No products tracked yet</Text>
          <Text style={styles.emptyText}>
            Tell George about your AC filters, water filters, light bulbs, smoke detectors, 
            pool chemicals, and other home products. He will track replacement schedules 
            and help you buy them when it is time.
          </Text>
          <Pressable onPress={onAddProduct} style={styles.startButton}>
            <Text style={styles.startText}>Tell George About Your Home</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  addButton: {
    backgroundColor: "rgba(244, 124, 32, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  section: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  productInfo: { flex: 1 },
  productName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  productStatus: { color: "#10B981", fontSize: 12, marginTop: 2 },
  buyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 12,
  },
  buyText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 12 },
  emptyTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 8 },
  emptyText: { color: colors.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 16 },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  startText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
```

### George's Data Gathering Nudges
George passively gathers product info one question at a time during conversations:

```
// After a home cleaning booking:
"Quick question: do you know what size AC filter your home uses? I can track when it needs replacing and help you order it."

// After a pool service:
"What pool chemicals do you usually use? I can track when you are running low."

// During a Home DNA Scan:
"I noticed your water heater looks like a Rheem 50-gallon. Those need the anode rod checked every 3-5 years. Want me to track that?"

// Casual check-in:
"Do you have a whole-house water filter? If so, what brand? Most need the cartridge swapped every 6 months."
```

### Amazon Affiliate Integration
- All product links include the `uptend20-20` affiliate tag (already configured)
- George maintains a curated product database (already built: 50+ exact products in george-tools.ts)
- When a replacement is due, George sends a chat card:

```
"Your AC filter is due for replacement (last changed 91 days ago). 
Here is the exact one for your system:

Filtrete 20x25x1 MPR 1500 - $12.99 on Amazon
[Buy Now]  [Remind Me Later]  [Already Replaced]"
```

- "Buy Now" opens Amazon with affiliate link
- "Already Replaced" resets the timer
- "Remind Me Later" snoozes for 1 week

### Product Categories to Track
| Category | Products | Typical Cycle |
|----------|----------|---------------|
| HVAC | AC filters, UV bulbs | 30-90 days |
| Water | Fridge filters, whole-house filters, softener salt | 3-6 months |
| Safety | Smoke detector batteries, CO detector batteries, fire extinguisher | 6-12 months |
| Pool | Chlorine, pH balancer, filter cartridges | 2-8 weeks |
| Lighting | Smart bulbs, outdoor bulbs, landscape lighting | 1-3 years |
| Appliance | Garbage disposal, dishwasher cleaner, dryer vent | 3-12 months |
| Pest | Ant bait stations, mosquito dunks, termite monitoring | 3-6 months |

---

## Feature 17: Home Timeline

Scrollable chronological record of everything done to the home.

### Component: `src/components/home/HomeTimeline.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { colors } from "@/theme/colors";

interface TimelineEvent {
  id: string;
  date: string;
  type: "service" | "scan" | "product" | "recommendation";
  title: string;
  description: string;
  proName?: string;
  cost?: number;
  photoUrl?: string;
}

interface HomeTimelineProps {
  events: TimelineEvent[];
}

const TYPE_COLORS = {
  service: colors.primary,
  scan: "#10B981",
  product: "#8B5CF6",
  recommendation: "#F59E0B",
};

export function HomeTimeline({ events }: HomeTimelineProps) {
  const renderEvent = ({ item, index }: { item: TimelineEvent; index: number }) => (
    <Animated.View entering={FadeInLeft.delay(index * 50).springify()} style={styles.eventRow}>
      {/* Timeline line + dot */}
      <View style={styles.lineContainer}>
        <View style={[styles.dot, { backgroundColor: TYPE_COLORS[item.type] }]} />
        {index < events.length - 1 && <View style={styles.line} />}
      </View>

      {/* Event content */}
      <View style={styles.eventContent}>
        <Text style={styles.eventDate}>{item.date}</Text>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDesc}>{item.description}</Text>
        {item.proName && <Text style={styles.eventMeta}>Pro: {item.proName}</Text>}
        {item.cost && <Text style={styles.eventMeta}>Cost: ${item.cost}</Text>}
        {item.photoUrl && (
          <Image source={{ uri: item.photoUrl }} style={styles.eventPhoto} />
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Timeline</Text>
      <Text style={styles.subtitle}>Everything George knows about your home</Text>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", paddingHorizontal: 16, marginBottom: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: 16, marginBottom: 16 },
  list: { paddingHorizontal: 16 },
  eventRow: { flexDirection: "row", marginBottom: 4 },
  lineContainer: { width: 24, alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  line: { width: 2, flex: 1, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 4 },
  eventContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    marginBottom: 4,
  },
  eventDate: { fontSize: 11, color: colors.textSecondary, fontWeight: "600", marginBottom: 4 },
  eventTitle: { fontSize: 15, color: "#fff", fontWeight: "700", marginBottom: 2 },
  eventDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  eventMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  eventPhoto: { width: "100%", height: 120, borderRadius: 10, marginTop: 8, backgroundColor: colors.surfaceElevated },
});
```

### Integration
Accessible from My Home tab as a scrollable view. Aggregates data from:
- `service_requests` (completed jobs with photos)
- `home_scans` (DNA scan results)
- `product_replacements` (tracked products)
- `george_recommendations` (tips that were acted on)

This becomes the home's permanent record. The longer it gets, the harder it is to leave the platform.

---

## Feature 18: Neighborhood Leaderboard (Anonymous)

Anonymous comparison of your home's maintenance score against your neighborhood.

### Component: `src/components/home/NeighborhoodLeaderboard.tsx`

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors } from "@/theme/colors";

interface NeighborhoodLeaderboardProps {
  neighborhoodName: string;
  neighborhoodAvgScore: number;
  yourScore: number;
  yourPercentile: number; // 0-100, e.g. 72 = top 28%
  totalHomes: number;
}

export function NeighborhoodLeaderboard({
  neighborhoodName,
  neighborhoodAvgScore,
  yourScore,
  yourPercentile,
  totalHomes,
}: NeighborhoodLeaderboardProps) {
  const percentileLabel = yourPercentile >= 75
    ? "Top " + (100 - yourPercentile) + "%"
    : yourPercentile >= 50
    ? "Above Average"
    : "Below Average";

  const barWidth = `${yourPercentile}%`;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text style={styles.title}>{neighborhoodName} Maintenance Score</Text>

      <View style={styles.compareRow}>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{yourScore}</Text>
          <Text style={styles.scoreLabel}>Your Home</Text>
        </View>
        <View style={styles.vsBlock}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreValue, { color: colors.textSecondary }]}>{neighborhoodAvgScore}</Text>
          <Text style={styles.scoreLabel}>Avg Score</Text>
        </View>
      </View>

      {/* Percentile bar */}
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: barWidth }]} />
        <View style={styles.barMarker} />
      </View>
      <View style={styles.barLabels}>
        <Text style={styles.barLabel}>Needs Work</Text>
        <Text style={[styles.barLabel, { color: colors.primary, fontWeight: "700" }]}>{percentileLabel}</Text>
        <Text style={styles.barLabel}>Top Maintained</Text>
      </View>

      <Text style={styles.footer}>Based on {totalHomes} homes in {neighborhoodName}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  compareRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  scoreBlock: { alignItems: "center", paddingHorizontal: 24 },
  scoreValue: { fontSize: 32, fontWeight: "800", color: colors.primary },
  scoreLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  vsBlock: { paddingHorizontal: 12 },
  vsText: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
  barContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    position: "relative",
    marginBottom: 8,
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  barMarker: {
    position: "absolute",
    right: 0,
    top: -2,
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  barLabel: { fontSize: 10, color: colors.textSecondary },
  footer: { fontSize: 11, color: colors.textSecondary, textAlign: "center" },
});
```

### Integration
Place in `MyHomeScreen.tsx` below the Home Health Score. Data is anonymized and aggregated from all UpTend users in the same neighborhood/HOA. No names, no addresses. Just scores. This creates healthy competition and social pressure to maintain homes, which drives more bookings.

---

## Updated Card Type Registry

Add to the existing registry in the chat renderer:

```tsx
const CARD_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // ... existing cards ...
  do_this_again: DoThisAgainCard,
  predictive_booking: PredictiveBookingCard,
  proactive_alert: ProactiveAlertCard,
  neighborhood_activity: NeighborhoodActivityCard,
  quote_timer: QuoteTimer,
  daily_tip: DailyTip,
  product_reminder: ProductReminderCard, // Amazon affiliate reminder in chat
};
```

---

## Feature 19: George Mood System (App-Wide Emotional UI)

George's mood transforms the entire app -- not just his avatar. Background tints, animation speeds, haptic patterns, chat bubble styling, sounds, particles. Full spec with all 8 mood states, theme configs, spring configs, haptic patterns, and the MoodProvider context is in **GEORGE-APP-SPEC.md** under "George Mood System."

### Core Component: `src/context/MoodContext.tsx`

```tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
} from "react-native-reanimated";
import { StyleSheet, View } from "react-native";

type MoodName = "neutral" | "excited" | "focused" | "protective" | "proud" | "concerned" | "urgent" | "chill";

interface MoodTheme {
  backgroundTint: string;
  surfaceTint: string;
  glowColor: string;
  glowIntensity: number;
  glowPulseSpeed: number;
  accentShift: string;
  textEmphasisWeight: string;
  borderGlow: string;
}

interface MoodState {
  current: MoodName;
  intensity: number;
  reason: string;
  theme: MoodTheme;
}

const MOOD_THEMES: Record<MoodName, MoodTheme> = {
  neutral: {
    backgroundTint: "rgba(244, 124, 32, 0.02)",
    surfaceTint: "rgba(0, 0, 0, 0)",
    glowColor: "#F47C20",
    glowIntensity: 0.3,
    glowPulseSpeed: 3000,
    accentShift: "#F47C20",
    textEmphasisWeight: "400",
    borderGlow: "rgba(244, 124, 32, 0.06)",
  },
  excited: {
    backgroundTint: "rgba(244, 124, 32, 0.05)",
    surfaceTint: "rgba(244, 124, 32, 0.02)",
    glowColor: "#FF8C34",
    glowIntensity: 0.6,
    glowPulseSpeed: 1500,
    accentShift: "#FF8C34",
    textEmphasisWeight: "500",
    borderGlow: "rgba(244, 124, 32, 0.12)",
  },
  focused: {
    backgroundTint: "rgba(100, 140, 200, 0.03)",
    surfaceTint: "rgba(0, 0, 0, 0.02)",
    glowColor: "#D4882A",
    glowIntensity: 0.5,
    glowPulseSpeed: 0,
    accentShift: "#E8862A",
    textEmphasisWeight: "500",
    borderGlow: "rgba(200, 200, 255, 0.06)",
  },
  protective: {
    backgroundTint: "rgba(220, 100, 30, 0.04)",
    surfaceTint: "rgba(220, 100, 30, 0.02)",
    glowColor: "#E8731C",
    glowIntensity: 0.7,
    glowPulseSpeed: 1000,
    accentShift: "#E8731C",
    textEmphasisWeight: "600",
    borderGlow: "rgba(220, 100, 30, 0.10)",
  },
  proud: {
    backgroundTint: "rgba(255, 200, 50, 0.03)",
    surfaceTint: "rgba(255, 200, 50, 0.01)",
    glowColor: "#FFB830",
    glowIntensity: 0.5,
    glowPulseSpeed: 4000,
    accentShift: "#FFB830",
    textEmphasisWeight: "500",
    borderGlow: "rgba(255, 200, 50, 0.08)",
  },
  concerned: {
    backgroundTint: "rgba(150, 120, 80, 0.03)",
    surfaceTint: "rgba(0, 0, 0, 0.01)",
    glowColor: "#C4862A",
    glowIntensity: 0.4,
    glowPulseSpeed: 2500,
    accentShift: "#D49030",
    textEmphasisWeight: "500",
    borderGlow: "rgba(200, 160, 80, 0.08)",
  },
  urgent: {
    backgroundTint: "rgba(239, 68, 68, 0.04)",
    surfaceTint: "rgba(239, 68, 68, 0.02)",
    glowColor: "#F4501C",
    glowIntensity: 0.9,
    glowPulseSpeed: 600,
    accentShift: "#F4501C",
    textEmphasisWeight: "700",
    borderGlow: "rgba(239, 68, 68, 0.12)",
  },
  chill: {
    backgroundTint: "rgba(100, 150, 200, 0.02)",
    surfaceTint: "rgba(0, 0, 0, 0)",
    glowColor: "#D4A040",
    glowIntensity: 0.15,
    glowPulseSpeed: 5000,
    accentShift: "#D4A040",
    textEmphasisWeight: "400",
    borderGlow: "rgba(200, 200, 255, 0.04)",
  },
};

const MOOD_SPRINGS: Record<MoodName, { damping: number; stiffness: number; mass: number }> = {
  neutral:    { damping: 15, stiffness: 150, mass: 1.0 },
  excited:    { damping: 12, stiffness: 195, mass: 0.9 },
  focused:    { damping: 20, stiffness: 180, mass: 1.0 },
  protective: { damping: 16, stiffness: 170, mass: 1.0 },
  proud:      { damping: 10, stiffness: 130, mass: 1.0 },
  concerned:  { damping: 15, stiffness: 150, mass: 1.0 },
  urgent:     { damping: 18, stiffness: 220, mass: 0.8 },
  chill:      { damping: 12, stiffness: 100, mass: 1.2 },
};

interface MoodContextValue extends MoodState {
  springConfig: { damping: number; stiffness: number; mass: number };
  updateMood: (mood: MoodName, intensity: number, reason: string) => void;
}

const MoodContext = createContext<MoodContextValue>({
  current: "neutral",
  intensity: 0.5,
  reason: "default",
  theme: MOOD_THEMES.neutral,
  springConfig: MOOD_SPRINGS.neutral,
  updateMood: () => {},
});

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MoodState>({
    current: "neutral",
    intensity: 0.5,
    reason: "default",
    theme: MOOD_THEMES.neutral,
  });

  const tintOpacity = useSharedValue(0.02);

  const updateMood = useCallback((mood: MoodName, intensity: number, reason: string) => {
    const theme = MOOD_THEMES[mood];
    tintOpacity.value = withTiming(intensity * 0.08, { duration: 1500 });
    setState({ current: mood, intensity, reason, theme });
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: state.theme.backgroundTint,
    opacity: tintOpacity.value,
    pointerEvents: "none" as const,
  }));

  return (
    <MoodContext.Provider
      value={{
        ...state,
        springConfig: MOOD_SPRINGS[state.current],
        updateMood,
      }}
    >
      <View style={{ flex: 1 }}>
        {children}
        <Animated.View style={overlayStyle} />
      </View>
    </MoodContext.Provider>
  );
}

export const useMood = () => useContext(MoodContext);
```

### Integration: Wire Into Chat API Response

In `useGeorgeChat.ts`, after receiving a response from `POST /api/ai/chat`:

```typescript
import { useMood } from "@/context/MoodContext";

// Inside the chat hook
const { updateMood } = useMood();

async function sendMessage(text: string, images?: string[]) {
  const response = await api.post("/api/ai/chat", { message: text, images });
  
  // Update mood from George's response
  if (response.data.mood) {
    updateMood(
      response.data.mood,
      response.data.moodIntensity ?? 0.5,
      response.data.moodReason ?? "chat"
    );
  }
  
  // ... handle message + cards as normal
}
```

### Integration: Mood-Aware Haptics

```typescript
// src/services/moodHaptics.ts
import * as Haptics from "expo-haptics";
import { useMood } from "@/context/MoodContext";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function moodHaptic(
  mood: string,
  action: "tap" | "message" | "alert" | "success"
) {
  const { ImpactFeedbackStyle } = Haptics;
  
  switch (mood) {
    case "excited":
      if (action === "message") {
        await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
        await delay(80);
        await Haptics.impactAsync(ImpactFeedbackStyle.Light);
      } else {
        await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
      }
      break;

    case "urgent":
      if (action === "alert") {
        for (let i = 0; i < 3; i++) {
          await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
          await delay(100);
        }
      } else {
        await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
      }
      break;

    case "proud":
      if (action === "success") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await delay(200);
        await Haptics.impactAsync(ImpactFeedbackStyle.Light);
        await delay(100);
        await Haptics.impactAsync(ImpactFeedbackStyle.Light);
      } else {
        await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
      }
      break;

    case "chill":
      await Haptics.impactAsync(ImpactFeedbackStyle.Light);
      break;

    case "protective":
      await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
      break;

    case "focused":
      await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
      break;

    default:
      await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
  }
}
```

### Integration: Mood-Aware Input Placeholder

```typescript
// In InputBar.tsx
import { useMood } from "@/context/MoodContext";

function getPlaceholder(mood: string): string {
  switch (mood) {
    case "chill": return "What's up?";
    case "focused": return "Describe the issue...";
    case "urgent": return "Tell me what happened";
    case "excited": return "What else can I help with?";
    case "protective": return "What do you need?";
    case "proud": return "Anything else today?";
    case "concerned": return "What's going on?";
    default: return "Message George...";
  }
}
```

### Integration: Wrap App Root

In `App.tsx`, wrap the entire app:

```tsx
import { MoodProvider } from "@/context/MoodContext";

export default function App() {
  return (
    <MoodProvider>
      <AtmosphereProvider> {/* weather + time, composes with mood */}
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </AtmosphereProvider>
    </MoodProvider>
  );
}
```

### Backend: Add Mood to Chat Response

In `george-agent.ts`, add mood determination to the system prompt and parse it from the response. The AI already has full context -- add this instruction:

```
At the end of every response, include a mood tag on its own line:
[MOOD:excited:0.7:found_savings]
Format: [MOOD:state:intensity:reason]
States: neutral, excited, focused, protective, proud, concerned, urgent, chill
Intensity: 0.0-1.0
This line will be stripped before showing to the user.
```

Parse in the chat route handler and include in the API response as `mood`, `moodIntensity`, `moodReason`.

### Updated Card Registry

```tsx
const CARD_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // ... all existing cards ...
  // No new card for mood -- mood is contextual, not a card type.
  // But the MoodProvider wraps everything so all cards inherit mood styling.
};
```

## Feature 20: Service Diagnostic Flows (Conversational Intake)

George asks smart diagnostic questions before quoting, one at a time, adapting to what the customer already said. This replaces traditional form-based booking flows (like Angi/Thumbtack) with natural conversation.

### Component: `src/components/chat/ServiceDiagnosticEngine.tsx`

```tsx
import React, { useCallback } from 'react';
import { Haptics, ImpactFeedbackStyle } from 'expo-haptics';

// Each service has a diagnostic tree: ordered questions with branching logic
interface DiagnosticQuestion {
  id: string;
  question: string;
  type: 'single' | 'multi' | 'text' | 'photo' | 'number';
  options?: string[];
  skipIf?: (answers: Record<string, any>) => boolean;
  followUp?: (answer: any) => string | null; // dynamic follow-up based on answer
}

interface ServiceDiagnostic {
  serviceSlug: string;
  serviceName: string;
  questions: DiagnosticQuestion[];
  photoEligible: boolean; // whether to offer photo upload
  photoPrompt?: string;
}

const SERVICE_DIAGNOSTICS: Record<string, ServiceDiagnostic> = {
  'junk-removal': {
    serviceSlug: 'junk-removal',
    serviceName: 'Junk Removal',
    photoEligible: true,
    photoPrompt: 'Got a photo of the stuff? Helps me give you a more accurate price.',
    questions: [
      {
        id: 'junk_type',
        question: "What kind of stuff do you need removed?",
        type: 'single',
        options: [
          'Furniture & appliances',
          'Yard waste',
          'Construction debris',
          'General junk & boxes',
          'Hazardous materials',
          'Mix of everything',
        ],
      },
      {
        id: 'junk_volume',
        question: "Roughly how much are we talking?",
        type: 'single',
        options: ['A few items', 'Half a truck', 'Full truck load', 'Multiple loads'],
      },
      {
        id: 'junk_floor',
        question: "What floor is most of the stuff on?",
        type: 'single',
        options: ['Ground floor / outside', 'Second floor', 'Garage', 'Basement'],
      },
      {
        id: 'junk_access',
        question: "Any access issues I should know about? Narrow hallways, gated community, stairs?",
        type: 'text',
      },
      {
        id: 'timeline',
        question: "How soon do you need this done?",
        type: 'single',
        options: ['ASAP (1-2 days)', 'Within 2 weeks', 'Still planning'],
      },
    ],
  },

  'pressure-washing': {
    serviceSlug: 'pressure-washing',
    serviceName: 'Pressure Washing',
    photoEligible: true,
    photoPrompt: 'Got a photo of the area? I can see exactly what we are working with.',
    questions: [
      {
        id: 'pw_areas',
        question: "What areas need washing?",
        type: 'multi',
        options: ['Driveway', 'House exterior', 'Patio / deck', 'Pool deck', 'Sidewalk', 'Fence', 'Roof'],
      },
      {
        id: 'pw_reason',
        question: "What's the main reason?",
        type: 'single',
        options: ['Mold or moss buildup', 'Stains', 'Prep for painting', 'General maintenance', 'Selling the house'],
      },
      {
        id: 'pw_property',
        question: "Home or business?",
        type: 'single',
        options: ['Home', 'Business'],
      },
      {
        id: 'timeline',
        question: "How soon do you need this done?",
        type: 'single',
        options: ['ASAP (1-2 days)', 'Within 2 weeks', 'Still planning'],
      },
    ],
  },

  'gutter-cleaning': {
    serviceSlug: 'gutter-cleaning',
    serviceName: 'Gutter Cleaning',
    photoEligible: false, // can't photograph gutters from ground
    questions: [
      {
        id: 'gutter_issue',
        question: "What's going on with your gutters?",
        type: 'multi',
        options: ['Clogged', 'Overflowing', 'Not draining', 'Regular maintenance', 'Need repair'],
      },
      {
        id: 'gutter_stories',
        question: "How many stories is your house?",
        type: 'single',
        options: ['One story', 'Two stories', 'Three or more'],
      },
      {
        id: 'timeline',
        question: "How urgent? Water damage happening right now?",
        type: 'single',
        options: ['Urgent - water damage now', 'Within 2 weeks', 'Just maintenance - no rush'],
      },
    ],
  },

  'moving-labor': {
    serviceSlug: 'moving-labor',
    serviceName: 'Moving Labor',
    photoEligible: false,
    questions: [
      {
        id: 'move_type',
        question: "What kind of help do you need?",
        type: 'single',
        options: ['Loading / unloading a truck', 'Full packing + loading', 'Moving heavy items (piano, safe, etc.)', 'Rearranging furniture'],
      },
      {
        id: 'move_size',
        question: "How big is the place?",
        type: 'single',
        options: ['Studio / 1 bedroom', '2-3 bedrooms', '4+ bedrooms', 'Just a few items'],
      },
      {
        id: 'move_stairs',
        question: "Any stairs involved?",
        type: 'single',
        options: ['No stairs', 'One flight', 'Multiple flights', 'Elevator available'],
      },
      {
        id: 'move_date',
        question: "When is the move?",
        type: 'text',
      },
    ],
  },

  'handyman': {
    serviceSlug: 'handyman',
    serviceName: 'Handyman',
    photoEligible: true,
    photoPrompt: 'Got a photo of what needs fixing? Helps me scope it right.',
    questions: [
      {
        id: 'handy_tasks',
        question: "What needs doing?",
        type: 'multi',
        options: [
          'Hanging / mounting (TV, shelves, art)',
          'Carpentry',
          'Door, hinge, or lock repair',
          'Small electrical',
          'Small plumbing',
          'Painting / drywall',
          'Appliance install',
          'Furniture assembly',
          'Other',
        ],
      },
      {
        id: 'handy_count',
        question: "How many separate tasks?",
        type: 'single',
        options: ['Just one thing', '2-3 things', '4+ things (handyman day)'],
        followUp: (answer) =>
          answer === '4+ things (handyman day)'
            ? "Nice, a handyman day. List out everything and I will bundle it for you."
            : null,
      },
      {
        id: 'timeline',
        question: "How urgent?",
        type: 'single',
        options: ['Urgent (1-2 days)', 'Within 2 weeks', 'Still planning'],
      },
    ],
  },

  'demolition': {
    serviceSlug: 'demolition',
    serviceName: 'Light Demolition',
    photoEligible: true,
    photoPrompt: 'Photo of the area to be demolished? Helps me estimate the scope.',
    questions: [
      {
        id: 'demo_type',
        question: "What kind of demo?",
        type: 'single',
        options: [
          'Room / interior tearout',
          'Shed or small structure removal',
          'Deck or patio removal',
          'Debris / rubble clearing',
          'Pool demolition',
          'Other',
        ],
      },
      {
        id: 'demo_size',
        question: "Roughly how big is the area?",
        type: 'text',
      },
      {
        id: 'demo_hazard',
        question: "Any chance of hazardous materials? Asbestos, lead paint, chemicals?",
        type: 'single',
        options: ['No', 'Possibly', 'Yes', 'Not sure'],
      },
      {
        id: 'timeline',
        question: "How soon?",
        type: 'single',
        options: ['Within 2 weeks', 'More than 2 weeks', 'Still planning'],
      },
    ],
  },

  'garage-cleanout': {
    serviceSlug: 'garage-cleanout',
    serviceName: 'Garage Cleanout',
    photoEligible: true,
    photoPrompt: 'Send me a photo of the garage and I will give you a tighter price.',
    questions: [
      {
        id: 'garage_fullness',
        question: "How full is the garage?",
        type: 'single',
        options: ['Quarter full', 'Half full', 'Mostly full', 'Completely packed'],
      },
      {
        id: 'garage_contents',
        question: "Mostly what kind of stuff?",
        type: 'multi',
        options: ['General junk & boxes', 'Furniture', 'Tools & equipment', 'Appliances', 'Yard stuff', 'Mix of everything'],
      },
      {
        id: 'garage_hazard',
        question: "Any hazardous stuff? Paint, chemicals, old batteries?",
        type: 'single',
        options: ['No', 'Yes', 'Not sure'],
      },
      {
        id: 'timeline',
        question: "How soon do you need it cleared out?",
        type: 'single',
        options: ['ASAP (1-2 days)', 'Within 2 weeks', 'Still planning'],
      },
    ],
  },

  'home-cleaning': {
    serviceSlug: 'home-cleaning',
    serviceName: 'Home Cleaning',
    photoEligible: false,
    questions: [
      {
        id: 'clean_type',
        question: "What kind of cleaning?",
        type: 'single',
        options: ['General housekeeping', 'Deep clean', 'Move-out clean', 'Move-in clean', 'Post-construction clean', 'Specific room or item'],
      },
      {
        id: 'clean_size',
        question: "How many bedrooms and bathrooms?",
        type: 'text',
      },
      {
        id: 'clean_recurring',
        question: "One-time or recurring?",
        type: 'single',
        options: ['One-time', 'Weekly', 'Bi-weekly', 'Monthly'],
      },
      {
        id: 'clean_pets',
        question: "Any pets in the home?",
        type: 'single',
        options: ['No pets', 'Dogs', 'Cats', 'Both', 'Other'],
      },
      {
        id: 'timeline',
        question: "How soon do you need this?",
        type: 'single',
        options: ['ASAP (1-2 days)', 'Within 2 weeks', 'Still planning'],
      },
    ],
  },

  'pool-cleaning': {
    serviceSlug: 'pool-cleaning',
    serviceName: 'Pool Cleaning',
    photoEligible: false,
    questions: [
      {
        id: 'pool_need',
        question: "What's going on with your pool?",
        type: 'single',
        options: ['Regular maintenance', 'Green / cloudy water', 'Broken pump or filter', 'Surface damage', 'Opening / closing for season', 'Other repair'],
      },
      {
        id: 'pool_type',
        question: "In-ground or above-ground?",
        type: 'single',
        options: ['In-ground', 'Above-ground'],
      },
      {
        id: 'pool_recurring',
        question: "One-time service or ongoing maintenance?",
        type: 'single',
        options: ['One-time', 'Weekly', 'Bi-weekly', 'Monthly'],
      },
      {
        id: 'timeline',
        question: "How soon?",
        type: 'single',
        options: ['Urgent', 'Within 2 weeks', 'Still planning'],
      },
    ],
  },

  'landscaping': {
    serviceSlug: 'landscaping',
    serviceName: 'Landscaping',
    photoEligible: true,
    photoPrompt: 'Photo of the yard? Helps me see what we are working with.',
    questions: [
      {
        id: 'land_type',
        question: "What kind of landscaping help?",
        type: 'single',
        options: ['New design & planting', 'Regular maintenance', 'Lawn care (mowing, fertilizing)', 'Tree or shrub work', 'Hardscaping (pavers, walls)', 'Irrigation / sprinklers'],
      },
      {
        id: 'land_area',
        question: "Front yard, backyard, or both?",
        type: 'single',
        options: ['Front yard', 'Backyard', 'Both', 'Side yard / other'],
      },
      {
        id: 'land_recurring',
        question: "One-time or recurring?",
        type: 'single',
        options: ['One-time', 'Weekly', 'Bi-weekly', 'Monthly'],
      },
      {
        id: 'timeline',
        question: "How soon?",
        type: 'single',
        options: ['Within 2 weeks', 'More than 2 weeks', 'Still planning'],
      },
    ],
  },

  'carpet-cleaning': {
    serviceSlug: 'carpet-cleaning',
    serviceName: 'Carpet Cleaning',
    photoEligible: true,
    photoPrompt: 'Photo of the carpet or stain? Helps me recommend the right treatment.',
    questions: [
      {
        id: 'carpet_what',
        question: "What needs cleaning?",
        type: 'multi',
        options: ['Wall-to-wall carpet', 'Area rugs', 'Upholstery / furniture', 'Stairs'],
      },
      {
        id: 'carpet_rooms',
        question: "How many rooms?",
        type: 'single',
        options: ['1-2 rooms', '3-4 rooms', '5+ rooms', 'Whole house'],
      },
      {
        id: 'carpet_issues',
        question: "Any specific issues?",
        type: 'multi',
        options: ['Pet stains', 'Heavy traffic areas', 'Food / drink spills', 'Allergies / deep clean needed', 'General refresh'],
      },
      {
        id: 'timeline',
        question: "How soon?",
        type: 'single',
        options: ['Urgent (1-2 days)', 'Within 2 weeks', 'Still planning'],
      },
    ],
  },

  'home-dna-scan': {
    serviceSlug: 'home-dna-scan',
    serviceName: 'Home DNA Scan',
    photoEligible: false,
    questions: [
      {
        id: 'scan_reason',
        question: "What brings you in for a home scan?",
        type: 'single',
        options: ['Just want to know my home health', 'Buying a new home', 'Selling my home', 'Specific concern (roof, foundation, etc.)'],
      },
      {
        id: 'scan_property',
        question: "What type of property?",
        type: 'single',
        options: ['Single-family house', 'Condo / townhouse', 'Multi-family'],
      },
      {
        id: 'scan_age',
        question: "Roughly how old is the home?",
        type: 'single',
        options: ['Less than 5 years', '5-15 years', '15-30 years', '30+ years', 'Not sure'],
      },
      {
        id: 'scan_concerns',
        question: "Any specific concerns?",
        type: 'multi',
        options: ['Roof', 'Foundation', 'Plumbing', 'Electrical', 'HVAC', 'Mold', 'Pests', 'No specific concerns'],
      },
    ],
  },
};

// Diagnostic engine: manages question flow in chat
interface DiagnosticState {
  serviceSlug: string;
  currentIndex: number;
  answers: Record<string, any>;
  complete: boolean;
  photoOffered: boolean;
}

export function useDiagnosticEngine() {
  const [state, setState] = React.useState<DiagnosticState | null>(null);

  const startDiagnostic = useCallback((serviceSlug: string) => {
    const diagnostic = SERVICE_DIAGNOSTICS[serviceSlug];
    if (!diagnostic) return null;

    Haptics.impactAsync(ImpactFeedbackStyle.Light);
    setState({
      serviceSlug,
      currentIndex: 0,
      answers: {},
      complete: false,
      photoOffered: false,
    });
    return diagnostic.questions[0];
  }, []);

  const answerQuestion = useCallback((questionId: string, answer: any) => {
    if (!state) return null;
    const diagnostic = SERVICE_DIAGNOSTICS[state.serviceSlug];

    const newAnswers = { ...state.answers, [questionId]: answer };
    let nextIndex = state.currentIndex + 1;

    // Skip questions whose skipIf returns true
    while (nextIndex < diagnostic.questions.length) {
      const nextQ = diagnostic.questions[nextIndex];
      if (nextQ.skipIf && nextQ.skipIf(newAnswers)) {
        nextIndex++;
      } else {
        break;
      }
    }

    // Check for follow-up
    const currentQ = diagnostic.questions[state.currentIndex];
    const followUp = currentQ.followUp ? currentQ.followUp(answer) : null;

    // Offer photo if eligible and haven't yet
    const shouldOfferPhoto = !state.photoOffered && diagnostic.photoEligible && nextIndex >= 2;

    if (nextIndex >= diagnostic.questions.length) {
      Haptics.impactAsync(ImpactFeedbackStyle.Medium);
      setState({ ...state, answers: newAnswers, complete: true, currentIndex: nextIndex });
      return { complete: true, answers: newAnswers, followUp };
    }

    Haptics.impactAsync(ImpactFeedbackStyle.Light);
    setState({
      ...state,
      currentIndex: nextIndex,
      answers: newAnswers,
      photoOffered: state.photoOffered || shouldOfferPhoto,
    });

    return {
      complete: false,
      nextQuestion: diagnostic.questions[nextIndex],
      followUp,
      offerPhoto: shouldOfferPhoto ? diagnostic.photoPrompt : null,
    };
  }, [state]);

  const reset = useCallback(() => setState(null), []);

  return { state, startDiagnostic, answerQuestion, reset, diagnostics: SERVICE_DIAGNOSTICS };
}
```

### Quick-Reply Chips Component: `src/components/chat/DiagnosticChips.tsx`

```tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Haptics, ImpactFeedbackStyle } from 'expo-haptics';

interface DiagnosticChipsProps {
  options: string[];
  multiSelect?: boolean;
  selected?: string[];
  onSelect: (option: string) => void;
  onSubmitMulti?: (selected: string[]) => void;
  mood?: string;
}

export const DiagnosticChips: React.FC<DiagnosticChipsProps> = ({
  options,
  multiSelect = false,
  selected = [],
  onSelect,
  onSubmitMulti,
  mood = 'focused',
}) => {
  const moodColors: Record<string, string> = {
    focused: '#F47C20',
    chill: '#4CAF50',
    urgent: '#EF4444',
    proud: '#F47C20',
    curious: '#3B82F6',
    concerned: '#F59E0B',
    playful: '#A855F7',
    determined: '#F47C20',
  };

  const accentColor = moodColors[mood] || '#F47C20';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.chip,
              isSelected && { backgroundColor: accentColor, borderColor: accentColor },
            ]}
            onPress={() => {
              Haptics.impactAsync(ImpactFeedbackStyle.Light);
              onSelect(option);
            }}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
      {multiSelect && selected.length > 0 && onSubmitMulti && (
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: accentColor, borderColor: accentColor }]}
          onPress={() => {
            Haptics.impactAsync(ImpactFeedbackStyle.Medium);
            onSubmitMulti(selected);
          }}
        >
          <Text style={[styles.chipText, styles.chipTextSelected]}>Done</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  chipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
```

### Integration

1. **Chat screen** detects when George asks a diagnostic question and renders `DiagnosticChips` as quick-reply buttons below the message
2. **Single-select** chips: tap one, it sends that answer as a message
3. **Multi-select** chips: tap multiple, hit "Done" to send all selected
4. **Photo prompt**: when `offerPhoto` fires, show a camera button inline
5. **Haptics**: light tap on each chip, medium on completion
6. **Mood-aware**: chip accent color matches George's current mood
7. **After diagnostic completes**: George has all the data to call `calculate_quote` and present a locked price with one-tap booking

### API Contract
The diagnostic answers get sent to the backend as structured data alongside the chat message:
```json
{
  "message": "Done",
  "diagnosticAnswers": {
    "serviceSlug": "pressure-washing",
    "answers": {
      "pw_areas": ["Driveway", "Patio / deck"],
      "pw_reason": "Mold or moss buildup",
      "pw_property": "Home",
      "timeline": "Within 2 weeks"
    }
  }
}
```
George's backend uses these structured answers to call `calculate_quote` with precise parameters instead of parsing free text.

---

## Feature 21: Job Routing Cascade (Backend + Pro App)

The job routing cascade ensures every booked job gets matched to a pro reliably. Customer price is GUARANTEED once quoted — never changes.

### How It Works

1. **Pre-Quote**: George calls `getAvailableProRates` to check online pro pricing before generating a customer quote
2. **Post-Booking**: 4-tier cascade assigns a pro

### Cascade Logic

```typescript
// server/services/job-routing.ts
interface CascadeState {
  jobId: string;
  tier: 1 | 2 | 3 | 4;
  startedAt: Date;
  currentProId: string | null;
  offeredPros: string[]; // already-offered pro IDs
  payoutPercent: number; // starts at 85%, tier 3 = 90%
}

// Tier 1 (0-10 min): Best-fit pro
// Match by: proximity > rating > tier pricing > specialty
// Tier 2 (10-30 min): Next best pro
// Tier 3 (30-60 min): Sweetener — offer at 90% payout
// Tier 4 (60+ min): Expand radius + notify customer of delay
```

### API Endpoints
- `POST /api/jobs/:jobId/offer` — Send job offer to a pro
- `POST /api/jobs/:jobId/respond` — Pro accepts (`{ accepted: true }`) or declines
- `GET /api/jobs/:jobId/offer-status` — Check cascade state (tier, current pro, time remaining)

### Pro App: Job Offer Card

When a pro receives an offer, it appears as a full-screen takeover in the Pro app:

```
┌─────────────────────────────────┐
│  NEW JOB OFFER                  │
│  ⏱ Expires in 9:45              │
│                                 │
│  Gutter Cleaning                │
│  📍 2.3 mi · Lake Nona          │
│  💰 $127.50 (your take)         │
│  📅 Mar 5, 2-4 PM               │
│                                 │
│  ████████████ Accept ████████████│
│                                 │
│  [ Decline ]                    │
└─────────────────────────────────┘
```

- Countdown timer shows time remaining before offer moves to next pro
- Heavy haptic + push notification on offer arrival
- Accept triggers instant assignment + customer notification
- Decline moves to next cascade tier

### Customer Notification During Cascade

- Tier 1-2: No notification (seamless)
- Tier 3: No notification (still working)
- Tier 4: "We're finding the best pro for your job. Hang tight — we'll have someone confirmed shortly."

---

## Feature 22: Tiered Pro Pricing Configuration

### Pro Signup: Price Setting

During pro registration, after selecting services, pros set their price for each tier:

```
┌─────────────────────────────────┐
│  Set Your Prices                │
│                                 │
│  Junk Removal                   │
│  ┌─────────────────────────┐   │
│  │ Tier 1: Few items       │   │
│  │ Market range: $89-$149  │   │
│  │ Your price: [  $___  ]  │   │
│  ├─────────────────────────┤   │
│  │ Tier 2: Half truck      │   │
│  │ Market range: $179-$299 │   │
│  │ Your price: [  $___  ]  │   │
│  ├─────────────────────────┤   │
│  │ Tier 3: Full truck      │   │
│  │ Market range: $299-$449 │   │
│  │ Your price: [  $___  ]  │   │
│  ├─────────────────────────┤   │
│  │ Tier 4: Multiple loads  │   │
│  │ Market range: $449-$699 │   │
│  │ Your price: [  $___  ]  │   │
│  └─────────────────────────┘   │
│                                 │
│  Moving Labor (hourly)          │
│  Your rate: [  $/hr  ]          │
│                                 │
└─────────────────────────────────┘
```

### Pro Dashboard: Edit Prices Anytime

In the Pro Profile section, pros can edit their tier pricing at any time. Changes auto-save via `PATCH /api/pro/profile` with `proTierRates` field.

### Data Source
All tier definitions and market price ranges live in `client/src/constants/service-price-ranges.ts`.

### Service Tier Breakdown
| Service | Tiers |
|---------|-------|
| Junk Removal | 4 (few items, half truck, full truck, multiple loads) |
| Pressure Washing | 3 (driveway, partial house, full house) |
| Gutters | 2 (standard clean, deep clean) |
| Demolition | 3 (small, medium, large) |
| Garage Cleanout | 3 (partial, half, full) |
| Home Cleaning | 4 (standard, deep, move-out, post-construction) |
| Pool Cleaning | 3 (maintenance, green recovery, repair) |
| Landscaping | 3 (basic, standard, full service) |
| Carpet Cleaning | 3 (1-2 rooms, 3-4 rooms, whole house) |
| Moving Labor | Single hourly rate |
| Handyman | Single hourly rate |

---

## Feature 23: Pro Dashboard Editable Profile

### Component: Pro Profile Settings

Pros can manage their entire profile from the dashboard:

```
┌─────────────────────────────────┐
│  My Profile                     │
│                                 │
│  Company: [  Green Clean LLC  ] │
│  Phone:   [  407-555-1234     ] │
│  Service Area: [ 25 ] miles     │
│                                 │
│  ─── Active Services ──────── │
│  ✅ Junk Removal     [Edit $]  │
│  ✅ Pressure Washing [Edit $]  │
│  ☐  Gutters                    │
│  ✅ Demolition       [Edit $]  │
│  ☐  Garage Cleanout            │
│  ☐  Home Cleaning              │
│  ...                            │
│                                 │
│  Auto-saved ✓                   │
└─────────────────────────────────┘
```

### API
- `PATCH /api/pro/profile` — Auto-save on any field change
- Accepted fields: `serviceTypes`, `companyName`, `phone`, `serviceArea`, `proRates`, `proTierRates`
- Toggle a service off → pro stops receiving those job types immediately
- Toggle on → pro can set pricing, then starts receiving offers

---

## Feature 24: Pro Welcome Email

Sent automatically on pro registration. Dark navy branding with orange accents.

### Email Content Structure

```
Subject: Welcome to UpTend — Let's Get You Earning

From: alan@uptendapp.com
Tagline: One Price. One Pro. Done.

[UpTend Logo — "Up" in #F47C20, "Tend" in white]

Hey [Pro Name],

Welcome to UpTend. Here's how to start earning:

━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Set Up Your Payout
Connect your bank via Stripe for instant payments.
━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: Review Your Pricing
Set your rates for each service tier. You can change them anytime.
━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: Go Online
Toggle your status to start receiving job offers in your area.
━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: Accept & Complete Jobs
Accept offers, navigate to the job, complete the work, get paid.
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 MEET GEORGE
George is our AI that handles customers, quoting, and scheduling.
He'll send you job offers matched to your services, location, and rates.
You focus on the work — George handles the rest.

┌─────────────────────────────┐
│ QUICK REFERENCE              │
├─────────────────────────────┤
│ Payout:     85% (Standard)  │
│ Pay timing: Instant/weekly  │
│ Job offers: Push + in-app   │
│ Support:    alan@uptendapp  │
└─────────────────────────────┘
```

### Admin Notification
On every new pro registration, an admin notification email is sent to alan@uptendapp.com with the pro's name, services, and location.
