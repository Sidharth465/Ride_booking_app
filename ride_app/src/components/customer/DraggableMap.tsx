import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { useUserStore } from "@/store/userStore";
import { useWS } from "@/service/WSProvider";
import { customMapStyle } from "@/utils/CustomMap";
import { getCurrentDeviceLocation, reverseGeocode } from "@/utils/mapUtils";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import haversine from "haversine-distance";
import { mapStyles } from "@/styles/mapStyles";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { RFValue } from "@/utils/responsive";
import { Colors } from "@/utils/Constants";

const MAX_DISTANCE_THRESHOLD = 10000;
const GEOCODE_DEBOUNCE_MS = 800;
const REGION_DELTA = 0.05; // wider so nearby riders are on-screen
const ZONE_REFRESH_MS = 5000;

type NearbyRider = {
  riderId: string;
  coords: { latitude: number; longitude: number; heading?: number };
  distance?: number;
};

/** Android custom markers need one paint pass or they stay invisible */
const RiderIconMarker: FC<{
  riderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
}> = memo(({ riderId, latitude, longitude, heading }) => {
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 600);
    return () => clearTimeout(t);
  }, [latitude, longitude]);

  return (
    <Marker
      identifier={riderId}
      coordinate={{ latitude, longitude }}
      title="Rider available"
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={Number.isFinite(heading) ? Number(heading) : 0}
      tracksViewChanges={tracks}
    >
      <Image
        source={require("@/assets/icons/bike_marker.png")}
        style={{ width: 44, height: 44 }}
        resizeMode="contain"
      />
    </Marker>
  );
});

const DraggableMap: FC<{ height?: number }> = ({ height }) => {
  const mapRef = useRef<MapView>(null);
  const initialCoords = useRef<{ latitude: number; longitude: number } | null>(
    null
  );
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allowRegionUpdates = useRef(false);
  const applySeq = useRef(0);
  const didFitRiders = useRef(false);

  const [loadingGps, setLoadingGps] = useState(true);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [nearbyRiders, setNearbyRiders] = useState<NearbyRider[]>([]);

  const { emit, on, off } = useWS();
  const location = useUserStore((s) => s.location);
  const setLocation = useUserStore((s) => s.setLocation);
  const outOfRange = useUserStore((s) => s.outOfRange);
  const setOutOfRange = useUserStore((s) => s.setOutOfRange);

  // Always emit — WSProvider queues until the socket connects
  const subscribeZone = useCallback(
    (lat: number, lng: number) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      console.log("[CustomerMap] subscribeToZone", lat.toFixed(5), lng.toFixed(5));
      emit("subscribeToZone", { latitude: lat, longitude: lng });
    },
    [emit]
  );

  useEffect(() => {
    const onNearby = (list: NearbyRider[]) => {
      const next = Array.isArray(list)
        ? list.filter(
            (r) =>
              r?.riderId &&
              Number.isFinite(Number(r?.coords?.latitude)) &&
              Number.isFinite(Number(r?.coords?.longitude))
          )
        : [];
      console.log("[CustomerMap] nearbyriders", next.length);
      setNearbyRiders(next);

      // First time riders appear, frame them with the customer pin
      if (next.length > 0 && !didFitRiders.current && mapRef.current) {
        const customer = useUserStore.getState().location;
        const points = next.map((r) => ({
          latitude: Number(r.coords.latitude),
          longitude: Number(r.coords.longitude),
        }));
        if (customer?.latitude != null) {
          points.push({
            latitude: customer.latitude,
            longitude: customer.longitude,
          });
        }
        didFitRiders.current = true;
        mapRef.current.fitToCoordinates(points, {
          edgePadding: { top: 80, right: 60, bottom: 160, left: 60 },
          animated: true,
        });
      }
    };

    on("nearbyriders", onNearby);

    const pushZone = () => {
      const loc = useUserStore.getState().location;
      if (loc?.latitude != null && loc?.longitude != null) {
        subscribeZone(loc.latitude, loc.longitude);
      }
    };

    pushZone();
    const poll = setInterval(pushZone, ZONE_REFRESH_MS);

    return () => {
      clearInterval(poll);
      off("nearbyriders", onNearby);
    };
  }, [on, off, subscribeZone]);

  useEffect(() => {
    if (location?.latitude == null || location?.longitude == null) return;
    subscribeZone(location.latitude, location.longitude);
  }, [location?.latitude, location?.longitude, subscribeZone]);

  const applyCoords = useCallback(
    async (latitude: number, longitude: number) => {
      const seq = ++applySeq.current;
      const address = await reverseGeocode(latitude, longitude);
      if (seq !== applySeq.current) return;

      setLocation({
        latitude,
        longitude,
        address:
          address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      });

      if (initialCoords.current) {
        const distance = haversine(initialCoords.current, {
          latitude,
          longitude,
        });
        setOutOfRange(distance > MAX_DISTANCE_THRESHOLD);
      }
    },
    [setLocation, setOutOfRange]
  );

  const centerOnGps = useCallback(async () => {
    try {
      setLoadingGps(true);
      allowRegionUpdates.current = false;
      didFitRiders.current = false;

      const deviceLocation = await getCurrentDeviceLocation();
      const { latitude, longitude } = deviceLocation;

      initialCoords.current = { latitude, longitude };

      const nextRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: REGION_DELTA,
        longitudeDelta: REGION_DELTA,
      };

      setMapRegion(nextRegion);
      setLocation(deviceLocation);
      subscribeZone(latitude, longitude);

      requestAnimationFrame(() => {
        mapRef.current?.animateToRegion(nextRegion, 400);
      });

      setTimeout(() => {
        allowRegionUpdates.current = true;
      }, 1000);
    } catch (error) {
      console.log("Error getting GPS coordinates", error);
    } finally {
      setLoadingGps(false);
    }
  }, [setLocation, subscribeZone]);

  useEffect(() => {
    centerOnGps();
    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    };
  }, [centerOnGps]);

  const handleRegionChangeComplete = (newRegion: Region) => {
    if (!allowRegionUpdates.current) return;

    const current = useUserStore.getState().location;
    if (current) {
      const moved = haversine(
        { latitude: current.latitude, longitude: current.longitude },
        { latitude: newRegion.latitude, longitude: newRegion.longitude }
      );
      if (moved < 25) return;
    }

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => {
      applyCoords(newRegion.latitude, newRegion.longitude);
    }, GEOCODE_DEBOUNCE_MS);
  };

  return (
    <View
      style={height ? { height, width: "100%" } : { flex: 1, width: "100%" }}
    >
      {mapRegion ? (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={
            Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
          }
          initialRegion={mapRegion}
          onRegionChangeComplete={handleRegionChangeComplete}
          maxZoomLevel={18}
          minZoomLevel={8}
          pitchEnabled={false}
          rotateEnabled={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsIndoors={false}
          showsTraffic={false}
          showsBuildings={false}
          showsPointsOfInterest={false}
          customMapStyle={
            Platform.OS === "android" ? customMapStyle : undefined
          }
          showsUserLocation
        >
          {nearbyRiders.map((rider) => (
            <RiderIconMarker
              key={String(rider.riderId)}
              riderId={String(rider.riderId)}
              latitude={Number(rider.coords.latitude)}
              longitude={Number(rider.coords.longitude)}
              heading={rider.coords.heading}
            />
          ))}
        </MapView>
      ) : (
        <View style={mapStyles.loadingMap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {mapRegion && (
        <View style={mapStyles.centerMarkerContainer} pointerEvents="none">
          <Image
            source={require("@/assets/icons/marker.png")}
            style={mapStyles.marker}
          />
        </View>
      )}

      <TouchableOpacity
        style={mapStyles.gpsButton}
        onPress={centerOnGps}
        activeOpacity={0.8}
      >
        {loadingGps ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={RFValue(16)}
            color={Colors.primary}
          />
        )}
      </TouchableOpacity>

      {outOfRange && (
        <View style={mapStyles.outOfRange}>
          <FontAwesome5 name="exclamation-circle" size={24} color="red" />
        </View>
      )}
    </View>
  );
};

export default memo(DraggableMap);
