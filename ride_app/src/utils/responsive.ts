import { Dimensions, PixelRatio } from "react-native";

const WINDOW_WIDTH = Dimensions.get("screen").width;
const WINDOW_HEIGHT = Dimensions.get("screen").height;

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/** Vertical / top / bottom values */
export const scaleVertical = (size: number) =>
  (WINDOW_HEIGHT / guidelineBaseHeight) * size;

/** Left / right / horizontal values */
export const scaleHorizontal = (size: number) =>
  (WINDOW_WIDTH / guidelineBaseWidth) * size;

/** When both axes matter (default factor 0.5) */
export const scaleModerate = (size: number, factor = 0.5): number =>
  size + (scaleHorizontal(size) - size) * factor;

/** Scaled font size based on screen width (guideline 375) */
export const RFValue = (size: number): number => {
  const scaledSize = size * (WINDOW_WIDTH / guidelineBaseWidth);
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

export { WINDOW_HEIGHT, WINDOW_WIDTH };
