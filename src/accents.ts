import type { AccentSet } from "./palettes";

export type AccentHue = { light: string; dark: string };
export type Accent = {
  id: string;
  label: string;
  kind: "solid" | "gradient";
  light: string;
  dark: string;
  swatch: string;
  duo: AccentHue;
  tri: AccentHue;
};

export const DEFAULT_ACCENT_ID = "ocean";
const gradientSwatch = (angle: number, a: string, b: string, c: string, mid: number): string =>
  `linear-gradient(${angle}deg, ${a} 0%, ${b} ${mid}%, ${c} 100%)`;

export const legacyAccentIds: Record<string, string> = {
  paper: "theme",
  gold: "sunset",
  lime: "neon",
  sky: "ocean",
  dusk: "aurora",
  coral: "fire",
  mist: "prism",
};

export const accents: readonly Accent[] = [
  {
    id: "theme",
    label: "Theme",
    kind: "solid",
    light: "var(--dark)",
    dark: "var(--light)",
    swatch: "var(--darkgray)",
    duo: { light: "var(--darkgray)", dark: "var(--gray)" },
    tri: { light: "var(--gray)", dark: "var(--darkgray)" },
  },
  {
    id: "mint",
    label: "Mint",
    kind: "solid",
    light: "oklch(0.52 0.14 163)",
    dark: "oklch(0.77 0.15 163)",
    swatch: "oklch(0.77 0.15 163)",
    duo: { light: "oklch(0.58 0.1 163)", dark: "oklch(0.68 0.1 163)" },
    tri: { light: "oklch(0.45 0.08 163)", dark: "oklch(0.58 0.08 163)" },
  },
  {
    id: "orange",
    label: "Orange",
    kind: "solid",
    light: "oklch(0.58 0.16 55)",
    dark: "oklch(0.76 0.14 55)",
    swatch: "oklch(0.76 0.14 55)",
    duo: { light: "oklch(0.5 0.12 55)", dark: "oklch(0.66 0.12 55)" },
    tri: { light: "oklch(0.42 0.08 55)", dark: "oklch(0.55 0.08 55)" },
  },
  {
    id: "green",
    label: "Green",
    kind: "solid",
    light: "oklch(0.5 0.14 145)",
    dark: "oklch(0.74 0.14 145)",
    swatch: "oklch(0.74 0.14 145)",
    duo: { light: "oklch(0.58 0.1 145)", dark: "oklch(0.64 0.1 145)" },
    tri: { light: "oklch(0.42 0.08 145)", dark: "oklch(0.55 0.08 145)" },
  },
  {
    id: "cyan",
    label: "Cyan",
    kind: "solid",
    light: "oklch(0.5 0.1 210)",
    dark: "oklch(0.76 0.1 210)",
    swatch: "oklch(0.76 0.1 210)",
    duo: { light: "oklch(0.58 0.08 210)", dark: "oklch(0.66 0.08 210)" },
    tri: { light: "oklch(0.42 0.06 210)", dark: "oklch(0.55 0.06 210)" },
  },
  {
    id: "blue",
    label: "Blue",
    kind: "solid",
    light: "oklch(0.5 0.18 255)",
    dark: "oklch(0.7 0.12 255)",
    swatch: "oklch(0.7 0.12 255)",
    duo: { light: "oklch(0.58 0.12 255)", dark: "oklch(0.62 0.1 255)" },
    tri: { light: "oklch(0.42 0.1 255)", dark: "oklch(0.52 0.08 255)" },
  },
  {
    id: "purple",
    label: "Purple",
    kind: "solid",
    light: "oklch(0.5 0.16 300)",
    dark: "oklch(0.72 0.12 300)",
    swatch: "oklch(0.72 0.12 300)",
    duo: { light: "oklch(0.58 0.12 300)", dark: "oklch(0.62 0.1 300)" },
    tri: { light: "oklch(0.42 0.08 300)", dark: "oklch(0.55 0.08 300)" },
  },
  {
    id: "pink",
    label: "Pink",
    kind: "solid",
    light: "oklch(0.55 0.18 8)",
    dark: "oklch(0.74 0.14 8)",
    swatch: "oklch(0.74 0.14 8)",
    duo: { light: "oklch(0.5 0.12 8)", dark: "oklch(0.64 0.1 8)" },
    tri: { light: "oklch(0.42 0.08 8)", dark: "oklch(0.55 0.08 8)" },
  },
  {
    id: "sunset",
    label: "Sunset",
    kind: "gradient",
    light: "oklch(0.55 0.18 19)",
    dark: "oklch(0.7 0.19 19)",
    swatch: gradientSwatch(
      135,
      "oklch(0.7 0.19 19)",
      "oklch(0.86 0.12 74)",
      "oklch(0.92 0.1 89)",
      52,
    ),
    duo: { light: "oklch(0.55 0.14 74)", dark: "oklch(0.86 0.12 74)" },
    tri: { light: "oklch(0.52 0.12 89)", dark: "oklch(0.92 0.1 89)" },
  },
  {
    id: "ocean",
    label: "Ocean",
    kind: "gradient",
    light: "oklch(0.5 0.14 228)",
    dark: "oklch(0.77 0.15 228)",
    swatch: gradientSwatch(
      140,
      "oklch(0.77 0.15 228)",
      "oklch(0.59 0.23 259)",
      "oklch(0.72 0.15 248)",
      48,
    ),
    duo: { light: "oklch(0.48 0.18 259)", dark: "oklch(0.68 0.18 259)" },
    tri: { light: "oklch(0.5 0.14 248)", dark: "oklch(0.72 0.15 248)" },
  },
  {
    id: "neon",
    label: "Neon",
    kind: "gradient",
    light: "oklch(0.48 0.16 129)",
    dark: "oklch(0.92 0.23 129)",
    swatch: gradientSwatch(
      145,
      "oklch(0.92 0.23 129)",
      "oklch(0.89 0.18 162)",
      "oklch(0.8 0.15 220)",
      46,
    ),
    duo: { light: "oklch(0.48 0.14 162)", dark: "oklch(0.89 0.18 162)" },
    tri: { light: "oklch(0.5 0.12 220)", dark: "oklch(0.8 0.15 220)" },
  },
  {
    id: "aurora",
    label: "Aurora",
    kind: "gradient",
    light: "oklch(0.55 0.2 351)",
    dark: "oklch(0.68 0.25 351)",
    swatch: gradientSwatch(
      145,
      "oklch(0.68 0.25 351)",
      "oklch(0.5 0.14 307)",
      "oklch(0.6 0.13 244)",
      45,
    ),
    duo: { light: "oklch(0.5 0.14 307)", dark: "oklch(0.7 0.14 307)" },
    tri: { light: "oklch(0.48 0.14 244)", dark: "oklch(0.7 0.13 244)" },
  },
  {
    id: "fire",
    label: "Fire",
    kind: "gradient",
    light: "oklch(0.55 0.18 33)",
    dark: "oklch(0.67 0.22 33)",
    swatch: gradientSwatch(
      145,
      "oklch(0.67 0.22 33)",
      "oklch(0.59 0.22 1)",
      "oklch(0.82 0.15 72)",
      45,
    ),
    duo: { light: "oklch(0.52 0.18 1)", dark: "oklch(0.68 0.2 1)" },
    tri: { light: "oklch(0.55 0.14 72)", dark: "oklch(0.82 0.15 72)" },
  },
  {
    id: "prism",
    label: "Prism",
    kind: "gradient",
    light: "oklch(0.5 0.12 220)",
    dark: "oklch(0.75 0.14 220)",
    swatch: gradientSwatch(
      145,
      "oklch(0.75 0.14 220)",
      "oklch(0.69 0.19 313)",
      "oklch(0.66 0.2 21)",
      45,
    ),
    duo: { light: "oklch(0.52 0.16 313)", dark: "oklch(0.69 0.19 313)" },
    tri: { light: "oklch(0.55 0.18 21)", dark: "oklch(0.66 0.2 21)" },
  },
] as const;

const accentById = new Map(accents.map((accent) => [accent.id, accent]));
export const resolveAccentId = (id: string): string => legacyAccentIds[id] ?? id;
export const getAccent = (id: string): Accent =>
  accentById.get(resolveAccentId(id)) ?? accentById.get(DEFAULT_ACCENT_ID)!;
export const isAccentId = (value: string | null): boolean =>
  Boolean(value && accentById.has(resolveAccentId(value)));
export const accentSets = (id: string): { light: AccentSet; dark: AccentSet } => {
  const accent = getAccent(id);
  return {
    light: [accent.light, accent.duo.light, accent.tri.light],
    dark: [accent.dark, accent.duo.dark, accent.tri.dark],
  };
};
