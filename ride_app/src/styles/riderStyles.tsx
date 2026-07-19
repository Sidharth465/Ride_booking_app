import { AppColors, Colors, MapColors } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import { scaleHorizontal, scaleModerate, scaleVertical } from "@/utils/responsive";

export const createRiderStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    headerContainer: {
      backgroundColor: c.secondary,
      padding: scaleModerate(10),
    },
    emptyImage: {
      width: scaleModerate(120),
      height: scaleModerate(120),
      resizeMode: "contain",
      transform: [{ scaleX: -1 }],
      marginVertical: scaleVertical(15),
    },
    toggleContainer: {
      paddingVertical: 0,
      paddingHorizontal: scaleHorizontal(15),
      borderWidth: 1,
      borderRadius: scaleModerate(100),
      flexDirection: "row",
      borderColor: c.border,
      alignItems: "center",
      gap: scaleHorizontal(5),
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.background,
    },
    icon: {
      width: scaleModerate(40),
      height: scaleModerate(40),
      resizeMode: "contain",
    },
    earningContainer: {
      padding: scaleModerate(10),
      paddingVertical: scaleVertical(15),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.muted,
    },
  });

export const createOrderStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    flexRowBase: {
      gap: scaleHorizontal(10),
      flexDirection: "row",
      alignItems: "baseline",
      marginVertical: scaleVertical(5),
    },
    continuousLine: {
      width: scaleHorizontal(2),
      height: "100%",
      position: "absolute",
      top: scaleVertical(12),
      backgroundColor: c.secondary,
      alignSelf: "center",
      marginLeft: scaleHorizontal(2),
    },
    borderLine: {
      borderLeftWidth: 1,
      paddingLeft: scaleHorizontal(12),
      borderLeftColor: c.secondary,
    },
    label: {
      opacity: 0.4,
      marginVertical: scaleVertical(2),
    },
    infoText: {
      width: "96%",
    },
    dropHollowCircle: {
      borderWidth: 2,
      top: 1,
      borderColor: MapColors.drop,
      padding: scaleModerate(3),
      borderRadius: scaleModerate(100),
    },
    pickupHollowCircle: {
      borderWidth: 2,
      top: 1,
      borderColor: MapColors.pickup,
      padding: scaleModerate(3),
      borderRadius: scaleModerate(100),
    },
    container: {
      padding: scaleModerate(10),
      borderRadius: scaleModerate(12),
      backgroundColor: c.surface,
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      shadowColor: c.text,
      elevation: 8,
      margin: scaleModerate(10),
    },
    flexRowEnd: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: scaleVertical(10),
      gap: scaleHorizontal(10),
    },
    rideIcon: {
      width: scaleModerate(30),
      height: scaleModerate(30),
      resizeMode: "contain",
    },
    locationsContainer: {
      paddingVertical: scaleVertical(10),
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: scaleVertical(10),
    },
  });

export let riderStyles = createRiderStyles();
export let orderStyles = createOrderStyles();

export const rebuildRiderStyles = (c: AppColors) => {
  riderStyles = createRiderStyles(c);
  orderStyles = createOrderStyles(c);
};
