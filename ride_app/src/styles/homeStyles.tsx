import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import { scaleHorizontal } from "@/utils/responsive";

export const createHomeStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContainer: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: scaleHorizontal(10),
    },
  });

export let homeStyles = createHomeStyles();
export const rebuildHomeStyles = (c: AppColors) => {
  homeStyles = createHomeStyles(c);
};
