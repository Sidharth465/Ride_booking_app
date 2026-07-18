import { Platform } from "react-native";

/**
 * API host for the Ride Booking Server.
 * - Set EXPO_PUBLIC_API_HOST in .env (your machine's LAN IP when testing on a real device)
 * - Android emulator: use 10.0.2.2 to reach the host machine
 * - iOS simulator: localhost works
 */
const envHost = process.env.EXPO_PUBLIC_API_HOST;

const resolveHost = () => {
  if (envHost) return envHost;
  if (Platform.OS === "android") return "10.0.2.2";
  return "localhost";
};

const HOST = resolveHost();
const PORT = process.env.EXPO_PUBLIC_API_PORT ?? "3000";

export const BASE_URL = `http://${HOST}:${PORT}`;
export const SOCKET_URL = `http://${HOST}:${PORT}`;
