import { StyleSheet, TextInput, View } from "react-native";
import React from "react";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "./CustomText";
import { useThemedStyles } from "@/theme/useThemedStyles";
import { useColors } from "@/theme/ThemeProvider";
import { AppColors } from "@/utils/Constants";

const PhoneInput = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
}: {
  value: string | undefined;
  onChangeText: ((text: string) => void) | undefined;
  onFocus?: (() => void) | undefined;
  onBlur?: (() => void) | undefined;
}) => {
  const colors = useColors();
  const styles = useThemedStyles((c: AppColors) => ({
    container: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
      marginVertical: 15,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: c.surface,
    },
    input: {
      fontSize: RFValue(13),
      fontFamily: "Medium",
      height: 48,
      width: "90%" as const,
      color: c.text,
    },
    text: {
      fontSize: RFValue(13),
      top: -1,
      fontFamily: "Medium",
      color: c.text,
    },
  }));

  return (
    <View style={styles.container}>
      <CustomText fontFamily="Medium" style={styles.text}>
        🇮🇳 +91
      </CustomText>
      <TextInput
        placeholder="0000000000"
        keyboardType="phone-pad"
        value={value}
        maxLength={10}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  );
};

export default PhoneInput;
