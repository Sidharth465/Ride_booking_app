import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/utils/Constants";
import { scaleHorizontal, scaleModerate, scaleVertical } from "@/utils/responsive";

type AnimatedBottomSheetProps = {
  visible: boolean;
  onClose?: () => void;
  children: ReactNode;
  /** Allow tapping dimmed backdrop to dismiss */
  dismissOnBackdrop?: boolean;
  /** Extra bottom padding inside sheet */
  contentPaddingBottom?: number;
};

const { height: SCREEN_H } = Dimensions.get("window");

/**
 * Shared bottom sheet: faded overlay + slide-up panel + keyboard-aware layout.
 */
const AnimatedBottomSheet: FC<AnimatedBottomSheetProps> = ({
  visible,
  onClose,
  children,
  dismissOnBackdrop = false,
  contentPaddingBottom = 0,
}) => {
  const insets = useSafeAreaInsets();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslate = useRef(new Animated.Value(SCREEN_H * 0.4)).current;
  const [mounted, setMounted] = useState(visible);
  const [keyboardPad, setKeyboardPad] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      setKeyboardPad(e?.endCoordinates?.height ?? 0);
    };
    const onHide = () => setKeyboardPad(0);

    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      overlayOpacity.setValue(0);
      sheetTranslate.setValue(SCREEN_H * 0.35);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslate, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslate, {
          toValue: SCREEN_H * 0.25,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          setKeyboardPad(0);
        }
      });
    }
  }, [visible]);

  if (!mounted) return null;

  const bottomPad =
    Math.max(insets.bottom, scaleVertical(12)) +
    contentPaddingBottom +
    (Platform.OS === "android"
      ? Math.max(0, keyboardPad - scaleVertical(24))
      : 0);

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View
          pointerEvents="none"
          style={[styles.overlay, { opacity: overlayOpacity }]}
        />

        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissOnBackdrop ? onClose : undefined}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
          keyboardVerticalOffset={Platform.OS === "ios" ? scaleVertical(8) : 0}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: bottomPad,
                transform: [{ translateY: sheetTranslate }],
              },
            ]}
          >
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default AnimatedBottomSheet;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 20, 25, 0.45)",
  },
  kav: {
    width: "100%",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: scaleModerate(24),
    borderTopRightRadius: scaleModerate(24),
    maxHeight: SCREEN_H * 0.88,
    shadowColor: Colors.text,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: scaleVertical(10),
    paddingBottom: scaleVertical(4),
  },
  handle: {
    width: scaleHorizontal(40),
    height: scaleVertical(4),
    borderRadius: scaleModerate(2),
    backgroundColor: Colors.border,
  },
  scrollContent: {
    paddingHorizontal: scaleHorizontal(18),
    paddingTop: scaleVertical(4),
  },
});
