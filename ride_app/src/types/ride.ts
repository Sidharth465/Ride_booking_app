export type VehicleType = "bike" | "auto" | "cabEconomy" | "cabPremium";

export type LocationPoint = {
  latitude: number;
  longitude: number;
  address: string;
} | null;

export type PlaceSuggestion = {
  place_id: string;
  title: string;
  description: string;
};

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  bike: "Bike",
  auto: "Auto",
  cabEconomy: "Cab Economy",
  cabPremium: "Cab Premium",
};
