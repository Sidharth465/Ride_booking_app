import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "@/components/shared/CustomText";
import { useWS } from "@/service/WSProvider";
import { tokenStorage } from "@/store/storage";
import { useColors } from "@/theme/ThemeProvider";
import { getSession } from "@/service/session";
import { RFValue } from "react-native-responsive-fontsize";

type ChatPayload = {
  rideId?: string;
  message?: {
    _id?: string;
    sender?: string;
    role?: "customer" | "rider";
    text?: string;
  };
};

type JwtPayload = { id?: string };

/**
 * Listens for socket chatNotification / chatMessage for the peer
 * and shows an in-app banner when the user is not already in that chat.
 */
const ChatNotificationListener = () => {
  const { on, off } = useWS();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [banner, setBanner] = useState<{
    rideId: string;
    text: string;
    fromLabel: string;
  } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myId = (() => {
    try {
      const token = tokenStorage.getString("access_token");
      if (!token) return null;
      return jwtDecode<JwtPayload>(token).id ?? null;
    } catch {
      return null;
    }
  })();

  const showBanner = (rideId: string, text: string, fromRole: string) => {
    const onChat =
      pathnameRef.current?.includes("/chat") ||
      pathnameRef.current?.endsWith("chat");
    if (onChat) return;

    if (hideTimer.current) clearTimeout(hideTimer.current);
    setBanner({
      rideId,
      text,
      fromLabel: fromRole === "rider" ? "Rider" : "Customer",
    });
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setBanner(null));
    }, 4500);
  };

  useEffect(() => {
    const handle = (payload: ChatPayload) => {
      const rideId = String(payload?.rideId || "");
      const msg = payload?.message;
      if (!rideId || !msg?.text) return;
      if (myId && msg.sender && String(msg.sender) === String(myId)) return;
      showBanner(rideId, msg.text, msg.role || "customer");
    };

    on("chatNotification", handle);
    return () => {
      off("chatNotification", handle);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [on, off, myId]);

  if (!banner) return null;

  const openChat = () => {
    const { role } = getSession();
    const href =
      role === "rider"
        ? { pathname: "/rider/chat" as const, params: { rideId: banner.rideId } }
        : {
            pathname: "/customer/chat" as const,
            params: { rideId: banner.rideId },
          };
    setBanner(null);
    router.push(href);
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: insets.top + 8,
          opacity,
          transform: [
            {
              translateY: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={openChat}
        style={[
          styles.banner,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primary,
          },
        ]}
      >
        <View
          style={[styles.iconWrap, { backgroundColor: colors.primary }]}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={16}
            color={colors.onPrimary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CustomText
            fontFamily="Bold"
            fontSize={11}
            style={{ color: colors.text }}
          >
            New message from {banner.fromLabel}
          </CustomText>
          <CustomText
            fontSize={11}
            numberOfLines={2}
            style={{ color: colors.muted, marginTop: 2 }}
          >
            {banner.text}
          </CustomText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ChatNotificationListener;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 30,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
