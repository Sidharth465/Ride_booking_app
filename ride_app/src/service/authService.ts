import axios from "axios";
import { Alert } from "react-native";
import { BASE_URL } from "./config";
import {
  AppRole,
  clearSessionStores,
  goHome,
  goRole,
  persistSession,
} from "./session";

/** Immediate logout (no dialog) — splash / token expiry */
export const performLogout = (disconnect?: () => void) => {
  clearSessionStores(disconnect);
  goRole();
};

/** UI logout with confirmation */
export const logout = (disconnect?: () => void) => {
  Alert.alert("Logout", "Are you sure you want to logout?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Logout",
      style: "destructive",
      onPress: () => performLogout(disconnect),
    },
  ]);
};

export const signIn = async (
  payload: { role: AppRole; phone: string },
  updateAccessToken: () => void
) => {
  const phone = payload.phone.replace(/\D/g, "").slice(-10);

  if (phone.length !== 10) {
    Alert.alert("Invalid phone", "Enter a valid 10-digit phone number");
    return;
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/signin`, {
      role: payload.role,
      phone,
    });

    const user = response?.data?.user;
    const role = user?.role as AppRole | undefined;
    const accessToken = response?.data?.access_token;
    const refreshToken = response?.data?.refresh_token;

    if (!user || !role || !accessToken || !refreshToken) {
      Alert.alert("Error", "Invalid login response");
      return;
    }

    if (role !== payload.role) {
      Alert.alert("Error", "Role mismatch. Try again.");
      return;
    }

    persistSession({
      accessToken,
      refreshToken,
      role,
      user,
    });

    updateAccessToken();
    goHome(role);
  } catch (error: any) {
    console.log("Error in signin", error);
    Alert.alert(
      "Error",
      error?.response?.data?.msg ||
        error?.response?.data?.message ||
        "Something went wrong"
    );
  }
};
