import { Linking, Alert, Platform } from "react-native";

/** Open native dialer for a phone number */
export const callPhone = async (phone?: string | null) => {
  const raw = String(phone || "").trim();
  if (!raw) {
    Alert.alert("No number", "Phone number is not available yet.");
    return;
  }

  // Keep digits / + for dialer
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) {
    Alert.alert("Invalid number", "Could not dial this phone number.");
    return;
  }

  const url = Platform.select({
    ios: `telprompt:${cleaned}`,
    android: `tel:${cleaned}`,
    default: `tel:${cleaned}`,
  }) as string;

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      // Fallback for simulators
      await Linking.openURL(`tel:${cleaned}`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert("Call failed", "Unable to open the phone dialer.");
  }
};
