import { logout } from "@/service/authService";
import { useWS } from "@/service/WSProvider";
import { useUserStore } from "@/store/userStore";
import { uiStyles } from "@/styles/uiStyles";
import { hasBlockingActiveRide } from "@/utils/rideActive";
import { router } from "expo-router";
import React from "react";
import { View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "../shared/CustomText";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/theme/ThemeProvider";
import { MapColors } from "@/utils/Constants";

const LocationBar = () => {
  const { location, activeRide } = useUserStore();
  const { disconnect } = useWS();
  const colors = useColors();

  const openLocations = () => {
    if (hasBlockingActiveRide(activeRide)) {
      Alert.alert(
        "Ride in progress",
        "Finish or cancel your current ride before booking another.",
        [
          {
            text: "Open ride",
            onPress: () => router.navigate("/customer/liveride"),
          },
          { text: "OK", style: "cancel" },
        ]
      );
      return;
    }
    router.navigate("/customer/selectlocations");
  };

  return (
    <View style={uiStyles.absoluteTop}>
      <SafeAreaView edges={["top"]} />
      <View style={styles.row}>
        <TouchableOpacity
          style={[uiStyles.btn, { backgroundColor: colors.surface }]}
          onPress={() => logout(disconnect)}
          hitSlop={8}
        >
          <AntDesign name="logout" size={RFValue(14)} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.locationBar, { backgroundColor: colors.surface }]}
          onPress={openLocations}
          activeOpacity={0.85}
        >
          <View style={[uiStyles.dot, { backgroundColor: MapColors.pickup }]} />
          <CustomText numberOfLines={1} style={styles.locationText}>
            {location?.address || "Getting address..."}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[uiStyles.btn, { backgroundColor: colors.surface }]}
          onPress={() => router.navigate("/customer/history")}
          hitSlop={8}
        >
          <Ionicons
            name="time-outline"
            size={RFValue(16)}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LocationBar;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    width: "100%",
  },
  locationBar: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    height: 40,
    alignItems: "center",
    flexDirection: "row",
    paddingRight: 12,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 10,
  },
  locationText: {
    flex: 1,
    minWidth: 0,
    fontSize: RFValue(11),
    fontFamily: "Regular",
    opacity: 0.85,
  },
});
