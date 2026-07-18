import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";

export const createRoleStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: "center",
    },
    logo: {
      resizeMode: "contain",
      height: 60,
      marginTop: 120,
      marginBottom: 40,
    },
    card: {
      width: "90%",
      marginTop: 40,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      marginVertical: 10,
      alignItems: "center",
      overflow: "hidden",
    },
    cardContent: {
      width: "100%",
      padding: 14,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: c.text,
    },
    image: {
      height: 120,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      width: "100%",
    },
    description: {
      fontSize: 14,
      color: c.muted,
      marginTop: 4,
    },
  });

export let roleStyles = createRoleStyles();
export const rebuildRoleStyles = (c: AppColors) => {
  roleStyles = createRoleStyles(c);
};
