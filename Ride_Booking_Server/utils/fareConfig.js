/**
 * Single source of fare rates for the server.
 * Must stay in sync with ride_app/src/utils/fareConfig.ts
 * Formula: max(minimumFare, baseFare + distanceKm * perKmRate)
 */
export const FARE_RATES = {
  bike: { baseFare: 10, perKmRate: 3.5, minimumFare: 18 },
  auto: { baseFare: 18, perKmRate: 6, minimumFare: 25 },
  cabEconomy: { baseFare: 30, perKmRate: 9, minimumFare: 49 },
  cabPremium: { baseFare: 45, perKmRate: 12, minimumFare: 79 },
};
