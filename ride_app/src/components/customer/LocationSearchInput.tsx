import React, { FC } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/utils/Constants";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "../shared/CustomText";

type LocationSearchInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onClear?: () => void;
  isActive?: boolean;
  dotColor: string;
};

const LocationSearchInput: FC<LocationSearchInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onClear,
  isActive,
  dotColor,
}) => {
  return (
    <View style={[styles.row, isActive && styles.activeRow]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.inputWrap}>
        <CustomText style={styles.label} fontFamily="Medium" fontSize={9}>
          {label}
        </CustomText>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          autoCorrect={false}
        />
      </View>
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} hitSlop={12}>
          <Ionicons name="close-circle" size={RFValue(16)} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default LocationSearchInput;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary_light,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  activeRow: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  inputWrap: {
    flex: 1,
  },
  label: {
    color: Colors.muted,
    marginBottom: 2,
  },
  input: {
    fontSize: RFValue(12),
    color: Colors.text,
    padding: 0,
    fontFamily: "Regular",
  },
});
