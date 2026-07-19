import React, { useCallback, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/shared/CustomText";
import { getMyRides } from "@/service/rideService";
import { Colors } from "@/utils/Constants";
import {
  RFValue,
  scaleHorizontal,
  scaleModerate,
  scaleVertical,
} from "@/utils/responsive";
import { VEHICLE_LABELS, VehicleType } from "@/types/ride";

type HistoryRide = {
  _id: string;
  vehicle: string;
  fare: number;
  distance: number;
  status: string;
  paymentStatus?: string;
  rating?: number | null;
  pickup: { address: string };
  drop: { address: string };
  createdAt?: string;
};

const statusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return Colors.tertiary;
    case "CANCELLED":
      return Colors.danger;
    case "SEARCHING_FOR_RIDER":
      return Colors.primary;
    default:
      return Colors.muted;
  }
};

const RideHistory = () => {
  const [rides, setRides] = useState<HistoryRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getMyRides();
      setRides((data as HistoryRide[]) || []);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={RFValue(22)} color={Colors.text} />
        </TouchableOpacity>
        <CustomText fontFamily="Bold" style={styles.title}>
          Ride history
        </CustomText>
        <View style={{ width: scaleHorizontal(22) }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          contentContainerStyle={
            rides.length === 0 ? styles.center : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <CustomText style={{ color: Colors.muted }}>No rides yet</CustomText>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <CustomText fontFamily="SemiBold" style={{ flex: 1 }}>
                  {VEHICLE_LABELS[item.vehicle as VehicleType] ?? item.vehicle}
                </CustomText>
                <CustomText fontFamily="Bold" style={{ color: Colors.primary }}>
                  ₹{Math.round(item.fare)}
                </CustomText>
              </View>
              <CustomText fontSize={11} numberOfLines={1} style={styles.addr}>
                {item.pickup?.address}
              </CustomText>
              <CustomText fontSize={11} numberOfLines={1} style={styles.addr}>
                → {item.drop?.address}
              </CustomText>
              <View style={styles.meta}>
                <CustomText
                  fontSize={10}
                  fontFamily="Medium"
                  style={{ color: statusColor(item.status) }}
                >
                  {item.status.replace(/_/g, " ")}
                </CustomText>
                {item.paymentStatus === "PAID" ? (
                  <CustomText fontSize={10} style={{ color: Colors.tertiary }}>
                    · Paid
                  </CustomText>
                ) : null}
                {item.rating != null ? (
                  <CustomText fontSize={10} style={{ color: Colors.primary }}>
                    · ★ {item.rating}
                  </CustomText>
                ) : null}
                {item.createdAt ? (
                  <CustomText
                    fontSize={10}
                    style={{ color: Colors.muted, marginLeft: "auto" }}
                  >
                    {new Date(item.createdAt).toLocaleDateString()}
                  </CustomText>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default RideHistory;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scaleHorizontal(16),
    paddingVertical: scaleVertical(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: { fontSize: RFValue(15), color: Colors.text },
  center: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: scaleModerate(24),
  },
  list: {
    paddingHorizontal: scaleHorizontal(16),
    paddingTop: scaleVertical(16),
    paddingBottom: scaleVertical(40),
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: scaleModerate(14),
    padding: scaleModerate(14),
    marginBottom: scaleVertical(12),
    backgroundColor: Colors.surface,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleVertical(6),
  },
  addr: { color: Colors.muted, marginBottom: scaleVertical(2) },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleHorizontal(4),
    marginTop: scaleVertical(8),
  },
});
