/**
 * Single source of fare rates for the mobile app.
 * Formula: max(minimumFare, baseFare + distanceKm * perKmRate)
 *
 * Tuned for typical India city rides (Rapido / Ola-like).
 */
export const FARE_RATES = {
  bike: { baseFare: 10, perKmRate: 3.5, minimumFare: 18 },
  auto: { baseFare: 18, perKmRate: 6, minimumFare: 25 },
  cabEconomy: { baseFare: 30, perKmRate: 9, minimumFare: 49 },
  cabPremium: { baseFare: 45, perKmRate: 12, minimumFare: 79 },
} as const;

export type FareVehicle = keyof typeof FARE_RATES;
