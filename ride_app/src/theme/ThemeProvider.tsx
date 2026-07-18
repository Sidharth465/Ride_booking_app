import { StatusBar } from "expo-status-bar";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { storage } from "@/store/storage";
import {
  AppColors,
  DEFAULT_THEME,
  THEMES,
  ThemeId,
  applyColorPalette,
} from "@/utils/Constants";
import { rebuildThemeStyles } from "@/theme/rebuildThemeStyles";

const STORAGE_KEY = "app_theme_id";

type ThemeContextValue = {
  themeId: ThemeId;
  colors: AppColors;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): ThemeId {
  const raw = storage.getString(STORAGE_KEY);
  if (raw && raw in THEMES) return raw as ThemeId;
  return DEFAULT_THEME;
}

function bootTheme(id: ThemeId) {
  applyColorPalette(THEMES[id]);
  rebuildThemeStyles(THEMES[id]);
}

bootTheme(readStoredTheme());

const DARK_THEMES: ThemeId[] = ["midnight_sky", "forest_lime", "dark"];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeId, setThemeId] = useState<ThemeId>(readStoredTheme);

  const setTheme = useCallback((id: ThemeId) => {
    if (!(id in THEMES)) return;
    applyColorPalette(THEMES[id]);
    rebuildThemeStyles(THEMES[id]);
    storage.set(STORAGE_KEY, id);
    setThemeId(id);
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      colors: THEMES[themeId],
      setTheme,
    }),
    [themeId, setTheme]
  );

  const statusStyle = DARK_THEMES.includes(themeId) ? "light" : "dark";

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={statusStyle} />
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export function useColors(): AppColors {
  return useTheme().colors;
}
