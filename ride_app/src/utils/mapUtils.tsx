import axios from "axios";
import * as Location from "expo-location";
import { useUserStore } from "@/store/userStore";
import { FARE_RATES } from "./fareConfig";
import { LocationPoint } from "@/types/ride";

export const getLatLong = async (placeId: string) => {
    try {
        const response = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
            params: {
                place_id: placeId,
                fields: "geometry,formatted_address",
                key: process.env.EXPO_PUBLIC_MAP_API_KEY,
            },
        });
        const data = response.data;
        if (data.status === 'OK' && data.result) {
            const location = data.result.geometry.location;
            const address = data.result.formatted_address;

            return {
                latitude: location.lat,
                longitude: location.lng,
                address: address,
            };
        } else {
            throw new Error('Unable to fetch location details');
        }
    } catch (error) {
        throw new Error('Unable to fetch location details');
    }
}

const formatExpoAddress = (place: {
    name?: string | null;
    streetNumber?: string | null;
    street?: string | null;
    district?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string | null;
}) => {
    return [
        place.name,
        place.streetNumber,
        place.street,
        place.district,
        place.city,
        place.region,
        place.postalCode,
        place.country,
    ]
        .filter(Boolean)
        .join(", ");
};

export const reverseGeocode = async (latitude: number, longitude: number) => {
    // 1) Google Geocoding (best formatted address when API key allows it)
    try {
        const key = process.env.EXPO_PUBLIC_MAP_API_KEY;
        if (key) {
            const response = await axios.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                { params: { latlng: `${latitude},${longitude}`, key } }
            );
            if (response.data.status === "OK" && response.data.results?.[0]) {
                return response.data.results[0].formatted_address as string;
            }
            console.log("Geocoding failed:", response.data.status);
        }
    } catch (error) {
        console.log("Error during Google reverse geocoding:", error);
    }

    // 2) Device / Expo fallback (works without Google billing)
    try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (places?.[0]) {
            const formatted = formatExpoAddress(places[0]);
            if (formatted) return formatted;
        }
    } catch (error) {
        console.log("Error during Expo reverse geocoding:", error);
    }

    return "";
};

/** Fresh GPS reading + reverse-geocoded address for pickup.
 * Never trusts an old last-known fix as the primary source (that caused wrong pickup).
 */
export const getCurrentDeviceLocation = async (): Promise<
  NonNullable<LocationPoint>
> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  // Enable services if needed (no-op when already on)
  await Location.enableNetworkProviderAsync().catch(() => undefined);

  let coords: { latitude: number; longitude: number } | null = null;

  try {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    coords = {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
  } catch (error) {
    console.log("Fresh GPS failed, trying recent last-known:", error);
    // Only accept last-known if it is recent (< 20s) and reasonably accurate
    const last = await Location.getLastKnownPositionAsync({
      maxAge: 20000,
      requiredAccuracy: 100,
    });
    if (last?.coords) {
      coords = {
        latitude: last.coords.latitude,
        longitude: last.coords.longitude,
      };
    } else {
      throw error;
    }
  }

  if (!coords) {
    throw new Error("Unable to get current position");
  }

  const address = await reverseGeocode(coords.latitude, coords.longitude);

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    address:
      address ||
      `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
  };
};

function extractPlaceData(data: any) {
    return data.map((item: any) => ({
        place_id: item.place_id,
        title: item.structured_formatting.main_text,
        description: item.description
    }));
}

export const getPlacesSuggestions = async (query: string) => {
    const { location } = useUserStore.getState();
    try {
        const params: Record<string, string | number> = {
            input: query,
            components: "country:IN",
            key: process.env.EXPO_PUBLIC_MAP_API_KEY as string,
        };

        if (location?.latitude && location?.longitude) {
            params.location = `${location.latitude},${location.longitude}`;
            params.radius = 50000;
        }

        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            { params }
        );

        if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
            console.log("Places autocomplete status:", response.data.status);
            return [];
        }

        return extractPlaceData(response.data.predictions ?? []);
    } catch (error) {
        console.error("Error fetching autocomplete suggestions:", error);
        return [];
    }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/** Haversine distance in meters */
export const distanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => calculateDistance(lat1, lon1, lat2, lon2) * 1000;

/** Must be this close to pickup/drop to Arrived / Start / Complete */
export const GEOFENCE_RADIUS_METERS = 50;

export const calculateFare = (distanceKm: number) => {
    const safeDistance = Math.max(0, distanceKm);

    const fareCalculation = (
        baseFare: number,
        perKmRate: number,
        minimumFare: number
    ) => {
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

function quadraticBezierCurve(p1: any, p2: any, controlPoint: any, numPoints: any) {
    const points = [];
    const step = 1 / (numPoints - 1);

    for (let t = 0; t <= 1; t += step) {
        const x =
            (1 - t) ** 2 * p1[0] +
            2 * (1 - t) * t * controlPoint[0] +
            t ** 2 * p2[0];
        const y =
            (1 - t) ** 2 * p1[1] +
            2 * (1 - t) * t * controlPoint[1] +
            t ** 2 * p2[1];
        const coord = { latitude: x, longitude: y };
        points.push(coord);
    }

    return points;
}

const calculateControlPoint = (p1: any, p2: any) => {
    const d = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
    const scale = 1; // Scale factor to reduce bending
    const h = d * scale; // Reduced distance from midpoint
    const w = d / 2;
    const x_m = (p1[0] + p2[0]) / 2;
    const y_m = (p1[1] + p2[1]) / 2;

    const x_c =
        x_m +
        ((h * (p2[1] - p1[1])) /
            (2 * Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2))) *
        (w / d);
    const y_c =
        y_m -
        ((h * (p2[0] - p1[0])) /
            (2 * Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2))) *
        (w / d);

    const controlPoint = [x_c, y_c];
    return controlPoint;
};

export const getPoints = (places: any) => {
    const p1 = [places[0].latitude, places[0].longitude];
    const p2 = [places[1].latitude, places[1].longitude];
    const controlPoint = calculateControlPoint(p1, p2);

    return quadraticBezierCurve(p1, p2, controlPoint, 100);
};

export const vehicleIcons: Record<'bike' | 'auto' | 'cabEconomy' | 'cabPremium', { icon: any }> = {
    bike: { icon: require('@/assets/icons/bike.png') },
    auto: { icon: require('@/assets/icons/auto.png') },
    cabEconomy: { icon: require('@/assets/icons/cab.png') },
    cabPremium: { icon: require('@/assets/icons/cab_premium.png') },
};
