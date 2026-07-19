import React, { FC } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "./CustomText";
import { callPhone } from "@/utils/phone";
import { useColors } from "@/theme/ThemeProvider";
import { RFValue, scaleHorizontal, scaleModerate, scaleVertical } from "@/utils/responsive";

type ContactActionsProps = {
  phone?: string | null;
  peerLabel: string;
  onChat: () => void;
  disabled?: boolean;
};

const ContactActions: FC<ContactActionsProps> = ({
  phone,
  peerLabel,
  onChat,
  disabled,
}) => {
  const colors = useColors();

  if (disabled) return null;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.tertiary }]}
        onPress={() => callPhone(phone)}
        activeOpacity={0.85}
      >
        <Ionicons name="call" size={RFValue(18)} color={colors.onPrimary} />
        <CustomText
          fontFamily="Medium"
          style={{ color: colors.onPrimary, fontSize: RFValue(13) }}
        >
          Call {peerLabel}
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={onChat}
        activeOpacity={0.85}
      >
        <Ionicons
          name="chatbubble-ellipses"
          size={RFValue(18)}
          color={colors.onPrimary}
        />
        <CustomText
          fontFamily="Medium"
          style={{ color: colors.onPrimary, fontSize: RFValue(13) }}
        >
          Chat
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

export default ContactActions;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: scaleHorizontal(10),
    marginBottom: scaleVertical(12),
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scaleHorizontal(6),
    paddingVertical: scaleVertical(12),
    borderRadius: scaleModerate(12),
  },
});
