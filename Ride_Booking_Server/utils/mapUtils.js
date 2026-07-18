import { FARE_RATES } from "./fareConfig.js";

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** Haversine distance in meters */
export const distanceInMeters = (lat1, lon1, lat2, lon2) => {
  return calculateDistance(lat1, lon1, lat2, lon2) * 1000;
};

/** Rider must be this close to pickup/drop for Arrived / Complete */
export const GEOFENCE_RADIUS_METERS = 50;

export const calculateFare = (distanceKm) => {
  const safeDistance = Math.max(0, distanceKm);

  const fareCalculation = (baseFare, perKmRate, minimumFare) => {
    const calculatedFare = baseFare + safeDistance * perKmRate;
    return Math.round(Math.max(calculatedFare, minimumFare));
  };

  return {
    bike: fareCalculation(
      FARE_RATES.bike.baseFare,
      FARE_RATES.bike.perKmRate,
      FARE_RATES.bike.minimumFare
    ),
    auto: fareCalculation(
      FARE_RATES.auto.baseFare,
      FARE_RATES.auto.perKmRate,
      FARE_RATES.auto.minimumFare
    ),
    cabEconomy: fareCalculation(
      FARE_RATES.cabEconomy.baseFare,
      FARE_RATES.cabEconomy.perKmRate,
      FARE_RATES.cabEconomy.minimumFare
    ),
    cabPremium: fareCalculation(
      FARE_RATES.cabPremium.baseFare,
      FARE_RATES.cabPremium.perKmRate,
      FARE_RATES.cabPremium.minimumFare
    ),
  };
};

export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
