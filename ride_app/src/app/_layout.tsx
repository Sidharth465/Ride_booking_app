import { WSProvider } from "@/service/WSProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import ChatNotificationListener from "@/components/shared/ChatNotificationListener";
import { getSession, homeHref } from "@/service/session";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";

/**
 * Auth gate — does NOT intercept splash (splash validates + restores session).
 *
 * Public:  /index, /role, /auth/*
 * Private: /customer/*, /rider/*
 */
const AuthNavigator = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const { isLoggedIn, role } = getSession();
    const root = segments[0];

    const onSplash = !root || root === "index";
    const onRole = root === "role";
    const onAuth = root === "auth";
    const onCustomer = root === "customer";
    const onRider = root === "rider";

    if (segments.length === 0 || onSplash) return;

    if (!isLoggedIn || !role) {
      if (onCustomer || onRider) {
        router.replace("/role");
      }
      return;
    }

    // Logged in — bounce off role/auth only (splash handles cold start)
    if (onRole || onAuth) {
      router.replace(homeHref(role));
      return;
    }

    if (role === "rider" && onCustomer) {
      router.replace("/rider");
      return;
    }
    if (role === "customer" && onRider) {
      router.replace("/customer");
    }
  }, [segments, router]);

  return <>{children}</>;
};

const RootLayout = () => {
  return (
    <ThemeProvider>
      <WSProvider>
        <AuthNavigator>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{ headerShown: false }}
              initialRouteName="index"
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="role" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="customer" />
              <Stack.Screen name="rider" />
            </Stack>
            <ChatNotificationListener />
          </View>
        </AuthNavigator>
      </WSProvider>
    </ThemeProvider>
  );
};

export default gestureHandlerRootHOC(RootLayout);
