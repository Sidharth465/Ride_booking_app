import { screenHeight, screenWidth } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import { scaleVertical } from "@/utils/responsive";

export const splashStyles = StyleSheet.create({
  img: {
    width: screenWidth * 0.4,
    height: screenHeight * 0.4,
    resizeMode: "contain",
  },
  text: {
    position: "absolute",
    bottom: scaleVertical(40),
  },
});
