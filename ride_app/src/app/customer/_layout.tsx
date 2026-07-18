import React, { useCallback } from "react";
import { BackHandler } from "react-native";
import { Stack, useFocusEffect, useSegments } from "expo-router";

/**
 * Customer private stack (home + trip planning + live ride).
 * Auth lives at /auth/customer — not here.
 */
const CustomerLayout = () => {
  const segments = useSegments();

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (
          segments.includes("selectlocations") ||
          segments.includes("liveride")
        ) {
          return false;
        }
        return true;
      });
      return () => sub.remove();
    }, [segments])
  );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="selectlocations" />
      <Stack.Screen name="liveride" />
      <Stack.Screen name="history" />
      <Stack.Screen name="chat" />
    </Stack>
  );
};

export default CustomerLayout;
