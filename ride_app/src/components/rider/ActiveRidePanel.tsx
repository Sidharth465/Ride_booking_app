import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import type { SharedValue } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "../shared/CustomText";
import CustomButton from "../shared/CustomButton";
import ContactActions from "../shared/ContactActions";
import SlideToComplete from "../shared/SlideToComplete";
import { ActiveRide, useRiderStore } from "@/store/riderStore";
import { withAlpha, AppColors, MapColors } from "@/utils/Constants";
import { useColors } from "@/theme/ThemeProvider";
import { useThemedStyles } from "@/theme/useThemedStyles";
import { openGoogleMapsTo } from "@/utils/openMaps";
import {
  RFValue,
  scaleHorizontal,
  scaleModerate,
  scaleVertical,
} from "@/utils/responsive";

export const RIDER_SHEET_MINI_RATIO = 0.34;
export const RIDER_SHEET_EXPANDED_RATIO = 0.58;

type ActiveRidePanelProps = {
  ride: NonNullable<ActiveRide>;
  updating: boolean;
  distanceToDropMeters: number | null;
  dropEtaMin?: number | null;
  routeKm?: number | null;
  animatedPosition: SharedValue<number>;
  onSnapHeightChange?: (sheetHeight: number) => void;
  onMarkArrived: () => void;
  onVerifyOtp: (otp: string) => void;
  onComplete: () => void;
  onCancel?: () => void;
};

const statusLabel = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "Drive to customer pickup";
    case "ARRIVED":
      return "Collect OTP to start trip";
    case "START":
      return "Trip live — head to drop";
    case "COMPLETED":
      return "Trip completed";
    default:
      return status;
  }
};

const formatDistance = (meters: number | null) => {
  if (meters == null || !Number.isFinite(meters)) return null;
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
};

const formatEta = (minutes: number | null | undefined) => {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} hr ${rem} min` : `${h} hr`;
};

const ActiveRidePanel: FC<ActiveRidePanelProps> = ({
  ride,
  updating,
  distanceToDropMeters,
  dropEtaMin,
  routeKm,
  animatedPosition,
  onSnapHeightChange,
  onMarkArrived,
  onVerifyOtp,
  onComplete,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colors = useColors();
  const sheetRef = useRef<BottomSheet>(null);
  const riderLocation = useRiderStore((s) => s.location);
  const [otp, setOtp] = useState("");

  const bottomPad =
    Math.max(insets.bottom, scaleVertical(14)) +
    (Platform.OS === "ios" ? scaleVertical(4) : scaleVertical(8));
  const miniHeight = Math.round(windowHeight * RIDER_SHEET_MINI_RATIO);
  const expandedHeight = Math.round(windowHeight * RIDER_SHEET_EXPANDED_RATIO);

  const snapPoints = useMemo(
    () => [miniHeight, expandedHeight],
    [miniHeight, expandedHeight]
  );

  const reportSnap = useCallback(
    (index: number) => {
      onSnapHeightChange?.(index >= 1 ? expandedHeight : miniHeight);
    },
    [miniHeight, expandedHeight, onSnapHeightChange]
  );

  useEffect(() => {
    onSnapHeightChange?.(expandedHeight);
  }, [expandedHeight, onSnapHeightChange]);

  useEffect(() => {
    setOtp("");
    // Expand for OTP entry
    if (ride.status === "ARRIVED") {
      sheetRef.current?.snapToIndex(1);
    }
  }, [ride._id, ride.status]);

  const etaLabel = formatEta(dropEtaMin ?? null);
  const distLabel = formatDistance(distanceToDropMeters);
  const navigateTarget = ride.status === "START" ? "drop" : "pickup";

  const openNavigate = () => {
    const dest =
      navigateTarget === "drop"
        ? {
            latitude: Number(ride.drop.latitude),
            longitude: Number(ride.drop.longitude),
          }
        : {
            latitude: Number(ride.pickup.latitude),
            longitude: Number(ride.pickup.longitude),
          };
    const from = riderLocation
      ? {
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
        }
      : null;
    openGoogleMapsTo(dest, from);
  };

  const styles = useThemedStyles((c: AppColors) => ({
    content: {
      paddingHorizontal: scaleHorizontal(18),
      paddingTop: scaleVertical(4),
      paddingBottom: bottomPad,
    },
    topRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
      marginBottom: scaleVertical(10),
    },
    titleBlock: { flex: 1, paddingRight: scaleHorizontal(12) },
    title: { fontSize: RFValue(16), color: c.text },
    subtitle: { color: c.primary, marginTop: scaleVertical(3) },
    farePill: {
      backgroundColor: withAlpha(c.primary, 0.12),
      paddingHorizontal: scaleHorizontal(12),
      paddingVertical: scaleVertical(8),
      borderRadius: scaleModerate(12),
      alignItems: "flex-end" as const,
    },
    fare: { fontSize: RFValue(15), color: c.primary },
    chipRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: scaleHorizontal(8),
      marginBottom: scaleVertical(12),
    },
    chip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: scaleHorizontal(6),
      paddingHorizontal: scaleHorizontal(10),
      paddingVertical: scaleVertical(8),
      borderRadius: scaleModerate(10),
      backgroundColor: withAlpha(MapColors.path, 0.12),
    },
    chipText: { fontSize: RFValue(11), color: MapColors.path },
    navigateBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: scaleHorizontal(8),
      backgroundColor: MapColors.path,
      borderRadius: scaleModerate(14),
      paddingVertical: scaleVertical(14),
      marginBottom: scaleVertical(12),
    },
    navigateText: {
      color: "#FFFFFF",
      fontSize: RFValue(13),
    },
    routeCard: {
      backgroundColor: c.secondary_light,
      borderRadius: scaleModerate(14),
      padding: scaleModerate(14),
      marginBottom: scaleVertical(12),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    routeRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: scaleHorizontal(10),
    },
    routeLabel: { color: c.muted, marginBottom: scaleVertical(2), letterSpacing: 0.4 },
    pickupDot: {
      width: scaleModerate(10),
      height: scaleModerate(10),
      borderRadius: scaleModerate(5),
      backgroundColor: MapColors.pickup,
      marginTop: scaleVertical(4),
    },
    dropDot: {
      width: scaleModerate(10),
      height: scaleModerate(10),
      borderRadius: scaleModerate(5),
      backgroundColor: MapColors.drop,
      marginTop: scaleVertical(4),
    },
    routeLine: {
      width: scaleHorizontal(2),
      height: scaleVertical(14),
      backgroundColor: c.border,
      marginLeft: scaleHorizontal(4),
      marginVertical: scaleVertical(4),
    },
    actions: {
      marginTop: scaleVertical(4),
      alignItems: "center" as const,
      gap: scaleHorizontal(10),
      width: "100%" as const,
    },
    otpBlock: {
      width: "100%" as const,
      alignItems: "center" as const,
      gap: scaleHorizontal(10),
      backgroundColor: withAlpha(c.primary, 0.08),
      borderRadius: scaleModerate(16),
      padding: scaleModerate(14),
      borderWidth: 1.5,
      borderColor: withAlpha(c.primary, 0.3),
    },
    otpHint: { color: c.muted, textAlign: "center" as const },
    otpInput: {
      width: "75%" as const,
      borderWidth: 1.5,
      borderColor: c.primary,
      backgroundColor: c.surface,
      borderRadius: scaleModerate(14),
      paddingVertical:
        Platform.OS === "ios" ? scaleVertical(14) : scaleVertical(10),
      fontSize: RFValue(24),
      fontFamily: "Bold",
      letterSpacing: 12,
      color: c.text,
      textAlign: "center" as const,
    },
    cancelLink: { marginTop: scaleVertical(2), paddingVertical: scaleVertical(10) },
  }));

  return (
    <BottomSheet
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableOverDrag={false}
      enableContentPanningGesture={ride.status !== "START"}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      animatedPosition={animatedPosition}
      onChange={reportSnap}
      handleIndicatorStyle={{
        backgroundColor: colors.border,
        width: scaleHorizontal(40),
        height: scaleVertical(4),
      }}
      backgroundStyle={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: scaleModerate(24),
        borderTopRightRadius: scaleModerate(24),
        shadowColor: colors.text,
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: -4 },
        elevation: 18,
      }}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <CustomText fontFamily="Bold" style={styles.title}>
              {ride.status === "START"
                ? "En route to drop"
                : ride.status === "ARRIVED"
                  ? "At pickup"
                  : "Go to pickup"}
            </CustomText>
            <CustomText fontSize={11} style={styles.subtitle}>
              {statusLabel(ride.status)}
            </CustomText>
          </View>
          <View style={styles.farePill}>
            <CustomText fontFamily="Bold" style={styles.fare}>
              ₹{Math.round(ride.fare)}
            </CustomText>
          </View>
        </View>

        <View style={styles.chipRow}>
          {etaLabel ? (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={RFValue(14)} color={MapColors.path} />
              <CustomText fontFamily="Medium" style={styles.chipText}>
                ~{etaLabel}
                {routeKm != null ? ` · ${routeKm.toFixed(1)} km` : ""}
              </CustomText>
            </View>
          ) : null}
          {ride.status === "START" && distLabel ? (
            <View style={styles.chip}>
              <Ionicons name="navigate-outline" size={RFValue(14)} color={MapColors.path} />
              <CustomText fontFamily="Medium" style={styles.chipText}>
                {distLabel}
              </CustomText>
            </View>
          ) : null}
        </View>

        {/* Primary: turn-by-turn */}
        {["ACCEPTED", "ARRIVED", "START"].includes(ride.status) ? (
          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={openNavigate}
            activeOpacity={0.88}
          >
            <Ionicons name="navigate" size={RFValue(20)} color="#FFFFFF" />
            <CustomText fontFamily="Bold" style={styles.navigateText}>
              {navigateTarget === "drop"
                ? "Navigate to drop"
                : "Navigate to pickup"}
            </CustomText>
          </TouchableOpacity>
        ) : null}

        <ContactActions
          peerLabel="Customer"
          phone={ride.customer?.phone}
          disabled={!["ACCEPTED", "ARRIVED", "START"].includes(ride.status)}
          onChat={() =>
            router.push({
              pathname: "/rider/chat",
              params: { rideId: ride._id },
            })
          }
        />

        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.pickupDot} />
            <View style={{ flex: 1 }}>
              <CustomText fontSize={9} style={styles.routeLabel}>
                PICKUP
              </CustomText>
              <CustomText numberOfLines={2} fontSize={12} fontFamily="Medium">
                {ride.pickup.address}
              </CustomText>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.dropDot} />
            <View style={{ flex: 1 }}>
              <CustomText fontSize={9} style={styles.routeLabel}>
                DROP
              </CustomText>
              <CustomText numberOfLines={2} fontSize={12} fontFamily="Medium">
                {ride.drop.address}
              </CustomText>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {ride.status === "ACCEPTED" && (
            <>
              <CustomButton
                title="I've arrived at pickup"
                loading={updating}
                onPress={onMarkArrived}
              />
              {onCancel ? (
                <TouchableOpacity onPress={onCancel} style={styles.cancelLink}>
                  <CustomText
                    fontSize={12}
                    fontFamily="Medium"
                    style={{ color: colors.danger }}
                  >
                    Cancel ride
                  </CustomText>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {ride.status === "ARRIVED" && (
            <View style={styles.otpBlock}>
              <CustomText fontSize={11} style={styles.otpHint}>
                Ask the customer for their 4-digit OTP
              </CustomText>
              <BottomSheetTextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="••••"
                placeholderTextColor={colors.border}
                textAlign="center"
                returnKeyType="done"
                blurOnSubmit
              />
              <CustomButton
                title="Verify OTP & start"
                loading={updating}
                disabled={otp.length !== 4}
                onPress={() => {
                  Keyboard.dismiss();
                  onVerifyOtp(otp);
                }}
              />
            </View>
          )}

          {ride.status === "START" && (
            <SlideToComplete
              title="Slide to complete ride"
              loading={updating}
              onComplete={onComplete}
            />
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

export default ActiveRidePanel;
