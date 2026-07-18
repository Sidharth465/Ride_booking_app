import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./storage";

export type RiderLocation = {
  latitude: number;
  longitude: number;
  address: string;
  heading: number;
} | null;

export type ActiveRide = {
  _id: string;
  vehicle: string;
  distance: number;
  fare: number;
  status: string;
  otp?: string;
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
  customer?: {
    _id?: string;
    phone?: string;
  };
} | null;

interface RiderStoreProps {
  user: any;
  _hasHydrated: boolean;
  location: RiderLocation;
  onDuty: boolean;
  activeRide: ActiveRide;
  setHasHydrated: (v: boolean) => void;
  setUser: (data: any) => void;
  setOnDuty: (data: boolean) => void;
  setLocation: (data: RiderLocation) => void;
  setActiveRide: (ride: ActiveRide) => void;
  clearRiderData: () => void;
}

export const useRiderStore = create<RiderStoreProps>()(
  persist(
    (set) => ({
      user: null,
      _hasHydrated: false,
      location: null,
      onDuty: false,
      activeRide: null,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      setUser: (data) => set({ user: data }),
      setOnDuty: (data) => set({ onDuty: data }),
      setLocation: (data) => set({ location: data }),
      setActiveRide: (ride) => set({ activeRide: ride }),
      clearRiderData: () =>
        set({
          user: null,
          location: null,
          onDuty: false,
          activeRide: null,
        }),
    }),
    {
      name: "rider-store",
      partialize: (state) => ({
        user: state.user,
        activeRide: state.activeRide,
        onDuty: state.onDuty,
      }),
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        // Active trip ⇒ must be treated as on-duty after restart
        if (
          state?.activeRide &&
          ["ACCEPTED", "ARRIVED", "START"].includes(state.activeRide.status)
        ) {
          state.setOnDuty(true);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
