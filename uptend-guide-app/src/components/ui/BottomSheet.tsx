/**
 * @module BottomSheet
 * @description Reusable bottom sheet modal for filters, confirmations, and custom content.
 * Uses React Native Modal + Animated for a smooth slide-up effect.
 *
 * @example
 * ```tsx
 * <BottomSheet visible={showFilter} onClose={() => setShowFilter(false)} title="Filter Jobs">
 *   <FilterContent />
 * </BottomSheet>
 *
 * <BottomSheet visible={showConfirm} onClose={close} title="Cancel Job?" snapPoints={[200]}>
 *   <Text>Are you sure?</Text>
 *   <Button variant="destructive" onPress={handleCancel}>Yes, Cancel</Button>
 * </BottomSheet>
 * ```
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  useColorScheme,
  type StyleProp,
  type ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radii, spacing } from './tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Called when the sheet should close (backdrop tap or drag) */
  onClose: () => void;
  /** Title displayed at the top */
  title?: string;
  /** Sheet content */
  children: React.ReactNode;
  /** Max height as percentage of screen (0-1). Default 0.6 */
  maxHeightRatio?: number;
  /** Show handle/pill at top */
  showHandle?: boolean;
  /** Disable closing by tapping backdrop */
  disableBackdropClose?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  maxHeightRatio = 0.6,
  showHandle = true,
  disableBackdropClose = false,
  style,
}: BottomSheetProps) {
  const dark = useColorScheme() === 'dark';
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    } else {
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const bgColor = dark ? colors.surfaceDark : colors.background;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={disableBackdropClose ? undefined : onClose}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: SCREEN_HEIGHT * maxHeightRatio,
              backgroundColor: bgColor,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              paddingBottom: spacing.xxl,
              transform: [{ translateY }],
            },
            style,
          ]}
        >
          {showHandle && (
            <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: dark ? '#475569' : '#CBD5E1' }} />
            </View>
          )}
          {title && (
            <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: dark ? colors.borderDark : colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: dark ? colors.textDark : colors.text }}>{title}</Text>
            </View>
          )}
          <View style={{ padding: spacing.lg }}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default BottomSheet;
