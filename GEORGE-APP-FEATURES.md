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
  message: "A pro is already coming to your street on March 12. Book the same day for 5% off.",
  actionLabel: "Get Group Rate",
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
              <Text style={styles.discountText}>5% off</Text>
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
George periodically checks for active/recent jobs near the customer's address. If a pro is already in the neighborhood, George shows this card with a group discount option. The 5% discount applies when a pro can do back-to-back jobs in the same area (reduced travel = savings passed to customer).

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
