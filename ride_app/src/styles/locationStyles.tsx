import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";

export const createLocationStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
  container: {
    paddingVertical: 15,
    paddingRight: 15,
    marginLeft: 15,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
});

export let locationStyles = createLocationStyles();
export const rebuildLocationStyles = (c: AppColors) => {
  locationStyles = createLocationStyles(c);
};
