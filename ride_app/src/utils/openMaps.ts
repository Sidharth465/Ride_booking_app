import { Linking, Platform, Alert } from "react-native";

type LatLng = { latitude: number; longitude: number };

/**
 * Opens Google Maps directions for a pickup → drop (or any origin → destination) route.
 * Falls back to the web Maps URL if the native app scheme fails.
 */
export async function openGoogleMapsDirections(
  origin: LatLng,
  destination: LatLng
) {
  const o = `${origin.latitude},${origin.longitude}`;
  const d = `${destination.latitude},${destination.longitude}`;

  const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`;

  const appUrl =
    Platform.OS === "ios"
      ? `comgooglemaps://?saddr=${o}&daddr=${d}&directionsmode=driving`
      : `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`;

  try {
    if (Platform.OS === "ios") {
      const canApp = await Linking.canOpenURL("comgooglemaps://");
      if (canApp) {
        await Linking.openURL(appUrl);
        return;
      }
    }
    await Linking.openURL(webUrl);
  } catch {
    try {
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert("Could not open Maps", "Install Google Maps or try again.");
    }
  }
}

/** Navigate to a single destination (device GPS as start when origin omitted). */
export async function openGoogleMapsTo(
  destination: LatLng,
  origin?: LatLng | null
) {
  if (origin) {
    return openGoogleMapsDirections(origin, destination);
  }
  const d = `${destination.latitude},${destination.longitude}`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=driving`;
  try {
    await Linking.openURL(webUrl);
  } catch {
    Alert.alert("Could not open Maps", "Install Google Maps or try again.");
  }
}
