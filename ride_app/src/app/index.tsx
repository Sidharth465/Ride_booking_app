import { View, Image, Alert } from "react-native";
import React, { useEffect, useRef } from "react";
import { commonStyles } from "@/styles/commonStyles";
import { splashStyles } from "@/styles/splashStyles";
import CustomText from "@/components/shared/CustomText";
import { jwtDecode } from "jwt-decode";
import { useFonts } from "expo-font";
import { tokenStorage } from "@/store/storage";
import { refresh_tokens } from "@/service/apiInterceptors";
import { performLogout } from "@/service/authService";
import {
  getSession,
  goHome,
  goRole,
  waitForStoreHydration,
} from "@/service/session";
import { useWS } from "@/service/WSProvider";
import { getMyRides } from "@/service/rideService";
import { useUserStore } from "@/store/userStore";
import { hasBlockingActiveRide } from "@/utils/rideActive";

type JwtPayload = { exp?: number };

const Main = () => {
  const hasNavigated = useRef(false);
  const { updateAccessToken } = useWS();
  const [loaded] = useFonts({
    Bold: require("@/assets/fonts/NotoSans-Bold.ttf"),
    Regular: require("@/assets/fonts/NotoSans-Regular.ttf"),
    Medium: require("@/assets/fonts/NotoSans-Medium.ttf"),
    Light: require("@/assets/fonts/NotoSans-Light.ttf"),
    SemiBold: require("@/assets/fonts/NotoSans-SemiBold.ttf"),
  });

  const syncCustomerActiveRide = async () => {
    try {
      const rides = await getMyRides();
      const blocking = (rides || []).find((r: any) =>
        hasBlockingActiveRide(r)
      );
      const { setActiveRide, clearTrip } = useUserStore.getState();
      if (blocking) {
        setActiveRide({
          _id: String(blocking._id),
          vehicle: blocking.vehicle,
          distance: Number(blocking.distance) || 0,
          fare: Number(blocking.fare) || 0,
          status: blocking.status,
          otp: (blocking as any).otp ?? null,
          paymentStatus: (blocking as any).paymentStatus ?? null,
          pickup: blocking.pickup,
          drop: blocking.drop,
          rider: (blocking as any).rider ?? null,
        });
      } else if (hasBlockingActiveRide(useUserStore.getState().activeRide)) {
        // Stale local trip — clear so we don't force liveride
        clearTrip();
      }
    } catch (e) {
      console.log("[Splash] active ride sync failed", e);
    }
  };

  const restoreSession = async () => {
    // Restore persisted user/rider profile from MMKV first
    await waitForStoreHydration();

    const { token, refresh, role, isLoggedIn } = getSession();

    if (!token || !refresh || !isLoggedIn || !role) {
      goRole();
      return;
    }

    try {
      const decodeAccessToken = jwtDecode<JwtPayload>(token);
      const decodeRefreshToken = jwtDecode<JwtPayload>(refresh);
      const currentTime = Date.now() / 1000;

      if (!decodeRefreshToken.exp || decodeRefreshToken.exp < currentTime) {
        performLogout();
        Alert.alert("Session Expired", "Please login again");
        return;
      }

      if (!decodeAccessToken.exp || decodeAccessToken.exp < currentTime) {
        const refreshed = await refresh_tokens();
        if (!refreshed) {
          goRole();
          return;
        }
      }

      // Reconnect socket with restored token
      updateAccessToken();

      if (role === "customer") {
        await syncCustomerActiveRide();
      }

      goHome(role);
    } catch {
      tokenStorage.clearAll();
      goRole();
    }
  };

  useEffect(() => {
    if (!loaded || hasNavigated.current) return;
    hasNavigated.current = true;
    restoreSession();
  }, [loaded]);

  return (
    <View style={commonStyles.container}>
      <Image
        source={require("@/assets/images/logo_t.png")}
        style={splashStyles.img}
      />
      <CustomText variant="h5" style={splashStyles.text} fontFamily="Medium">
        Made In 🇮🇳
      </CustomText>
    </View>
  );
};

export default Main;
