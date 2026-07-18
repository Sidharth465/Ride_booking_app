import React, { FC, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../shared/CustomText";
import CustomButton from "../shared/CustomButton";
import AnimatedBottomSheet from "../shared/AnimatedBottomSheet";
import { Colors } from "@/utils/Constants";
import { RFValue } from "react-native-responsive-fontsize";
import { PaymentMethod } from "@/service/rideService";

type PaymentSheetProps = {
  visible: boolean;
  fare: number;
  paying: boolean;
  rating: number;
  paid: boolean;
  rated: boolean;
  onSelectMethod: (method: PaymentMethod) => void;
  onSelectStars: (stars: number) => void;
  onSubmitRating: () => void;
  onDone: () => void;
};

const METHODS: {
  id: PaymentMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "cash", label: "Cash", icon: "cash-outline" },
  { id: "upi", label: "UPI (mock)", icon: "phone-portrait-outline" },
  { id: "card", label: "Card (mock)", icon: "card-outline" },
];

const PaymentSheet: FC<PaymentSheetProps> = ({
  visible,
  fare,
  paying,
  rating,
  paid,
  rated,
  onSelectMethod,
  onSelectStars,
  onSubmitRating,
  onDone,
}) => {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  return (
    <AnimatedBottomSheet visible={visible}>
      <CustomText fontFamily="Bold" style={styles.title}>
        {paid
          ? rated
            ? "All set!"
            : "Rate your rider"
          : "Pay for your trip"}
      </CustomText>
      <CustomText
        fontSize={12}
        style={{ color: Colors.muted, marginBottom: 16 }}
      >
        {paid
          ? rated
            ? "Thanks for riding with us"
            : "How was your experience?"
          : `Amount due · ₹${Math.round(fare)}`}
      </CustomText>

      {!paid && (
        <>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.methodRow,
                selected === m.id && styles.methodSelected,
              ]}
              onPress={() => setSelected(m.id)}
              activeOpacity={0.8}
            >
              <Ionicons name={m.icon} size={22} color={Colors.primary} />
              <CustomText
                fontFamily="Medium"
                style={{ flex: 1, marginLeft: 12 }}
              >
                {m.label}
              </CustomText>
              {selected === m.id ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={Colors.tertiary}
                />
              ) : null}
            </TouchableOpacity>
          ))}

          <View style={{ height: 12 }} />
          {paying ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <CustomButton
              title={`Pay ₹${Math.round(fare)}`}
              disabled={!selected}
              onPress={() => selected && onSelectMethod(selected)}
            />
          )}
        </>
      )}

      {paid && !rated && (
        <>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => onSelectStars(n)}
                hitSlop={8}
              >
                <Ionicons
                  name={n <= rating ? "star" : "star-outline"}
                  size={36}
                  color={n <= rating ? Colors.primary : Colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          <CustomButton
            title="Submit rating"
            disabled={rating < 1}
            loading={paying}
            onPress={onSubmitRating}
          />
        </>
      )}

      {paid && rated && (
        <View style={{ marginBottom: 8 }}>
          <CustomButton title="Done" onPress={onDone} />
        </View>
      )}
    </AnimatedBottomSheet>
  );
};

export default PaymentSheet;

const styles = StyleSheet.create({
  title: {
    fontSize: RFValue(16),
    marginBottom: 4,
    color: Colors.text,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: Colors.secondary_light,
  },
  methodSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(255, 90, 79, 0.1)",
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    marginTop: 8,
  },
});
