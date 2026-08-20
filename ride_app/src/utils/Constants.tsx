import { WINDOW_HEIGHT, WINDOW_WIDTH } from "@/utils/responsive";

export const screenHeight = WINDOW_HEIGHT;
export const screenWidth = WINDOW_WIDTH;

export type ThemeId =
  | "ink_coral"
  | "forest_lime"
  | "sand_indigo"
  | "slate_amber"
  | "graphite_teal";

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

export const DEFAULT_THEME: ThemeId = "ink_coral";

/** Fixed map colors — never follow app theme */
export const MapColors = {
  path: "#007AFF",
  pickup: "#158A58",
  drop: "#F16485",
  rider: "#007AFF",
  offline: "#888888",
} as const;

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
