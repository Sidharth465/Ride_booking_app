import { AppColors, Colors } from "@/utils/Constants";
import { StyleSheet } from "react-native";

export const createMapStyles = (c: AppColors = Colors) =>
  StyleSheet.create({
  container: {
    flex: 1,
  },
  gpsButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    padding: 8,
    borderRadius: 100,
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
    bottom: 10,
    gap: 5,
    right: "33%",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    borderRadius: 100,
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
    padding: 12,
    backgroundColor: c.surface,
    borderRadius: 100,
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
    marginLeft: -15,
    marginTop: -30,
    position: "absolute",
    top: "50%",
    zIndex: 2,
  },
  marker: {
    resizeMode: "contain",
    height: 30,
    width: 30,
  },
});

export let mapStyles = createMapStyles();
export const rebuildMapStyles = (c: AppColors) => {
  mapStyles = createMapStyles(c);
};
