import React, { FC } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import CustomText from "../shared/CustomText";
import { VehicleType, VEHICLE_LABELS } from "@/types/ride";
import { vehicleIcons } from "@/utils/mapUtils";
import { rideStyles } from "@/styles/rideStyles";
import { Colors } from "@/utils/Constants";
import { RFValue, scaleHorizontal, scaleVertical } from "@/utils/responsive";

type FareMap = Record<VehicleType, number>;

type VehicleSelectorProps = {
  fares: FareMap;
  distanceKm: number;
  selected: VehicleType | null;
  onSelect: (vehicle: VehicleType) => void;
};

const VEHICLES: VehicleType[] = ["bike", "auto", "cabEconomy", "cabPremium"];

const VehicleSelector: FC<VehicleSelectorProps> = ({
  fares,
  distanceKm,
  selected,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <View style={rideStyles.headerContainer}>
        <CustomText fontFamily="SemiBold">Choose a ride</CustomText>
        <CustomText fontSize={10} style={{ color: Colors.muted }}>
          {distanceKm.toFixed(1)} km
        </CustomText>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: scaleVertical(8) }}
        showsVerticalScrollIndicator={false}
      >
        {VEHICLES.map((vehicle) => {
          const isSelected = selected === vehicle;
          return (
            <TouchableOpacity
              key={vehicle}
              style={[
                rideStyles.rideOption,
                {
                  borderColor: isSelected ? Colors.primary : Colors.border,
                  backgroundColor: isSelected
                    ? "rgba(255, 90, 79, 0.08)"
                    : Colors.surface,
                },
              ]}
              onPress={() => onSelect(vehicle)}
              activeOpacity={0.8}
            >
              <View style={styles.optionRow}>
                <Image
                  source={vehicleIcons[vehicle].icon}
                  style={rideStyles.rideIcon}
                />
                <View style={rideStyles.rideDetails}>
                  <CustomText fontFamily="Medium">
                    {VEHICLE_LABELS[vehicle]}
                  </CustomText>
                  <CustomText fontSize={10} style={{ color: Colors.muted }}>
                    {vehicle === "bike"
                      ? "Fastest for short trips"
                      : vehicle === "auto"
                        ? "Affordable 3-wheeler"
                        : vehicle === "cabEconomy"
                          ? "Comfortable sedan"
                          : "Premium AC cab"}
                  </CustomText>
                </View>
                <View style={rideStyles.priceContainer}>
                  <CustomText
                    fontFamily="Bold"
                    style={{ fontSize: RFValue(13), color: Colors.primary }}
                  >
                    ₹{Math.round(fares[vehicle])}
                  </CustomText>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default VehicleSelector;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  list: {
    flex: 1,
    paddingHorizontal: scaleHorizontal(10),
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleHorizontal(12),
  },
});
