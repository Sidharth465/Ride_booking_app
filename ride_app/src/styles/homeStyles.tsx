import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";

export const createHomeStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContainer: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 10,
    },
  });

export let homeStyles = createHomeStyles();
export const rebuildHomeStyles = (c: AppColors) => {
  homeStyles = createHomeStyles(c);
};
