import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

export const createModalStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: c.background,
    },
    footerContainer: {
      backgroundColor: c.surface,
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowColor: c.text,
      elevation: 10,
      padding: 15,
    },
    addressText: {
      fontSize: RFValue(12),
      color: c.text,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: 12,
      padding: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonContainer: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      marginVertical: 10,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    buttonText: {
      color: c.onPrimary,
      fontSize: RFValue(13),
      fontWeight: "700",
    },
    centerText: {
      textAlign: "center",
      fontWeight: "600",
      marginTop: 15,
      fontSize: RFValue(13),
      textTransform: "capitalize",
      color: c.text,
    },
    cancelButton: {
      color: c.primary,
      fontSize: RFValue(13),
      position: "absolute",
      top: -18,
      zIndex: 99,
      right: 14,
    },
    searchContainer: {
      backgroundColor: c.secondary,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      margin: 15,
      justifyContent: "space-between",
      borderRadius: 12,
    },
    input: {
      backgroundColor: c.secondary,
      width: "92%",
      height: 42,
      color: c.text,
    },
  });

export let modalStyles = createModalStyles();
export const rebuildModalStyles = (c: AppColors) => {
  modalStyles = createModalStyles(c);
};
