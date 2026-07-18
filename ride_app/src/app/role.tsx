import { View, Image, TouchableOpacity } from "react-native";
import React, { useEffect } from "react";
import { roleStyles } from "@/styles/roleStyles";
import CustomText from "@/components/shared/CustomText";
import { getSession, goAuth, goHome } from "@/service/session";
import { Colors } from "@/utils/Constants";

const Role = () => {
  useEffect(() => {
    const { isLoggedIn, role } = getSession();
    if (isLoggedIn && role) {
      goHome(role);
    }
  }, []);

  return (
    <View style={roleStyles.container}>
      <Image
        source={require("@/assets/images/logo_t.png")}
        style={roleStyles.logo}
      />
      <CustomText fontFamily="Medium" variant="h5" style={{ color: Colors.text }}>
        Choose your user type
      </CustomText>

      <TouchableOpacity
        onPress={() => goAuth("customer")}
        style={roleStyles.card}
        activeOpacity={0.85}
      >
        <Image
          style={roleStyles.image}
          source={require("@/assets/images/customer.jpg")}
        />
        <View style={roleStyles.cardContent}>
          <CustomText style={roleStyles.title}>Customer</CustomText>
          <CustomText style={roleStyles.description}>
            Book rides and track your trips easily.
          </CustomText>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => goAuth("rider")}
        style={roleStyles.card}
        activeOpacity={0.85}
      >
        <Image
          style={roleStyles.image}
          source={require("@/assets/images/rider.jpg")}
        />
        <View style={roleStyles.cardContent}>
          <CustomText style={roleStyles.title}>Rider</CustomText>
          <CustomText style={roleStyles.description}>
            Go online and accept nearby ride requests.
          </CustomText>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Role;
