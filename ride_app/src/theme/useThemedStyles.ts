import { useMemo } from "react";
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";
import { AppColors } from "@/utils/Constants";
import { useTheme } from "@/theme/ThemeProvider";

type NamedStyles = {
  [key: string]: ViewStyle | TextStyle | ImageStyle;
};

/** Recreate StyleSheet when the active theme changes */
export function useThemedStyles<T extends NamedStyles>(
  factory: (c: AppColors) => T
): T {
  const { colors, themeId } = useTheme();
  return useMemo(
    () => StyleSheet.create(factory(colors)) as T,
    // themeId is the intentional dependency; colors is synced with it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeId]
  );
}
