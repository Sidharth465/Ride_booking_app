import React, { FC, useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type { SharedValue } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "../shared/CustomText";
import CustomButton from "../shared/CustomButton";
import ContactActions from "../shared/ContactActions";
import { CustomerActiveRide } from "@/store/userStore";
import { withAlpha, AppColors, MapColors } from "@/utils/Constants";
import { useColors } from "@/theme/ThemeProvider";
import { useThemedStyles } from "@/theme/useThemedStyles";
import { RFValue } from "react-native-responsive-fontsize";
import { VEHICLE_LABELS, VehicleType } from "@/types/ride";

type CustomerLiveRidePanelProps = {
  ride: NonNullable<CustomerActiveRide>;
  searching: boolean;
  searchHint?: string | null;
  canceling: boolean;
  dropEtaMin?: number | null;
  routeKm?: number | null;
  hasLiveRider: boolean;
  /** Y of sheet top from screen top — drives map height while dragging */
  animatedPosition: SharedValue<number>;
  onSnapHeightChange?: (sheetHeight: number) => void;
  onCancelSearch: () => void;
  onCancelRide: () => void;
  onPay: () => void;
};

const statusLabel = (status: string, searchHint?: string | null) => {
  if (status === "SEARCHING_FOR_RIDER" && searchHint) return searchHint;
  switch (status) {
    case "SEARCHING_FOR_RIDER":
      return "Looking for nearby riders…";
    case "ACCEPTED":
      return "Rider is on the way to pickup";
    case "ARRIVED":
      return "Rider arrived — share your OTP";
    case "START":
      return "Trip in progress — heading to drop";
    case "COMPLETED":
      return "Trip completed — please pay";
    default:
      return status;
  }
};

const formatEta = (minutes: number | null | undefined) => {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} hr ${rem} min` : `${h} hr`;
};

/** Mini = map-focused peek; expanded = full context at 60% */
export const LIVE_SHEET_MINI_RATIO = 0.38;
export const LIVE_SHEET_EXPANDED_RATIO = 0.6;
export const LIVE_SHEET_MINI_BASE = Math.round(812 * LIVE_SHEET_MINI_RATIO); // approx for initial map pad

const CustomerLiveRidePanel: FC<CustomerLiveRidePanelProps> = ({
  ride,
  searching,
  searchHint,
  canceling,
  dropEtaMin,
  routeKm,
  hasLiveRider,
  animatedPosition,
  onSnapHeightChange,
  onCancelSearch,
  onCancelRide,
  onPay,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colors = useColors();
  const sheetRef = useRef<BottomSheet>(null);
  const vehicle = ride.vehicle as VehicleType;
  const etaLabel = formatEta(dropEtaMin ?? null);
  const showOtp =
    Boolean(ride.otp) && ["ACCEPTED", "ARRIVED"].includes(ride.status);
  const canCancelMidRide = ["ACCEPTED", "ARRIVED"].includes(ride.status);
  const riderPhone =
    typeof ride.rider === "object" ? ride.rider?.phone : null;

  const bottomPad =
    Math.max(insets.bottom, 14) + (Platform.OS === "ios" ? 4 : 8);
  // Mini still tall enough for status + fare + ETA + contacts peek
  const miniHeight = Math.round(windowHeight * LIVE_SHEET_MINI_RATIO);
  const expandedHeight = Math.round(windowHeight * LIVE_SHEET_EXPANDED_RATIO);

  const snapPoints = useMemo(
    () => [miniHeight, expandedHeight],
    [miniHeight, expandedHeight]
  );

  const reportSnap = useCallback(
    (index: number) => {
      const h = index >= 1 ? expandedHeight : miniHeight;
      onSnapHeightChange?.(h);
    },
    [miniHeight, expandedHeight, onSnapHeightChange]
  );

  // Start expanded so full trip context is visible
  useEffect(() => {
    onSnapHeightChange?.(expandedHeight);
  }, [expandedHeight, onSnapHeightChange]);

  const styles = useThemedStyles((c: AppColors) => ({
    content: {
      paddingHorizontal: 18,
      paddingTop: 4,
      paddingBottom: bottomPad,
    },
    topRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
      marginBottom: 10,
    },
    titleBlock: { flex: 1, paddingRight: 12 },
    title: { fontSize: RFValue(15), color: c.text },
    subtitle: { color: c.primary, marginTop: 2 },
    farePill: {
      backgroundColor: withAlpha(c.primary, 0.12),
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      alignItems: "flex-end" as const,
    },
    fare: { fontSize: RFValue(15), color: c.primary },
    vehicleMeta: { color: c.muted, marginTop: 2 },
    metaRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: 10,
    },
    liveChip: {
      alignSelf: "flex-start" as const,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      marginBottom: 10,
      backgroundColor: withAlpha(MapColors.pickup, 0.12),
    },
    etaRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      marginBottom: 10,
      backgroundColor: withAlpha(MapColors.path, 0.12),
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
    },
    etaText: { fontSize: RFValue(12), color: MapColors.path },
    routeCard: {
      backgroundColor: c.secondary_light,
      borderRadius: 14,
      padding: 14,
      marginBottom: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    routeRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: 10,
    },
    routeLabel: { color: c.muted, marginBottom: 2, letterSpacing: 0.4 },
    pickupDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: MapColors.pickup,
      marginTop: 4,
    },
    dropDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: MapColors.drop,
      marginTop: 4,
    },
    routeLine: {
      width: 2,
      height: 14,
      backgroundColor: c.border,
      marginLeft: 4,
      marginVertical: 4,
    },
    otpBox: {
      backgroundColor: withAlpha(c.primary, 0.1),
      borderRadius: 14,
      padding: 14,
      alignItems: "center" as const,
      marginTop: 12,
      marginBottom: 4,
      borderWidth: 1.5,
      borderColor: withAlpha(c.primary, 0.35),
    },
    otp: {
      fontSize: RFValue(28),
      color: c.primary,
      letterSpacing: 8,
      marginTop: 4,
    },
    actions: {
      marginTop: 14,
      alignItems: "center" as const,
      gap: 10,
      width: "100%" as const,
      paddingBottom: 8,
    },
    cancelLink: { marginTop: 4, paddingVertical: 10 },
    searchingRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      marginBottom: 4,
    },
  }));

  return (
    <BottomSheet
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableOverDrag={false}
      animatedPosition={animatedPosition}
      onChange={reportSnap}
      handleIndicatorStyle={{
        backgroundColor: colors.border,
        width: 40,
        height: 4,
      }}
      backgroundStyle={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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
            {searching ? (
              <View style={styles.searchingRow}>
                <ActivityIndicator color={colors.primary} />
                <CustomText fontFamily="Bold" style={styles.title}>
                  Finding a rider
                </CustomText>
              </View>
            ) : (
              <CustomText fontFamily="Bold" style={styles.title}>
                Your trip
              </CustomText>
            )}
            <CustomText fontSize={11} style={styles.subtitle}>
              {statusLabel(ride.status, searchHint)}
            </CustomText>
            <CustomText fontSize={10} style={styles.vehicleMeta}>
              {VEHICLE_LABELS[vehicle] ?? ride.vehicle} ·{" "}
              {Number(ride.distance).toFixed(1)} km
            </CustomText>
          </View>
          <View style={styles.farePill}>
            <CustomText fontFamily="Bold" style={styles.fare}>
              ₹{Math.round(ride.fare)}
            </CustomText>
          </View>
        </View>

        {etaLabel && !searching ? (
          <View style={styles.etaRow}>
            <Ionicons name="time-outline" size={16} color={MapColors.path} />
            <CustomText fontFamily="Bold" style={styles.etaText}>
              {ride.status === "START"
                ? `Drop in ~${etaLabel}`
                : `Expected drop · ~${etaLabel}`}
            </CustomText>
            {routeKm != null ? (
              <CustomText fontSize={10} style={{ color: colors.muted }}>
                · {routeKm.toFixed(1)} km
              </CustomText>
            ) : null}
          </View>
        ) : null}

        {riderPhone ? (
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={14} color={colors.muted} />
            <CustomText
              fontSize={11}
              style={{ color: colors.muted, marginLeft: 6 }}
            >
              Rider · {riderPhone}
            </CustomText>
          </View>
        ) : null}

        <ContactActions
          peerLabel="Rider"
          phone={riderPhone}
          disabled={
            !["ACCEPTED", "ARRIVED", "START"].includes(ride.status)
          }
          onChat={() =>
            router.push({
              pathname: "/customer/chat",
              params: { rideId: ride._id },
            })
          }
        />

        {hasLiveRider &&
        ["ACCEPTED", "ARRIVED", "START"].includes(ride.status) ? (
          <View style={styles.liveChip}>
            <Ionicons
              name="navigate-circle"
              size={14}
              color={MapColors.pickup}
            />
            <CustomText
              fontSize={11}
              fontFamily="Medium"
              style={{ marginLeft: 6, color: MapColors.pickup }}
            >
              Live tracking — rider on map
            </CustomText>
          </View>
        ) : null}

        {!searching &&
        !hasLiveRider &&
        ride.status !== "COMPLETED" &&
        ride.status !== "SEARCHING_FOR_RIDER" ? (
          <CustomText
            fontSize={10}
            style={{ color: colors.muted, marginBottom: 10 }}
          >
            Waiting for rider live location…
          </CustomText>
        ) : null}

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

        {showOtp ? (
          <View style={styles.otpBox}>
            <CustomText fontSize={10} style={{ color: colors.muted }}>
              Share this OTP with your rider
            </CustomText>
            <CustomText fontFamily="Bold" style={styles.otp}>
              {ride.otp}
            </CustomText>
          </View>
        ) : null}

        <View style={styles.actions}>
          {searching && (
            <CustomButton
              title="Cancel search"
              loading={canceling}
              onPress={onCancelSearch}
            />
          )}

          {canCancelMidRide && (
            <TouchableOpacity onPress={onCancelRide} style={styles.cancelLink}>
              <CustomText
                fontSize={12}
                fontFamily="Medium"
                style={{ color: colors.danger }}
              >
                Cancel ride
              </CustomText>
            </TouchableOpacity>
          )}

          {ride.status === "COMPLETED" && (
            <CustomButton title="Pay & rate" onPress={onPay} />
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

export default CustomerLiveRidePanel;
