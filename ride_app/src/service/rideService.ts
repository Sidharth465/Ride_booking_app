import { appAxios } from "./apiInterceptors";
import { ActiveRide } from "@/store/riderStore";

export type CreateRidePayload = {
  vehicle: string;
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  drop: {
    address: string;
    latitude: number;
    longitude: number;
  };
};

export type PaymentMethod = "cash" | "upi" | "card";

export const createRide = async (payload: CreateRidePayload) => {
  const { data } = await appAxios.post("/ride/create", payload);
  return data.ride as ActiveRide;
};

export const acceptRide = async (rideId: string) => {
  const { data } = await appAxios.patch(`/ride/accept/${rideId}`);
  return data.ride as ActiveRide;
};

export const updateRideStatus = async (
  rideId: string,
  status: "ARRIVED" | "COMPLETED",
  coords?: { latitude: number; longitude: number }
) => {
  const { data } = await appAxios.patch(`/ride/update/${rideId}`, {
    status,
    ...(coords
      ? { latitude: coords.latitude, longitude: coords.longitude }
      : {}),
  });
  return data.ride as ActiveRide;
};

export const verifyOtpAndStart = async (
  rideId: string,
  otp: string
) => {
  const { data } = await appAxios.post(`/ride/verify-otp/${rideId}`, {
    otp,
  });
  return data.ride as ActiveRide;
};

export const cancelRide = async (rideId: string) => {
  const { data } = await appAxios.patch(`/ride/cancel/${rideId}`);
  return data.ride as ActiveRide;
};

export const payForRide = async (rideId: string, method: PaymentMethod) => {
  const { data } = await appAxios.post(`/ride/pay/${rideId}`, { method });
  return data.ride as ActiveRide;
};

export const rateRide = async (rideId: string, rating: number) => {
  const { data } = await appAxios.post(`/ride/rate/${rideId}`, { rating });
  return data.ride as ActiveRide;
};

export const getMyRides = async (status?: string) => {
  const { data } = await appAxios.get("/ride/rides", {
    params: status ? { status } : undefined,
  });
  return data.rides as ActiveRide[];
};
