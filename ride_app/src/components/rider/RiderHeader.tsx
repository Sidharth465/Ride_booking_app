import React, { FC, useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import CustomText from "../shared/CustomText";
import ThemePicker from "../shared/ThemePicker";
import { riderStyles } from "@/styles/riderStyles";
import { logout } from "@/service/authService";
import { useWS } from "@/service/WSProvider";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { useColors } from "@/theme/ThemeProvider";
import { useThemedStyles } from "@/theme/useThemedStyles";
import { AppColors } from "@/utils/Constants";

type RiderHeaderProps = {
  onDuty: boolean;
  onToggleDuty: () => void;
  toggling?: boolean;
};

const RiderHeader: FC<RiderHeaderProps> = ({
  onDuty,
  onToggleDuty,
  toggling,
}) => {
  const { disconnect } = useWS();
  const colors = useColors();
  const [themeOpen, setThemeOpen] = useState(false);
  const styles = useThemedStyles((c: AppColors) => ({
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: 10,
      paddingBottom: 6,
    },
    leftActions: {
      flexDirection: "row" as const,
      gap: 6,
    },
    logoutBtn: {
      backgroundColor: c.surface,
      borderRadius: 100,
      paddingHorizontal: 10,
      paddingVertical: 6,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
    },
    titleBlock: {
      flex: 1,
    },
    title: {
      fontSize: RFValue(14),
      color: c.text,
    },
    subtitle: {
      color: c.muted,
      marginTop: 2,
    },
  }));

  return (
    <View style={riderStyles.headerContainer}>
      <SafeAreaView edges={["top"]} />
      <View style={styles.row}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => logout(disconnect)}
            hitSlop={12}
          >
            <AntDesign name="logout" size={RFValue(14)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setThemeOpen(true)}
            hitSlop={12}
          >
            <Ionicons
              name="color-palette-outline"
              size={RFValue(14)}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => router.navigate("/rider/history")}
            hitSlop={12}
          >
            <Ionicons
              name="time-outline"
              size={RFValue(14)}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.titleBlock}>
          <CustomText fontFamily="Bold" style={styles.title}>
            Rider Mode
          </CustomText>
          <CustomText fontSize={10} style={styles.subtitle}>
            {onDuty ? "You are online — waiting for rides" : "You are offline"}
          </CustomText>
        </View>

        <TouchableOpacity
          style={[
            riderStyles.toggleContainer,
            {
              backgroundColor: onDuty ? colors.tertiary : colors.surface,
              borderColor: onDuty ? colors.tertiary : colors.border,
              opacity: toggling ? 0.6 : 1,
            },
          ]}
          onPress={onToggleDuty}
          disabled={toggling}
          activeOpacity={0.8}
        >
          <Image
            source={
              onDuty
                ? require("@/assets/icons/switch_on.png")
                : require("@/assets/icons/switch_off.png")
            }
            style={riderStyles.icon}
          />
          <CustomText
            fontFamily="Bold"
            fontSize={10}
            style={{ color: onDuty ? colors.onPrimary : colors.text }}
          >
            {onDuty ? "ON" : "OFF"}
          </CustomText>
        </TouchableOpacity>
      </View>

      <ThemePicker visible={themeOpen} onClose={() => setThemeOpen(false)} />
    </View>
  );
};

export default RiderHeader;
