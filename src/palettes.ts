import type { GraphPalette, GraphPaletteName } from "./types";
import { accentSets } from "./accents";

export type AccentSet = readonly [string, string, string];

export const defaultAccents: AccentSet = [
  "lab(92.9449% -44.411 80.292)",
  "lab(89.622% -60.7933 21.1414)",
  "lab(77.5288% -33.8221 -35.2522)",
];

export const graphPalettes: Record<GraphPaletteName, AccentSet> = {
  greenday: [
    "lab(75.3083% -50.8817 16.5941)",
    "lab(64.2127% -33.5133 10.9937)",
    "lab(52.3473% -26.752 8.78495)",
  ],
  orange: [
    "lab(71.4857% 31.7395 50.6703)",
    "lab(59.9849% 27.1583 43.2884)",
    "lab(47.4458% 17.612 27.6482)",
  ],
  smelly: [
    "lab(71.5613% -39.2213 32.0347)",
    "lab(59.4864% -27.9865 22.5741)",
    "lab(48.8016% -22.3829 17.9859)",
  ],
  bluebee: [
    "lab(72.927% -27.9603 -18.655)",
    "lab(61.1772% -22.4508 -14.9579)",
    "lab(48.266% -16.9089 -11.2492)",
  ],
  indigosea: [
    "lab(64.6212% -3.42974 -41.9226)",
    "lab(55.4566% -3.21141 -35.0042)",
    "lab(43.9603% -2.77504 -28.0458)",
  ],
  purple: [
    "lab(65.9315% 23.8296 -37.7086)",
    "lab(54.6046% 19.7722 -31.452)",
    "lab(46.7671% 15.6163 -25.232)",
  ],
  pink: [
    "lab(68.1924% 46.0132 8.22219)",
    "lab(57.0643% 32.9593 5.82368)",
    "lab(46.8598% 26.3926 4.64644)",
  ],
  fire: [
    "lab(63.1816% 61.0248 26.574)",
    "lab(83.7092% 15.1838 49.0253)",
    "lab(91.052% 3.18348 41.0078)",
  ],
  deepsea: [
    "lab(73.7018% -27.0253 -40.4936)",
    "lab(61.4794% 5.08663 -63.0304)",
    "lab(66.9883% -8.56626 -50.0439)",
  ],
  pinkteam: [
    "lab(59.5163% 79.0474 -13.7787)",
    "lab(63.2046% 32.0657 -40.4435)",
    "lab(64.9393% -11.5563 -42.2452)",
  ],
  burning: [
    "lab(59.7009% 67.0661 59.0563)",
    "lab(60.382% 65.0115 2.28822)",
    "lab(78.9059% 22.0683 64.7554)",
  ],
  blueteam: [
    "lab(71.6811% -31.5902 -32.9072)",
    "lab(61.1151% 48.3187 -49.9469)",
    "lab(58.4679% 63.9384 31.5448)",
  ],
  theme: accentSets("theme").light,
  mint: accentSets("mint").light,
  green: accentSets("green").light,
  cyan: accentSets("cyan").light,
  blue: accentSets("blue").light,
  sunset: accentSets("sunset").light,
  ocean: accentSets("ocean").light,
  neon: accentSets("neon").light,
  aurora: accentSets("aurora").light,
  prism: accentSets("prism").light,
};

export const darkGraphPalettes: Partial<Record<GraphPaletteName, AccentSet>> = Object.fromEntries(
  ["theme", "mint", "green", "cyan", "blue", "sunset", "ocean", "neon", "aurora", "prism"].map(
    (id) => [id, accentSets(id).dark],
  ),
);

export const paletteMode = (palette: GraphPalette): "solid" | "duo" | "trio" =>
  palette === "solid" || palette === "mono" ? "solid" : palette === "duo" ? "duo" : "trio";

export const paletteAccents = (palette: GraphPalette, fallback: AccentSet): AccentSet =>
  palette in graphPalettes ? graphPalettes[palette as GraphPaletteName] : fallback;

export const paletteDarkAccents = (palette: GraphPalette, fallback: AccentSet): AccentSet =>
  darkGraphPalettes[palette as GraphPaletteName] ?? paletteAccents(palette, fallback);
