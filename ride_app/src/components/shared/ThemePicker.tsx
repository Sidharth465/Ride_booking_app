import React, { FC } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "@/components/shared/CustomText";
import { useTheme } from "@/theme/ThemeProvider";
import { THEME_META, THEMES, ThemeId } from "@/utils/Constants";
import { RFValue } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

/** Preferred display order; any new THEMES keys are appended automatically */
const THEME_ORDER: ThemeId[] = [
  "midnight_sky",
  "ink_coral",
  "forest_lime",
  "sand_indigo",
  "slate_amber",
  "graphite_teal",
  "light",
  "dark",
];

const ALL_THEME_IDS: ThemeId[] = [
  ...THEME_ORDER.filter((id) => id in THEMES && id in THEME_META),
  ...(Object.keys(THEMES) as ThemeId[]).filter(
    (id) => !THEME_ORDER.includes(id) && id in THEME_META
  ),
];

type ThemePickerProps = {
  visible: boolean;
  onClose: () => void;
};

const ThemePicker: FC<ThemePickerProps> = ({ visible, onClose }) => {
  const { themeId, colors, setTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handleWrap}>
            <View
              style={[styles.handle, { backgroundColor: colors.border }]}
            />
          </View>
          <CustomText
            fontFamily="Bold"
            style={{ fontSize: RFValue(15), color: colors.text, marginBottom: 4 }}
          >
            App Theme
          </CustomText>
          <CustomText
            fontSize={11}
            style={{ color: colors.muted, marginBottom: 14 }}
          >
            Pick a look — saved on this device
          </CustomText>

          <ScrollView bounces={false}>
            {ALL_THEME_IDS.map((id) => {
              const meta = THEME_META[id];
              const selected = themeId === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.row,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected
                        ? colors.secondary_light
                        : colors.background,
                    },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setTheme(id);
                    onClose();
                  }}
                >
                  <View style={styles.swatches}>
                    {meta.swatches.map((hex) => (
                      <View
                        key={hex}
                        style={[styles.swatch, { backgroundColor: hex }]}
                      />
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText
                      fontFamily="SemiBold"
                      style={{ color: colors.text }}
                    >
                      {meta.label}
                    </CustomText>
                    <CustomText fontSize={10} style={{ color: colors.muted }}>
                      {meta.blurb}
                    </CustomText>
                  </View>
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.primary}
                    />
                  ) : (
                    <Ionicons
                      name="ellipse-outline"
                      size={22}
                      color={colors.border}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ThemePicker;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 8,
    maxHeight: "70%",
  },
  handleWrap: { alignItems: "center", marginBottom: 10 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  swatches: { flexDirection: "row", gap: 4 },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
});
