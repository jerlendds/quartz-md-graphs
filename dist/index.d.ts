import { QuartzTransformerPlugin } from '@quartz-community/types';
import { MdGraphsOptions, GraphLimits, GraphNode, GraphScalar, GraphDiagnostic, GraphPaletteName } from './types.js';
export { GraphAnnotation, GraphPalette } from './types.js';

declare function parseGraphMeta(meta?: string): Record<string, string>;
declare const MdGraphs: QuartzTransformerPlugin<Partial<MdGraphsOptions>>;

declare const supportedGraphTypes: readonly ["table", "flow", "bars", "rank", "cells", "meter", "spark", "tree", "timeline", "stack", "funnel", "gantt", "plot", "waffle", "diff", "invoice", "compare", "stat", "kpi", "spec", "activity", "heatmap", "calendar", "waterfall", "uptime", "slope", "bullet", "timer", "countdown", "frame", "matrix", "check", "sheet"];
type SupportedGraphType = (typeof supportedGraphTypes)[number];

declare const defaultGraphLimits: GraphLimits;
declare function parseInfoAttributes(meta?: string): {
    attributes: Record<string, GraphScalar>;
    diagnostics: GraphDiagnostic[];
};
declare function parseGraphFence(input: {
    type: string;
    meta?: string;
    value: string;
    strict?: boolean;
    limits?: Partial<GraphLimits>;
}): GraphNode;

type AccentSet = readonly [string, string, string];
declare const defaultAccents: AccentSet;
declare const graphPalettes: Record<GraphPaletteName, AccentSet>;

type AccentHue = {
    light: string;
    dark: string;
};
type Accent = {
    id: string;
    label: string;
    kind: "solid" | "gradient";
    light: string;
    dark: string;
    swatch: string;
    duo: AccentHue;
    tri: AccentHue;
};
declare const legacyAccentIds: Record<string, string>;
declare const accents: readonly Accent[];
declare const getAccent: (id: string) => Accent;
declare const isAccentId: (value: string | null) => boolean;
declare const accentSets: (id: string) => {
    light: AccentSet;
    dark: AccentSet;
};

declare const widthOf: (value: string) => number;
declare const padEnd: (value: string, size: number) => string;
declare const padStart: (value: string, size: number) => string;
declare const dash: (count: number) => string;
declare const rule: (count: number) => string;
declare const fillTrack: (filled: number, total: number, on?: string, off?: string) => string;
declare const col: (value: string, size: number, align?: "left" | "right") => string;
declare const colWidth: (values: string[]) => number;
declare const frameAscii: (title: string, lines: string[], minInner?: number) => string;

declare const SPARK_GLYPHS: readonly ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
declare const STACK_GLYPHS: readonly ["█", "▓", "▒", "░", "#", "=", "+", "-"];
declare const GLYPH_PRESETS: {
    readonly shade: readonly ["·", "░", "▒", "▓", "█"];
    readonly ascii: readonly [".", "-", "=", "#", "@"];
    readonly hash: readonly [" ", "#"];
    readonly bar: readonly [" ", "█"];
};
declare const glyphScale: (glyphs: string | undefined, fallback: readonly string[]) => readonly string[];
declare const glyphAt: (scale: readonly string[], ratio: number) => string;
declare const sparkGlyphs: (values: number[], glyphs?: string) => string[];
declare const meterTrack: (value: number, ticks: number, glyphs?: string) => string;
declare const miniBars: (values: number[], height: number, glyphs?: string) => string[];

declare const graphExampleTypes: readonly ["table", "sheet", "bars", "rank", "cells", "meter", "spark", "tree", "timeline", "check", "stack", "funnel", "gantt", "waffle", "diff", "invoice", "compare", "matrix", "stat", "kpi", "spec", "waterfall", "uptime", "slope", "bullet"];
declare const supplementalGraphTypes: readonly ["flow", "plot", "activity", "heatmap", "calendar", "timer", "countdown", "frame"];
declare const graphFence: (type: string, body: string, title?: string) => string;

export { GLYPH_PRESETS, GraphDiagnostic, GraphLimits, GraphNode, GraphPaletteName, GraphScalar, MdGraphs, MdGraphsOptions, SPARK_GLYPHS, STACK_GLYPHS, type SupportedGraphType, accentSets, accents, col, colWidth, dash, defaultAccents, defaultGraphLimits, fillTrack, frameAscii, getAccent, glyphAt, glyphScale, graphExampleTypes, graphFence, graphPalettes, isAccentId, legacyAccentIds, meterTrack, miniBars, padEnd, padStart, parseGraphFence, parseGraphMeta, parseInfoAttributes, rule, sparkGlyphs, supplementalGraphTypes, supportedGraphTypes, widthOf };
