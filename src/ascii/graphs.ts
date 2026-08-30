import { fillTrack } from "./frame";

export const SPARK_GLYPHS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"] as const;
export const STACK_GLYPHS = ["█", "▓", "▒", "░", "#", "=", "+", "-"] as const;

export const GLYPH_PRESETS = {
  shade: ["·", "░", "▒", "▓", "█"],
  ascii: [".", "-", "=", "#", "@"],
  hash: [" ", "#"],
  bar: [" ", "█"],
} as const satisfies Record<string, readonly string[]>;

export type GlyphPreset = keyof typeof GLYPH_PRESETS;

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const glyphScale = (
  glyphs: string | undefined,
  fallback: readonly string[],
): readonly string[] => {
  if (!glyphs) return fallback;
  const preset = GLYPH_PRESETS[glyphs.trim().toLowerCase() as GlyphPreset];
  if (preset) return preset;
  const custom = /^\s*\[([\s\S]*)\]\s*$/
    .exec(glyphs)?.[1]
    ?.split(",")
    .map((entry) => {
      const token = entry.trim();
      const quoted = /^(?:"([\s\S]*)"|'([\s\S]*)')$/.exec(token);
      return quoted ? (quoted[1] ?? quoted[2] ?? "") : token;
    });
  return custom && custom.length >= 2 && custom.every((entry) => entry.length > 0)
    ? custom
    : fallback;
};

export const glyphAt = (scale: readonly string[], ratio: number): string =>
  scale[Math.round(clamp01(ratio) * (scale.length - 1))] ?? scale.at(-1) ?? "█";

export const sparkGlyphs = (values: number[], glyphs?: string): string[] => {
  const peak = Math.max(...values, 1);
  const scale = glyphScale(glyphs, SPARK_GLYPHS);
  return values.map((value) => glyphAt(scale, value / peak));
};

export const meterTrack = (value: number, ticks: number, glyphs?: string): string => {
  const scale = glyphScale(glyphs, ["-", "="]);
  const active = scale.length > 2 ? scale.at(-2)! : scale.at(-1)!;
  return fillTrack(Math.round(clamp01(value) * ticks), ticks, active, scale[0]!);
};

export const miniBars = (values: number[], height: number, glyphs?: string): string[] => {
  const peak = Math.max(...values, 1);
  const fill = glyphScale(glyphs, ["█"]).at(-1)!;
  return Array.from({ length: height }, (_, row) =>
    values
      .map((value) => {
        const level = Math.round((value / peak) * (height - 1));
        return height - 1 - row <= level ? fill : " ";
      })
      .join(" "),
  );
};
