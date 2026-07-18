import React, { FC, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import CustomText from "@/components/shared/CustomText";
import { useColors } from "@/theme/ThemeProvider";
import { RFValue } from "react-native-responsive-fontsize";

const THUMB = 52;
const THRESHOLD = 0.85;

type SlideToCompleteProps = {
  title?: string;
  loading?: boolean;
  disabled?: boolean;
  onComplete: () => void;
};

const SlideToComplete: FC<SlideToCompleteProps> = ({
  title = "Slide to complete ride",
  loading = false,
  disabled = false,
  onComplete,
}) => {
  const colors = useColors();
  const trackW = useSharedValue(0);
  const tx = useSharedValue(0);
  const done = useSharedValue(false);

  useEffect(() => {
    if (!loading) {
      done.value = false;
      tx.value = withSpring(0, { damping: 18, stiffness: 180 });
    }
  }, [loading, done, tx]);

  const fireComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined
    );
    onComplete();
  };

  const pan = Gesture.Pan()
    .enabled(!loading && !disabled)
    .activeOffsetX(8)
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      "worklet";
      if (done.value || trackW.value <= 0) return;
      const max = Math.max(0, trackW.value - THUMB - 8);
      tx.value = Math.min(Math.max(0, e.translationX), max);
    })
    .onEnd(() => {
      "worklet";
      if (done.value || trackW.value <= 0) return;
      const max = Math.max(0, trackW.value - THUMB - 8);
      if (tx.value >= max * THRESHOLD) {
        done.value = true;
        tx.value = withSpring(max, { damping: 16, stiffness: 200 });
        runOnJS(fireComplete)();
      } else {
        tx.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const onLayout = (e: LayoutChangeEvent) => {
    trackW.value = e.nativeEvent.layout.width;
  };

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: tx.value + THUMB,
  }));

  const labelStyle = useAnimatedStyle(() => {
    const max = Math.max(1, trackW.value - THUMB - 8);
    const opacity = interpolate(
      tx.value,
      [0, max * 0.55],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.secondary_light,
          borderColor: colors.border,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: colors.primary },
          fillStyle,
        ]}
      />

      <Animated.View style={[styles.labelWrap, labelStyle]} pointerEvents="none">
        <CustomText
          fontFamily="Medium"
          style={{ color: colors.muted, fontSize: RFValue(12) }}
        >
          {loading ? "Completing…" : title}
        </CustomText>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: colors.primary },
            thumbStyle,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={26}
              color={colors.onPrimary}
            />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default SlideToComplete;

const styles = StyleSheet.create({
  track: {
    width: "100%",
    height: THUMB + 8,
    borderRadius: (THUMB + 8) / 2,
    borderWidth: 1.5,
    justifyContent: "center",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: (THUMB + 8) / 2,
    opacity: 0.22,
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: THUMB + 12,
  },
  thumb: {
    position: "absolute",
    left: 4,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
