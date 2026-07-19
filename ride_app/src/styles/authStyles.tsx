import { AppColors, Colors, screenWidth } from "@/utils/Constants";
import { Platform, StyleSheet } from "react-native";
import { scaleHorizontal, scaleModerate, scaleVertical } from "@/utils/responsive";

export const createAuthStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    logo: {
      width: scaleModerate(70),
      height: scaleModerate(70),
      resizeMode: "contain",
    },
    container: {
      padding: scaleModerate(12),
      flex: 1,
      backgroundColor: c.background,
    },
    flexRowGap: {
      flexDirection: "row",
      alignItems: "center",
      gap: scaleHorizontal(5),
    },
    footerContainer: {
      position: "absolute",
      bottom: Platform.OS === "android" ? scaleVertical(20) : scaleVertical(30),
      width: screenWidth,
      padding: scaleModerate(10),
      justifyContent: "center",
      alignItems: "center",
    },
  });

export let authStyles = createAuthStyles();
export const rebuildAuthStyles = (c: AppColors) => {
  authStyles = createAuthStyles(c);
};
