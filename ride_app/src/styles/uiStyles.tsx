import { AppColors, Colors, screenWidth } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

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
    paddingHorizontal: 15,
    overflow: "hidden",
    paddingVertical: 10,
    justifyContent: "space-between",
    width: "100%",
  },
  btn: {
    backgroundColor: c.surface,
    borderRadius: 100,
    justifyContent: "center",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowColor: c.text,
    elevation: 10,
    alignItems: "center",
    width: 36,
    height: 36,
    padding: 0,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: c.tertiary,
    borderRadius: 100,
    marginHorizontal: 10,
  },
  locationBar: {
    flex: 1,
    minWidth: 0,
    backgroundColor: c.surface,
    borderRadius: 12,
    height: 38,
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
    gap: 4,
    borderRadius: 12,
    marginBottom: 20,
    padding: 10,
    backgroundColor: c.secondary_light,
  },
  cubeContainer: {
    width: "22.8%",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cubeIcon: {
    width: "100%",
    height: 45,
    aspectRatio: 1 / 1,
    resizeMode: "contain",
  },
  cubeIconContainer: {
    width: "100%",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    height: 60,
    marginBottom: 10,
    backgroundColor: c.secondary,
  },
  cubes: {
    flexDirection: "row",
    height: 100,
    marginVertical: 20,
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
    marginVertical: 10,
    height: 100,
  },
  banner: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  bannerContainer: {
    width: "100%",
    height: screenWidth,
    marginBottom: 100,
  },
  locationInputs: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: c.border,
  },
  suggestionText: {
    marginTop: 6,
    color: c.muted,
    textTransform: "capitalize",
  },
  mapPinIcon: {
    width: 20,
    marginRight: 10,
    height: 20,
    resizeMode: "contain",
  },
});

export let uiStyles = createUiStyles();
export const rebuildUiStyles = (c: AppColors) => {
  uiStyles = createUiStyles(c);
};
