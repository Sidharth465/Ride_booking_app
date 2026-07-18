import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import * as Location from "expo-location";
import RiderHeader from "@/components/rider/RiderHeader";
import RiderMap from "@/components/rider/RiderMap";
import RideOfferModal, { RideOffer } from "@/components/rider/RideOfferModal";
import ActiveRidePanel, {
  RIDER_SHEET_EXPANDED_RATIO,
} from "@/components/rider/ActiveRidePanel";
import CustomText from "@/components/shared/CustomText";
import { useRiderStore } from "@/store/riderStore";
import { useWS } from "@/service/WSProvider";
import { reverseGeocode, distanceInMeters } from "@/utils/mapUtils";
import { acceptRide, updateRideStatus, verifyOtpAndStart, cancelRide } from "@/service/rideService";
import { riderStyles } from "@/styles/riderStyles";
import { Colors } from "@/utils/Constants";

const LOCATION_INTERVAL_MS = 4000;
const TRIP_LOCATION_INTERVAL_MS = 1000;

const RiderHome = () => {
  const { emit, on, off, isConnected } = useWS();
  const { height: windowHeight } = useWindowDimensions();
  const location = useRiderStore((s) => s.location);
  const onDuty = useRiderStore((s) => s.onDuty);
  const activeRide = useRiderStore((s) => s.activeRide);
  const setLocation = useRiderStore((s) => s.setLocation);
  const setOnDuty = useRiderStore((s) => s.setOnDuty);
  const setActiveRide = useRiderStore((s) => s.setActiveRide);

  const [offer, setOffer] = useState<RideOffer | null>(null);
  const [toggling, setToggling] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [gpsReady, setGpsReady] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [dropEtaMin, setDropEtaMin] = useState<number | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [sheetHeight, setSheetHeight] = useState(
    Math.round(windowHeight * RIDER_SHEET_EXPANDED_RATIO)
  );

  const sheetPosition = useSharedValue(
    windowHeight * (1 - RIDER_SHEET_EXPANDED_RATIO)
  );

  const mapWrapStyle = useAnimatedStyle(() => ({
    height: Math.max(sheetPosition.value, 140),
    width: "100%" as const,
    overflow: "hidden" as const,
  }));

  const onSnapHeightChange = useCallback((h: number) => {
    setSheetHeight(h);
  }, []);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastEmitAt = useRef(0);
  const emitRef = useRef(emit);
  emitRef.current = emit;

  const publishOnDuty = useCallback(() => {
    const currentLocation = useRiderStore.getState().location;
    if (!currentLocation) return;
    emit("goOnDuty", {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      heading: currentLocation.heading,
    });
    console.log("[Rider] goOnDuty emitted", currentLocation);
  }, [emit]);

  const distanceToDropMeters = (() => {
    if (!location || !activeRide || activeRide.status !== "START") return null;
    const drop = activeRide.drop;
    if (drop?.latitude == null || drop?.longitude == null) return null;
    return distanceInMeters(
      location.latitude,
      location.longitude,
      drop.latitude,
      drop.longitude
    );
  })();

  const requireCoords = () => {
    const coords = useRiderStore.getState().location;
    if (!coords) {
      Alert.alert("GPS needed", "Wait for your location before continuing.");
      return null;
    }
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  };

  const applyPosition = useCallback(
    async (coords: {
      latitude: number;
      longitude: number;
      heading: number | null;
    }) => {
      const prev = useRiderStore.getState().location;
      let address = prev?.address ?? "";
      if (!address) {
        address =
          (await reverseGeocode(coords.latitude, coords.longitude)) ||
          "Current location";
      }

      const next = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        heading: coords.heading ?? 0,
        address,
      };
      setLocation(next);

      const { onDuty: isOnDuty, activeRide: trip } = useRiderStore.getState();
      const now = Date.now();
      const interval = trip ? TRIP_LOCATION_INTERVAL_MS : LOCATION_INTERVAL_MS;
      if ((isOnDuty || trip) && now - lastEmitAt.current >= interval) {
        lastEmitAt.current = now;
        emitRef.current("updateLocation", {
          latitude: next.latitude,
          longitude: next.longitude,
          heading: next.heading,
        });
      }
    },
    [setLocation]
  );

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location required",
          "Enable location permission to go on duty."
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (!mounted) return;

      await applyPosition({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        heading: current.coords.heading,
      });
      setGpsReady(true);

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: TRIP_LOCATION_INTERVAL_MS,
        },
        (pos) => {
          applyPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading,
          });
        }
      );
    };

    start();

    return () => {
      mounted = false;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [applyPosition]);

  useEffect(() => {
    const handleOffer = (ride: RideOffer) => {
      console.log("[Rider] rideOffer received", ride?._id);
      if (useRiderStore.getState().activeRide) return;
      setOffer(ride);
    };

    const handleCanceled = (payload?: { message?: string; rideId?: string }) => {
      const current = useRiderStore.getState().activeRide;
      if (
        payload?.rideId &&
        current?._id &&
        String(payload.rideId) !== String(current._id)
      ) {
        return;
      }
      setOffer(null);
      setActiveRide(null);
      Alert.alert(
        "Ride canceled",
        payload?.message || "The customer canceled this ride."
      );
    };

    on("rideOffer", handleOffer);
    on("rideCanceled", handleCanceled);

    return () => {
      off("rideOffer", handleOffer);
      off("rideCanceled", handleCanceled);
    };
  }, [on, off, setActiveRide]);

  // Rejoin ride room after reload / reconnect when a trip is active
  useEffect(() => {
    if (activeRide?._id && isConnected()) {
      emit("subscribeRide", activeRide._id);
    }
  }, [activeRide?._id, emit, isConnected]);

  // Active trip after app restart → force ON + re-announce to server
  useEffect(() => {
    if (
      !activeRide ||
      !["ACCEPTED", "ARRIVED", "START"].includes(activeRide.status)
    ) {
      return;
    }
    if (!onDuty) setOnDuty(true);
    if (gpsReady && isConnected()) {
      publishOnDuty();
    }
  }, [
    activeRide?._id,
    activeRide?.status,
    onDuty,
    gpsReady,
    isConnected,
    publishOnDuty,
    setOnDuty,
  ]);

  // Keep server onDuty map warm: reconnect + heartbeat (server map is in-memory)
  useEffect(() => {
    const onDutyAck = (payload: { onDuty?: boolean }) => {
      console.log("[Rider] dutyStatus ack", payload);
      setSocketReady(Boolean(payload?.onDuty));
    };
    on("dutyStatus", onDutyAck);

    let wasConnected = isConnected();
    setSocketReady(wasConnected);
    if (wasConnected && onDuty) publishOnDuty();

    const poll = setInterval(() => {
      const connected = isConnected();
      if (connected && !wasConnected && useRiderStore.getState().onDuty) {
        console.log("[Rider] socket reconnected — re-emitting goOnDuty");
        publishOnDuty();
      }
      if (!useRiderStore.getState().onDuty) {
        setSocketReady(connected);
      }
      wasConnected = connected;
    }, 1000);

    // Heartbeat every 5s while ON — survives missed goOnDuty / disconnect races
    const heartbeat = setInterval(() => {
      if (useRiderStore.getState().onDuty && isConnected()) {
        publishOnDuty();
      }
    }, 5000);

    return () => {
      clearInterval(poll);
      clearInterval(heartbeat);
      off("dutyStatus", onDutyAck);
    };
  }, [isConnected, onDuty, publishOnDuty, on, off]);

  const toggleDuty = async () => {
    const currentLocation = useRiderStore.getState().location;
    if (!currentLocation) {
      Alert.alert("Wait", "Getting your GPS location…");
      return;
    }

    setToggling(true);
    try {
      if (!useRiderStore.getState().onDuty) {
        if (!isConnected()) {
          Alert.alert(
            "Connecting…",
            "Socket not connected yet. Wait a second and try ON again."
          );
          return;
        }
        publishOnDuty();
        setOnDuty(true);
      } else {
        if (useRiderStore.getState().activeRide) {
          Alert.alert(
            "On a trip",
            "Complete the active ride before going offline."
          );
          return;
        }
        emit("goOffDuty");
        setOnDuty(false);
        setOffer(null);
      }
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = async () => {
    if (!offer) return;
    setAccepting(true);
    try {
      const ride = await acceptRide(offer._id);
      setActiveRide(ride);
      setOffer(null);
      emit("subscribeRide", ride._id);
      // Push location immediately so customer can track
      const coords = useRiderStore.getState().location;
      if (coords) {
        emit("updateLocation", {
          latitude: coords.latitude,
          longitude: coords.longitude,
          heading: coords.heading,
        });
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        "Could not accept ride — it may already be taken.";
      Alert.alert("Accept failed", message);
      setOffer(null);
    } finally {
      setAccepting(false);
    }
  };

  const handleMarkArrived = async () => {
    if (!activeRide) return;
    setUpdating(true);
    try {
      const ride = await updateRideStatus(activeRide._id, "ARRIVED");
      setActiveRide(ride);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.msg || "Could not update status"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!activeRide) return;
    setUpdating(true);
    try {
      const ride = await verifyOtpAndStart(activeRide._id, otp);
      setActiveRide(ride);
      Alert.alert("Trip started", "Navigate to the drop location.");
    } catch (error: any) {
      Alert.alert(
        "Could not start",
        error?.response?.data?.msg || "Invalid OTP — try again"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!activeRide) return;
    const coords = requireCoords();
    if (!coords) return;
    setUpdating(true);
    try {
      await updateRideStatus(activeRide._id, "COMPLETED", coords);
      setActiveRide(null);
      Alert.alert("Trip complete", "Great job! Waiting for the next offer.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.msg || "Could not complete ride"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    if (!activeRide) return;
    Alert.alert("Cancel ride", "Cancel this trip?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          setUpdating(true);
          try {
            await cancelRide(activeRide._id);
            setActiveRide(null);
            setOffer(null);
          } catch (error: any) {
            Alert.alert(
              "Cancel failed",
              error?.response?.data?.msg ||
                error?.response?.data?.message ||
                "Could not cancel"
            );
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      {!activeRide ? (
        <RiderHeader
          onDuty={onDuty}
          onToggleDuty={toggleDuty}
          toggling={toggling}
        />
      ) : null}

      {activeRide ? (
        <Animated.View style={mapWrapStyle}>
          <RiderMap
            bottomPadding={sheetHeight}
            onRouteInfo={({ etaMin, distanceKm }) => {
              setDropEtaMin(etaMin);
              setRouteKm(distanceKm);
            }}
          />
        </Animated.View>
      ) : (
        <View style={{ flex: 1 }}>
          <RiderMap
            onRouteInfo={({ etaMin, distanceKm }) => {
              setDropEtaMin(etaMin);
              setRouteKm(distanceKm);
            }}
          />
        </View>
      )}

      {!gpsReady && (
        <View style={[styles.gpsBanner, activeRide && { top: 56 }]}>
          <ActivityIndicator color={Colors.primary} />
          <CustomText fontSize={11} style={{ marginLeft: 8 }}>
            Acquiring GPS…
          </CustomText>
        </View>
      )}

      {!activeRide && onDuty && !offer && (
        <View style={styles.waitingChip}>
          <CustomText
            fontFamily="Medium"
            fontSize={11}
            style={{ color: Colors.onPrimary }}
          >
            {socketReady
              ? "Online — listening for nearby ride offers"
              : "Online — connecting to server…"}
          </CustomText>
        </View>
      )}

      {!onDuty && !activeRide && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Image
            source={require("@/assets/icons/ride.jpg")}
            style={riderStyles.emptyImage}
          />
          <CustomText fontFamily="SemiBold">Go ON duty to get rides</CustomText>
          <CustomText
            fontSize={11}
            style={{ color: Colors.muted, marginTop: 4 }}
          >
            Toggle the switch in the header
          </CustomText>
        </View>
      )}

      <RideOfferModal
        offer={activeRide ? null : offer}
        accepting={accepting}
        onAccept={handleAccept}
        onIgnore={() => setOffer(null)}
      />

      {activeRide && (
        <ActiveRidePanel
          ride={activeRide}
          updating={updating}
          distanceToDropMeters={distanceToDropMeters}
          dropEtaMin={dropEtaMin}
          routeKm={routeKm}
          animatedPosition={sheetPosition}
          onSnapHeightChange={onSnapHeightChange}
          onMarkArrived={handleMarkArrived}
          onVerifyOtp={handleVerifyOtp}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}
    </View>
  );
};

export default RiderHome;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gpsBanner: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  waitingChip: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 160,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
  },
});
