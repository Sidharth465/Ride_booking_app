import React, { FC, memo, useEffect, useMemo, useRef, useState } from "react";
import { Image, Platform } from "react-native";
import { Marker, AnimatedRegion } from "react-native-maps";
import { VehicleType } from "@/types/ride";

type MovingVehicleMarkerProps = {
  latitude: number;
  longitude: number;
  heading?: number | null;
  vehicle?: VehicleType | string | null;
  title?: string;
  size?: number;
};

const markerIcon = (vehicle?: string | null) => {
  switch (vehicle) {
    case "auto":
      return require("@/assets/icons/auto_marker.png");
    case "cabEconomy":
    case "cabPremium":
      return require("@/assets/icons/cab_marker.png");
    case "bike":
    default:
      return require("@/assets/icons/bike_marker.png");
  }
};

/** Bearing in degrees from point A → B (0 = north, clockwise) */
export const bearingBetween = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const isValidHeading = (h: number | null | undefined) =>
  h != null && Number.isFinite(h) && h >= 0;

/**
 * Smoothly animates a vehicle icon between GPS updates and rotates by heading.
 * Avoids toggling tracksViewChanges on every move (that remounts the icon).
 */
const MovingVehicleMarker: FC<MovingVehicleMarkerProps> = ({
  latitude,
  longitude,
  heading,
  vehicle,
  title = "Rider",
  size = 48,
}) => {
  const coordinate = useRef(
    new AnimatedRegion({
      latitude,
      longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;

  const lastLat = useRef(latitude);
  const lastLng = useRef(longitude);
  const lastRotation = useRef(
    isValidHeading(heading) ? Number(heading) : 0
  );
  const [rotation, setRotation] = useState(lastRotation.current);
  // Android needs one paint pass for custom marker views; keep false after that
  const [tracksViewChanges, setTracksViewChanges] = useState(
    Platform.OS === "android"
  );

  const icon = useMemo(() => markerIcon(vehicle), [vehicle]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), 400);
    return () => clearTimeout(t);
  }, [icon]);

  useEffect(() => {
    const prevLat = lastLat.current;
    const prevLng = lastLng.current;
    const moved =
      Math.abs(prevLat - latitude) > 0.000008 ||
      Math.abs(prevLng - longitude) > 0.000008;

    let nextRotation = lastRotation.current;
    if (isValidHeading(heading)) {
      nextRotation = Number(heading);
    } else if (moved) {
      nextRotation = bearingBetween(prevLat, prevLng, latitude, longitude);
    }

    // Only update rotation state when it actually changes (avoids icon redraw)
    if (Math.abs(nextRotation - lastRotation.current) > 2) {
      lastRotation.current = nextRotation;
      setRotation(nextRotation);
      if (Platform.OS === "android") {
        setTracksViewChanges(true);
        setTimeout(() => setTracksViewChanges(false), 200);
      }
    }

    if (moved) {
      coordinate
        .timing({
          latitude,
          longitude,
          duration: 1000,
          useNativeDriver: false,
        } as any)
        .start();
    } else {
      coordinate.setValue({
        latitude,
        longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      } as any);
    }

    lastLat.current = latitude;
    lastLng.current = longitude;
  }, [latitude, longitude, heading, coordinate]);

  return (
    <Marker.Animated
      coordinate={coordinate as any}
      title={title}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={rotation}
      tracksViewChanges={tracksViewChanges}
    >
      <Image
        source={icon}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Marker.Animated>
  );
};

export default memo(MovingVehicleMarker);
