import React, { FC } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../shared/CustomText";
import CustomButton from "../shared/CustomButton";
import AnimatedBottomSheet from "../shared/AnimatedBottomSheet";
import RouteMap from "@/components/customer/RouteMap";
import { orderStyles } from "@/styles/riderStyles";
import { vehicleIcons } from "@/utils/mapUtils";
import { openGoogleMapsDirections } from "@/utils/openMaps";
import { VehicleType, VEHICLE_LABELS } from "@/types/ride";
import { Colors, MapColors } from "@/utils/Constants";
import {
  RFValue,
  scaleHorizontal,
  scaleModerate,
  scaleVertical,
} from "@/utils/responsive";

export type RideOffer = {
  _id: string;
  vehicle: VehicleType;
  distance: number;
  fare: number;
  pickup: { address: string; latitude: number; longitude: number };
  drop: { address: string; latitude: number; longitude: number };
  customer?: { phone?: string };
};

type RideOfferModalProps = {
  offer: RideOffer | null;
  accepting: boolean;
  onAccept: () => void;
  onIgnore: () => void;
};

const RideOfferModal: FC<RideOfferModalProps> = ({
  offer,
  accepting,
  onAccept,
  onIgnore,
}) => {
  const vehicle = (offer?.vehicle ?? "bike") as VehicleType;

  const openMaps = () => {
    if (!offer?.pickup || !offer?.drop) return;
    openGoogleMapsDirections(
      {
        latitude: Number(offer.pickup.latitude),
        longitude: Number(offer.pickup.longitude),
      },
      {
        latitude: Number(offer.drop.latitude),
        longitude: Number(offer.drop.longitude),
      }
    );
  };

  return (
    <AnimatedBottomSheet
      visible={Boolean(offer)}
      onClose={onIgnore}
      dismissOnBackdrop
    >
      {offer ? (
        <>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Image
                source={vehicleIcons[vehicle]?.icon}
                style={orderStyles.rideIcon}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText fontFamily="Bold" style={styles.title}>
                New ride offer
              </CustomText>
              <CustomText fontSize={11} style={{ color: Colors.muted }}>
                {VEHICLE_LABELS[vehicle] ?? vehicle} ·{" "}
                {Number(offer.distance).toFixed(1)} km
              </CustomText>
            </View>
            <View style={styles.farePill}>
              <CustomText fontFamily="Bold" style={styles.fare}>
                ₹{Math.round(offer.fare)}
              </CustomText>
            </View>
          </View>

          <View style={styles.mapWrap}>
            <RouteMap pickup={offer.pickup} drop={offer.drop} />
          </View>

          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.pickupDot} />
              <View style={{ flex: 1 }}>
                <CustomText fontSize={9} style={styles.routeLabel}>
                  PICKUP
                </CustomText>
                <CustomText numberOfLines={2} fontSize={12} fontFamily="Medium">
                  {offer.pickup.address}
                </CustomText>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={styles.dropDot} />
              <View style={{ flex: 1 }}>
                <CustomText fontSize={9} style={styles.routeLabel}>
                  DROP
                </CustomText>
                <CustomText numberOfLines={2} fontSize={12} fontFamily="Medium">
                  {offer.drop.address}
                </CustomText>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.mapsBtn}
            onPress={openMaps}
            activeOpacity={0.85}
          >
            <Ionicons name="map-outline" size={RFValue(18)} color={MapColors.path} />
            <CustomText
              fontFamily="Medium"
              fontSize={12}
              style={{ color: MapColors.path, marginLeft: scaleHorizontal(8) }}
            >
              Open in Google Maps
            </CustomText>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.ignoreBtn}
              onPress={onIgnore}
              activeOpacity={0.8}
            >
              <CustomText
                fontFamily="Medium"
                style={{ color: Colors.danger }}
              >
                Ignore
              </CustomText>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <CustomButton
                title="Accept ride"
                loading={accepting}
                onPress={onAccept}
              />
            </View>
          </View>
        </>
      ) : null}
    </AnimatedBottomSheet>
  );
};

export default RideOfferModal;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleHorizontal(12),
    marginBottom: scaleVertical(12),
  },
  iconWrap: {
    width: scaleModerate(48),
    height: scaleModerate(48),
    borderRadius: scaleModerate(14),
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: RFValue(15), color: Colors.text },
  farePill: {
    backgroundColor: "rgba(255, 90, 79, 0.12)",
    paddingHorizontal: scaleHorizontal(12),
    paddingVertical: scaleVertical(8),
    borderRadius: scaleModerate(12),
  },
  fare: { fontSize: RFValue(15), color: Colors.primary },
  mapWrap: {
    height: scaleVertical(160),
    borderRadius: scaleModerate(14),
    overflow: "hidden",
    marginBottom: scaleVertical(12),
    backgroundColor: Colors.secondary_light,
  },
  routeCard: {
    backgroundColor: Colors.secondary_light,
    borderRadius: scaleModerate(14),
    padding: scaleModerate(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scaleHorizontal(10),
  },
  routeLabel: {
    color: Colors.muted,
    marginBottom: scaleVertical(2),
    letterSpacing: 0.4,
  },
  pickupDot: {
    width: scaleModerate(10),
    height: scaleModerate(10),
    borderRadius: scaleModerate(5),
    backgroundColor: MapColors.pickup,
    marginTop: scaleVertical(4),
  },
  dropDot: {
    width: scaleModerate(10),
    height: scaleModerate(10),
    borderRadius: scaleModerate(5),
    backgroundColor: MapColors.drop,
    marginTop: scaleVertical(4),
  },
  routeLine: {
    width: scaleHorizontal(2),
    height: scaleVertical(14),
    backgroundColor: Colors.border,
    marginLeft: scaleHorizontal(4),
    marginVertical: scaleVertical(4),
  },
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scaleVertical(12),
    paddingVertical: scaleVertical(12),
    borderRadius: scaleModerate(12),
    borderWidth: 1.5,
    borderColor: MapColors.path,
    backgroundColor: "rgba(0, 122, 255, 0.08)",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleHorizontal(10),
    marginTop: scaleVertical(14),
    marginBottom: scaleVertical(8),
  },
  ignoreBtn: {
    paddingVertical: scaleVertical(12),
    paddingHorizontal: scaleHorizontal(16),
    borderRadius: scaleModerate(12),
    backgroundColor: "rgba(220, 38, 38, 0.08)",
  },
});
