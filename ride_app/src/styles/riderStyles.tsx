import { AppColors, Colors, MapColors } from "@/utils/Constants";
import { StyleSheet } from "react-native";

export const createRiderStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    headerContainer: {
      backgroundColor: c.secondary,
      padding: 10,
    },
    emptyImage: {
      width: 120,
      height: 120,
      resizeMode: "contain",
      transform: [{ scaleX: -1 }],
      marginVertical: 15,
    },
    toggleContainer: {
      paddingVertical: 0,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderRadius: 100,
      flexDirection: "row",
      borderColor: c.border,
      alignItems: "center",
      gap: 5,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.background,
    },
    icon: {
      width: 40,
      height: 40,
      resizeMode: "contain",
    },
    earningContainer: {
      padding: 10,
      paddingVertical: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.muted,
    },
  });

export const createOrderStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    flexRowBase: {
      gap: 10,
      flexDirection: "row",
      alignItems: "baseline",
      marginVertical: 5,
    },
    continuousLine: {
      width: 2,
      height: "100%",
      position: "absolute",
      top: 12,
      backgroundColor: c.secondary,
      alignSelf: "center",
      marginLeft: 2,
    },
    borderLine: {
      borderLeftWidth: 1,
      paddingLeft: 12,
      borderLeftColor: c.secondary,
    },
    label: {
      opacity: 0.4,
      marginVertical: 2,
    },
    infoText: {
      width: "96%",
    },
    dropHollowCircle: {
      borderWidth: 2,
      top: 1,
      borderColor: MapColors.drop,
      padding: 3,
      borderRadius: 100,
    },
    pickupHollowCircle: {
      borderWidth: 2,
      top: 1,
      borderColor: MapColors.pickup,
      padding: 3,
      borderRadius: 100,
    },
    container: {
      padding: 10,
      borderRadius: 12,
      backgroundColor: c.surface,
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      shadowColor: c.text,
      elevation: 8,
      margin: 10,
    },
    flexRowEnd: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 10,
      gap: 10,
    },
    rideIcon: {
      width: 30,
      height: 30,
      resizeMode: "contain",
    },
    locationsContainer: {
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: 10,
    },
  });

export let riderStyles = createRiderStyles();
export let orderStyles = createOrderStyles();

export const rebuildRiderStyles = (c: AppColors) => {
  riderStyles = createRiderStyles(c);
  orderStyles = createOrderStyles(c);
};
