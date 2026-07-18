import { Stack } from "expo-router";
import React from "react";

const AuthLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="customer" />
      <Stack.Screen name="rider" />
    </Stack>
  );
};

export default AuthLayout;
