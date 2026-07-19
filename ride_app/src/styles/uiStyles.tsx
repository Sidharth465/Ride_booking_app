import { AppColors, Colors, screenWidth } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import { RFValue, scaleHorizontal, scaleModerate, scaleVertical } from "@/utils/responsive";

export const createUiStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
    absoluteTop: {
      zIndex: 1,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      width: "100%",
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: scaleHorizontal(15),
      overflow: "hidden",
      paddingVertical: scaleVertical(10),
      justifyContent: "space-between",
      width: "100%",
    },
    btn: {
      backgroundColor: c.surface,
      borderRadius: scaleModerate(100),
      justifyContent: "center",
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowColor: c.text,
      elevation: 10,
      alignItems: "center",
      width: scaleModerate(36),
      height: scaleModerate(36),
      padding: 0,
    },
    dot: {
      width: scaleModerate(6),
      height: scaleModerate(6),
      backgroundColor: c.tertiary,
      borderRadius: scaleModerate(100),
      marginHorizontal: scaleHorizontal(10),
    },
    locationBar: {
      flex: 1,
      minWidth: 0,
      backgroundColor: c.surface,
      borderRadius: scaleModerate(12),
      height: scaleVertical(38),
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowColor: c.text,
      elevation: 10,
      gap: 1,
      alignItems: "center",
      flexDirection: "row",
    },
    locationText: {
      flex: 1,
      minWidth: 0,
      fontSize: RFValue(10),
      fontFamily: "Regular",
      color: c.text,
      opacity: 0.8,
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: scaleHorizontal(4),
      borderRadius: scaleModerate(12),
      marginBottom: scaleVertical(20),
      padding: scaleModerate(10),
      backgroundColor: c.secondary_light,
    },
    cubeContainer: {
      width: "22.8%",
      marginRight: scaleHorizontal(10),
      justifyContent: "center",
      alignItems: "center",
    },
    cubeIcon: {
      width: "100%",
      height: scaleVertical(45),
      aspectRatio: 1 / 1,
      resizeMode: "contain",
    },
    cubeIconContainer: {
      width: "100%",
      padding: scaleModerate(10),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: scaleModerate(12),
      height: scaleVertical(60),
      marginBottom: scaleVertical(10),
      backgroundColor: c.secondary,
    },
    cubes: {
      flexDirection: "row",
      height: scaleVertical(100),
      marginVertical: scaleVertical(20),
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    adImage: {
      height: "100%",
      width: "100%",
      resizeMode: "cover",
    },
    adSection: {
      width: "100%",
      backgroundColor: c.secondary,
      marginVertical: scaleVertical(10),
      height: scaleVertical(100),
    },
    banner: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
    bannerContainer: {
      width: "100%",
      height: screenWidth,
      marginBottom: scaleVertical(100),
    },
    locationInputs: {
      padding: scaleModerate(15),
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    suggestionText: {
      marginTop: scaleVertical(6),
      color: c.muted,
      textTransform: "capitalize",
    },
    mapPinIcon: {
      width: scaleModerate(20),
      marginRight: scaleHorizontal(10),
      height: scaleModerate(20),
      resizeMode: "contain",
    },
  });

export let uiStyles = createUiStyles();
export const rebuildUiStyles = (c: AppColors) => {
  uiStyles = createUiStyles(c);
};
