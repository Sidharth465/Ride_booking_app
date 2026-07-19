import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import { scaleHorizontal, scaleModerate, scaleVertical } from "@/utils/responsive";

export const createMapStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gpsButton: {
      position: "absolute",
      bottom: scaleVertical(16),
      right: scaleHorizontal(16),
      padding: scaleModerate(8),
      borderRadius: scaleModerate(100),
      backgroundColor: c.surface,
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowColor: c.text,
      elevation: 10,
      zIndex: 3,
    },
    loadingMap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.secondary,
    },
    gpsLiveButton: {
      position: "absolute",
      bottom: scaleVertical(10),
      gap: scaleHorizontal(5),
      right: "33%",
      paddingHorizontal: scaleHorizontal(10),
      flexDirection: "row",
      alignItems: "center",
      padding: scaleModerate(5),
      borderRadius: scaleModerate(100),
      backgroundColor: c.primary,
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowColor: c.text,
      elevation: 10,
    },
    outOfRange: {
      position: "absolute",
      top: "20%",
      left: "45%",
      padding: scaleModerate(12),
      backgroundColor: c.surface,
      borderRadius: scaleModerate(100),
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowColor: c.text,
      elevation: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    centerMarkerContainer: {
      left: "50%",
      marginLeft: scaleHorizontal(-15),
      marginTop: scaleVertical(-30),
      position: "absolute",
      top: "50%",
      zIndex: 2,
    },
    marker: {
      resizeMode: "contain",
      height: scaleModerate(30),
      width: scaleModerate(30),
    },
  });

export let mapStyles = createMapStyles();
export const rebuildMapStyles = (c: AppColors) => {
  mapStyles = createMapStyles(c);
};
