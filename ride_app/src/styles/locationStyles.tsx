import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import { scaleHorizontal, scaleVertical } from "@/utils/responsive";

export const createLocationStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    container: {
      paddingVertical: scaleVertical(15),
      paddingRight: scaleHorizontal(15),
      marginLeft: scaleHorizontal(15),
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
  });

export let locationStyles = createLocationStyles();
export const rebuildLocationStyles = (c: AppColors) => {
  locationStyles = createLocationStyles(c);
};
