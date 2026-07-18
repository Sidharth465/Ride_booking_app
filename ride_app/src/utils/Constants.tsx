import { Dimensions } from "react-native";

export const screenHeight = Dimensions.get("screen").height;
export const screenWidth = Dimensions.get("screen").width;

export type ThemeId =
  | "ink_coral"
  | "forest_lime"
  | "midnight_sky"
  | "sand_indigo"
  | "slate_amber"
  | "graphite_teal"
  | "light"
  | "dark";

export type AppColors = {
  primary: string;
  background: string;
  text: string;
  theme: string;
  secondary: string;
  tertiary: string;
  secondary_light: string;
  iosColor: string;
  surface: string;
  muted: string;
  border: string;
  danger: string;
  onPrimary: string;
};

export const THEME_META: Record<
  ThemeId,
  { label: string; blurb: string; swatches: [string, string, string] }
> = {
  ink_coral: {
    label: "Ink + Coral",
    blurb: "Modern urban with vibrant coral actions",
    swatches: ["#1F2328", "#FF6B6B", "#F7F8FA"],
  },
  forest_lime: {
    label: "Forest + Lime",
    blurb: "Fresh mobility with energetic lime accents",
    swatches: ["#164A41", "#B7F700", "#F5F8F4"],
  },
  midnight_sky: {
    label: "Midnight + Sky",
    blurb: "Tech-inspired navy with electric cyan",
    swatches: ["#1B263B", "#20D8FF", "#F4F8FC"],
  },
  sand_indigo: {
    label: "Sand + Indigo",
    blurb: "Warm travel experience with elegant indigo",
    swatches: ["#F6F1E8", "#3F51B5", "#FFFFFF"],
  },
  slate_amber: {
    label: "Slate + Amber",
    blurb: "Elegant slate with warm amber accents",
    swatches: ["#1E293B", "#F59E0B", "#F8FAFC"],
  },
  graphite_teal: {
    label: "Graphite + Teal",
    blurb: "Sophisticated graphite with vibrant teal",
    swatches: ["#202124", "#14B8A6", "#F8FAFC"],
  },
  light: {
    label: "Light",
    blurb: "Clean bright surfaces with blue accents",
    swatches: ["#FCFCFD", "#2563EB", "#FFFFFF"],
  },
  dark: {
    label: "Dark",
    blurb: "Deep charcoal with cool blue accents",
    swatches: ["#09090B", "#3B82F6", "#18181B"],
  },
};

export const THEMES: Record<ThemeId, AppColors> = {
  ink_coral: {
    primary: "#FF5A4F",
    background: "#F7F4F1",
    text: "#0F1419",
    theme: "#FF5A4F",
    secondary: "#E8E4DF",
    tertiary: "#2A9D8F",
    secondary_light: "#FBF9F7",
    iosColor: "#2A9D8F",
    surface: "#FFFFFF",
    muted: "#3D4A5C",
    border: "#E0DBD5",
    danger: "#DC2626",
    onPrimary: "#FFFFFF",
  },
  forest_lime: {
    primary: "#A3E635",
    background: "#0F1A14",
    text: "#E8F5E9",
    theme: "#A3E635",
    secondary: "#1A2E24",
    tertiary: "#34D399",
    secondary_light: "#132018",
    iosColor: "#34D399",
    surface: "#16241C",
    muted: "#9CB4A6",
    border: "#2A3F34",
    danger: "#F87171",
    onPrimary: "#0F1A14",
  },
  midnight_sky: {
    primary: "#22D3EE",
    background: "#0B1220",
    text: "#E8EEF7",
    theme: "#22D3EE",
    secondary: "#1E293B",
    tertiary: "#7DD3FC",
    secondary_light: "#111827",
    iosColor: "#7DD3FC",
    surface: "#141C2B",
    muted: "#94A3B8",
    border: "#2A3548",
    danger: "#F87171",
    onPrimary: "#0B1220",
  },
  sand_indigo: {
    primary: "#4F46E5",
    background: "#F5F0E8",
    text: "#1E1B4B",
    theme: "#4F46E5",
    secondary: "#E8E0D4",
    tertiary: "#6366F1",
    secondary_light: "#FAF7F2",
    iosColor: "#6366F1",
    surface: "#FFFbf5",
    muted: "#5B5675",
    border: "#DDD4C6",
    danger: "#DC2626",
    onPrimary: "#FFFFFF",
  },
  light: {
    primary: "#FCFCFD",
    background: "#FCFCFD",
    text: "#18181B",
    theme: "#FCFCFD",
    secondary: "#18181B",
    tertiary: "#2563EB",
    secondary_light: "#FCFCFD",
    iosColor: "#2563EB",
    surface: "#FFFFFF",
    muted: "#18181B",
    border: "#E0DBD5",
    danger: "#DC2626",
    onPrimary: "#18181B",
  },

  dark: {
    primary: "#09090B",
    background: "#09090B",
    text: "#F4F4F5",
    theme: "#09090B",
    secondary: "#F4F4F5",
    tertiary: "#3B82F6",
    secondary_light: "#09090B",
    iosColor: "#3B82F6",
    surface: "#09090B",
    muted: "#F4F4F5",
    border: "#E0DBD5",
    danger: "#DC2626",
    onPrimary: "#F4F4F5",
  },
  slate_amber: {
    primary: "#F59E0B",
    background: "#F8FAFC",
    text: "#0F172A",
    theme: "#F59E0B",
    secondary: "#E2E8F0",
    tertiary: "#FBBF24",
    secondary_light: "#FFFFFF",
    iosColor: "#FBBF24",
    surface: "#FFFFFF",
    muted: "#64748B",
    border: "#CBD5E1",
    danger: "#DC2626",
    onPrimary: "#FFFFFF",
  },
  
  graphite_teal: {
    primary: "#14B8A6",
    background: "#F9FAFB",
    text: "#202124",
    theme: "#14B8A6",
    secondary: "#E5E7EB",
    tertiary: "#2DD4BF",
    secondary_light: "#FFFFFF",
    iosColor: "#2DD4BF",
    surface: "#FFFFFF",
    muted: "#6B7280",
    border: "#D1D5DB",
    danger: "#DC2626",
    onPrimary: "#FFFFFF",
  },
};

export const DEFAULT_THEME: ThemeId = "midnight_sky";

/** Fixed map colors — never follow app theme */
export const MapColors = {
  path: "#007AFF",
  pickup: "#158A58",
  drop: "#F16485",
  rider: "#007AFF",
  offline: "#888888",
} as const;

/** Mutable palette — ThemeProvider Object.assigns on change; style rebuilds refresh StyleSheets */
export const Colors: AppColors = { ...THEMES[DEFAULT_THEME] };

export function applyColorPalette(palette: AppColors) {
  Object.assign(Colors, palette);
}

export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
