import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { FC } from "react";
import CustomText from "./CustomText";
import { RFValue, scaleModerate, scaleVertical } from "@/utils/responsive";
import { useColors } from "@/theme/ThemeProvider";

const CustomButton: FC<CustomButtonProps> = ({
  title,
  disabled,
  onPress,
  loading,
}) => {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={disabled || loading ? undefined : onPress}
      disabled={Boolean(disabled || loading)}
      activeOpacity={0.85}
      style={[
        styles.container,
        {
          backgroundColor: disabled ? colors.secondary : colors.primary,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.onPrimary} />
      ) : (
        <CustomText
          fontFamily="Bold"
          style={{
            fontSize: RFValue(12),
            color: disabled ? colors.muted : colors.onPrimary,
          }}
        >
          {title}
        </CustomText>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  container: {
    height: scaleVertical(48),
    width: "90%",
    borderRadius: scaleModerate(12),
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
});
