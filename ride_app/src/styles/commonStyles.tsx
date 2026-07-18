import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";

export const createCommonStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.background,
    },
    containerBlack: {
      flex: 1,
      backgroundColor: c.background,
    },
    flexRowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    flexRowGap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
    },
    flexRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    center: {
      alignItems: "center",
      justifyContent: "center",
    },
    lightText: {
      opacity: 0.7,
      marginTop: 2,
    },
  });

export let commonStyles = createCommonStyles();
export const rebuildCommonStyles = (c: AppColors) => {
  commonStyles = createCommonStyles(c);
};
