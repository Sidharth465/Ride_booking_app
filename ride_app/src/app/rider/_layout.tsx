import React, { useCallback } from "react";
import { BackHandler } from "react-native";
import { Stack, useFocusEffect, useSegments } from "expo-router";

/**
 * Rider private stack only (home).
 * Auth lives at /auth/rider — not here.
 */
const RiderLayout = () => {
  const segments = useSegments();

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (segments.includes("chat") || segments.includes("history")) {
          return false;
        }
        return true;
      });
      return () => sub.remove();
    }, [segments])
  );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
      <Stack.Screen name="chat" />
    </Stack>
  );
};

export default RiderLayout;
