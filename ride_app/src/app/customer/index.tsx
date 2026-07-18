import { View, TouchableOpacity, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import LocationBar from "@/components/customer/LocationBar";
import { homeStyles } from "@/styles/homeStyles";
import DraggableMap from "@/components/customer/DraggableMap";
import CustomText from "@/components/shared/CustomText";
import ThemePicker from "@/components/shared/ThemePicker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppColors, THEME_META } from "@/utils/Constants";
import { useColors, useTheme } from "@/theme/ThemeProvider";
import { useThemedStyles } from "@/theme/useThemedStyles";
import { RFValue } from "react-native-responsive-fontsize";
import { useUserStore } from "@/store/userStore";
import { hasBlockingActiveRide } from "@/utils/rideActive";

const CustomerHome = () => {
  const location = useUserStore((s) => s.location);
  const activeRide = useUserStore((s) => s.activeRide);
  const rideInProgress = hasBlockingActiveRide(activeRide);
  const colors = useColors();
  const { themeId } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);

  // If an active trip exists, never stay on the locked search home
  useEffect(() => {
    if (hasBlockingActiveRide(activeRide)) {
      router.replace("/customer/liveride");
    }
  }, [activeRide?._id, activeRide?.status, activeRide?.paymentStatus]);

  const styles = useThemedStyles((c: AppColors) => ({
    mapArea: { flex: 1 },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: Platform.OS === "ios" ? 36 : 24,
      shadowColor: c.text,
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 12,
    },
    greetingRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      marginBottom: 12,
    },
    greeting: {
      fontSize: RFValue(14),
      color: c.text,
      flex: 1,
      paddingRight: 8,
    },
    themeBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: c.secondary_light,
      borderWidth: 1,
      borderColor: c.border,
    },
    whereTo: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      alignSelf: "stretch" as const,
      width: "100%" as const,
      backgroundColor: c.secondary_light,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    whereToDisabled: {
      opacity: 0.75,
      backgroundColor: c.secondary,
    },
    whereToText: {
      flex: 1,
      minWidth: 0,
      color: c.muted,
      fontSize: RFValue(12),
    },
    activeRideBanner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 14,
    },
  }));

  const openBooking = () => {
    if (rideInProgress) {
      router.replace("/customer/liveride");
      return;
    }
    router.navigate("/customer/selectlocations");
  };

  // Avoid flashing locked home while redirecting to live ride
  if (rideInProgress) {
    return <View style={homeStyles.container} />;
  }

  return (
    <View style={homeStyles.container}>
      <LocationBar />

      <View style={styles.mapArea}>
        <DraggableMap />
      </View>

      <View style={styles.sheet}>
        {rideInProgress ? null : (
          <>
            <View style={styles.greetingRow}>
              <CustomText fontFamily="SemiBold" style={styles.greeting}>
                Where are you going?
              </CustomText>
              <TouchableOpacity
                style={styles.themeBtn}
                onPress={() => setThemeOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="color-palette-outline"
                  size={RFValue(14)}
                  color={colors.primary}
                />
                <CustomText fontSize={10} fontFamily="Medium">
                  {THEME_META[themeId].label.split(" ")[0]}
                </CustomText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.whereTo}
              activeOpacity={0.85}
              onPress={openBooking}
            >
              <Ionicons
                name="search"
                size={RFValue(16)}
                color={colors.muted}
              />
              <CustomText style={styles.whereToText} numberOfLines={1}>
                {location?.address
                  ? location.address
                  : "Getting your location…"}
              </CustomText>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ThemePicker visible={themeOpen} onClose={() => setThemeOpen(false)} />
    </View>
  );
};

export default CustomerHome;
