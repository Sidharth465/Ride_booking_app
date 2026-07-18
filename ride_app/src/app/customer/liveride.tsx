import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useUserStore } from "@/store/userStore";
import { useWS } from "@/service/WSProvider";
import PaymentSheet from "@/components/customer/PaymentSheet";
import CustomerLiveRidePanel, {
  LIVE_SHEET_EXPANDED_RATIO,
} from "@/components/customer/CustomerLiveRidePanel";
import MovingVehicleMarker from "@/components/shared/MovingVehicleMarker";
import { AppColors, MapColors } from "@/utils/Constants";
import { useColors } from "@/theme/ThemeProvider";
import { useThemedStyles } from "@/theme/useThemedStyles";
import { customMapStyle } from "@/utils/CustomMap";
import { mapStyles } from "@/styles/mapStyles";
import {
  cancelRide,
  payForRide,
  rateRide,
  PaymentMethod,
} from "@/service/rideService";
import { calculateDistance, getPoints } from "@/utils/mapUtils";
import { hasBlockingActiveRide } from "@/utils/rideActive";

type RiderCoords = { latitude: number; longitude: number; heading?: number };

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_MAP_API_KEY ?? "";
const MIN_ROUTE_KM = 0.05;

const LiveRide = () => {
  const { emit, on, off, isConnected } = useWS();
  const colors = useColors();
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = useRef<MapView>(null);
  const activeRide = useUserStore((s) => s.activeRide);
  const setActiveRide = useUserStore((s) => s.setActiveRide);
  const clearTrip = useUserStore((s) => s.clearTrip);
  const [canceling, setCanceling] = useState(false);
  const [riderCoords, setRiderCoords] = useState<RiderCoords | null>(null);
  const [searchHint, setSearchHint] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [rated, setRated] = useState(false);
  const [rating, setRating] = useState(0);
  const [dropEtaMin, setDropEtaMin] = useState<number | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [useFallbackLine, setUseFallbackLine] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(
    Math.round(windowHeight * LIVE_SHEET_EXPANDED_RATIO)
  );
  const searchStarted = useRef(false);
  // Sheet top Y from screen top — map height tracks this while dragging
  const sheetPosition = useSharedValue(
    windowHeight * (1 - LIVE_SHEET_EXPANDED_RATIO)
  );

  const mapWrapStyle = useAnimatedStyle(() => ({
    height: Math.max(sheetPosition.value, 120),
    width: "100%" as const,
    overflow: "hidden" as const,
  }));

  const onSnapHeightChange = useCallback((h: number) => {
    setSheetHeight(h);
  }, []);

  const styles = useThemedStyles((c: AppColors) => ({
    root: { flex: 1, backgroundColor: c.background },
    center: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    topBar: {
      position: "absolute" as const,
      top: 0,
      left: 12,
      zIndex: 2,
    },
    backBtn: {
      backgroundColor: c.surface,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 6,
    },
  }));

  const searching = activeRide?.status === "SEARCHING_FOR_RIDER";

  const finishTrip = () => {
    setShowPayment(false);
    clearTrip();
    router.replace("/customer");
  };

  useEffect(() => {
    if (!activeRide?._id) {
      router.replace("/customer");
      return;
    }

    setUseFallbackLine(false);
    setDropEtaMin(null);
    setRouteKm(null);

    // Resume payment sheet if reopening a completed unpaid ride
    if (activeRide.status === "COMPLETED") {
      setShowPayment(true);
      if ((activeRide as any).paymentStatus === "PAID") setPaid(true);
      if ((activeRide as any).rating != null) {
        setRated(true);
        setRating((activeRide as any).rating);
      }
    }

    const applyRide = (ride: any) => {
      if (!ride?._id) return;
      const prev = useUserStore.getState().activeRide;
      const riderId =
        typeof ride.rider === "object" ? ride.rider?._id : ride.rider;
      const prevRiderId =
        typeof prev?.rider === "object"
          ? (prev.rider as any)?._id
          : prev?.rider;

      const nextOtp =
        ride.status === "START" || ride.status === "COMPLETED"
          ? null
          : ride.otp ?? prev?.otp;

      // Skip no-op updates (subscribeRide re-emits rideData often)
      if (
        prev &&
        String(prev._id) === String(ride._id) &&
        prev.status === ride.status &&
        (prev.otp ?? null) === (nextOtp ?? null) &&
        (prev.paymentStatus ?? null) === (ride.paymentStatus ?? null) &&
        String(prevRiderId || "") === String(riderId || "")
      ) {
        if (riderId) emit("subscribeToriderLocation", riderId);
        return;
      }

      const next = {
        ...(prev || {}),
        ...ride,
        _id: String(ride._id),
        otp: nextOtp,
      };
      console.log("[Customer] ride update", next.status);
      setActiveRide(next as any);
      if (ride.status !== "SEARCHING_FOR_RIDER") {
        setSearchHint(null);
      }

      if (riderId) emit("subscribeToriderLocation", riderId);

      if (ride.status === "COMPLETED") {
        setShowPayment(true);
        if (ride.paymentStatus === "PAID") setPaid(true);
        if (ride.rating != null) {
          setRated(true);
          setRating(ride.rating);
        }
      }
    };

    const joinRideRoom = () => {
      const ride = useUserStore.getState().activeRide;
      if (!ride?._id) return;

      emit("subscribeRide", ride._id);

      if (
        ride.status === "SEARCHING_FOR_RIDER" &&
        !searchStarted.current
      ) {
        searchStarted.current = true;
        console.log("[Customer] searchrider", ride._id);
        emit("searchrider", ride._id);
      }

      const riderId =
        typeof ride.rider === "object" ? ride.rider?._id : ride.rider;
      if (riderId) {
        emit("subscribeToriderLocation", riderId);
      }
    };

    const roomsJoined = { current: false };

    if (isConnected()) {
      joinRideRoom();
      roomsJoined.current = true;
    }

    // Re-join only after a real disconnect — not every few seconds while online
    const reconnectPoll = setInterval(() => {
      if (isConnected()) {
        if (!roomsJoined.current) {
          joinRideRoom();
          roomsJoined.current = true;
        }
      } else {
        roomsJoined.current = false;
      }
    }, 2500);

    const onRideData = (ride: any) => applyRide(ride);
    const onRideUpdate = (ride: any) => applyRide(ride);
    const onRideStarted = (ride: any) => applyRide(ride);
    const onAccepted = (ride?: any) => applyRide(ride);

    const onRiderLocation = (payload: {
      riderId?: string;
      coords?: RiderCoords;
    }) => {
      if (payload?.coords?.latitude != null) {
        setRiderCoords({
          latitude: payload.coords.latitude,
          longitude: payload.coords.longitude,
          heading: payload.coords.heading,
        });
      }
    };

    const onSearchStatus = (payload: {
      message?: string;
      onDutyCount?: number;
    }) => {
      setSearchHint(
        payload?.message ||
          `Searching… (${payload?.onDutyCount ?? 0} riders online)`
      );
    };

    const onError = (payload: { message?: string; rideId?: string }) => {
      const currentId = useUserStore.getState().activeRide?._id;
      if (payload?.rideId && currentId && String(payload.rideId) !== String(currentId)) {
        return;
      }
      Alert.alert("Ride", payload?.message || "Something went wrong", [
        {
          text: "OK",
          onPress: () => {
            clearTrip();
            router.replace("/customer");
          },
        },
      ]);
    };

    const onCanceled = (payload?: { message?: string; rideId?: string }) => {
      const currentId = useUserStore.getState().activeRide?._id;
      // Ignore cancel events for a different ride (stale search listeners)
      if (
        payload?.rideId &&
        currentId &&
        String(payload.rideId) !== String(currentId)
      ) {
        console.log("[Customer] ignore rideCanceled for other ride", payload.rideId);
        return;
      }
      Alert.alert("Ride canceled", payload?.message || "This ride was canceled");
      clearTrip();
      router.replace("/customer");
    };

    on("rideData", onRideData);
    on("rideUpdate", onRideUpdate);
    on("rideStarted", onRideStarted);
    on("rideAccepted", onAccepted);
    on("riderLocationUpdate", onRiderLocation);
    on("searchStatus", onSearchStatus);
    on("error", onError);
    on("rideCanceled", onCanceled);

    return () => {
      clearInterval(reconnectPoll);
      off("rideData", onRideData);
      off("rideUpdate", onRideUpdate);
      off("rideStarted", onRideStarted);
      off("rideAccepted", onAccepted);
      off("riderLocationUpdate", onRiderLocation);
      off("searchStatus", onSearchStatus);
      off("error", onError);
      off("rideCanceled", onCanceled);
    };
  }, [activeRide?._id]);

  const didFitRider = useRef(false);

  useEffect(() => {
    didFitRider.current = false;
  }, [activeRide?._id]);

  const mapEdgePadding = useMemo(
    () => ({
      top: 80,
      right: 60,
      bottom: Math.max(40, Math.round(sheetHeight * 0.08)),
      left: 60,
    }),
    [sheetHeight]
  );

  // Fit map once when rider location first arrives — not on every GPS ping
  useEffect(() => {
    if (!activeRide || !riderCoords || !mapRef.current) return;
    if (didFitRider.current) return;
    didFitRider.current = true;
    mapRef.current.fitToCoordinates(
      [
        riderCoords,
        {
          latitude: activeRide.pickup.latitude,
          longitude: activeRide.pickup.longitude,
        },
        {
          latitude: activeRide.drop.latitude,
          longitude: activeRide.drop.longitude,
        },
      ],
      {
        edgePadding: mapEdgePadding,
        animated: true,
      }
    );
  }, [riderCoords?.latitude, riderCoords?.longitude, activeRide?._id]);

  // During trip: refresh remaining ETA from rider → drop (~city speed fallback)
  useEffect(() => {
    if (
      !riderCoords ||
      !activeRide ||
      activeRide.status !== "START" ||
      !activeRide.drop
    ) {
      return;
    }
    const km = calculateDistance(
      riderCoords.latitude,
      riderCoords.longitude,
      activeRide.drop.latitude,
      activeRide.drop.longitude
    );
    // ~22 km/h urban two-wheeler average
    setDropEtaMin(Math.max(1, Math.round((km / 22) * 60)));
  }, [
    riderCoords?.latitude,
    riderCoords?.longitude,
    activeRide?.status,
    activeRide?.drop?.latitude,
    activeRide?.drop?.longitude,
  ]);

  const pickupCoord = useMemo(() => {
    if (!activeRide) return null;
    return {
      latitude: Number(activeRide.pickup.latitude),
      longitude: Number(activeRide.pickup.longitude),
    };
  }, [activeRide?.pickup?.latitude, activeRide?.pickup?.longitude]);

  const dropCoord = useMemo(() => {
    if (!activeRide) return null;
    return {
      latitude: Number(activeRide.drop.latitude),
      longitude: Number(activeRide.drop.longitude),
    };
  }, [activeRide?.drop?.latitude, activeRide?.drop?.longitude]);

  const routeDistanceKm =
    pickupCoord && dropCoord
      ? calculateDistance(
          pickupCoord.latitude,
          pickupCoord.longitude,
          dropCoord.latitude,
          dropCoord.longitude
        )
      : 0;

  const canRequestDirections =
    Boolean(GOOGLE_MAPS_KEY) &&
    pickupCoord &&
    dropCoord &&
    routeDistanceKm >= MIN_ROUTE_KM;

  const fallbackCoords = useMemo(() => {
    if (!pickupCoord || !dropCoord) return [];
    return getPoints([pickupCoord, dropCoord]);
  }, [pickupCoord, dropCoord]);

  const cancelSearch = () => {
    if (!activeRide?._id) return;
    if (activeRide.status !== "SEARCHING_FOR_RIDER") {
      Alert.alert("Cannot cancel search", "This ride is no longer searching.");
      return;
    }
    const rideId = activeRide._id;
    Alert.alert("Cancel ride", "Stop searching for a rider?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: () => {
          setCanceling(true);
          emit("cancelRide", { rideId });
          // Only clear if this searching ride is still the active one
          const current = useUserStore.getState().activeRide;
          if (current?._id === rideId) {
            clearTrip();
            router.replace("/customer");
          }
          setCanceling(false);
        },
      },
    ]);
  };

  const cancelActiveRide = () => {
    if (!activeRide?._id) return;
    Alert.alert("Cancel ride", "Cancel this trip?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          setCanceling(true);
          try {
            await cancelRide(activeRide._id);
            clearTrip();
            router.replace("/customer");
          } catch (error: any) {
            Alert.alert(
              "Cancel failed",
              error?.response?.data?.msg ||
                error?.response?.data?.message ||
                "Could not cancel ride"
            );
          } finally {
            setCanceling(false);
          }
        },
      },
    ]);
  };

  const handlePay = async (method: PaymentMethod) => {
    if (!activeRide?._id) return;
    setPaying(true);
    try {
      const ride = await payForRide(activeRide._id, method);
      setActiveRide(ride);
      setPaid(true);
    } catch (error: any) {
      Alert.alert(
        "Payment failed",
        error?.response?.data?.msg ||
          error?.response?.data?.message ||
          "Could not process payment"
      );
    } finally {
      setPaying(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!activeRide?._id || rating < 1) return;
    setPaying(true);
    try {
      const ride = await rateRide(activeRide._id, rating);
      setActiveRide(ride);
      setRated(true);
    } catch (error: any) {
      Alert.alert(
        "Rating failed",
        error?.response?.data?.msg ||
          error?.response?.data?.message ||
          "Could not submit rating"
      );
    } finally {
      setPaying(false);
    }
  };

  const initialRegion = useMemo(() => {
    if (!activeRide) return undefined;
    return {
      latitude: activeRide.pickup.latitude,
      longitude: activeRide.pickup.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [activeRide?._id]);

  if (!activeRide || !initialRegion) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View style={mapWrapStyle}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={
            Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
          }
          initialRegion={initialRegion}
          customMapStyle={
            Platform.OS === "android" ? customMapStyle : undefined
          }
        >
          {pickupCoord && (
            <Marker
              coordinate={pickupCoord}
              title="Pickup"
              anchor={{ x: 0.5, y: 1 }}
            >
              <Image
                source={require("@/assets/icons/marker.png")}
                style={mapStyles.marker}
              />
            </Marker>
          )}
          {dropCoord && (
            <Marker
              coordinate={dropCoord}
              title="Drop"
              anchor={{ x: 0.5, y: 1 }}
            >
              <Image
                source={require("@/assets/icons/drop_marker.png")}
                style={mapStyles.marker}
              />
            </Marker>
          )}
          {riderCoords && (
            <MovingVehicleMarker
              latitude={riderCoords.latitude}
              longitude={riderCoords.longitude}
              heading={riderCoords.heading}
              vehicle={activeRide.vehicle}
              title="Rider"
            />
          )}

          {canRequestDirections &&
          !useFallbackLine &&
          pickupCoord &&
          dropCoord ? (
            <MapViewDirections
              origin={pickupCoord}
              destination={dropCoord}
              apikey={GOOGLE_MAPS_KEY}
              mode="DRIVING"
              region="IN"
              strokeWidth={5}
              strokeColor={MapColors.path}
              onReady={(result) => {
                setRouteKm(result.distance);
                if (activeRide.status !== "START" || !riderCoords) {
                  setDropEtaMin(result.duration);
                }
                if (!didFitRider.current) {
                  didFitRider.current = true;
                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: mapEdgePadding,
                    animated: true,
                  });
                }
              }}
              onError={(message) => {
                console.log("[LiveRide] Directions error:", message);
                setUseFallbackLine(true);
                setDropEtaMin(
                  Math.max(1, Math.round((routeDistanceKm / 22) * 60))
                );
                setRouteKm(routeDistanceKm);
              }}
            />
          ) : null}

          {(useFallbackLine || !canRequestDirections) &&
          fallbackCoords.length > 1 ? (
            <Polyline
              coordinates={fallbackCoords}
              strokeWidth={5}
              strokeColor={MapColors.path}
            />
          ) : null}
        </MapView>
      </Animated.View>

      <SafeAreaView style={styles.topBar} edges={["top"]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (hasBlockingActiveRide(activeRide)) {
              return;
            }
            router.replace("/customer");
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      <CustomerLiveRidePanel
        ride={activeRide}
        searching={searching}
        searchHint={searchHint}
        canceling={canceling}
        dropEtaMin={dropEtaMin}
        routeKm={routeKm}
        hasLiveRider={Boolean(riderCoords)}
        animatedPosition={sheetPosition}
        onSnapHeightChange={onSnapHeightChange}
        onCancelSearch={cancelSearch}
        onCancelRide={cancelActiveRide}
        onPay={() => setShowPayment(true)}
      />

      <PaymentSheet
        visible={showPayment}
        fare={activeRide.fare}
        paying={paying}
        rating={rating}
        paid={paid}
        rated={rated}
        onSelectMethod={handlePay}
        onSelectStars={setRating}
        onSubmitRating={handleSubmitRating}
        onDone={finishTrip}
      />
    </View>
  );
};

export default LiveRide;
