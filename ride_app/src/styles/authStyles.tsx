import { AppColors, Colors, screenWidth } from "@/utils/Constants";
import { Platform, StyleSheet } from "react-native";

export const createAuthStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    logo: {
      width: 70,
      height: 70,
      resizeMode: "contain",
    },
    container: {
      padding: 12,
      flex: 1,
      backgroundColor: c.background,
    },
    flexRowGap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    footerContainer: {
      position: "absolute",
      bottom: Platform.OS === "android" ? 20 : 30,
      width: screenWidth,
      padding: 10,
      justifyContent: "center",
      alignItems: "center",
    },
  });

export let authStyles = createAuthStyles();
export const rebuildAuthStyles = (c: AppColors) => {
  authStyles = createAuthStyles(c);
};
