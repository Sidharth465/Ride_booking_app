import { Text, StyleSheet } from "react-native";
import React, { FC } from "react";
import { useColors } from "@/theme/ThemeProvider";
import FontSize from "@/utils/fonts";

const fontSizes = {
  h1: FontSize.font24,
  h2: FontSize.font22,
  h3: FontSize.font20,
  h4: FontSize.font18,
  h5: FontSize.font16,
  h6: FontSize.font14,
  h7: FontSize.font12,
  h8: FontSize.font10,
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
          color: colors?.text,
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
