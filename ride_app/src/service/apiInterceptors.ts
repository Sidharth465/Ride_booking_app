import axios from "axios";
import { BASE_URL } from "./config";
import { tokenStorage } from "@/store/storage";
import { performLogout } from "./authService";

export const appAxios = axios.create({
  baseURL: BASE_URL,
});

let refreshPromise: Promise<string | null> | null = null;

export const refresh_tokens = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = tokenStorage.getString("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
        refresh_token: refreshToken,
      });

      const new_access_token = response?.data?.access_token;
      const new_refresh_token = response?.data?.refresh_token;

      if (!new_access_token || !new_refresh_token) {
        throw new Error("Invalid refresh response");
      }

      tokenStorage.set("access_token", new_access_token);
      tokenStorage.set("refresh_token", new_refresh_token);
      return new_access_token;
    } catch (error) {
      console.log("REFRESH_TOKEN ERROR", error);
      performLogout();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

appAxios.interceptors.request.use(async (config) => {
  const accessToken = tokenStorage.getString("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

appAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refresh_tokens();
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return appAxios(originalRequest);
        }
      } catch (refreshError) {
        console.log("Error refreshing token", refreshError);
      }
    }

    return Promise.reject(error);
  }
);
