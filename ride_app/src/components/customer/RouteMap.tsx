import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { LocationPoint } from "@/types/ride";
import { customMapStyle, indiaIntialRegion } from "@/utils/CustomMap";
import { MapColors } from "@/utils/Constants";
import { mapStyles } from "@/styles/mapStyles";
import { calculateDistance, getPoints } from "@/utils/mapUtils";

type RouteMapProps = {
  pickup: NonNullable<LocationPoint>;
  drop: NonNullable<LocationPoint>;
};

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_MAP_API_KEY ?? "";
/** Skip Directions when points are essentially the same (~50m). */
const MIN_ROUTE_KM = 0.05;

const RouteMap: FC<RouteMapProps> = ({ pickup, drop }) => {
  const mapRef = useRef<MapView>(null);
  const [useFallbackLine, setUseFallbackLine] = useState(false);

  const origin = useMemo(
    () => ({ latitude: Number(pickup.latitude), longitude: Number(pickup.longitude) }),
    [pickup.latitude, pickup.longitude]
  );
  const destination = useMemo(
    () => ({ latitude: Number(drop.latitude), longitude: Number(drop.longitude) }),
    [drop.latitude, drop.longitude]
  );

  const coordsValid =
    Number.isFinite(origin.latitude) &&
    Number.isFinite(origin.longitude) &&
    Number.isFinite(destination.latitude) &&
    Number.isFinite(destination.longitude);

  const distanceKm = coordsValid
    ? calculateDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      )
    : 0;

  const canRequestDirections =
    Boolean(GOOGLE_MAPS_KEY) && coordsValid && distanceKm >= MIN_ROUTE_KM;

  const fallbackCoords = useMemo(() => {
    if (!coordsValid) return [];
    return getPoints([origin, destination]);
  }, [coordsValid, origin, destination]);

  useEffect(() => {
    setUseFallbackLine(false);
    if (!coordsValid) return;
    mapRef.current?.fitToCoordinates([origin, destination], {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  }, [coordsValid, origin, destination]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider="google"
        initialRegion={indiaIntialRegion}
        customMapStyle={customMapStyle}
        pitchEnabled={false}
      >
        <Marker coordinate={origin} title="Pickup">
          <Image
            source={require("@/assets/icons/marker.png")}
            style={mapStyles.marker}
          />
        </Marker>

        <Marker coordinate={destination} title="Drop">
          <Image
            source={require("@/assets/icons/drop_marker.png")}
            style={mapStyles.marker}
          />
        </Marker>

        {canRequestDirections && !useFallbackLine ? (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_KEY}
            mode="DRIVING"
            region="IN"
            strokeWidth={4}
            strokeColor={MapColors.path}
            onReady={(result) => {
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }}
            onError={(message) => {
              console.log("MapViewDirections error:", message, {
                origin,
                destination,
                distanceKm,
              });
              // ZERO_RESULTS / network → still show a line between pins
              setUseFallbackLine(true);
            }}
          />
        ) : null}

        {(useFallbackLine || (!canRequestDirections && coordsValid)) &&
        fallbackCoords.length > 1 ? (
          <Polyline
            coordinates={fallbackCoords}
            strokeWidth={4}
            strokeColor={MapColors.path}
          />
        ) : null}
      </MapView>
    </View>
  );
};

export default RouteMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
});
