import React, { FC, memo, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useRiderStore } from "@/store/riderStore";
import { customMapStyle, indiaIntialRegion } from "@/utils/CustomMap";
import { MapColors } from "@/utils/Constants";
import { calculateDistance, getPoints } from "@/utils/mapUtils";
import MovingVehicleMarker from "@/components/shared/MovingVehicleMarker";
import { mapStyles } from "@/styles/mapStyles";
import { scaleHorizontal, scaleVertical } from "@/utils/responsive";

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_MAP_API_KEY ?? "";
const MIN_ROUTE_KM = 0.05;

type RiderMapProps = {
  onRouteInfo?: (info: { etaMin: number; distanceKm: number }) => void;
  /** Extra bottom padding when trip sheet is open */
  bottomPadding?: number;
};

const RiderMap: FC<RiderMapProps> = ({
  onRouteInfo,
  bottomPadding = 80,
}) => {
  const mapRef = useRef<MapView>(null);
  const location = useRiderStore((s) => s.location);
  const activeRide = useRiderStore((s) => s.activeRide);
  const [useFallbackLine, setUseFallbackLine] = useState(false);
  const didFit = useRef(false);
  const onRouteInfoRef = useRef(onRouteInfo);
  onRouteInfoRef.current = onRouteInfo;

  const pickup = useMemo(() => {
    if (!activeRide?.pickup) return null;
    return {
      latitude: Number(activeRide.pickup.latitude),
      longitude: Number(activeRide.pickup.longitude),
    };
  }, [activeRide?.pickup?.latitude, activeRide?.pickup?.longitude]);

  const drop = useMemo(() => {
    if (!activeRide?.drop) return null;
    return {
      latitude: Number(activeRide.drop.latitude),
      longitude: Number(activeRide.drop.longitude),
    };
  }, [activeRide?.drop?.latitude, activeRide?.drop?.longitude]);

  // Route to the next stop: pickup before start, drop after start
  const routeOrigin = useMemo(() => {
    if (!activeRide || !location) return null;
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }, [activeRide?._id, location?.latitude, location?.longitude]);

  const routeDest = useMemo(() => {
    if (!activeRide) return null;
    if (activeRide.status === "START") return drop;
    return pickup;
  }, [activeRide?.status, pickup, drop]);

  // Don't rebuild Directions on every GPS tick — only when rider moved ~80m
  const [navOrigin, setNavOrigin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!routeOrigin) {
      setNavOrigin(null);
      return;
    }
    setNavOrigin((prev) => {
      if (!prev) return routeOrigin;
      const movedKm = calculateDistance(
        prev.latitude,
        prev.longitude,
        routeOrigin.latitude,
        routeOrigin.longitude
      );
      return movedKm >= 0.08 ? routeOrigin : prev;
    });
  }, [routeOrigin?.latitude, routeOrigin?.longitude, activeRide?.status]);

  const routeDistanceKm =
    navOrigin && routeDest
      ? calculateDistance(
          navOrigin.latitude,
          navOrigin.longitude,
          routeDest.latitude,
          routeDest.longitude
        )
      : 0;

  const canRequestDirections =
    Boolean(GOOGLE_MAPS_KEY) &&
    Boolean(activeRide) &&
    navOrigin &&
    routeDest &&
    routeDistanceKm >= MIN_ROUTE_KM;

  const fallbackCoords = useMemo(() => {
    if (!navOrigin || !routeDest) return [];
    return getPoints([navOrigin, routeDest]);
  }, [navOrigin, routeDest]);

  const edgePadding = useMemo(
    () => ({
      top: scaleVertical(100),
      right: scaleHorizontal(50),
      bottom: Math.max(scaleVertical(40), Math.round(bottomPadding * 0.15)),
      left: scaleHorizontal(50),
    }),
    [bottomPadding]
  );

  useEffect(() => {
    setUseFallbackLine(false);
    didFit.current = false;
  }, [activeRide?._id, activeRide?.status]);

  useEffect(() => {
    if (!location || activeRide) return;
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400
    );
  }, [location?.latitude, location?.longitude, activeRide]);

  // Fit once per trip phase
  useEffect(() => {
    if (!activeRide || !navOrigin || !routeDest || didFit.current) return;
    didFit.current = true;
    const pts = [navOrigin, routeDest];
    if (pickup && activeRide.status === "START") pts.push(pickup);
    if (drop && activeRide.status !== "START") pts.push(drop);
    mapRef.current?.fitToCoordinates(pts, {
      edgePadding,
      animated: true,
    });
  }, [activeRide?._id, activeRide?.status, navOrigin, routeDest]);

  useEffect(() => {
    if (
      !location ||
      !activeRide ||
      activeRide.status !== "START" ||
      !drop
    ) {
      return;
    }
    const km = calculateDistance(
      location.latitude,
      location.longitude,
      drop.latitude,
      drop.longitude
    );
    onRouteInfoRef.current?.({
      etaMin: Math.max(1, Math.round((km / 22) * 60)),
      distanceKm: km,
    });
  }, [
    location?.latitude,
    location?.longitude,
    activeRide?.status,
    drop?.latitude,
    drop?.longitude,
  ]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider="google"
        initialRegion={indiaIntialRegion}
        customMapStyle={customMapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
        pitchEnabled={false}
      >
        {location && (
          <MovingVehicleMarker
            latitude={location.latitude}
            longitude={location.longitude}
            heading={location.heading}
            vehicle={activeRide?.vehicle ?? "bike"}
            title="You"
          />
        )}

        {activeRide && pickup && (
          <Marker
            coordinate={pickup}
            title="Pickup"
            anchor={{ x: 0.5, y: 1 }}
          >
            <Image
              source={require("@/assets/icons/marker.png")}
              style={mapStyles.marker}
            />
          </Marker>
        )}

        {activeRide && drop && (
          <Marker coordinate={drop} title="Drop" anchor={{ x: 0.5, y: 1 }}>
            <Image
              source={require("@/assets/icons/drop_marker.png")}
              style={mapStyles.marker}
            />
          </Marker>
        )}

        {activeRide &&
        canRequestDirections &&
        !useFallbackLine &&
        navOrigin &&
        routeDest ? (
          <MapViewDirections
            origin={navOrigin}
            destination={routeDest}
            apikey={GOOGLE_MAPS_KEY}
            mode="DRIVING"
            region="IN"
            strokeWidth={5}
            strokeColor={MapColors.path}
            onReady={(result) => {
              if (activeRide.status !== "START") {
                onRouteInfoRef.current?.({
                  etaMin: result.duration,
                  distanceKm: result.distance,
                });
              }
              if (!didFit.current) {
                didFit.current = true;
                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding,
                  animated: true,
                });
              }
            }}
            onError={(message) => {
              console.log("[RiderMap] Directions error:", message);
              setUseFallbackLine(true);
              onRouteInfoRef.current?.({
                etaMin: Math.max(1, Math.round((routeDistanceKm / 22) * 60)),
                distanceKm: routeDistanceKm,
              });
            }}
          />
        ) : null}

        {activeRide &&
        (useFallbackLine || !canRequestDirections) &&
        fallbackCoords.length > 1 ? (
          <Polyline
            coordinates={fallbackCoords}
            strokeWidth={5}
            strokeColor={MapColors.path}
          />
        ) : null}
      </MapView>
    </View>
  );
};

export default memo(RiderMap);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
