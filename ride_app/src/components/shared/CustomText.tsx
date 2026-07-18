import { Text, StyleSheet } from "react-native";
import React, { FC } from "react";
import { useColors } from "@/theme/ThemeProvider";

const fontSizes = {
  h1: 24,
  h2: 22,
  h3: 20,
  h4: 18,
  h5: 16,
  h6: 14,
  h7: 12,
  h8: 10,
};

const CustomText: FC<CustomTextProps> = ({
  variant = "h6",
  style,
  fontFamily = "Regular",
  fontSize,
  children,
  numberOfLines,
}) => {
  const colors = useColors();

  return (
    <Text
      numberOfLines={numberOfLines ?? undefined}
      style={[
        styles.text,
        {
          fontSize: fontSize ?? fontSizes[variant],
          fontFamily,
          color: colors.text,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

export default CustomText;

const styles = StyleSheet.create({
  text: {
    textAlign: "left",
  },
});
