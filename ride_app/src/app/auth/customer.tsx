import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { authStyles } from "@/styles/authStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "@/components/shared/CustomText";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import PhoneInput from "@/components/shared/PhoneInput";
import { useWS } from "@/service/WSProvider";
import CustomButton from "@/components/shared/CustomButton";
import { signIn } from "@/service/authService";
import { goRole } from "@/service/session";
import { Colors } from "@/utils/Constants";

const CustomerAuth = () => {
  const { updateAccessToken } = useWS();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNextPress = async () => {
    setLoading(true);
    try {
      await signIn({ role: "customer", phone }, updateAccessToken);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <ScrollView contentContainerStyle={authStyles.container}>
        <View style={commonStyles.flexRowBetween}>
          <TouchableOpacity onPress={goRole} hitSlop={12} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Image
            style={authStyles.logo}
            source={require("@/assets/images/logo_t.png")}
          />
          <TouchableOpacity style={authStyles.flexRowGap}>
            <Entypo name="help-with-circle" size={18} color="grey" />
            <CustomText fontFamily="Medium" variant="h7">
              Help
            </CustomText>
          </TouchableOpacity>
        </View>

        <CustomText variant="h6" fontFamily="Medium">
          What&apos;s your number?
        </CustomText>
        <CustomText style={commonStyles.lightText} variant="h7">
          Enter your phone number to proceed as Customer
        </CustomText>
        <PhoneInput value={phone} onChangeText={setPhone} />
      </ScrollView>

      <View style={authStyles.footerContainer}>
        <CustomText
          variant="h8"
          fontFamily="Regular"
          style={[
            commonStyles.lightText,
            { textAlign: "center", marginHorizontal: 20 },
          ]}
        >
          By continuing you agree to our Terms of Service and Privacy Policy.
        </CustomText>
        <CustomButton
          title="Continue"
          onPress={handleNextPress}
          loading={loading}
          disabled={loading || phone.replace(/\D/g, "").length < 10}
        />
      </View>
    </SafeAreaView>
  );
};

export default CustomerAuth;
