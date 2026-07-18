import { tokenStorage } from "@/store/storage";
import { useUserStore } from "@/store/userStore";
import { useRiderStore } from "@/store/riderStore";
import { hasBlockingActiveRide } from "@/utils/rideActive";
import { Href, router } from "expo-router";

export type AppRole = "customer" | "rider";

export const getSession = () => {
  const token = tokenStorage.getString("access_token");
  const refresh = tokenStorage.getString("refresh_token");
  const role = tokenStorage.getString("user_role") as AppRole | undefined;
  return {
    token: token ?? null,
    refresh: refresh ?? null,
    role: role ?? null,
    isLoggedIn: Boolean(token && refresh && role),
  };
};

/** Wait until Zustand MMKV rehydration finishes (user profile restored). */
export const waitForStoreHydration = () =>
  new Promise<void>((resolve) => {
    const customerReady = useUserStore.getState()._hasHydrated;
    const riderReady = useRiderStore.getState()._hasHydrated;
    if (customerReady && riderReady) {
      resolve();
      return;
    }

    const unsubUser = useUserStore.subscribe((s) => {
      if (s._hasHydrated && useRiderStore.getState()._hasHydrated) {
        unsubUser();
        unsubRider();
        resolve();
      }
    });
    const unsubRider = useRiderStore.subscribe((s) => {
      if (s._hasHydrated && useUserStore.getState()._hasHydrated) {
        unsubUser();
        unsubRider();
        resolve();
      }
    });

    // Safety timeout — MMKV is sync, should be instant
    setTimeout(() => {
      useUserStore.getState().setHasHydrated(true);
      useRiderStore.getState().setHasHydrated(true);
      unsubUser();
      unsubRider();
      resolve();
    }, 500);
  });

export const homeHref = (role: AppRole): Href => {
  if (role === "rider") return "/rider";

  // Resume in-progress / unpaid trip instead of the locked home search UI
  const ride = useUserStore.getState().activeRide;
  if (hasBlockingActiveRide(ride)) {
    return "/customer/liveride";
  }
  return "/customer";
};

export const authHref = (role: AppRole): Href =>
  role === "customer" ? "/auth/customer" : "/auth/rider";

export const goHome = (role: AppRole) => {
  router.replace(homeHref(role));
};

export const goRole = () => {
  router.replace("/role");
};

export const goAuth = (role: AppRole) => {
  router.replace(authHref(role));
};

export const persistSession = (params: {
  accessToken: string;
  refreshToken: string;
  role: AppRole;
  user: any;
}) => {
  const { setUser, clearData } = useUserStore.getState();
  const { setUser: setRiderUser, clearRiderData } = useRiderStore.getState();

  tokenStorage.set("access_token", params.accessToken);
  tokenStorage.set("refresh_token", params.refreshToken);
  tokenStorage.set("user_role", params.role);

  if (params.role === "customer") {
    clearRiderData();
    setUser(params.user);
  } else {
    clearData();
    setRiderUser(params.user);
  }
};

export const clearSessionStores = (disconnect?: () => void) => {
  if (disconnect) disconnect();
  tokenStorage.clearAll();
  useUserStore.getState().clearData();
  useRiderStore.getState().clearRiderData();
};
