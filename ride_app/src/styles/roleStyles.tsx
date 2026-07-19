import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import {
  RFValue,
  scaleModerate,
  scaleVertical,
} from "@/utils/responsive";

export const createRoleStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: "center",
    },
    logo: {
      resizeMode: "contain",
      height: scaleVertical(60),
      marginTop: scaleVertical(120),
      marginBottom: scaleVertical(40),
    },
    card: {
      width: "90%",
      marginTop: scaleVertical(40),
      borderRadius: scaleModerate(18),
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      marginVertical: scaleVertical(10),
      alignItems: "center",
      overflow: "hidden",
    },
    cardContent: {
      width: "100%",
      padding: scaleModerate(14),
    },
    title: {
      fontSize: RFValue(18),
      fontWeight: "bold",
      color: c.text,
    },
    image: {
      height: scaleVertical(120),
      borderTopLeftRadius: scaleModerate(18),
      borderTopRightRadius: scaleModerate(18),
      width: "100%",
    },
    description: {
      fontSize: RFValue(14),
      color: c.muted,
      marginTop: scaleVertical(4),
    },
  });

export let roleStyles = createRoleStyles();
export const rebuildRoleStyles = (c: AppColors) => {
  roleStyles = createRoleStyles(c);
};
