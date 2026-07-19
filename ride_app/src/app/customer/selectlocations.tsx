import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "@/store/userStore";
import {
  getPlacesSuggestions,
  getLatLong,
  calculateDistance,
  calculateFare,
  getCurrentDeviceLocation,
} from "@/utils/mapUtils";
import { PlaceSuggestion, VehicleType } from "@/types/ride";
import LocationSearchInput from "@/components/customer/LocationSearchInput";
import LocationItem from "@/components/customer/LocationItem";
import RouteMap from "@/components/customer/RouteMap";
import VehicleSelector from "@/components/customer/VehicleSelector";
import CustomButton from "@/components/shared/CustomButton";
import CustomText from "@/components/shared/CustomText";
import { Colors, MapColors } from "@/utils/Constants";
import {
  RFValue,
  scaleHorizontal,
  scaleModerate,
  scaleVertical,
} from "@/utils/responsive";
import { createRide } from "@/service/rideService";
import { hasBlockingActiveRide } from "@/utils/rideActive";

type ActiveField = "pickup" | "drop";

const SelectLocations = () => {
  const {
    pickup,
    drop,
    selectedVehicle,
    location,
    activeRide,
    setPickup,
    setDrop,
    setLocation,
    setSelectedVehicle,
    setActiveRide,
  } = useUserStore();

  const [activeField, setActiveField] = useState<ActiveField>("drop");
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropQuery, setDropQuery] = useState(drop?.address ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [loadingPickupGps, setLoadingPickupGps] = useState(true);
  const [booking, setBooking] = useState(false);

  // True only after user picks a place from search suggestions
  const pickupFromSearch = useRef(false);

  // Block booking screen if a ride is already in progress
  useEffect(() => {
    if (!hasBlockingActiveRide(activeRide)) return;
    Alert.alert(
      "Ride in progress",
      "Finish or cancel your current ride before booking another.",
      [
        {
          text: "Open ride",
          onPress: () => router.replace("/customer/liveride"),
        },
      ]
    );
    router.replace("/customer/liveride");
  }, [activeRide?._id, activeRide?.status]);

  // Always resolve a FRESH GPS fix for pickup when this screen opens
  useEffect(() => {
    let cancelled = false;

    const bootPickup = async () => {
      setLoadingPickupGps(true);
      pickupFromSearch.current = false;

      // Clear stale pickup so we never flash an old/wrong address
      setPickup(null);
      setPickupQuery("");

      try {
        const current = await getCurrentDeviceLocation();
        if (cancelled) return;

        setLocation(current);
        setPickup(current);
        setPickupQuery(current.address);
      } catch (error) {
        console.log("Pickup GPS error", error);
        if (!cancelled) {
          Alert.alert(
            "Location",
            "Could not detect your current location. Tap “Use current location” or search manually."
          );
        }
      } finally {
        if (!cancelled) setLoadingPickupGps(false);
      }
    };

    bootPickup();
    return () => {
      cancelled = true;
    };
  }, [setPickup, setLocation]);

  // NOTE: Do NOT sync pickup from home-map `location` store.
  // Customer home stays mounted under this screen and was overwriting
  // the fresh GPS pickup with a wrong/stale map-pin location.

  const bothSelected = Boolean(pickup && drop);

  const distanceKm = useMemo(() => {
    if (!pickup || !drop) return 0;
    return calculateDistance(
      pickup.latitude,
      pickup.longitude,
      drop.latitude,
      drop.longitude
    );
  }, [pickup, drop]);

  const fares = useMemo(() => calculateFare(distanceKm), [distanceKm]);

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await getPlacesSuggestions(query.trim());
      setSuggestions(results);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const query = activeField === "pickup" ? pickupQuery : dropQuery;
    // Don't search when query matches an already-selected address
    const selectedAddress =
      activeField === "pickup" ? pickup?.address : drop?.address;
    if (selectedAddress && query === selectedAddress) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(timer);
  }, [pickupQuery, dropQuery, activeField, pickup?.address, drop?.address, runSearch]);

  const onSelectPlace = async (item: PlaceSuggestion) => {
    setResolving(true);
    try {
      const coords = await getLatLong(item.place_id);
      if (!coords) {
        Alert.alert("Error", "Could not resolve that location");
        return;
      }

      if (activeField === "pickup") {
        pickupFromSearch.current = true;
        setPickup(coords);
        setPickupQuery(coords.address);
      } else {
        setDrop(coords);
        setDropQuery(coords.address);
      }
      setSuggestions([]);

      // After picking pickup, move focus to drop
      if (activeField === "pickup" && !drop) {
        setActiveField("drop");
      }
    } catch {
      Alert.alert("Error", "Unable to fetch location details");
    } finally {
      setResolving(false);
    }
  };

  const useCurrentAsPickup = async () => {
    setResolving(true);
    try {
      const current = await getCurrentDeviceLocation();
      pickupFromSearch.current = false;
      setLocation(current);
      setPickup(current);
      setPickupQuery(current.address);
      setSuggestions([]);
      setActiveField("drop");
    } catch {
      Alert.alert(
        "Location",
        "Could not get your current location. Check GPS permissions."
      );
    } finally {
      setResolving(false);
    }
  };

  const onConfirm = async () => {
    if (hasBlockingActiveRide(useUserStore.getState().activeRide)) {
      Alert.alert(
        "Ride in progress",
        "Finish or cancel your current ride before booking another."
      );
      router.replace("/customer/liveride");
      return;
    }

    if (!pickup || !drop || !selectedVehicle) {
      Alert.alert("Select a vehicle", "Pick a ride type to continue");
      return;
    }

    setBooking(true);
    try {
      const ride = await createRide({
        vehicle: selectedVehicle,
        pickup: {
          address: pickup.address,
          latitude: pickup.latitude,
          longitude: pickup.longitude,
        },
        drop: {
          address: drop.address,
          latitude: drop.latitude,
          longitude: drop.longitude,
        },
      });

      setActiveRide(ride);
      // Keep pickup/drop for the live map; clear vehicle selection
      setSelectedVehicle(null);
      router.replace("/customer/liveride");
    } catch (error: any) {
      Alert.alert(
        "Booking failed",
        error?.response?.data?.msg ||
          error?.response?.data?.message ||
          "Could not create ride. Check your connection."
      );
    } finally {
      setBooking(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={RFValue(20)} color={Colors.text} />
          </TouchableOpacity>
          <CustomText fontFamily="SemiBold" variant="h6">
            Plan your trip
          </CustomText>
          <View style={{ width: scaleModerate(36) }} />
        </View>

        <View style={styles.inputs}>
          <LocationSearchInput
            label="PICKUP"
            placeholder={
              loadingPickupGps ? "Detecting your location…" : "Pickup location"
            }
            value={pickupQuery}
            onChangeText={(t) => {
              setPickupQuery(t);
              setActiveField("pickup");
            }}
            onFocus={() => setActiveField("pickup")}
            onClear={() => {
              setPickupQuery("");
              setPickup(null);
              pickupFromSearch.current = false;
              setActiveField("pickup");
            }}
            isActive={activeField === "pickup"}
            dotColor={MapColors.pickup}
          />
          {loadingPickupGps && (
            <ActivityIndicator
              style={{ marginBottom: scaleVertical(8) }}
              color={Colors.primary}
            />
          )}
          <LocationSearchInput
            label="DROP"
            placeholder="Where to?"
            value={dropQuery}
            onChangeText={(t) => {
              setDropQuery(t);
              setActiveField("drop");
            }}
            onFocus={() => setActiveField("drop")}
            onClear={() => {
              setDropQuery("");
              setDrop(null);
              setSelectedVehicle(null);
              setActiveField("drop");
            }}
            isActive={activeField === "drop"}
            dotColor={MapColors.drop}
          />

          {activeField === "pickup" && location && (
            <TouchableOpacity
              style={styles.useCurrent}
              onPress={useCurrentAsPickup}
            >
              <Ionicons name="locate" size={RFValue(16)} color={MapColors.pickup} />
              <CustomText fontSize={11} style={{ color: MapColors.pickup }}>
                Use current location
              </CustomText>
            </TouchableOpacity>
          )}
        </View>

        {(searching || resolving) && (
          <ActivityIndicator
            style={{ marginVertical: scaleVertical(8) }}
            color={Colors.primary}
          />
        )}

        {!bothSelected || suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <LocationItem item={item} onPress={onSelectPlace} />
            )}
            ListEmptyComponent={
              !searching ? (
                <CustomText style={styles.emptyHint} fontSize={11}>
                  Search for a place to set {activeField}
                </CustomText>
              ) : null
            }
          />
        ) : (
          <View style={styles.tripPanel}>
            <View style={styles.mapWrap}>
              <RouteMap pickup={pickup!} drop={drop!} />
            </View>
            <View style={styles.vehicleWrap}>
              <VehicleSelector
                fares={fares}
                distanceKm={distanceKm}
                selected={selectedVehicle}
                onSelect={(v: VehicleType) => setSelectedVehicle(v)}
              />
              <View style={styles.confirmWrap}>
                <CustomButton
                  title={
                    selectedVehicle
                      ? `Book ₹${Math.round(fares[selectedVehicle])}`
                      : "Select a vehicle"
                  }
                  disabled={!selectedVehicle || booking}
                  loading={booking}
                  onPress={onConfirm}
                />
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

export default SelectLocations;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scaleHorizontal(12),
    paddingBottom: scaleVertical(8),
  },
  backBtn: {
    width: scaleModerate(36),
    height: scaleModerate(36),
    borderRadius: scaleModerate(18),
    backgroundColor: Colors.secondary_light,
    alignItems: "center",
    justifyContent: "center",
  },
  inputs: {
    paddingHorizontal: scaleHorizontal(15),
    paddingBottom: scaleVertical(4),
  },
  useCurrent: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleHorizontal(6),
    marginBottom: scaleVertical(8),
    marginLeft: scaleHorizontal(4),
  },
  emptyHint: {
    textAlign: "center",
    color: Colors.muted,
    marginTop: scaleVertical(40),
  },
  tripPanel: {
    flex: 1,
  },
  mapWrap: {
    height: "38%",
  },
  vehicleWrap: {
    flex: 1,
    borderTopLeftRadius: scaleModerate(20),
    borderTopRightRadius: scaleModerate(20),
    backgroundColor: Colors.surface,
    marginTop: scaleVertical(-12),
    shadowColor: Colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmWrap: {
    alignItems: "center",
    paddingVertical: scaleVertical(12),
    paddingBottom: scaleVertical(24),
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
});
