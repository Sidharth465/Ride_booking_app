import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./storage";
import { LocationPoint, VehicleType } from "@/types/ride";

export type CustomerActiveRide = {
  _id: string;
  vehicle: string;
  distance: number;
  fare: number;
  status: string;
  otp?: string | null;
  paymentStatus?: string | null;
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
  rider?: {
    _id?: string;
    phone?: string;
  } | string | null;
} | null;

interface UserStoreProps {
  user: any;
  _hasHydrated: boolean;
  location: LocationPoint;
  pickup: LocationPoint;
  drop: LocationPoint;
  selectedVehicle: VehicleType | null;
  activeRide: CustomerActiveRide;
  outOfRange: boolean;
  setHasHydrated: (v: boolean) => void;
  setUser: (data: any) => void;
  setOutOfRange: (data: boolean) => void;
  setLocation: (data: LocationPoint) => void;
  setPickup: (data: LocationPoint) => void;
  setDrop: (data: LocationPoint) => void;
  setSelectedVehicle: (vehicle: VehicleType | null) => void;
  setActiveRide: (ride: CustomerActiveRide) => void;
  clearTrip: () => void;
  clearData: () => void;
}

export const useUserStore = create<UserStoreProps>()(
  persist(
    (set) => ({
      user: null,
      _hasHydrated: false,
      location: null,
      pickup: null,
      drop: null,
      selectedVehicle: null,
      activeRide: null,
      outOfRange: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      setUser: (data) => set({ user: data }),
      setOutOfRange: (data) => set({ outOfRange: data }),
      setLocation: (data) => set({ location: data }),
      setPickup: (data) => set({ pickup: data }),
      setDrop: (data) => set({ drop: data }),
      setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
      setActiveRide: (ride) => set({ activeRide: ride }),
      clearTrip: () =>
        set({
          pickup: null,
          drop: null,
          selectedVehicle: null,
          activeRide: null,
        }),
      clearData: () =>
        set({
          user: null,
          location: null,
          pickup: null,
          drop: null,
          selectedVehicle: null,
          activeRide: null,
          outOfRange: false,
        }),
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        user: state.user,
        activeRide: state.activeRide,
      }),
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
