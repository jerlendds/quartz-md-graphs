import type { Element, ElementContent, Text } from "hast";
import type { GraphPalette } from "./types";
import { paletteMode } from "./palettes";
import { col, colWidth, fillTrack } from "./ascii/frame";
import {
  GLYPH_PRESETS,
  SPARK_GLYPHS,
  STACK_GLYPHS,
  glyphAt,
  glyphScale,
  sparkGlyphs,
} from "./ascii/graphs";

type Datum = { label: string; value: number };
type RankDatum = Datum & { display?: string };
export const supportedGraphTypes = [
  "table",
  "flow",
  "bars",
  "rank",
  "cells",
  "meter",
  "spark",
  "tree",
  "timeline",
  "stack",
  "funnel",
  "gantt",
  "plot",
  "waffle",
  "diff",
  "invoice",
  "compare",
  "stat",
  "kpi",
  "spec",
  "activity",
  "heatmap",
  "calendar",
  "waterfall",
  "uptime",
  "slope",
  "bullet",
  "timer",
  "countdown",
  "frame",
  "matrix",
  "check",
  "sheet",
] as const;
export type SupportedGraphType = (typeof supportedGraphTypes)[number];
const text = (value: string): Text => ({ type: "text", value });
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const number = (value: string) => Number(value.replace(/[,$%]/g, ""));
const meaningful = (source: string) =>
  source
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !line.trimStart().startsWith("#"));

const properties = (source: string) => {
  const result: Record<string, string> = {};
  for (const line of meaningful(source)) {
    const match = /^([\w.-]+)\s*:\s*(.+)$/.exec(line.trim());
    if (match?.[1] && match[2]) result[match[1]] = match[2];
  }
  return result;
};

const data = (source: string): Datum[] =>
  meaningful(source).flatMap((line) => {
    const match = /^(.+?)\s*=\s*([+-]?[\d,.]+)(?:\s|$)/.exec(line.trim());
    return match?.[1] && match[2] && Number.isFinite(number(match[2]))
      ? [{ label: match[1].trim(), value: number(match[2]) }]
      : [];
  });

const rankData = (source: string): RankDatum[] => {
  if (!/^\s*items\s*:\s*$/im.test(source)) return data(source);
  const items: RankDatum[] = [];
  let item: Partial<RankDatum> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label };
      items.push(item as RankDatum);
      continue;
    }
    if (!item) continue;
    const value = /^\s+value\s*:\s*([+-]?[\d,.]+)\s*$/i.exec(line)?.[1];
    if (value && Number.isFinite(number(value))) item.value = number(value);
    const display = /^\s+display\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (display) item.display = display.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
  }
  return items.filter(
    (item): item is RankDatum => Boolean(item.label) && Number.isFinite(item.value),
  );
};

const bar = (ratio: number, width = 24, glyphs?: string) => {
  const scale = glyphScale(glyphs, ["·", "■"]);
  const filled = Math.round(clamp(ratio) * width);
  return `[${scale.at(-1)!.repeat(filled)}${scale[0]!.repeat(width - filled)}]`;
};

const asciiBar = (ratio: number, ticks: number, marker?: number, glyphs?: string) => {
  const scale = glyphScale(glyphs, ["-", "="]);
  const filled = Math.round(clamp(ratio) * ticks);
  const markerIndex = marker === undefined ? -1 : Math.round(clamp(marker) * ticks) - 1;
  const cells = [...fillTrack(filled, ticks, scale.at(-1)!, scale[0]!)].map((cell, index) =>
    index === markerIndex ? "|" : cell,
  );
  return `[ ${cells.join(" ")} ]`;
};

const rankBar = (ratio: number, ticks: number, glyphs?: string) => {
  const scale = glyphScale(glyphs, ["-", "="]);
  const empty = scale[0]!;
  const filled = scale.at(-1)!;
  const count = Math.round(clamp(ratio) * ticks);
  return `[ ${[...Array<string>(count).fill(filled), ...Array<string>(ticks - count).fill(empty)].join(" ")} ]`;
};

const aligned = (items: Datum[], width = 24, glyphs?: string) => {
  const labelWidth = Math.max(1, colWidth(items.map(({ label }) => label)));
  const max = Math.max(1, ...items.map(({ value }) => Math.abs(value)));
  return items.map(
    ({ label, value }) =>
      `${col(label, labelWidth)}  ${bar(Math.abs(value) / max, width, glyphs)}  ${value.toLocaleString("en-US")}`,
  );
};

const spark = (values: number[], glyphs?: string) => {
  const min = Math.min(...values);
  const range = Math.max(1, Math.max(...values) - min);
  const scale = glyphScale(glyphs, SPARK_GLYPHS);
  return values.map((value) => glyphAt(scale, (value - min) / range)).join("");
};

const sparkData = (source: string): number[][] => {
  const lines = source.split(/\r?\n/);
  const dataIndex = lines.findIndex((line) => /^\s*data\s*:/i.test(line));
  if (dataIndex >= 0) {
    const inline = /^\s*data\s*:\s*\[([^\]]+)\]\s*$/i.exec(lines[dataIndex]!)?.[1];
    if (inline) return [parseSequence(inline)];
    const arrays = lines.slice(dataIndex + 1).flatMap((line) => {
      const match = /^\s*-\s*\[([^\]]+)\]\s*$/.exec(line);
      return match?.[1] ? [parseSequence(match[1])] : [];
    });
    if (arrays.length) return arrays.filter((values) => values.length);
  }
  return meaningful(source).flatMap((line) => {
    const match = /^([^:]+):\s*(\[[^\]]+\]|[-+\d.,\s]+)$/.exec(line.trim());
    if (!match?.[1] || !match[2] || /^(label|caption|glyphs|palette)$/i.test(match[1])) return [];
    const values = parseSequence(match[2]);
    return values.length ? [values] : [];
  });
};

const sparkBody = (source: string, palette: GraphPalette, glyphs?: string): Element | undefined => {
  const series = sparkData(source);
  if (!series.length) return undefined;
  const props = properties(source);
  const mode = paletteMode(palette);
  const explicitColor = /^(accent2|accent3)$/i.test(props.color ?? "")
    ? Number(props.color!.slice(-1)) - 1
    : props.color?.toLowerCase() === "accent"
      ? 0
      : undefined;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--spark"] },
    children: [
      ...series.map((values, seriesIndex): Element => {
        const marks = sparkGlyphs(values, glyphs ?? props.glyphs);
        const colorIndex =
          explicitColor ??
          (mode === "solid" ? 0 : mode === "duo" ? seriesIndex % 2 : seriesIndex % 3);
        return {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__sparkline"] },
          children: marks.map((mark, index): Element => ({
            type: "element",
            tagName: "span",
            properties: {
              className: [
                "md-graph__spark-mark",
                ...(index === marks.length - 1
                  ? ["md-graph__accent", `md-graph__color-${colorIndex}`]
                  : ["md-graph__track"]),
              ],
            },
            children: [text(mark)],
          })),
        };
      }),
      ...(props.label || props.caption
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__caption", "md-graph__spark-caption"] },
              children: [text((props.label ?? props.caption)!)],
            },
          ]
        : []),
    ],
  };
};

const parseSequence = (value: string) =>
  value
    .replace(/^\[|\]$/g, "")
    .split(/[\s,]+/)
    .map(number)
    .filter(Number.isFinite);

const durationSeconds = (value: string) => {
  const units = { d: 86_400, h: 3_600, m: 60, s: 1 } as const;
  let seconds = 0;
  for (const match of value.matchAll(/([\d.]+)\s*([dhms])/g))
    seconds += Number(match[1]) * units[match[2] as keyof typeof units];
  return seconds;
};

const clock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3_600);
  const minutes = Math.floor((safe % 3_600) / 60);
  const rest = safe % 60;
  return `${hours ? `${hours}:` : ""}${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(rest).padStart(2, "0")}`;
};

const tableLines = (source: string) =>
  meaningful(source)
    .filter((line) => line.includes("|"))
    .filter((line) => !/^\s*\|?\s*:?-{3}/.test(line))
    .map((line) =>
      line
        .replace(/^\s*\||\|\s*$/g, "")
        .split("|")
        .map((cell) => cell.trim())
        .join("  │  "),
    );

type TableAlignment = "left" | "center" | "right" | undefined;

const yamlScalar = (value: string): string => {
  const trimmed = value.trim();
  const quoted = /^(?:"([\s\S]*)"|'([\s\S]*)')$/.exec(trimmed);
  return quoted ? (quoted[1] ?? quoted[2] ?? "") : trimmed;
};

const yamlArray = (value: string): string[] | undefined => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return undefined;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) return parsed.map((cell) => String(cell));
  } catch {
    // Accept YAML-like unquoted scalars as a compatibility fallback.
  }
  const cells: string[] = [];
  let cell = "";
  let quote = "";
  for (const character of trimmed.slice(1, -1)) {
    if (quote) {
      if (character === quote) quote = "";
      else cell += character;
    } else if (character === '"' || character === "'") quote = character;
    else if (character === ",") {
      cells.push(yamlScalar(cell));
      cell = "";
    } else cell += character;
  }
  cells.push(yamlScalar(cell));
  return cells;
};

const tableSection = (source: string, name: string): string[] => {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${name}\\s*:`, "i").test(line));
  if (start < 0) return [];
  const inline = lines[start]!.replace(new RegExp(`^${name}\\s*:\\s*`, "i"), "").trim();
  if (inline) return [inline];
  const values: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^[A-Za-z][\w-]*\s*:/.test(line)) break;
    const item = /^\s+-\s*(.+?)\s*$/.exec(line)?.[1];
    if (item) values.push(item);
  }
  return values;
};

const tableAlignmentConfig = (source: string): TableAlignment[] | undefined => {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => /^\s*align\s*:/i.test(line));
  if (start < 0) return undefined;
  const inline = lines[start]!.replace(/^\s*align\s*:\s*/i, "").trim();
  const values = inline
    ? (yamlArray(inline) ?? inline.replace(/^\[|\]$/g, "").split(","))
    : lines.slice(start + 1).flatMap((line) => {
        const match = /^\s*-\s*(left|center|right)\s*$/i.exec(line);
        return match?.[1] ? [match[1]] : [];
      });
  const alignments = values.map((value) => yamlScalar(value).trim().toLowerCase());
  return alignments.every((value) => ["left", "center", "right"].includes(value))
    ? (alignments as TableAlignment[])
    : undefined;
};

const splitTableRow = (line: string): string[] => {
  const cells: string[] = [];
  let cell = "";
  let escaped = false;
  for (const character of line.trim().replace(/^\|/, "").replace(/\|$/, "")) {
    if (escaped) {
      cell += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  if (escaped) cell += "\\";
  cells.push(cell.trim());
  return cells;
};

const parseTable = (source: string) => {
  const structuredHeaders = tableSection(source, "headers");
  if (structuredHeaders.length) {
    const header = yamlArray(structuredHeaders[0]!) ?? structuredHeaders.map(yamlScalar);
    const rows = tableSection(source, "rows").flatMap((value) => {
      const parsed = yamlArray(value);
      return parsed ? [parsed] : [];
    });
    const footerValues = tableSection(source, "footer");
    const footer = footerValues.length
      ? (yamlArray(footerValues[0]!) ?? footerValues.map(yamlScalar))
      : undefined;
    const configuredAlignments = tableAlignmentConfig(source);
    const alignments =
      configuredAlignments?.length === header.length
        ? configuredAlignments
        : header.map((_, index): TableAlignment => (index === 0 ? "left" : "right"));
    if (
      header.length < 2 ||
      !rows.length ||
      rows.some((row) => row.length !== header.length) ||
      (footer && footer.length !== header.length)
    )
      return undefined;
    return { header, alignments, rows, footer };
  }
  const lines = meaningful(source).filter((line) => line.includes("|"));
  if (lines.length < 2) return undefined;
  const header = splitTableRow(lines[0]!);
  const divider = splitTableRow(lines[1]!);
  if (
    header.length < 2 ||
    divider.length !== header.length ||
    !divider.every((cell) => /^:?-{3,}:?$/.test(cell))
  )
    return undefined;
  const dividerAlignments: TableAlignment[] = divider.map((cell) =>
    cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "left",
  );
  const rows = lines.slice(2).map(splitTableRow);
  if (rows.some((row) => row.length !== header.length)) return undefined;
  const configuredAlignments = tableAlignmentConfig(source);
  const alignments =
    configuredAlignments?.length === header.length ? configuredAlignments : dividerAlignments;
  return { header, alignments, rows, footer: undefined };
};

const tableCell = (tagName: "th" | "td", value: string, alignment: TableAlignment): Element => ({
  type: "element",
  tagName,
  properties: {
    ...(tagName === "th" ? { scope: "col" } : {}),
    ...(alignment ? { dataAlign: alignment } : {}),
  },
  children: [text(value)],
});

const tableBody = (source: string): Element | undefined => {
  const parsed = parseTable(source);
  if (!parsed) return undefined;
  const row = (cells: string[], header = false, summary = false): Element => ({
    type: "element",
    tagName: "tr",
    properties: {
      ...(!header && (summary || /^(total|subtotal|net|grand total)$/i.test(cells[0]?.trim() ?? ""))
        ? { className: ["md-graph__table-summary"] }
        : {}),
    },
    children: cells.map((cell, index) =>
      tableCell(header ? "th" : "td", cell, parsed.alignments[index]),
    ),
  });
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--table"] },
    children: [
      {
        type: "element",
        tagName: "table",
        properties: {
          className: ["md-graph__table", ...(parsed.footer ? ["md-graph__table--footer"] : [])],
        },
        children: [
          {
            type: "element",
            tagName: "thead",
            properties: {},
            children: [row(parsed.header, true)],
          },
          {
            type: "element",
            tagName: "tbody",
            properties: {},
            children: parsed.rows.map((cells) => row(cells)),
          },
          ...(parsed.footer
            ? [
                {
                  type: "element" as const,
                  tagName: "tfoot",
                  properties: {},
                  children: [row(parsed.footer, false, true)],
                },
              ]
            : []),
        ],
      },
    ],
  };
};

type SheetSection = { title: string; rows: string[][] };

const sheetSections = (source: string): SheetSection[] => {
  const sections: SheetSection[] = [];
  let section: SheetSection | undefined;
  let insideSections = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^sections\s*:\s*$/i.test(line)) {
      insideSections = true;
      continue;
    }
    if (!insideSections) continue;
    const title = /^\s{2}-\s*title\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (title) {
      section = { title: yamlScalar(title), rows: [] };
      sections.push(section);
      continue;
    }
    if (!section || /^\s+rows\s*:\s*$/i.test(line)) continue;
    const row = /^\s{4,}-\s*(\[[\s\S]*\])\s*$/.exec(line)?.[1];
    const cells = row ? yamlArray(row) : undefined;
    if (cells) section.rows.push(cells);
  }
  return sections.filter(({ rows }) => rows.length);
};

const sheetBody = (source: string): Element | undefined => {
  const headerValues = tableSection(source, "headers");
  if (!headerValues.length) return undefined;
  const header = yamlArray(headerValues[0]!) ?? headerValues.map(yamlScalar);
  const sections = sheetSections(source);
  if (
    header.length < 2 ||
    !sections.length ||
    sections.some(({ rows }) => rows.some((row) => row.length !== header.length))
  )
    return undefined;
  const configured = tableAlignmentConfig(source);
  const alignments =
    configured?.length === header.length
      ? configured
      : header.map((_, index): TableAlignment => (index === 0 ? "left" : "right"));
  const cells = (values: string[], tagName: "th" | "td" = "td") =>
    values.map((value, index) => tableCell(tagName, value, alignments[index]));
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--sheet"] },
    children: [
      {
        type: "element",
        tagName: "table",
        properties: { className: ["md-graph__table", "md-graph__sheet"] },
        children: [
          {
            type: "element",
            tagName: "thead",
            properties: {},
            children: [
              { type: "element", tagName: "tr", properties: {}, children: cells(header, "th") },
            ],
          },
          ...sections.map((section, index): Element => ({
            type: "element",
            tagName: "tbody",
            properties: {
              className: ["md-graph__sheet-section"],
              dataSectionIndex: index,
            },
            children: [
              {
                type: "element",
                tagName: "tr",
                properties: { className: ["md-graph__sheet-heading"] },
                children: [
                  {
                    type: "element",
                    tagName: "th",
                    properties: { colSpan: header.length, scope: "rowgroup" },
                    children: [text(section.title)],
                  },
                ],
              },
              ...section.rows.map((row): Element => ({
                type: "element",
                tagName: "tr",
                properties: {},
                children: cells(row),
              })),
            ],
          })),
        ],
      },
    ],
  };
};

type FlowTone = "accent" | "muted" | "default";
type FlowNode = { label: string; tone: FlowTone; stretch: boolean };

const parseFlowNodes = (source: string): FlowNode[][] | undefined => {
  const rows: FlowNode[][] = [];
  let row: FlowNode[] | undefined;
  let node: FlowNode | undefined;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*nodes\s*:\s*$/i.test(line)) {
      row = [];
      rows.push(row);
      node = undefined;
      continue;
    }
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label && row) {
      node = { label, tone: "default", stretch: false };
      row.push(node);
      continue;
    }
    const tone = /^\s*tone\s*:\s*(accent|muted|default)\s*$/i.exec(line)?.[1] as
      FlowTone | undefined;
    if (tone && node) node.tone = tone;
    const stretch = /^\s*stretch\s*:\s*(true|false)\s*$/i.exec(line)?.[1];
    if (stretch && node) node.stretch = stretch === "true";
  }
  return rows.length && rows.every((nodes) => nodes.length) ? rows : undefined;
};

const flowBody = (source: string): Element | undefined => {
  const rows = parseFlowNodes(source);
  if (!rows) return undefined;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--flow"] },
    children: rows.map((nodes) => ({
      type: "element",
      tagName: "div",
      properties: { className: ["md-graph__flow-row"] },
      children: nodes.flatMap((node, index): ElementContent[] => [
        ...(index
          ? [
              {
                type: "element" as const,
                tagName: "span",
                properties: {
                  className: [
                    "md-graph__flow-connector",
                    ...(node.stretch ? ["md-graph__flow-connector--stretch"] : []),
                    ...(node.tone === "accent" ? ["md-graph__flow-tone--accent"] : []),
                  ],
                },
                children: node.stretch ? [] : [text("- - -▶")],
              },
            ]
          : []),
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["md-graph__flow-node", `md-graph__flow-tone--${node.tone}`],
          },
          children: [text(node.label)],
        },
      ]),
    })),
  };
};

type GraphTextColor = "accent" | "accent2" | "accent3" | "dark" | "light";
type TreeItem = { label: string; meta?: string; color?: GraphTextColor; children: TreeItem[] };

const textColorClasses = (color?: GraphTextColor): string[] => {
  if (!color) return [];
  if (color === "dark" || color === "light") return [`md-graph__tone--${color}`];
  const index = color === "accent" ? 0 : Number(color.slice(-1)) - 1;
  return ["md-graph__accent", `md-graph__color-${index}`];
};

const parseTreeNodes = (source: string): TreeItem[] | undefined => {
  if (!/^nodes\s*:\s*$/im.test(source)) return undefined;
  const roots: TreeItem[] = [];
  const stack: { indent: number; node: TreeItem }[] = [];
  let current: TreeItem | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^(\s*)-\s*label\s*:\s*(.+?)\s*$/i.exec(line);
    if (label?.[2]) {
      const indent = label[1]!.length;
      const node: TreeItem = { label: yamlScalar(label[2]), children: [] };
      while (stack.length && stack.at(-1)!.indent >= indent) stack.pop();
      if (stack.length) stack.at(-1)!.node.children.push(node);
      else roots.push(node);
      stack.push({ indent, node });
      current = node;
      continue;
    }
    if (!current) continue;
    const meta = /^\s+meta\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (meta) current.meta = yamlScalar(meta);
    const color = /^\s+color\s*:\s*(accent|accent2|accent3|dark|light)\s*$/i.exec(line)?.[1] as
      GraphTextColor | undefined;
    if (color) current.color = color;
  }
  return roots.length ? roots : undefined;
};

type FlatTreeItem = TreeItem & { branch: string };
const flattenTree = (nodes: TreeItem[], prefix = "", root = true): FlatTreeItem[] => {
  const singleRoot = root && nodes.length === 1;
  return nodes.flatMap((node, index) => {
    const last = index === nodes.length - 1;
    const branch = singleRoot ? "" : `${prefix}${last ? "└─ " : "├─ "}`;
    const childPrefix = singleRoot ? "" : `${prefix}${last ? "   " : "│  "}`;
    return [{ ...node, branch }, ...flattenTree(node.children, childPrefix, false)];
  });
};

const treeBody = (source: string): Element | undefined => {
  const nodes = parseTreeNodes(source);
  if (!nodes) return undefined;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--tree"] },
    children: flattenTree(nodes).map((node): Element => {
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__tree-row"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__tree-name"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__tree-branch"] },
                children: [text(node.branch)],
              },
              {
                type: "element",
                tagName: "span",
                properties: {
                  className: ["md-graph__tree-label", ...textColorClasses(node.color)],
                },
                children: [text(node.label)],
              },
            ],
          },
          ...(node.meta
            ? [
                {
                  type: "element" as const,
                  tagName: "span",
                  properties: { className: ["md-graph__tree-meta"] },
                  children: [text(node.meta)],
                },
              ]
            : []),
        ],
      };
    }),
  };
};

type TimelineColor = "accent" | "accent2" | "accent3" | "muted" | "ink";
type TimelineEvent = { date: string; label: string; color?: TimelineColor };

const timelineColorClasses = (color: TimelineColor = "ink"): string[] => {
  if (color === "muted" || color === "ink") return [`md-graph__tone--${color}`];
  return textColorClasses(color);
};

const parseTimelineEvents = (source: string): TimelineEvent[] | undefined => {
  if (!/^events\s*:\s*$/im.test(source)) return undefined;
  const events: TimelineEvent[] = [];
  let event: Partial<TimelineEvent> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const date = /^\s*-\s*date\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (date) {
      event = { date: yamlScalar(date) };
      events.push(event as TimelineEvent);
      continue;
    }
    if (!event) continue;
    const label = /^\s+label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) event.label = yamlScalar(label);
    const color = /^\s+color\s*:\s*(accent|accent2|accent3|muted|ink)\s*$/i.exec(line)?.[1] as
      TimelineColor | undefined;
    if (color) event.color = color;
  }
  const parsed = events.filter((event): event is TimelineEvent =>
    Boolean(event.date && event.label),
  );
  return parsed.length ? parsed : undefined;
};

const timelineBody = (source: string): Element | undefined => {
  const events = parseTimelineEvents(source);
  if (!events) return undefined;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--timeline"] },
    children: events.map((event, index): Element => {
      const color = event.color ?? "ink";
      const colorClasses = timelineColorClasses(color);
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "md-graph__timeline-event",
            ...colorClasses,
            ...(color === "muted" ? ["md-graph__timeline-event--muted"] : []),
            ...(index === events.length - 1 ? ["md-graph__timeline-event--last"] : []),
          ],
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__timeline-marker"] },
            children: [text(color === "muted" ? "○" : "●")],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__timeline-date"] },
            children: [text(event.date)],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__timeline-label"] },
            children: [text(event.label)],
          },
        ],
      };
    }),
  };
};

type CheckColor = TimelineColor | `#${string}`;
type CheckItem = {
  label: string;
  done: boolean;
  note?: string;
  symbol?: string;
  color?: CheckColor;
};

const parseCheckItems = (source: string): CheckItem[] | undefined => {
  if (!/^items\s*:\s*$/im.test(source)) return undefined;
  const items: CheckItem[] = [];
  let item: Partial<CheckItem> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label), done: false };
      items.push(item as CheckItem);
      continue;
    }
    if (!item) continue;
    const done = /^\s+done\s*:\s*(true|false)\s*$/i.exec(line)?.[1];
    if (done) item.done = done.toLowerCase() === "true";
    const note = /^\s+note\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (note) item.note = yamlScalar(note);
    const symbol = /^\s+symbol\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (symbol) item.symbol = yamlScalar(symbol);
    const colorSource = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (colorSource) {
      const color = yamlScalar(colorSource);
      if (
        /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
          color,
        )
      ) {
        item.color = color as CheckColor;
      }
    }
  }
  return items.filter(({ label }) => Boolean(label)).length ? items : undefined;
};

const checkBody = (source: string): Element | undefined => {
  const items = parseCheckItems(source);
  if (!items) return undefined;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--check"] },
    children: items.map((item): Element => {
      const hex = item.color?.startsWith("#") ? item.color : undefined;
      const named: TimelineColor = hex
        ? "accent"
        : ((item.color as TimelineColor | undefined) ?? (item.done ? "accent" : "muted"));
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "md-graph__check-item",
            ...(!item.done ? ["md-graph__check-item--open"] : []),
          ],
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["md-graph__check-marker", ...timelineColorClasses(named)],
              ...(hex ? { style: `color:${hex}` } : {}),
            },
            children: [text(`[${item.done ? (item.symbol ?? "x") : " "}]`)],
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__check-copy"] },
            children: [
              {
                type: "element" as const,
                tagName: "span",
                properties: { className: ["md-graph__check-label"] },
                children: [text(item.label)],
              },
              ...(item.note
                ? [
                    {
                      type: "element" as const,
                      tagName: "span",
                      properties: { className: ["md-graph__check-note"] },
                      children: [text(item.note)],
                    },
                  ]
                : []),
            ],
          },
        ],
      };
    }),
  };
};

type StackSegment = { label: string; value: number; color?: TimelineColor };
type StackRow = { label: string; segments: StackSegment[] };

const parseStackRows = (source: string): StackRow[] | undefined => {
  if (!/^rows\s*:\s*$/im.test(source)) return undefined;
  const rows: StackRow[] = [];
  let row: StackRow | undefined;
  let segment: Partial<StackSegment> | undefined;
  let inSegments = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s{4}segments\s*:\s*$/i.test(line)) {
      inSegments = true;
      continue;
    }
    const label = /^(\s*)-\s*label\s*:\s*(.+?)\s*$/i.exec(line);
    if (label?.[2]) {
      if (label[1]!.length <= 2) {
        row = { label: yamlScalar(label[2]), segments: [] };
        rows.push(row);
        segment = undefined;
        inSegments = false;
      } else if (row && inSegments) {
        segment = { label: yamlScalar(label[2]) };
        row.segments.push(segment as StackSegment);
      }
      continue;
    }
    const value = /^\s+value\s*:\s*([+-]?[\d.]+)\s*$/i.exec(line)?.[1];
    if (segment && value && Number.isFinite(Number(value))) segment.value = Number(value);
    const color = /^\s+color\s*:\s*(accent|accent2|accent3|muted|ink)\s*$/i.exec(line)?.[1] as
      TimelineColor | undefined;
    if (segment && color) segment.color = color;
  }
  const parsed = rows.filter((row) => row.segments.some((entry) => Number.isFinite(entry.value)));
  return parsed.length ? parsed : undefined;
};

const stackCounts = (segments: StackSegment[], ticks: number): number[] => {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0) || 1;
  const raw = segments.map((segment) => (Math.max(0, segment.value) / total) * ticks);
  const counts = raw.map(Math.floor);
  let remaining = ticks - counts.reduce((sum, count) => sum + count, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; remaining > 0; index++, remaining--)
    counts[order[index % order.length]!.index]!++;
  return counts;
};

const stackBody = (source: string, glyphs?: string): Element | undefined => {
  const rows = parseStackRows(source);
  if (!rows) return undefined;
  const props = properties(source);
  const ticks = Math.max(1, Math.round(Number(props.ticks) || 24));
  const scale = glyphScale(glyphs ?? props.glyphs, STACK_GLYPHS);
  const legend = [...new Set(rows.flatMap((row) => row.segments.map(({ label }) => label)))];
  const accentedLabel = legend.includes(props.accent ?? "") ? props.accent! : legend[0]!;
  const explicitColors = new Map<string, TimelineColor>();
  for (const row of rows) {
    for (const segment of row.segments) {
      if (segment.color && !explicitColors.has(segment.label)) {
        explicitColors.set(segment.label, segment.color);
      }
    }
  }
  const segmentColor = (label: string): string[] =>
    timelineColorClasses(
      explicitColors.get(label) ?? (label === accentedLabel ? "accent" : "muted"),
    );
  const glyphFor = (label: string) => scale[legend.indexOf(label) % scale.length] ?? "█";
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--stack"],
      style: `--md-graph-stack-ticks:${ticks}`,
    },
    children: [
      ...rows.map((row): Element => {
        const counts = stackCounts(row.segments, ticks);
        return {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__stack-row"] },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__stack-row-label"] },
              children: [text(row.label)],
            },
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__stack-track"] },
              children: row.segments.flatMap((segment, index) =>
                Array.from({ length: counts[index] ?? 0 }, (): Element => ({
                  type: "element" as const,
                  tagName: "span",
                  properties: {
                    className: ["md-graph__stack-cell", ...segmentColor(segment.label)],
                  },
                  children: [text(glyphFor(segment.label))],
                })),
              ),
            },
          ],
        };
      }),
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__stack-legend"] },
        children: legend.map((label): Element => ({
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__stack-key"] },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__stack-key-glyph", ...segmentColor(label)] },
              children: [text(glyphFor(label))],
            },
            text(` ${label}`),
          ],
        })),
      },
    ],
  };
};

type FunnelStep = {
  label: string;
  value: number;
  display?: string;
  color?: TimelineColor;
};

const parseFunnelSteps = (source: string): FunnelStep[] | undefined => {
  if (!/^steps\s*:\s*$/im.test(source)) return undefined;
  const steps: FunnelStep[] = [];
  let step: Partial<FunnelStep> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      step = { label: yamlScalar(label) };
      steps.push(step as FunnelStep);
      continue;
    }
    if (!step) continue;
    const value = /^\s+value\s*:\s*([+-]?[\d.]+)\s*$/i.exec(line)?.[1];
    if (value && Number.isFinite(Number(value))) step.value = Number(value);
    const display = /^\s+display\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (display) step.display = yamlScalar(display);
    const color = /^\s+color\s*:\s*(accent|accent2|accent3|ink|muted)\s*$/i.exec(line)?.[1] as
      TimelineColor | undefined;
    if (color) step.color = color;
  }
  const parsed = steps.filter((step) => step.label && Number.isFinite(step.value));
  return parsed.length ? parsed : undefined;
};

const funnelBody = (source: string, glyphs?: string): Element | undefined => {
  const steps = parseFunnelSteps(source);
  if (!steps) return undefined;
  const props = properties(source);
  const ticks = Math.max(1, Math.round(Number(props.ticks) || 20));
  const peak = Math.max(steps[0]?.value ?? 0, 1);
  const focusedStage = steps.some(({ label }) => label === props.stage) ? props.stage : undefined;
  const scale = glyphScale(glyphs ?? props.glyphs, ["-", "█"]);
  const empty = scale[0] ?? "-";
  const filled = scale.length > 2 ? scale.at(-2)! : (scale.at(-1) ?? "█");
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--funnel"],
      style: `--md-graph-funnel-ticks:${ticks}`,
    },
    children: steps.map((step, stepIndex): Element => {
      const ratio = Math.max(0, step.value) / peak;
      const count = Math.min(ticks, Math.max(step.value > 0 ? 1 : 0, Math.round(ratio * ticks)));
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "md-graph__funnel-row",
            ...(focusedStage && step.label !== focusedStage
              ? ["md-graph__funnel-row--receded"]
              : []),
          ],
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__funnel-label"] },
            children: [text(step.label)],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__funnel-track"] },
            children: Array.from({ length: ticks }, (_, index): Element => ({
              type: "element",
              tagName: "span",
              properties: {
                className: [
                  "md-graph__funnel-cell",
                  ...(index < count
                    ? [
                        "md-graph__funnel-cell--filled",
                        ...timelineColorClasses(step.color ?? "accent"),
                      ]
                    : ["md-graph__funnel-cell--empty"]),
                ],
              },
              children: [text(index < count ? filled : empty)],
            })),
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__funnel-value"] },
            children: [text(step.display ?? step.value.toLocaleString("en-US"))],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__funnel-percent"] },
            children: [text(stepIndex === 0 ? "" : `${Math.round(ratio * 100)}%`)],
          },
        ],
      };
    }),
  };
};

type GanttItem = {
  label: string;
  start: number;
  end: number;
  complete: number;
  color?: TimelineColor;
};

const parseGanttItems = (source: string): GanttItem[] | undefined => {
  if (!/^items\s*:\s*$/im.test(source)) return undefined;
  const items: GanttItem[] = [];
  let item: Partial<GanttItem> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label), complete: 1 };
      items.push(item as GanttItem);
      continue;
    }
    if (!item) continue;
    const numeric = /^\s+(start|end|complete)\s*:\s*([+-]?[\d.]+)\s*$/i.exec(line);
    if (numeric?.[1] && numeric[2] && Number.isFinite(Number(numeric[2]))) {
      item[numeric[1].toLowerCase() as "start" | "end" | "complete"] = Number(numeric[2]);
    }
    const color = /^\s+color\s*:\s*(accent|accent2|accent3|muted|ink)\s*$/i.exec(line)?.[1] as
      TimelineColor | undefined;
    if (color) item.color = color;
  }
  const parsed = items.filter(
    (item) => item.label && Number.isFinite(item.start) && Number.isFinite(item.end),
  );
  return parsed.length ? parsed : undefined;
};

const ganttBody = (source: string, glyphs?: string): Element | undefined => {
  const items = parseGanttItems(source);
  if (!items) return undefined;
  const props = properties(source);
  const columns = Math.max(1, Math.round(Number(props.columns) || 24));
  const progress = Number(props.progress);
  const hasProgress = Number.isFinite(progress);
  const tickLabels = yamlArray(props.ticks ?? "") ?? [];
  const focusedStage = items.some(({ label }) => label === props.stage) ? props.stage : undefined;
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade!);
  const filledGlyph = scale.at(-1) ?? "█";
  const remainingGlyph = scale[1] ?? scale[0] ?? "░";
  const track = (children: Element[], className: string[]): Element => ({
    type: "element",
    tagName: "span",
    properties: { className },
    children,
  });
  const rows: Element[] = [];
  if (hasProgress) {
    const playhead = Math.round(clamp(progress) * (columns - 1));
    rows.push({
      type: "element",
      tagName: "div",
      properties: { className: ["md-graph__gantt-row", "md-graph__gantt-progress-row"] },
      children: [
        { type: "element", tagName: "span", properties: {}, children: [text("")] },
        track(
          Array.from({ length: columns }, (_, index): Element => ({
            type: "element",
            tagName: "span",
            properties: {
              className: [
                "md-graph__gantt-cell",
                ...(index === playhead ? ["md-graph__accent"] : []),
              ],
            },
            children: [text(index === playhead ? "▾" : " ")],
          })),
          ["md-graph__gantt-track", "md-graph__gantt-playhead"],
        ),
      ],
    });
  }
  for (const item of items) {
    const start = Math.min(columns - 1, Math.max(0, Math.round(clamp(item.start) * columns)));
    const end = Math.min(columns, Math.max(start + 1, Math.round(clamp(item.end) * columns)));
    const completed = Math.round(clamp(item.complete) * (end - start));
    const color = item.color ?? (item.label === focusedStage ? "accent" : "ink");
    rows.push({
      type: "element",
      tagName: "div",
      properties: {
        className: [
          "md-graph__gantt-row",
          ...(focusedStage && item.label !== focusedStage ? ["md-graph__gantt-row--receded"] : []),
        ],
      },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__gantt-label", ...timelineColorClasses(color)] },
          children: [text(item.label)],
        },
        track(
          Array.from({ length: columns }, (_, index): Element => {
            const inside = index >= start && index < end;
            const done = inside && index < start + completed;
            return {
              type: "element",
              tagName: "span",
              properties: {
                className: [
                  "md-graph__gantt-cell",
                  ...(done
                    ? ["md-graph__gantt-cell--done", ...timelineColorClasses(color)]
                    : inside
                      ? ["md-graph__gantt-cell--remaining"]
                      : ["md-graph__gantt-cell--empty"]),
                ],
              },
              children: [text(done ? filledGlyph : inside ? remainingGlyph : "-")],
            };
          }),
          ["md-graph__gantt-track"],
        ),
      ],
    });
  }
  if (tickLabels.length) {
    rows.push({
      type: "element",
      tagName: "div",
      properties: { className: ["md-graph__gantt-row", "md-graph__gantt-axis-row"] },
      children: [
        { type: "element", tagName: "span", properties: {}, children: [text("")] },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__gantt-axis"] },
          children: tickLabels.map((label, index): Element => ({
            type: "element",
            tagName: "span",
            properties: {
              className: ["md-graph__gantt-tick"],
              style: `left:${tickLabels.length === 1 ? 0 : (index / (tickLabels.length - 1)) * 100}%`,
            },
            children: [text(label)],
          })),
        },
      ],
    });
  }
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--gantt"],
      style: `--md-graph-gantt-columns:${columns}`,
    },
    children: rows,
  };
};

const plotBody = (source: string, glyphs?: string): Element | undefined => {
  const props = properties(source);
  const values = parseSequence(props.data ?? "");
  if (!values.length) return undefined;
  const labels = tableSection(source, "labels").map(yamlScalar);
  const height = Math.max(1, Math.round(Number(props.height) || 7));
  const variant = props.variant === "line" ? "line" : "area";
  const progress = Number.isFinite(Number(props.progress)) ? clamp(Number(props.progress)) : 1;
  const revealed = Math.min(values.length, Math.max(0, Math.ceil(progress * values.length)));
  const peak = Math.max(...values, 1);
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade!);
  const cap = scale.at(-1) ?? "█";
  const fill = scale[1] ?? scale[0] ?? "░";
  const rows = Array.from({ length: height }, (_, row): Element => ({
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__plot-row"] },
    children: values.map((value, column): Element => {
      const capRow = height - 1 - Math.round((Math.max(0, value) / peak) * (height - 1));
      const visible = column < revealed;
      const isCap = visible && row === capRow;
      const isArea = visible && variant === "area" && row > capRow;
      const accented = column === revealed - 1;
      return {
        type: "element",
        tagName: "span",
        properties: {
          className: [
            "md-graph__plot-cell",
            ...(isCap ? ["md-graph__plot-cell--cap"] : []),
            ...(isArea ? ["md-graph__plot-cell--fill"] : []),
            ...(accented && isCap ? ["md-graph__accent"] : isCap ? ["md-graph__tone--ink"] : []),
          ],
        },
        children: [text(isCap ? cap : isArea ? fill : " ")],
      };
    }),
  }));
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--plot"],
      style: `--md-graph-plot-columns:${values.length};--md-graph-plot-height:${height}`,
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__plot-chart"] },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__plot-y-axis"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: {},
                children: [text(String(peak))],
              },
              { type: "element", tagName: "span", properties: {}, children: [text("0")] },
            ],
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__plot-canvas"] },
            children: rows,
          },
        ],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__plot-label-row"] },
        children: [
          { type: "element", tagName: "span", properties: {}, children: [text("")] },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__plot-x-axis"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: {},
                children: [text(labels[0] ?? "")],
              },
              {
                type: "element",
                tagName: "span",
                properties: {},
                children: [text(labels.at(-1) ?? labels[0] ?? "")],
              },
            ],
          },
        ],
      },
    ],
  };
};

const waffleBody = (source: string, glyphs?: string): Element | undefined => {
  const props = properties(source);
  if (!props.value || !Number.isFinite(Number(props.value))) return undefined;
  const value = clamp(Number(props.value));
  const cells = Math.max(1, Math.round(Number(props.cells) || 100));
  const columns = Math.max(1, Math.round(Number(props.columns) || 10));
  const filled = Math.round(value * cells);
  const requestedGlyphs = glyphs ?? props.glyphs;
  const scale = glyphScale(requestedGlyphs, GLYPH_PRESETS.shade!);
  const active = scale.at(-1) ?? "█";
  const empty =
    !requestedGlyphs || requestedGlyphs.trim().toLowerCase() === "shade"
      ? (scale[1] ?? scale[0] ?? "░")
      : (scale[0] ?? " ");
  const requestedColor = yamlScalar(props.color ?? "accent");
  const hexColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(requestedColor)
    ? requestedColor
    : undefined;
  const namedColor = /^(accent|accent2|accent3|muted|ink)$/.test(requestedColor)
    ? (requestedColor as TimelineColor)
    : "accent";
  const colorClasses = hexColor
    ? ["md-graph__waffle-color--custom"]
    : timelineColorClasses(namedColor);
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--waffle"],
      style: `--md-graph-waffle-columns:${columns}${hexColor ? `;--md-graph-waffle-color:${hexColor}` : ""}`,
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__waffle-grid"] },
        children: Array.from({ length: cells }, (_, index): Element => ({
          type: "element",
          tagName: "span",
          properties: {
            className: [
              "md-graph__waffle-cell",
              ...(index < filled
                ? ["md-graph__waffle-cell--filled", ...colorClasses]
                : ["md-graph__waffle-cell--empty"]),
            ],
          },
          children: [text(index < filled ? active : empty)],
        })),
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__waffle-percent", ...colorClasses] },
        children: [text(`${Math.round(value * 100)}%`)],
      },
      ...(props.label
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__waffle-label"] },
              children: [text(yamlScalar(props.label))],
            },
          ]
        : []),
    ],
  };
};

type DiffEntry = {
  label: string;
  value: string;
  color?: CheckColor;
  type?: "add" | "remove";
};

const parseDiff = (source: string): { rows: DiffEntry[]; footer?: DiffEntry } | undefined => {
  if (!/^rows\s*:\s*$/im.test(source)) return undefined;
  const rows: DiffEntry[] = [];
  let current: Partial<DiffEntry> | undefined;
  let footer: Partial<DiffEntry> | undefined;
  let inFooter = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^footer\s*:\s*$/i.test(line)) {
      inFooter = true;
      footer = {};
      current = footer;
      continue;
    }
    const rowLabel = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    const footerLabel = inFooter ? /^\s+label\s*:\s*(.+?)\s*$/i.exec(line)?.[1] : undefined;
    if (rowLabel) {
      current = { label: yamlScalar(rowLabel) };
      rows.push(current as DiffEntry);
      continue;
    }
    if (footerLabel && footer) footer.label = yamlScalar(footerLabel);
    if (!current) continue;
    const value = /^\s+value\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (value) current.value = yamlScalar(value);
    const colorSource = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (colorSource) {
      const color = yamlScalar(colorSource);
      if (
        /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
          color,
        )
      ) {
        current.color = color as CheckColor;
      }
    }
    const type = /^\s+type\s*:\s*(add|remove)\s*$/i.exec(line)?.[1] as
      DiffEntry["type"] | undefined;
    if (type) current.type = type;
  }
  const parsedRows = rows.filter(({ label, value }) => Boolean(label && value !== undefined));
  const parsedFooter =
    footer?.label && footer.value !== undefined ? (footer as DiffEntry) : undefined;
  return parsedRows.length ? { rows: parsedRows, footer: parsedFooter } : undefined;
};

const diffColor = (color: CheckColor | undefined): { classes: string[]; style?: string } => {
  if (color?.startsWith("#"))
    return { classes: ["md-graph__diff-color--custom"], style: `color:${color}` };
  return { classes: timelineColorClasses((color as TimelineColor | undefined) ?? "ink") };
};

const diffBody = (source: string): Element | undefined => {
  const parsed = parseDiff(source);
  if (!parsed) return undefined;
  const entry = (item: DiffEntry, footer = false): Element => {
    const tone = diffColor(item.color);
    const sign = item.type === "add" ? "+" : item.type === "remove" ? "−" : "";
    return {
      type: "element",
      tagName: "div",
      properties: {
        className: ["md-graph__diff-row", ...(footer ? ["md-graph__diff-footer"] : [])],
      },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["md-graph__diff-sign", ...tone.classes],
            ...(tone.style ? { style: tone.style } : {}),
          },
          children: [text(sign)],
        },
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["md-graph__diff-label", ...tone.classes],
            ...(tone.style ? { style: tone.style } : {}),
          },
          children: [text(item.label)],
        },
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["md-graph__diff-value", ...tone.classes],
            ...(tone.style ? { style: tone.style } : {}),
          },
          children: [text(item.value)],
        },
      ],
    };
  };
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--diff"] },
    children: [
      ...parsed.rows.map((row) => entry(row)),
      ...(parsed.footer ? [entry(parsed.footer, true)] : []),
    ],
  };
};

type InvoiceParty = { name?: string; lines: string[] };
type InvoiceMeta = { label: string; value: string };
type InvoiceItem = {
  description: string;
  qty?: string;
  rate?: string;
  amount: string;
};
type InvoiceTotal = { label: string; value: string; color?: CheckColor };
type InvoiceData = {
  from?: InvoiceParty;
  to?: InvoiceParty;
  meta: InvoiceMeta[];
  items: InvoiceItem[];
  totals: InvoiceTotal[];
  note?: string;
};

const parseInvoice = (source: string): InvoiceData | undefined => {
  if (!/^items\s*:\s*$/im.test(source)) return undefined;
  const invoice: InvoiceData = { meta: [], items: [], totals: [] };
  let section = "";
  let current: Record<string, unknown> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const heading = /^(from|to|meta|items|totals)\s*:\s*$/i.exec(line)?.[1]?.toLowerCase();
    if (heading) {
      section = heading;
      current = undefined;
      if (heading === "from" || heading === "to") {
        invoice[heading] = { lines: [] };
        current = invoice[heading] as unknown as Record<string, unknown>;
      }
      continue;
    }
    const note = /^note\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (note) {
      invoice.note = yamlScalar(note);
      continue;
    }
    if (section === "from" || section === "to") {
      const party = invoice[section]!;
      const name = /^\s+name\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
      if (name) party.name = yamlScalar(name);
      const detail = /^\s+-\s*(.+?)\s*$/.exec(line)?.[1];
      if (detail) party.lines.push(yamlScalar(detail));
      continue;
    }
    const first = /^\s*-\s*(label|description)\s*:\s*(.+?)\s*$/i.exec(line);
    if (first?.[1] && first[2]) {
      if (section === "meta") {
        current = { label: yamlScalar(first[2]) };
        invoice.meta.push(current as unknown as InvoiceMeta);
      } else if (section === "items") {
        current = { description: yamlScalar(first[2]) };
        invoice.items.push(current as unknown as InvoiceItem);
      } else if (section === "totals") {
        current = { label: yamlScalar(first[2]) };
        invoice.totals.push(current as unknown as InvoiceTotal);
      }
      continue;
    }
    if (!current) continue;
    const field = /^\s+(value|qty|rate|amount)\s*:\s*(.+?)\s*$/i.exec(line);
    if (field?.[1] && field[2]) current[field[1].toLowerCase()] = yamlScalar(field[2]);
    const colorSource = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (colorSource && section === "totals") {
      const color = yamlScalar(colorSource);
      if (
        /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
          color,
        )
      ) {
        current.color = color as CheckColor;
      }
    }
  }
  invoice.meta = invoice.meta.filter(({ label, value }) => Boolean(label && value !== undefined));
  invoice.items = invoice.items.filter(({ description, amount }) =>
    Boolean(description && amount !== undefined),
  );
  invoice.totals = invoice.totals.filter(({ label, value }) =>
    Boolean(label && value !== undefined),
  );
  return invoice.items.length ? invoice : undefined;
};

const invoiceBody = (source: string): Element | undefined => {
  const invoice = parseInvoice(source);
  if (!invoice) return undefined;
  const showQty = invoice.items.some(({ qty }) => qty !== undefined);
  const showRate = invoice.items.some(({ rate }) => rate !== undefined);
  const tableCells = (values: string[], header = false): Element[] =>
    values.map((value, index): Element => ({
      type: "element",
      tagName: "span",
      properties: {
        className: [
          "md-graph__invoice-cell",
          ...(header ? ["md-graph__invoice-cell--header"] : []),
          ...(index > 0 ? ["md-graph__invoice-cell--numeric"] : []),
        ],
      },
      children: [text(value)],
    }));
  const parties = [["FROM", invoice.from] as const, ["BILL TO", invoice.to] as const];
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: [
        "md-graph__body",
        "md-graph__body--invoice",
        ...(showQty ? ["md-graph__invoice--qty"] : []),
        ...(showRate ? ["md-graph__invoice--rate"] : []),
      ],
    },
    children: [
      ...(invoice.from || invoice.to
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__invoice-parties"] },
              children: parties.map(([heading, party]): Element => ({
                type: "element",
                tagName: "div",
                properties: { className: ["md-graph__invoice-party"] },
                children: [
                  {
                    type: "element",
                    tagName: "span",
                    properties: { className: ["md-graph__invoice-kicker"] },
                    children: [text(heading)],
                  },
                  ...(party?.name
                    ? [
                        {
                          type: "element" as const,
                          tagName: "span",
                          properties: { className: ["md-graph__invoice-party-name"] },
                          children: [text(party.name)],
                        },
                      ]
                    : []),
                  ...(party?.lines ?? []).map((line): Element => ({
                    type: "element",
                    tagName: "span",
                    properties: { className: ["md-graph__invoice-party-line"] },
                    children: [text(line)],
                  })),
                ],
              })),
            },
          ]
        : []),
      ...(invoice.meta.length
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__invoice-meta"] },
              children: invoice.meta.map((item): Element => ({
                type: "element",
                tagName: "div",
                properties: { className: ["md-graph__invoice-meta-item"] },
                children: [
                  {
                    type: "element",
                    tagName: "span",
                    properties: { className: ["md-graph__invoice-kicker"] },
                    children: [text(item.label)],
                  },
                  {
                    type: "element",
                    tagName: "span",
                    properties: {},
                    children: [text(item.value)],
                  },
                ],
              })),
            },
          ]
        : []),
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__invoice-table"] },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: {
              className: ["md-graph__invoice-table-row", "md-graph__invoice-table-head"],
            },
            children: tableCells(
              ["Description", ...(showQty ? ["Qty"] : []), ...(showRate ? ["Rate"] : []), "Amount"],
              true,
            ),
          },
          ...invoice.items.map((item): Element => ({
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__invoice-table-row"] },
            children: tableCells([
              item.description,
              ...(showQty ? [item.qty ?? ""] : []),
              ...(showRate ? [item.rate ?? ""] : []),
              item.amount,
            ]),
          })),
        ],
      },
      ...(invoice.totals.length
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__invoice-totals"] },
              children: invoice.totals.map((total): Element => {
                const tone = diffColor(total.color);
                return {
                  type: "element",
                  tagName: "div",
                  properties: { className: ["md-graph__invoice-total"] },
                  children: [
                    {
                      type: "element",
                      tagName: "span",
                      properties: { className: ["md-graph__invoice-total-label"] },
                      children: [text(total.label)],
                    },
                    {
                      type: "element",
                      tagName: "span",
                      properties: {
                        className: ["md-graph__invoice-total-value", ...tone.classes],
                        ...(tone.style ? { style: tone.style } : {}),
                      },
                      children: [text(total.value)],
                    },
                  ],
                };
              }),
            },
          ]
        : []),
      ...(invoice.note
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__invoice-note"] },
              children: [text(invoice.note)],
            },
          ]
        : []),
    ],
  };
};

type CompareRow = { label: string; values: string[] };

const compareBody = (source: string): Element | undefined => {
  const props = properties(source);
  const columns = yamlArray(props.columns ?? "");
  if (!columns?.length || !/^rows\s*:\s*$/im.test(source)) return undefined;
  const rows: CompareRow[] = [];
  let row: CompareRow | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      row = { label: yamlScalar(label), values: [] };
      rows.push(row);
      continue;
    }
    const values = /^\s+values\s*:\s*(\[[\s\S]*\])\s*$/i.exec(line)?.[1];
    if (row && values) row.values = yamlArray(values) ?? [];
  }
  const parsedRows = rows.filter(({ values }) => values.length);
  if (!parsedRows.length) return undefined;
  const accented = columns.indexOf(yamlScalar(props.accent ?? ""));
  const colorSource = yamlScalar(props.color ?? "accent");
  const color =
    /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
      colorSource,
    )
      ? (colorSource as CheckColor)
      : "accent";
  const tone = diffColor(color);
  const accentProperties = () => ({
    className: ["md-graph__compare-accent", ...tone.classes],
    ...(tone.style ? { style: tone.style } : {}),
  });
  const tableRow = (label: string, values: string[], header = false): Element => ({
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__compare-row", ...(header ? ["md-graph__compare-head"] : [])],
      style: `--md-graph-compare-columns:${columns.length}`,
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["md-graph__compare-label"] },
        children: [text(label)],
      },
      ...values.map((value, index): Element => {
        const normalized = value.trim().toLowerCase();
        const positive = normalized === "true";
        const negative = normalized === "false";
        const selected = index === accented;
        const display = positive ? "✓" : negative ? "–" : value;
        return {
          type: "element",
          tagName: "span",
          properties:
            selected && (header || positive)
              ? accentProperties()
              : {
                  className: [
                    "md-graph__compare-value",
                    ...(negative || (!selected && !positive)
                      ? ["md-graph__compare-value--muted"]
                      : []),
                  ],
                },
          children: [text(display)],
        };
      }),
    ],
  });
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--compare"] },
    children: [
      tableRow("", columns, true),
      ...parsedRows.map((row) => tableRow(row.label, row.values)),
    ],
  };
};

const matrixBody = (source: string): Element | undefined => {
  const props = properties(source);
  const columns = yamlArray(props.columns ?? "");
  if (!columns?.length || !/^rows\s*:\s*$/im.test(source)) return undefined;
  const rows: CompareRow[] = [];
  let row: CompareRow | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      row = { label: yamlScalar(label), values: [] };
      rows.push(row);
      continue;
    }
    const values = /^\s+values\s*:\s*(\[[\s\S]*\])\s*$/i.exec(line)?.[1];
    if (row && values) row.values = yamlArray(values) ?? [];
  }
  const parsedRows = rows.filter(({ values }) => values.length);
  if (!parsedRows.length) return undefined;
  const accented = yamlScalar(props.accent ?? "");
  const colorSource = yamlScalar(props.color ?? "accent");
  const color =
    /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
      colorSource,
    )
      ? (colorSource as CheckColor)
      : "accent";
  const tone = diffColor(color);
  const tableRow = (label: string, values: string[], header = false): Element => {
    const selected = !header && label === accented;
    return {
      type: "element",
      tagName: "div",
      properties: {
        className: [
          "md-graph__matrix-row",
          ...(header ? ["md-graph__matrix-head"] : []),
          ...(selected ? ["md-graph__matrix-row--accent"] : []),
        ],
        style: `--md-graph-matrix-columns:${columns.length}`,
      },
      children: [label, ...values].map((value, index): Element => ({
        type: "element",
        tagName: "span",
        properties: {
          className: [
            "md-graph__matrix-cell",
            ...(index ? ["md-graph__matrix-cell--value"] : ["md-graph__matrix-cell--label"]),
            ...(selected ? tone.classes : []),
          ],
          ...(selected && tone.style ? { style: tone.style } : {}),
        },
        children: [text(value)],
      })),
    };
  };
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--matrix"] },
    children: [
      tableRow("", columns, true),
      ...parsedRows.map((item) => tableRow(item.label, item.values)),
    ],
  };
};

type StatItem = { value: string; label: string; hint?: string; color?: CheckColor };

const statBody = (source: string): Element | undefined => {
  if (!/^items\s*:\s*$/im.test(source)) return undefined;
  const items: StatItem[] = [];
  let item: Partial<StatItem> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const first = /^\s*-\s*(value|label)\s*:\s*(.+?)\s*$/i.exec(line);
    if (first?.[1] && first[2]) {
      item = { [first[1].toLowerCase()]: yamlScalar(first[2]) };
      items.push(item as StatItem);
      continue;
    }
    if (!item) continue;
    const field = /^\s+(value|label|hint)\s*:\s*(.+?)\s*$/i.exec(line);
    if (field?.[1] && field[2]) {
      item[field[1].toLowerCase() as "value" | "label" | "hint"] = yamlScalar(field[2]);
    }
    const colorSource = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (colorSource) {
      const color = yamlScalar(colorSource);
      if (
        /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
          color,
        )
      ) {
        item.color = color as CheckColor;
      }
    }
  }
  const parsed = items.filter(({ value, label }) => Boolean(value !== undefined && label));
  if (!parsed.length) return undefined;
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--stat"],
      style: `--md-graph-stat-items:${parsed.length}`,
    },
    children: parsed.map((entry): Element => {
      const tone = diffColor(entry.color);
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__stat-item"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["md-graph__stat-value", ...tone.classes],
              ...(tone.style ? { style: tone.style } : {}),
            },
            children: [text(entry.value)],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__stat-label"] },
            children: [text(entry.label)],
          },
          ...(entry.hint
            ? [
                {
                  type: "element" as const,
                  tagName: "span",
                  properties: { className: ["md-graph__stat-hint"] },
                  children: [text(entry.hint)],
                },
              ]
            : []),
        ],
      };
    }),
  };
};

const kpiBody = (source: string, glyphs?: string): Element | undefined => {
  const props = properties(source);
  const values = parseSequence(props.data ?? "");
  if (props.value === undefined || !props.label || !values.length) return undefined;
  const colorSource = yamlScalar(props.color ?? "accent");
  const color =
    /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
      colorSource,
    )
      ? (colorSource as CheckColor)
      : "accent";
  const tone = diffColor(color);
  const marks = sparkGlyphs(values, glyphs ?? props.glyphs);
  const accentedProperties = (className: string[]) => ({
    className: [...className, ...tone.classes],
    ...(tone.style ? { style: tone.style } : {}),
  });
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--kpi"] },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: accentedProperties(["md-graph__kpi-value"]),
        children: [text(yamlScalar(props.value))],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__kpi-meta"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__kpi-label"] },
            children: [text(yamlScalar(props.label))],
          },
          ...(props.hint
            ? [
                {
                  type: "element" as const,
                  tagName: "span",
                  properties: { className: ["md-graph__kpi-hint"] },
                  children: [text(yamlScalar(props.hint))],
                },
              ]
            : []),
        ],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__kpi-spark"] },
        children: marks.map((mark, index): Element => ({
          type: "element",
          tagName: "span",
          properties:
            index === marks.length - 1
              ? accentedProperties(["md-graph__kpi-mark", "md-graph__kpi-mark--last"])
              : { className: ["md-graph__kpi-mark"] },
          children: [text(mark)],
        })),
      },
    ],
  };
};

type SpecRow = { label: string; value: string; color?: CheckColor };

const specBody = (source: string): Element | undefined => {
  if (!/^rows\s*:\s*$/im.test(source)) return undefined;
  const rows: SpecRow[] = [];
  let row: Partial<SpecRow> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      row = { label: yamlScalar(label) };
      rows.push(row as SpecRow);
      continue;
    }
    if (!row) continue;
    const value = /^\s+value\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (value) row.value = yamlScalar(value);
    const colorSource = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (colorSource) {
      const color = yamlScalar(colorSource);
      if (
        /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
          color,
        )
      ) {
        row.color = color as CheckColor;
      }
    }
  }
  const parsed = rows.filter(({ label, value }) => Boolean(label && value !== undefined));
  if (!parsed.length) return undefined;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--spec"] },
    children: parsed.map((entry): Element => {
      const tone = diffColor(entry.color);
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__spec-row"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__spec-label"] },
            children: [text(entry.label)],
          },
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["md-graph__spec-value", ...tone.classes],
              ...(tone.style ? { style: tone.style } : {}),
            },
            children: [text(entry.value)],
          },
        ],
      };
    }),
  };
};

type ActivityDay = { date: string; count: number };

const generatedActivityDays = (start: string, length: number): ActivityDay[] => {
  const [year, month, day] = start.split("-").map(Number);
  const origin = Date.UTC(year!, month! - 1, day!);
  if (!Number.isFinite(origin)) return [];
  return Array.from({ length: Math.max(0, Math.round(length)) }, (_, index) => {
    const time = origin + index * 86_400_000;
    const date = new Date(time).toISOString().slice(0, 10);
    const dow = new Date(time).getUTCDay();
    const week = Math.floor(index / 7);
    let count = 0;
    if (dow > 0 && dow < 6) {
      const pulse = (week + dow) % 9;
      count = pulse === 0 ? 12 : pulse === 4 ? 7 : pulse % 3 === 0 ? 3 : index % 5 === 0 ? 1 : 0;
    }
    return { date, count };
  });
};

const parseActivityDays = (source: string): ActivityDay[] | undefined => {
  if (!/^days\s*:\s*$/im.test(source)) return undefined;
  const generated = /^\s+activityDays\s*:\s*\[\s*([\d-]+)\s*,\s*(\d+)\s*\]\s*$/im.exec(source);
  if (generated?.[1] && generated[2]) {
    const days = generatedActivityDays(generated[1], Number(generated[2]));
    return days.length ? days : undefined;
  }
  const days: ActivityDay[] = [];
  let current: Partial<ActivityDay> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const inline =
      /^\s*-\s*\{\s*date\s*:\s*["']?([\d-]+)["']?\s*,\s*count\s*:\s*([\d.]+)\s*\}\s*$/i.exec(line);
    if (inline?.[1] && inline[2]) {
      days.push({ date: inline[1], count: Number(inline[2]) });
      continue;
    }
    const date = /^\s*-\s*date\s*:\s*["']?([\d-]+)["']?\s*$/i.exec(line)?.[1];
    if (date) {
      current = { date };
      days.push(current as ActivityDay);
      continue;
    }
    const count = /^\s+count\s*:\s*([\d.]+)\s*$/i.exec(line)?.[1];
    if (current && count) current.count = Number(count);
  }
  const parsed = days.filter(
    ({ date, count }) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(count),
  );
  return parsed.length ? parsed : undefined;
};

const activityBody = (source: string, glyphs?: string): Element | undefined => {
  const supplied = parseActivityDays(source);
  if (!supplied) return undefined;
  const props = properties(source);
  const weekStartsOn = props.weekStartsOn === "1" ? 1 : 0;
  const ordered = [...supplied].sort((a, b) => a.date.localeCompare(b.date));
  const firstTime = Date.parse(`${ordered[0]!.date}T00:00:00Z`);
  const lastTime = Date.parse(`${ordered.at(-1)!.date}T00:00:00Z`);
  const byDate = new Map(ordered.map((day) => [day.date, day.count]));
  const days: ActivityDay[] = [];
  for (let time = firstTime; time <= lastTime; time += 86_400_000) {
    const date = new Date(time).toISOString().slice(0, 10);
    days.push({ date, count: byDate.get(date) ?? 0 });
  }
  const firstDow = new Date(firstTime).getUTCDay();
  const leading = (firstDow - weekStartsOn + 7) % 7;
  const weeks = Math.ceil((leading + days.length) / 7);
  const requestedMax = Number(props.max);
  const peak =
    Number.isFinite(requestedMax) && requestedMax > 0
      ? requestedMax
      : Math.max(...days.map(({ count }) => count), 1);
  const colorSource = yamlScalar(props.color ?? "accent");
  const activityColor =
    /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
      colorSource,
    )
      ? (colorSource as CheckColor)
      : "accent";
  const requestedInkFrom = Number(props.inkFrom);
  const requestedAccentFrom = Number(props.accentFrom);
  const inkFrom = Number.isFinite(requestedInkFrom) ? Math.max(0, requestedInkFrom) : peak * 0.75;
  const accentFrom = Number.isFinite(requestedAccentFrom) ? Math.max(0, requestedAccentFrom) : peak;
  const activityTone = (count: number) => {
    if (count <= 0 || count < inkFrom) return diffColor("muted");
    if (count >= accentFrom) return diffColor(activityColor);
    return diffColor("ink");
  };
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade!);
  const slots: Array<ActivityDay | undefined> = [
    ...Array.from({ length: leading }, () => undefined),
    ...days,
    ...Array.from({ length: weeks * 7 - leading - days.length }, () => undefined),
  ];
  const monthSlots = new Map<number, string>();
  let previousMonth = -1;
  days.forEach((day, index) => {
    const date = new Date(`${day.date}T00:00:00Z`);
    const month = date.getUTCMonth();
    if (month !== previousMonth) {
      const week = Math.floor((leading + index) / 7);
      if (!monthSlots.has(week)) {
        monthSlots.set(week, date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }));
      }
      previousMonth = month;
    }
  });
  const legend = props.legend?.toLowerCase() !== "false";
  const caption =
    props.caption?.toLowerCase() === "false"
      ? undefined
      : yamlScalar(
          props.caption ??
            props.label ??
            `${days.reduce((sum, day) => sum + day.count, 0)} contributions`,
        );
  const weekday = (target: number) => (target - weekStartsOn + 7) % 7;
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: [
        "md-graph__body",
        "md-graph__body--activity",
        ...(weeks <= 54 ? ["md-graph__body--activity-fit"] : []),
      ],
      style: `--md-graph-activity-weeks:${weeks}`,
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__activity-month-row"] },
        children: [
          { type: "element", tagName: "span", properties: {}, children: [text("")] },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__activity-months"] },
            children: [...monthSlots].map(([week, month]): Element => ({
              type: "element",
              tagName: "span",
              properties: { style: `grid-column:${week + 1}` },
              children: [text(month)],
            })),
          },
        ],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__activity-main"] },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__activity-weekdays"] },
            children: [
              [weekday(1), "M"],
              [weekday(3), "W"],
              [weekday(5), "F"],
            ].map(([row, label]): Element => ({
              type: "element",
              tagName: "span",
              properties: { style: `grid-row:${Number(row) + 1}` },
              children: [text(String(label))],
            })),
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__activity-grid"] },
            children: slots.map((day): Element => {
              const ratio = day ? clamp(day.count / peak) : 0;
              const mark = glyphAt(scale, ratio);
              const tone = activityTone(day?.count ?? 0);
              return {
                type: "element",
                tagName: "span",
                properties: {
                  className: ["md-graph__activity-cell", ...tone.classes],
                  ...(tone.style ? { style: tone.style } : {}),
                  ...(day ? { title: `${day.date}: ${day.count}` } : {}),
                },
                children: [text(mark)],
              };
            }),
          },
        ],
      },
      ...(caption || legend
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__activity-footer"] },
              children: [
                {
                  type: "element" as const,
                  tagName: "span",
                  properties: { className: ["md-graph__activity-caption"] },
                  children: [text(caption ?? "")],
                },
                ...(legend
                  ? [
                      {
                        type: "element" as const,
                        tagName: "span",
                        properties: { className: ["md-graph__activity-legend"] },
                        children: [
                          text("Less "),
                          ...scale.map((mark, index): Element => {
                            const representative = (index / Math.max(1, scale.length - 1)) * peak;
                            const tone = activityTone(representative);
                            return {
                              type: "element",
                              tagName: "span",
                              properties: {
                                className: ["md-graph__activity-legend-mark", ...tone.classes],
                                ...(tone.style ? { style: tone.style } : {}),
                              },
                              children: [text(mark)],
                            };
                          }),
                          text(" More"),
                        ],
                      },
                    ]
                  : []),
              ],
            },
          ]
        : []),
    ],
  };
};

type HeatmapRow = { label: string; values: number[] };

const heatmapBody = (
  source: string,
  palette: GraphPalette,
  paletteExplicit: boolean,
  glyphs?: string,
): Element | undefined => {
  const props = properties(source);
  const columns = yamlArray(props.columns ?? "");
  if (!columns?.length || !/^rows\s*:\s*$/im.test(source)) return undefined;
  const rows: HeatmapRow[] = [];
  let row: HeatmapRow | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      row = { label: yamlScalar(label), values: [] };
      rows.push(row);
      continue;
    }
    const values = /^\s+values\s*:\s*(\[[\s\S]*\])\s*$/i.exec(line)?.[1];
    if (row && values) {
      row.values = (yamlArray(values) ?? []).map(Number).filter(Number.isFinite);
    }
  }
  const parsedRows = rows.filter(({ values }) => values.length);
  if (!parsedRows.length) return undefined;
  const requestedMax = Number(props.max);
  const peak =
    Number.isFinite(requestedMax) && requestedMax > 0
      ? requestedMax
      : Math.max(...parsedRows.flatMap(({ values }) => values), 1);
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade!);
  const validHeatmapColor = (value: string): value is CheckColor =>
    /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
      value,
    );
  const requestedColorScale = yamlArray(props.colorScale ?? "")?.filter(validHeatmapColor);
  const colors: CheckColor[] = requestedColorScale?.length
    ? requestedColorScale
    : ["muted", "accent2", "accent2", "accent", "accent"];
  const mode = paletteExplicit ? paletteMode(palette) : "solid";
  const rowColor = (index: number): CheckColor => {
    if (mode === "solid") return "accent";
    if (mode === "duo") return index % 2 ? "accent2" : "accent";
    return (["accent", "accent2", "accent3"] as CheckColor[])[index % 3]!;
  };
  const tone = (value: number, rowIndex = 0) => {
    const ratio = clamp(value / peak);
    const color = colors[Math.round(ratio * Math.max(0, colors.length - 1))] ?? "muted";
    return diffColor(paletteExplicit && color === "accent" ? rowColor(rowIndex) : color);
  };
  const rowElement = (
    label: string,
    values: Array<number | string>,
    header = false,
    rowIndex = 0,
  ): Element => ({
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__heatmap-row", ...(header ? ["md-graph__heatmap-head"] : [])],
      style: `--md-graph-heatmap-columns:${columns.length}`,
    },
    children: [label, ...values].map((value, index): Element => {
      const numeric = typeof value === "number" ? value : undefined;
      const cellTone = numeric === undefined ? undefined : tone(numeric, rowIndex);
      return {
        type: "element",
        tagName: "span",
        properties: {
          className: [
            "md-graph__heatmap-cell",
            ...(index ? ["md-graph__heatmap-cell--value"] : ["md-graph__heatmap-cell--label"]),
            ...(cellTone?.classes ?? []),
          ],
          ...(cellTone?.style ? { style: cellTone.style } : {}),
          ...(numeric === undefined
            ? {}
            : { title: `${label} / ${columns[index - 1]}: ${numeric}` }),
        },
        children: [
          text(numeric === undefined ? String(value) : glyphAt(scale, clamp(numeric / peak))),
        ],
      };
    }),
  });
  const legend = props.legend?.toLowerCase() !== "false";
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--heatmap"] },
    children: [
      rowElement("", columns, true),
      ...parsedRows.map(({ label, values }, index) => rowElement(label, values, false, index)),
      ...(props.caption || legend
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__heatmap-footer"] },
              children: [
                {
                  type: "element" as const,
                  tagName: "span",
                  properties: { className: ["md-graph__heatmap-caption"] },
                  children: [text(props.caption ? yamlScalar(props.caption) : "")],
                },
                ...(legend
                  ? [
                      {
                        type: "element" as const,
                        tagName: "span",
                        properties: { className: ["md-graph__heatmap-legend"] },
                        children: [
                          text("Less "),
                          ...scale.map((mark, index): Element => {
                            const cellTone = tone((index / Math.max(1, scale.length - 1)) * peak);
                            return {
                              type: "element",
                              tagName: "span",
                              properties: {
                                className: ["md-graph__heatmap-legend-mark", ...cellTone.classes],
                              },
                              children: [text(mark)],
                            };
                          }),
                          text(" More"),
                        ],
                      },
                    ]
                  : []),
              ],
            },
          ]
        : []),
    ],
  };
};

type CalendarMark = { day: number; accent?: boolean };

const calendarBody = (
  source: string,
  palette: GraphPalette,
  paletteExplicit: boolean,
): Element | undefined => {
  const props = properties(source);
  const year = Number(props.year);
  const month = Number(props.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12)
    return undefined;
  const marks: CalendarMark[] = [];
  const inlineMarks = yamlArray(props.marks ?? "");
  if (inlineMarks) {
    for (const value of inlineMarks) {
      const day = Number(value);
      if (Number.isInteger(day)) marks.push({ day });
    }
  } else if (/^marks\s*:\s*$/im.test(source)) {
    let mark: CalendarMark | undefined;
    for (const line of source.split(/\r?\n/)) {
      const day = /^\s*-\s*day\s*:\s*(\d+)\s*$/i.exec(line)?.[1];
      if (day) {
        mark = { day: Number(day) };
        marks.push(mark);
        continue;
      }
      const accent = /^\s+accent\s*:\s*(true|false)\s*$/i.exec(line)?.[1];
      if (mark && accent) mark.accent = accent.toLowerCase() === "true";
    }
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weekStartsOn = props.weekStartsOn === "0" ? 0 : 1;
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leading = (firstDow - weekStartsOn + 7) % 7;
  const today = Number(props.today);
  const colorSource = yamlScalar(props.color ?? "accent");
  const explicitColor =
    /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
      colorSource,
    )
      ? (colorSource as CheckColor)
      : "accent";
  const mode = paletteExplicit ? paletteMode(palette) : "solid";
  const marked = new Map(marks.map((mark, index) => [mark.day, { ...mark, index }]));
  const markColor = (index: number): CheckColor => {
    if (props.color || mode === "solid") return explicitColor;
    if (mode === "duo") return index % 2 ? "accent2" : "accent";
    return (["accent", "accent2", "accent3"] as CheckColor[])[index % 3]!;
  };
  const weekdayNames =
    weekStartsOn === 0 ? ["S", "M", "T", "W", "T", "F", "S"] : ["M", "T", "W", "T", "F", "S", "S"];
  const calendarCell = (value: string, classes: string[], style?: string): Element => ({
    type: "element",
    tagName: "span",
    properties: { className: ["md-graph__calendar-cell", ...classes], ...(style ? { style } : {}) },
    children: [text(value)],
  });
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--calendar"] },
    children: [
      ...weekdayNames.map((name) => calendarCell(name, ["md-graph__calendar-weekday"])),
      ...Array.from({ length: leading }, () => calendarCell("", ["md-graph__calendar-empty"])),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const entry = marked.get(day);
        const selected = Boolean(entry) || day === today;
        const tone = selected ? diffColor(markColor(entry?.index ?? 0)) : undefined;
        return calendarCell(
          day === today ? `[${day}]` : String(day),
          ["md-graph__calendar-day", ...(tone?.classes ?? [])],
          tone?.style,
        );
      }),
    ],
  };
};

type WaterfallKind = "start" | "in" | "out" | "end";
type WaterfallItem = { label: string; value: number; kind?: WaterfallKind; color?: CheckColor };

const waterfallBody = (source: string, glyphs?: string): Element | undefined => {
  if (!/^items\s*:\s*$/im.test(source)) return undefined;
  const props = properties(source);
  const items: WaterfallItem[] = [];
  let item: Partial<WaterfallItem> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label) };
      items.push(item as WaterfallItem);
      continue;
    }
    if (!item) continue;
    const value = /^\s+value\s*:\s*([+-]?[\d.]+)\s*$/i.exec(line)?.[1];
    if (value) item.value = Number(value);
    const kind = /^\s+kind\s*:\s*(start|in|out|end)\s*$/i.exec(line)?.[1] as
      WaterfallKind | undefined;
    if (kind) item.kind = kind;
    const color = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (color) {
      const parsed = yamlScalar(color);
      if (
        /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
          parsed,
        )
      )
        item.color = parsed as CheckColor;
    }
  }
  const parsed = items.filter(({ label, value }) => Boolean(label) && Number.isFinite(value));
  if (!parsed.length) return undefined;
  const resolved = parsed.map((entry, index) => ({
    ...entry,
    kind:
      entry.kind ??
      (index === 0
        ? "start"
        : index === parsed.length - 1
          ? "end"
          : entry.value < 0
            ? "out"
            : "in"),
  }));
  let current = 0;
  const segments = resolved.map((entry) => {
    const amount = Math.abs(entry.value);
    let start = current;
    let end = current;
    if (entry.kind === "start") {
      start = 0;
      end = entry.value;
      current = end;
    } else if (entry.kind === "in") {
      end = current + amount;
      current = end;
    } else if (entry.kind === "out") {
      end = current - amount;
      current = end;
    } else {
      start = 0;
      end = entry.value;
      current = end;
    }
    return { ...entry, start, end };
  });
  const low = Math.min(0, ...segments.flatMap(({ start, end }) => [start, end]));
  const high = Math.max(0, ...segments.flatMap(({ start, end }) => [start, end]));
  const span = Math.max(1, high - low);
  const ticks = Math.max(1, Math.round(Number(props.ticks) || 24));
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade!);
  const full = scale.at(-1)!;
  const empty = scale[0]!;
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--waterfall"],
      style: `--md-graph-waterfall-ticks:${ticks}`,
    },
    children: segments.map((entry): Element => {
      const from = Math.min(entry.start, entry.end);
      const to = Math.max(entry.start, entry.end);
      const tone = diffColor(entry.color ?? (entry.kind === "end" ? "accent" : "ink"));
      const display =
        entry.kind === "in"
          ? `+${Math.abs(entry.value)}`
          : entry.kind === "out"
            ? `-${Math.abs(entry.value)}`
            : String(entry.value);
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "md-graph__waterfall-row",
            ...(entry.kind === "end" ? ["md-graph__waterfall-row--end"] : []),
          ],
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__waterfall-label"] },
            children: [text(entry.label)],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__waterfall-track"] },
            children: Array.from({ length: ticks }, (_, index): Element => {
              const point = low + ((index + 0.5) / ticks) * span;
              const active = point >= from && point <= to;
              return {
                type: "element",
                tagName: "span",
                properties: {
                  className: [
                    "md-graph__waterfall-tick",
                    ...(active ? tone.classes : ["md-graph__waterfall-tick--empty"]),
                  ],
                  ...(active && tone.style ? { style: tone.style } : {}),
                },
                children: [text(active ? full : empty)],
              };
            }),
          },
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["md-graph__waterfall-value", ...tone.classes],
              ...(tone.style ? { style: tone.style } : {}),
            },
            children: [text(display)],
          },
        ],
      };
    }),
  };
};

type UptimeStatus = "ok" | "degraded" | "down" | "empty";

const uptimeBody = (source: string, glyphs?: string): Element | undefined => {
  const props = properties(source);
  const validStatus = (value: string): value is UptimeStatus =>
    /^(?:ok|degraded|down|empty)$/i.test(value);
  let days = (yamlArray(props.days ?? "") ?? [])
    .map((value) => value.toLowerCase())
    .filter(validStatus);
  if (!days.length && /^\s+statusDays\s*:\s*$/im.test(source)) {
    const length = Number(/^\s+length\s*:\s*(\d+)\s*$/im.exec(source)?.[1]);
    const fallback =
      /^\s+default\s*:\s*(ok|degraded|down|empty)\s*$/im.exec(source)?.[1]?.toLowerCase() ?? "ok";
    const indices = (name: "down" | "degraded") =>
      new Set(
        (
          yamlArray(
            new RegExp(`^\\s+${name}\\s*:\\s*(\\[[^\\]]*\\])\\s*$`, "im").exec(source)?.[1] ?? "",
          ) ?? []
        )
          .map(Number)
          .filter(Number.isInteger),
      );
    const down = indices("down");
    const degraded = indices("degraded");
    if (Number.isInteger(length) && length > 0 && validStatus(fallback)) {
      days = Array.from({ length }, (_, index) =>
        down.has(index) ? "down" : degraded.has(index) ? "degraded" : fallback,
      );
    }
  }
  if (!days.length) return undefined;
  const columns = Math.max(1, Math.round(Number(props.columns) || 30));
  const actualColumns = Math.min(columns, days.length);
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade!);
  const statusGlyph = (status: UptimeStatus) =>
    status === "empty"
      ? "-"
      : status === "ok"
        ? scale.at(-1)!
        : status === "degraded"
          ? glyphAt(scale, 0.5)
          : scale[0]!;
  const statusTone = (status: UptimeStatus) =>
    status === "ok" ? diffColor("accent") : diffColor("muted");
  const measured = days.filter((status) => status !== "empty");
  const percent = measured.length
    ? Math.round((measured.filter((status) => status === "ok").length / measured.length) * 100)
    : 0;
  const legendStatus: UptimeStatus[] = ["ok", "degraded", "down"];
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--uptime"],
      style: `--md-graph-uptime-columns:${actualColumns}`,
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__uptime-grid"] },
        children: days.map((status): Element => {
          const tone = statusTone(status);
          return {
            type: "element",
            tagName: "span",
            properties: {
              className: [
                "md-graph__uptime-day",
                `md-graph__uptime-day--${status}`,
                ...tone.classes,
              ],
            },
            children: [text(statusGlyph(status))],
          };
        }),
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__uptime-meta"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__uptime-percent", "md-graph__accent"] },
            children: [text(`${percent}%`)],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__uptime-from"] },
            children: [text(yamlScalar(props.from ?? ""))],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__uptime-to"] },
            children: [text(yamlScalar(props.to ?? ""))],
          },
        ],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__uptime-legend"] },
        children: legendStatus.flatMap((status, index): ElementContent[] => {
          const tone = statusTone(status);
          return [
            ...(index ? [text("  ")] : []),
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__uptime-legend-mark", ...tone.classes] },
              children: [text(statusGlyph(status))],
            },
            text(` ${status === "ok" ? "up" : status}`),
          ];
        }),
      },
    ],
  };
};

type SlopeItem = { label: string; from: number; to: number; color?: CheckColor };

const slopeBody = (source: string): Element | undefined => {
  if (!/^items\s*:\s*$/im.test(source)) return undefined;
  const props = properties(source);
  const items: SlopeItem[] = [];
  let item: Partial<SlopeItem> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label) };
      items.push(item as SlopeItem);
      continue;
    }
    if (!item) continue;
    const value = /^\s+(from|to)\s*:\s*([+-]?[\d,.]+)\s*$/i.exec(line);
    if (value?.[1] && value[2]) item[value[1] as "from" | "to"] = number(value[2]);
    const color = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (color) {
      const parsed = yamlScalar(color);
      if (
        /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
          parsed,
        )
      )
        item.color = parsed as CheckColor;
    }
  }
  const parsed = items.filter(
    ({ label, from, to }) => Boolean(label) && Number.isFinite(from) && Number.isFinite(to),
  );
  if (!parsed.length) return undefined;
  const row = (
    label: string,
    from: string,
    marker: string,
    to: string,
    tone?: ReturnType<typeof diffColor>,
    header = false,
  ): Element => ({
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__slope-row", ...(header ? ["md-graph__slope-head"] : [])],
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["md-graph__slope-label"] },
        children: [text(label)],
      },
      {
        type: "element",
        tagName: "span",
        properties: { className: ["md-graph__slope-from"] },
        children: [text(from)],
      },
      {
        type: "element",
        tagName: "span",
        properties: {
          className: ["md-graph__slope-marker", ...(tone?.classes ?? [])],
          ...(tone?.style ? { style: tone.style } : {}),
        },
        children: [text(marker)],
      },
      {
        type: "element",
        tagName: "span",
        properties: {
          className: ["md-graph__slope-to", ...(tone?.classes ?? [])],
          ...(tone?.style ? { style: tone.style } : {}),
        },
        children: [text(to)],
      },
    ],
  });
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--slope"] },
    children: [
      row(
        "",
        yamlScalar(props.fromLabel ?? "from"),
        "",
        yamlScalar(props.toLabel ?? "to"),
        undefined,
        true,
      ),
      ...parsed.map((item) => {
        const tone = diffColor(item.color ?? "accent");
        return row(
          item.label,
          item.from.toLocaleString("en-US"),
          item.from === item.to ? "–" : "→",
          item.to.toLocaleString("en-US"),
          tone,
        );
      }),
    ],
  };
};

type BulletItem = {
  label: string;
  value: number;
  target?: number;
  max?: number;
  display?: string;
  color?: CheckColor;
};

const bulletBody = (source: string, glyphs?: string): Element | undefined => {
  if (!/^items\s*:\s*$/im.test(source)) return undefined;
  const props = properties(source);
  const items: BulletItem[] = [];
  let item: Partial<BulletItem> | undefined;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label) };
      items.push(item as BulletItem);
      continue;
    }
    if (!item) continue;
    const numeric = /^\s+(value|target|max)\s*:\s*([+-]?[\d,.]+)\s*$/i.exec(line);
    if (numeric?.[1] && numeric[2])
      item[numeric[1] as "value" | "target" | "max"] = number(numeric[2]);
    const display = /^\s+display\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (display) item.display = yamlScalar(display);
    const color = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (color) {
      const parsed = yamlScalar(color);
      if (
        /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
          parsed,
        )
      )
        item.color = parsed as CheckColor;
    }
  }
  const parsed = items.filter(({ label, value }) => Boolean(label) && Number.isFinite(value));
  if (!parsed.length) return undefined;
  const ticks = Math.max(1, Math.round(Number(props.ticks) || 20));
  const scale = glyphScale(glyphs ?? props.glyphs, ["-", "="]);
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--bullet"],
      style: `--md-graph-bullet-ticks:${ticks}`,
    },
    children: parsed.map((item): Element => {
      const maximum = Math.max(1, item.max ?? item.target ?? item.value);
      const filled = Math.round(clamp(item.value / maximum) * ticks);
      const marker =
        item.target === undefined ? -1 : Math.round(clamp(item.target / maximum) * ticks) - 1;
      const tone = diffColor(item.color ?? "accent");
      const display =
        item.display ??
        (item.target === undefined
          ? item.value.toLocaleString("en-US")
          : `${item.value.toLocaleString("en-US")} / ${item.target.toLocaleString("en-US")}`);
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__bullet-row"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-label"] },
            children: [text(item.label)],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-bracket"] },
            children: [text("[")],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-track"] },
            children: Array.from({ length: ticks }, (_, index): Element => {
              const active = index < filled;
              const isMarker = index === marker;
              return {
                type: "element",
                tagName: "span",
                properties: {
                  className: [
                    "md-graph__bullet-tick",
                    ...(active && !isMarker ? tone.classes : ["md-graph__bullet-tick--muted"]),
                  ],
                  ...(active && !isMarker && tone.style ? { style: tone.style } : {}),
                },
                children: [text(isMarker ? "|" : active ? scale.at(-1)! : scale[0]!)],
              };
            }),
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-bracket"] },
            children: [text("]")],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-display"] },
            children: [text(display)],
          },
        ],
      };
    }),
  };
};

type TimerKind = "elapsed" | "ago" | "clock";

const timerBody = (source: string): Element | undefined => {
  const props = properties(source);
  const kindSource = props.kind ?? "elapsed";
  const kind = /^(?:elapsed|ago|clock)$/i.test(kindSource)
    ? (kindSource.toLowerCase() as TimerKind)
    : "elapsed";
  const atSource = props.at ? yamlScalar(props.at) : "";
  const at = atSource
    ? Number.isFinite(Number(atSource))
      ? Number(atSource)
      : Date.parse(atSource)
    : Number.NaN;
  if (kind !== "clock" && !Number.isFinite(at)) return undefined;
  const units = (yamlArray(props.units ?? "") ?? ["days", "hours", "minutes", "seconds"]).filter(
    (unit) => /^(?:days|hours|minutes|seconds)$/.test(unit),
  );
  const timeFormat = props.timeFormat === "12" ? "12" : "24";
  const formatDuration = (milliseconds: number) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    if (units.length === 1 && units[0] === "days") return `${days}d`;
    if (units.join(",") === "days,hours,minutes,seconds")
      return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    return units
      .map((unit) =>
        unit === "days"
          ? `${days}d`
          : unit === "hours"
            ? `${hours}h`
            : unit === "minutes"
              ? `${minutes}m`
              : `${remainder}s`,
      )
      .join(" ");
  };
  const now = Date.now();
  const initial =
    kind === "clock"
      ? new Date(now).toLocaleTimeString("en-US", {
          hour12: timeFormat === "12",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : `${formatDuration(now - at)}${kind === "ago" ? " ago" : ""}`;
  const colorSource = yamlScalar(props.color ?? "accent");
  const color =
    /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
      colorSource,
    )
      ? (colorSource as CheckColor)
      : "accent";
  const tone = diffColor(color);
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--timer"],
      "data-timer-kind": kind,
      "data-timer-at": Number.isFinite(at) ? String(at) : "",
      "data-timer-units": units.join(","),
      "data-timer-format": timeFormat,
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: {
          className: ["md-graph__timer-value", ...tone.classes],
          ...(tone.style ? { style: tone.style } : {}),
        },
        children: [text(initial)],
      },
      ...(props.caption
        ? [
            {
              type: "element" as const,
              tagName: "span",
              properties: { className: ["md-graph__timer-caption"] },
              children: [text(yamlScalar(props.caption))],
            },
          ]
        : []),
    ],
  };
};

const countdownBody = (source: string): Element | undefined => {
  const props = properties(source);
  const toSource = props.to ? yamlScalar(props.to) : "";
  const deadline = toSource
    ? Number.isFinite(Number(toSource))
      ? Number(toSource)
      : Date.parse(toSource)
    : Number.NaN;
  if (!Number.isFinite(deadline)) return undefined;
  const done = yamlScalar(props.done ?? "done");
  const remaining = deadline - Date.now();
  const format = (milliseconds: number) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };
  const colorSource = yamlScalar(props.color ?? "accent");
  const color =
    /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
      colorSource,
    )
      ? (colorSource as CheckColor)
      : "accent";
  const tone = diffColor(remaining <= 0 ? "muted" : color);
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--countdown"],
      "data-countdown-to": String(deadline),
      "data-countdown-done": done,
      "data-countdown-color": color,
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: {
          className: [
            "md-graph__countdown-value",
            ...(remaining <= 0 ? ["md-graph__countdown-value--done"] : []),
            ...tone.classes,
          ],
          ...(tone.style ? { style: tone.style } : {}),
        },
        children: [text(remaining <= 0 ? done : format(remaining))],
      },
      ...(props.caption
        ? [
            {
              type: "element" as const,
              tagName: "span",
              properties: { className: ["md-graph__countdown-caption"] },
              children: [text(yamlScalar(props.caption))],
            },
          ]
        : []),
    ],
  };
};

type FrameLine = { text: string; color?: CheckColor };

const frameBody = (source: string): Element | undefined => {
  const topProperty = (name: string) =>
    new RegExp(`^${name}\\s*:\\s*(.+?)\\s*$`, "im").exec(source)?.[1];
  const validColor = (value: string): value is CheckColor =>
    /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
      value,
    );
  const scalarOrBlock = (name: string): string | undefined => {
    const lines = source.split(/\r?\n/);
    const index = lines.findIndex((line) => new RegExp(`^${name}\\s*:`).test(line));
    if (index < 0) return undefined;
    const rest = lines[index]!.replace(new RegExp(`^${name}\\s*:\\s*`), "");
    if (rest.trim() !== "|") return rest.trim() ? yamlScalar(rest) : undefined;
    const block: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor++) {
      const line = lines[cursor]!;
      if (line && !/^\s+/.test(line)) break;
      block.push(line.replace(/^ {2}/, ""));
    }
    return block.join("\n").trimEnd();
  };
  const defaultColorSource = yamlScalar(topProperty("color") ?? "ink");
  const defaultColor = validColor(defaultColorSource) ? defaultColorSource : "ink";
  const captionColorSource = yamlScalar(topProperty("captionColor") ?? "muted");
  const captionColor = validColor(captionColorSource) ? captionColorSource : "muted";
  const lines: FrameLine[] = [];
  const contentHeader = /^content[ \t]*:[ \t]*(.*)$/im.exec(source)?.[1] ?? "";
  if (contentHeader.trim() && contentHeader.trim() !== "|") {
    lines.push({ text: yamlScalar(contentHeader) });
  } else if (contentHeader.trim() === "|") {
    const block = scalarOrBlock("content");
    if (block) lines.push(...block.split("\n").map((text) => ({ text })));
  } else if (/^content[ \t]*:[ \t]*$/im.test(source)) {
    let current: FrameLine | undefined;
    let inContent = false;
    for (const line of source.split(/\r?\n/)) {
      if (/^content\s*:\s*$/.test(line)) {
        inContent = true;
        continue;
      }
      if (inContent && line && !/^\s+/.test(line)) break;
      if (!inContent) continue;
      const entry =
        /^\s{2}-\s+text\s*:\s*(.+?)\s*$/.exec(line)?.[1] ?? /^\s{2}-\s+(.+?)\s*$/.exec(line)?.[1];
      if (entry) {
        current = { text: yamlScalar(entry) };
        lines.push(current);
        continue;
      }
      const color = /^\s{4}color\s*:\s*(.+?)\s*$/.exec(line)?.[1];
      if (current && color) {
        const parsed = yamlScalar(color);
        if (validColor(parsed)) current.color = parsed;
      }
    }
  }
  if (!lines.length) return undefined;
  const caption = scalarOrBlock("caption");
  const divider = Boolean(caption) && topProperty("divider")?.toLowerCase() !== "false";
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--frame"] },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__frame-content"] },
        children: lines.map((line): Element => {
          const tone = diffColor(line.color ?? defaultColor);
          return {
            type: "element",
            tagName: "div",
            properties: {
              className: ["md-graph__frame-line", ...tone.classes],
              ...(tone.style ? { style: tone.style } : {}),
            },
            children: [text(line.text)],
          };
        }),
      },
      ...(caption
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: {
                className: [
                  "md-graph__frame-caption",
                  ...(divider ? ["md-graph__frame-caption--divider"] : []),
                  ...diffColor(captionColor).classes,
                ],
                ...(diffColor(captionColor).style ? { style: diffColor(captionColor).style } : {}),
              },
              children: [text(caption)],
            },
          ]
        : []),
    ],
  };
};

type BarsGroup = {
  label: string;
  values: number[];
  size: "sm" | "md" | "lg";
  tone?: "accent" | "secondary" | "tertiary" | "muted";
};

const parseBarsGroups = (source: string): BarsGroup[] | undefined => {
  const groups: BarsGroup[] = [];
  let group: BarsGroup | undefined;
  for (const line of source.split(/\r?\n/)) {
    const section = /^\s*([\w-]+)\s*:\s*$/.exec(line)?.[1];
    if (section) {
      group = { label: section, values: [], size: "md" };
      groups.push(group);
      continue;
    }
    if (!group) continue;
    const label = /^\s+label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) group.label = label;
    const size = /^\s+size\s*:\s*(sm|md|lg)\s*$/i.exec(line)?.[1] as BarsGroup["size"];
    if (size) group.size = size;
    const tone = /^\s+tone\s*:\s*(accent|secondary|tertiary|muted)\s*$/i.exec(line)?.[1] as
      BarsGroup["tone"] | undefined;
    if (tone) group.tone = tone;
    const values = /^\s+values\s*:\s*\[([^\]]*)\]\s*$/i.exec(line)?.[1];
    if (values)
      group.values = values
        .split(",")
        .map(Number)
        .filter((value) => Number.isFinite(value) && value >= 0);
  }
  const structured = groups.filter(({ values }) => values.length);
  if (structured.length) return structured;
  const legacy = meaningful(source).flatMap((line) => {
    const match = /^([^:]+):\s*\[([^\]]+)\]$/.exec(line.trim());
    if (!match?.[1] || !match[2]) return [];
    const values = match[2].split(",").map(Number).filter(Number.isFinite);
    return values.length ? [{ label: match[1].trim(), values, size: "md" as const }] : [];
  });
  return legacy.length ? legacy : undefined;
};

const barsBody = (
  source: string,
  palette: GraphPalette,
  paletteExplicit: boolean,
  glyphs?: string,
): Element | undefined => {
  const groups = parseBarsGroups(source);
  if (!groups) return undefined;
  const processor = /^\s*processor\s*:\s*(.+?)\s*$/im.exec(source)?.[1];
  const connector = processor
    ? processor
        .trim()
        .split(/\s+/)
        .map((part) => (part === "->" || part === "→" ? "- - -▶" : part))
        .join("  ")
    : "- - -▶";
  const toneClass = (group: BarsGroup, index: number) =>
    group.tone === "muted"
      ? "md-graph__bars-tone--muted"
      : group.tone === "secondary" ||
          (!group.tone &&
            paletteExplicit &&
            paletteMode(palette) !== "solid" &&
            index === 0 &&
            groups.length > 1)
        ? "md-graph__color-1"
        : group.tone === "tertiary"
          ? "md-graph__color-2"
          : !group.tone && !paletteExplicit && index === 0 && groups.length > 1
            ? "md-graph__bars-tone--muted"
            : "md-graph__color-0";
  const labelToneClass = (group: BarsGroup, index: number): string[] =>
    group.tone || (index === 0 && groups.length > 1) ? [toneClass(group, index)] : [];
  const mark = glyphScale(glyphs, ["█"]).at(-1)!;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--bars"] },
    children: groups.flatMap((group, groupIndex): ElementContent[] => [
      ...(groupIndex
        ? [
            {
              type: "element" as const,
              tagName: "span",
              properties: { className: ["md-graph__bars-connector"] },
              children: [text(connector)],
            },
          ]
        : []),
      {
        type: "element",
        tagName: "div",
        properties: {
          className: ["md-graph__bars-group", `md-graph__bars-group--${group.size}`],
        },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__bars-stacks", toneClass(group, groupIndex)] },
            children: group.values.map((value) => ({
              type: "element",
              tagName: "span",
              properties: {
                className: ["md-graph__bars-stack"],
                ariaLabel: String(value),
              },
              children: Array.from({ length: Math.round(value) }, () => ({
                type: "element" as const,
                tagName: "span",
                properties: { ariaHidden: "true" },
                children: [text(mark)],
              })),
            })),
          },
          {
            type: "element",
            tagName: "div",
            properties: {
              className: ["md-graph__bars-group-label", ...labelToneClass(group, groupIndex)],
            },
            children: [text(group.label)],
          },
        ],
      },
    ]),
  };
};

type CellColor = "accent" | "accent2" | "accent3";
type CellGrid = { label: string; cells: number[][]; color: CellColor };

const parseCellGrids = (source: string): CellGrid[] | undefined => {
  const grids: CellGrid[] = [];
  let grid: CellGrid | undefined;
  for (const line of source.split(/\r?\n/)) {
    const itemLabel = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    const sectionLabel = /^(?!\s)([^:]+)\s*:\s*$/.exec(line)?.[1];
    if (itemLabel || sectionLabel) {
      grid = { label: itemLabel ?? sectionLabel!, cells: [], color: "accent" };
      grids.push(grid);
      continue;
    }
    if (!grid || /^\s*cells\s*:\s*$/i.test(line)) continue;
    const color = /^\s+color\s*:\s*(accent|accent2|accent3)\s*$/i.exec(line)?.[1] as
      CellColor | undefined;
    if (color) {
      grid.color = color;
      continue;
    }
    const array = /^\s*-\s*\[([01,\s]+)\]\s*$/.exec(line)?.[1];
    const compact = /^\s*([01](?:\s*[01])+?)\s*$/.exec(line)?.[1];
    const values = array
      ? array.split(",").map((value) => Number(value.trim()))
      : compact
        ? [...compact.replace(/\s/g, "")].map(Number)
        : [];
    if (values.length) grid.cells.push(values);
  }
  const parsed = grids.filter(({ cells }) => cells.length);
  return parsed.length ? parsed : undefined;
};

const cellGlyphPair = (glyphs = "shade"): [string, string] => {
  const scale = glyphScale(glyphs, GLYPH_PRESETS.shade!);
  return [scale[0]!, scale.at(-1)!];
};

const meterGlyphPair = (glyphs?: string): [string, string] => {
  const scale = glyphScale(glyphs, ["-", "="]);
  return [scale[0]!, scale.length > 2 ? scale.at(-2)! : scale.at(-1)!];
};

const cellsBody = (source: string, glyphs?: string): Element | undefined => {
  const grids = parseCellGrids(source);
  if (!grids) return undefined;
  const [empty, active] = cellGlyphPair(glyphs);
  const colorClass = (color: CellColor) =>
    color === "accent2"
      ? "md-graph__color-1"
      : color === "accent3"
        ? "md-graph__color-2"
        : "md-graph__color-0";
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--cells"] },
    children: grids.map((grid) => ({
      type: "element",
      tagName: "div",
      properties: { className: ["md-graph__cells-item"] },
      children: [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__cells-grid"] },
          children: grid.cells.map((row) => ({
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__cells-row"] },
            children: row.map((value) => ({
              type: "element",
              tagName: "span",
              properties: {
                className: [
                  "md-graph__cell",
                  value ? "md-graph__cell--active" : "md-graph__cell--empty",
                  ...(value ? [colorClass(grid.color)] : []),
                ],
                ariaHidden: "true",
              },
              children: [text(value ? active : empty)],
            })),
          })),
        },
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__cells-label"] },
          children: [text(grid.label)],
        },
      ],
    })),
  };
};

const meterBody = (source: string, glyphs?: string): Element | undefined => {
  const props = properties(source);
  const shorthand = /([\d.]+)\s*\/\s*([\d.]+)/.exec(source);
  if (!props.value && !shorthand) return undefined;
  const value = number(props.value ?? shorthand?.[1] ?? "0");
  const explicitMax = props.max ?? shorthand?.[2];
  const max = explicitMax ? number(explicitMax) || 1 : 1;
  const ratio = clamp(value / max);
  const ticks = Math.max(1, Math.round(number(props.ticks ?? "14") || 14));
  const meterGlyphs = glyphs ?? props.glyphs;
  const [empty, active] = meterGlyphPair(meterGlyphs);
  const meterColor = /^(accent2|accent3)$/i.test(props.color ?? "")
    ? Number(props.color!.slice(-1)) - 1
    : 0;
  const filled = Math.round(ratio * ticks);
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--meter"] },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: {
          className: ["md-graph__meter-row"],
          style: `--md-graph-meter-ticks:${ticks};--md-graph-meter-width:${ticks * 2.75}rem`,
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__meter-bar"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__track"] },
                children: [text("[")],
              },
              {
                type: "element",
                tagName: "span",
                properties: {
                  className: ["md-graph__meter-cells"],
                },
                children: Array.from({ length: ticks }, (_, index) => ({
                  type: "element",
                  tagName: "span",
                  properties: {
                    className: [
                      "md-graph__meter-cell",
                      index < filled ? `md-graph__color-${meterColor}` : "md-graph__track",
                    ],
                  },
                  children: [text(index < filled ? active : empty)],
                })),
              },
              {
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__track"] },
                children: [text("]")],
              },
            ],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__meter-value"] },
            children: [text(`${Math.round(ratio * 100)}%`)],
          },
        ],
      },
      ...(props.label
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__meter-label"] },
              children: [text(props.label)],
            },
          ]
        : []),
      ...(props.caption
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__caption", "md-graph__meter-caption"] },
              children: [text(props.caption)],
            },
          ]
        : []),
    ],
  };
};

function render(type: string, source: string, glyphs?: string): string[] {
  const props = properties(source);
  const items = data(source);
  switch (type) {
    case "rank": {
      const rankedItems = rankData(source);
      const ticks = Number(props.ticks) || 20;
      const max = number(props.max ?? "") || Math.max(1, ...rankedItems.map(({ value }) => value));
      const labelWidth = Math.max(14, ...rankedItems.map(({ label }) => label.length));
      return rankedItems.map(
        ({ label, value, display }) =>
          `${label.padEnd(labelWidth)}\t${rankBar(value / max, ticks, glyphs ?? props.glyphs)}\t${display ?? value.toLocaleString("en-US")}`,
      );
    }
    case "funnel":
      return aligned(items, 20, glyphs ?? props.glyphs);
    case "meter": {
      const shorthand = /([\d.]+)\s*\/\s*([\d.]+)/.exec(source);
      const value = number(props.value ?? shorthand?.[1] ?? "0");
      const max = number(props.max ?? shorthand?.[2] ?? "100") || 100;
      return [
        `${props.label ?? ""}\t${asciiBar(value / max, 15)}\t${Math.round((value / max) * 100)}%`,
      ];
    }
    case "bars": {
      const series = meaningful(source).flatMap((line) => {
        const match = /^([^:]+):\s*(\[[^\]]+\])$/.exec(line.trim());
        return match?.[1] && match[2] ? [{ name: match[1], values: parseSequence(match[2]) }] : [];
      });
      const max = Math.max(1, ...series.flatMap(({ values }) => values));
      const groups = series.map(
        ({ name, values }) =>
          `${values.map((value) => glyphAt(glyphScale(glyphs ?? props.glyphs, SPARK_GLYPHS), value / max)).join(" ")}\n${name}`,
      );
      return groups.length > 1
        ? groups.flatMap((group, index) =>
            index < groups.length - 1 ? [group, "- - -▶"] : [group],
          )
        : groups;
    }
    case "spark":
      return meaningful(source).flatMap((line) => {
        const match = /^([^:]+):\s*(.+)$/.exec(line);
        if (!match?.[1] || !match[2] || /^\|/.test(line)) return [];
        const values = parseSequence(match[2]);
        return values.length
          ? [`${match[1].padEnd(12)} ${spark(values, glyphs ?? props.glyphs)}`]
          : [];
      });
    case "flow":
      return meaningful(source)
        .filter((line) => line.includes("->"))
        .map((line) => line.trim().replace(/\s*->\s*/g, "  - - -▶  "));
    case "cells": {
      const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade!);
      const empty = scale[0]!;
      const full = scale.at(-1)!;
      return meaningful(source).map((line) =>
        /^\s*[01](?:\s*[01])+$/.test(line)
          ? line.replace(/1/g, full).replace(/0/g, empty).replace(/\s/g, " ")
          : line,
      );
    }
    case "tree": {
      const stack: boolean[] = [];
      return meaningful(source).map((line) => {
        const match = /^(\s*)[-*+]\s+(.+)$/.exec(line);
        if (!match?.[1] && !match?.[2]) return line;
        const depth = Math.floor((match?.[1]?.length ?? 0) / 2);
        stack.length = depth;
        return `${depth ? "│  ".repeat(depth - 1) + "├─ " : ""}${match?.[2] ?? line}`;
      });
    }
    case "timeline": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["·", "●"]);
      return meaningful(source).map((line) => {
        const cells = line.split("|").map((cell) => cell.trim());
        return cells.length >= 2
          ? `${scale.at(-1)}  ${cells[0]}  ${cells.slice(1).join(`  ${scale[0]}  `)}`
          : line;
      });
    }
    case "gantt": {
      const full = glyphScale(glyphs ?? props.glyphs, ["■"]).at(-1)!;
      const tasks = meaningful(source).flatMap((line) => {
        const match = /^(.+?)\s*:\s*(\S+)(?:\s*\.\.\s*(\S+))?$/.exec(line);
        if (!match?.[1] || !match[2]) return [];
        const start = Date.parse(match[2]),
          end = Date.parse(match[3] ?? match[2]);
        return Number.isFinite(start) && Number.isFinite(end)
          ? [{ label: match[1].trim(), start, end }]
          : [];
      });
      const min = Math.min(...tasks.map((task) => task.start)),
        max = Math.max(...tasks.map((task) => task.end)),
        span = Math.max(86_400_000, max - min);
      const labelWidth = Math.max(1, ...tasks.map((task) => task.label.length));
      return tasks.map(
        (task) =>
          `${task.label.padEnd(labelWidth)}  ${" ".repeat(Math.round(((task.start - min) / span) * 28))}${full.repeat(Math.max(1, Math.round(((task.end - task.start + 86_400_000) / span) * 28)))}`,
      );
    }
    case "plot": {
      const pointGlyph = glyphScale(glyphs ?? props.glyphs, ["●"]).at(-1)!;
      const lines = meaningful(source);
      const points = lines.flatMap((line) => {
        const match = /^([+-]?[\d.]+)\s*,\s*([+-]?[\d.]+)$/.exec(line.trim());
        return match ? [{ x: number(match[1]!), y: number(match[2]!) }] : [];
      });
      if (!points.length) return lines;
      const width = 32,
        height = 7,
        minX = Math.min(...points.map((p) => p.x)),
        maxX = Math.max(...points.map((p) => p.x)),
        minY = Math.min(...points.map((p) => p.y)),
        maxY = Math.max(...points.map((p) => p.y));
      const grid = Array.from({ length: height }, () => Array(width).fill(" "));
      for (const point of points)
        grid[
          height - 1 - Math.round(clamp((point.y - minY) / Math.max(1, maxY - minY)) * (height - 1))
        ]![Math.round(clamp((point.x - minX) / Math.max(1, maxX - minX)) * (width - 1))] =
          pointGlyph;
      return grid.map((row) => `│${row.join("")}`).concat(`└${"─".repeat(width)}`);
    }
    case "stack": {
      const full = glyphScale(glyphs ?? props.glyphs, ["■"]).at(-1)!;
      return items.length
        ? [
            `${items.map(({ label, value }) => `${label} ${full.repeat(Math.max(1, Math.round(value / 5)))}`).join("  ")}`,
          ]
        : tableLines(source);
    }
    case "waffle": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["·", "■"]);
      const size = /^(\d+)x(\d+)$/.exec(props.size ?? "10x10");
      const cols = Number(size?.[1] ?? 10),
        rows = Number(size?.[2] ?? 10),
        total = cols * rows;
      let cursor = 0;
      const cells = items.flatMap((item, series) =>
        Array(
          Math.round(
            (item.value /
              Math.max(
                100,
                items.reduce((sum, d) => sum + d.value, 0),
              )) *
              total,
          ),
        ).fill(String(series + 1)),
      );
      return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (cells[cursor++] ? scale.at(-1)! : scale[0]!)).join(" "),
      ).concat(items.map((item, index) => `${index + 1}  ${item.label}  ${item.value}`));
    }
    case "activity":
      return aligned(
        items.map((item) => ({ ...item, label: item.label.slice(5) })),
        12,
        glyphs ?? props.glyphs,
      );
    case "calendar": {
      const dates = meaningful(source).flatMap((line) => {
        const match = /^(\d{4})-(\d{2})-(\d{2})\s*=\s*(.+)$/.exec(line);
        return match
          ? [
              {
                year: Number(match[1]),
                month: Number(match[2]),
                day: Number(match[3]),
                value: match[4]!,
              },
            ]
          : [];
      });
      if (!dates.length) return meaningful(source);
      const { year, month } = dates[0]!,
        first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
        days = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const marked = new Map(dates.map((date) => [date.day, date.value]));
      const cells = Array(first)
        .fill("  ")
        .concat(
          Array.from({ length: days }, (_, index) =>
            marked.has(index + 1)
              ? String(index + 1).padStart(2) + "●"
              : String(index + 1).padStart(2) + " ",
          ),
        );
      return [
        "Su  Mo  Tu  We  Th  Fr  Sa",
        ...Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) =>
          cells.slice(row * 7, row * 7 + 7).join(" "),
        ),
      ];
    }
    case "waterfall": {
      let sum = 0;
      const values = meaningful(source).flatMap((line) => {
        const match = /^(.+?)\s*=\s*(.+)$/.exec(line);
        if (!match?.[1] || !match[2]) return [];
        if (match[2].trim() === "total") return [{ label: match[1].trim(), value: sum }];
        const value = number(match[2]);
        if (Number.isFinite(value)) {
          sum = sum === 0 ? value : sum + value;
          return [{ label: match[1].trim(), value }];
        }
        return [];
      });
      return aligned(values, 20);
    }
    case "slope":
      return meaningful(source).flatMap((line) => {
        const match = /^(.+?)\s*=\s*(.+?)\s*->\s*(.+)$/.exec(line);
        return match?.[1] ? [`${match[1].padEnd(14)} ${match[2]}  ─────>  ${match[3]}`] : [];
      });
    case "bullet": {
      const compact = meaningful(source).flatMap((line) => {
        const match = /^(.+?)\s*=\s*([\d.]+)\s*\/\s*([\d.]+)\s*\/\s*([\d.]+)/.exec(line);
        return match?.[1]
          ? [
              {
                label: match[1],
                value: number(match[2]!),
                target: number(match[3]!),
                max: number(match[4]!),
              },
            ]
          : [];
      });
      const bullets = compact.length
        ? compact
        : [
            {
              label: "",
              value: number(props.value ?? "0"),
              target: number(props.target ?? "0"),
              max: number(props.max ?? "100"),
            },
          ];
      return bullets.map(
        ({ label, value, target, max }) =>
          `${label.padEnd(12)}\t${asciiBar(value / max, 20, target / max, glyphs ?? props.glyphs)}\t${value} / ${target}`,
      );
    }
    case "uptime": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["·", "▨", "■"]);
      return meaningful(source).map((line) =>
        line
          .replace(/\s*=\s*up$/, `  ${scale.at(-1)!.repeat(5)} up`)
          .replace(/\s*=\s*down$/, `  ${scale[0]!.repeat(5)} down`)
          .replace(/\s*=\s*degraded$/, `  ${glyphAt(scale, 0.5).repeat(5)} degraded`),
      );
    }
    case "heatmap": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["·", ...SPARK_GLYPHS]);
      return meaningful(source)
        .filter((line) => !/^[xy]:/.test(line))
        .map((line) =>
          line
            .replace(/\b0\b/g, scale[0]!)
            .replace(/\b[1-9]\b/g, (value) => glyphAt(scale, Number(value) / 9)),
        );
    }
    case "diff":
      return meaningful(source).map((line) =>
        line.startsWith("+")
          ? `+ ${line.slice(1).trim()}`
          : line.startsWith("-")
            ? `− ${line.slice(1).trim()}`
            : line.replace(/\s*->\s*/, "  ──>  "),
      );
    case "stat":
      return [props.value ?? "", [props.change, props.period].filter(Boolean).join("  ")];
    case "kpi":
    case "spec":
      return Object.entries(props).map(([key, value]) => `${key.padEnd(16)} ${value}`);
    case "timer":
      return [
        `${clock(durationSeconds(props.elapsed ?? "0s"))} / ${clock(durationSeconds(props.duration ?? "0s"))}`,
        props.state ?? "",
      ];
    case "countdown": {
      const delta = Math.max(0, (Date.parse(props.target ?? "") - Date.now()) / 1_000);
      if (!Number.isFinite(delta)) return [props.target ?? ""];
      const days = Math.floor(delta / 86_400);
      return [
        `${days}d ${clock(delta % 86_400)}`,
        (props.units ?? "days hours minutes seconds").replace(/[[\],]/g, " ").replace(/\s+/g, "  "),
      ];
    }
    case "check": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["·", "✓"]);
      return meaningful(source).map((line) =>
        line
          .replace(/^\s*[-*]?\s*\[[xX]\]\s*/, `${scale.at(-1)}  `)
          .replace(/^\s*[-*]?\s*\[ \]\s*/, `${scale[0]}  `),
      );
    }
    case "table":
    case "compare":
    case "frame":
    case "matrix":
    case "sheet":
      return tableLines(source).length ? tableLines(source) : meaningful(source);
    case "invoice": {
      const table = tableLines(source);
      const meta = Object.entries(props)
        .filter(([key]) => !["subtotal", "tax", "total"].includes(key))
        .map(([key, value]) => `${key.padEnd(12)} ${value}`);
      const totals = ["subtotal", "tax", "total"].flatMap((key) =>
        props[key] ? [`${key.padEnd(12)} ${props[key]}`] : [],
      );
      return [
        ...meta,
        ...(meta.length ? [""] : []),
        ...table,
        ...(totals.length ? [""] : []),
        ...totals,
      ];
    }
    default:
      return meaningful(source);
  }
}

const ACCENT_GLYPHS = /([=#@■█●✓+▨▁▂▃▄▅▆▇]+)/g;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const coloredLine = (
  line: string,
  lineIndex: number,
  palette: GraphPalette,
  targets: string[],
): Element => {
  if (line.includes("\n")) {
    const [marks = "", label = ""] = line.split("\n");
    return {
      type: "element",
      tagName: "div",
      properties: { className: ["md-graph__line", "md-graph__line--bars"] },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__bars-marks"] },
          children: coloredLine(marks, Math.floor(lineIndex / 2) + 1, palette, targets).children,
        },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__bars-label"] },
          children: [text(label)],
        },
      ],
    };
  }
  if (line.includes("\t")) {
    const [label = "", barValue = "", value = ""] = line.split("\t");
    const barMatch = /^\[\s*(.*?)\s*\]$/.exec(barValue);
    const cells = barMatch?.[1]?.split(/\s+/).filter(Boolean) ?? [];
    const barChildren: ElementContent[] = [text("[")];
    barChildren.push({
      type: "element",
      tagName: "span",
      properties: { className: ["md-graph__bar-cells"] },
      children: cells.map((cell) => ({
        type: "element",
        tagName: "span",
        properties: {
          className:
            !["-", ".", "·", "░"].includes(cell) && cell !== "|"
              ? ["md-graph__accent", "md-graph__color-0"]
              : cell === "|"
                ? ["md-graph__marker"]
                : ["md-graph__track"],
        },
        children: [text(cell)],
      })),
    });
    barChildren.push(text("]"));
    return {
      type: "element",
      tagName: "div",
      properties: { className: ["md-graph__line", "md-graph__line--bar"] },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__bar-label"] },
          children: coloredLine(label.trimEnd(), lineIndex, palette, targets).children,
        },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__ascii-bar"] },
          children: barChildren,
        },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__bar-value"] },
          children: [text(value)],
        },
      ],
    };
  }
  const children: ElementContent[] = [];
  let cursor = 0,
    glyphIndex = 0;
  const targetPattern = targets.length
    ? targets
        .sort((a, b) => b.length - a.length)
        .map(escapeRegExp)
        .join("|")
    : "(?!)";
  const pattern = new RegExp(`(- - -▶)|([-.·])|${ACCENT_GLYPHS.source}|(${targetPattern})`, "g");
  for (const match of line.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) children.push(text(line.slice(cursor, start)));
    const connector = match[0] === "- - -▶";
    const track = /^[-.·]+$/.test(match[0]);
    const connectorTargeted =
      connector &&
      targets.some((target) =>
        line
          .slice(start + match[0].length)
          .trimStart()
          .startsWith(target),
      );
    const colorIndex =
      paletteMode(palette) === "solid"
        ? 0
        : paletteMode(palette) === "duo"
          ? (lineIndex + glyphIndex) % 2
          : (lineIndex + glyphIndex) % 4;
    children.push({
      type: "element",
      tagName: "span",
      properties: {
        className: track
          ? ["md-graph__track"]
          : connector
            ? [
                "md-graph__arrow",
                ...(connectorTargeted ? ["md-graph__accent", `md-graph__color-${colorIndex}`] : []),
              ]
            : ["md-graph__accent", `md-graph__color-${colorIndex}`],
      },
      children: [text(match[0])],
    });
    cursor = start + match[0].length;
    glyphIndex++;
  }
  if (cursor < line.length) children.push(text(line.slice(cursor)));
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__line"] },
    children: children.length ? children : [text(" ")],
  };
};

export function renderGraphBody(
  type: string,
  source: string,
  palette: GraphPalette,
  semantic = true,
  paletteExplicit = false,
  glyphs?: string,
): Element {
  const targets = source.split(/\r?\n/).flatMap((line) => {
    const match = /^\s*@(accent|highlight)\s+(?:"([^"]+)"|(\S+))/.exec(line);
    return match?.[2] || match?.[3] ? [match[2] ?? match[3]!] : [];
  });
  if (semantic && type === "table") {
    const table = tableBody(source);
    if (table) return table;
  }
  if (semantic && type === "sheet") {
    const sheet = sheetBody(source);
    if (sheet) return sheet;
  }
  if (semantic && type === "flow") {
    const flow = flowBody(source);
    if (flow) return flow;
  }
  if (semantic && type === "tree") {
    const tree = treeBody(source);
    if (tree) return tree;
  }
  if (semantic && type === "timeline") {
    const timeline = timelineBody(source);
    if (timeline) return timeline;
  }
  if (semantic && type === "check") {
    const check = checkBody(source);
    if (check) return check;
  }
  if (semantic && type === "stack") {
    const stack = stackBody(source, glyphs);
    if (stack) return stack;
  }
  if (semantic && type === "funnel") {
    const funnel = funnelBody(source, glyphs);
    if (funnel) return funnel;
  }
  if (semantic && type === "gantt") {
    const gantt = ganttBody(source, glyphs);
    if (gantt) return gantt;
  }
  if (semantic && type === "plot") {
    const plot = plotBody(source, glyphs);
    if (plot) return plot;
  }
  if (semantic && type === "waffle") {
    const waffle = waffleBody(source, glyphs);
    if (waffle) return waffle;
  }
  if (semantic && type === "diff") {
    const diff = diffBody(source);
    if (diff) return diff;
  }
  if (semantic && type === "invoice") {
    const invoice = invoiceBody(source);
    if (invoice) return invoice;
  }
  if (semantic && type === "compare") {
    const compare = compareBody(source);
    if (compare) return compare;
  }
  if (semantic && type === "matrix") {
    const matrix = matrixBody(source);
    if (matrix) return matrix;
  }
  if (semantic && type === "stat") {
    const stat = statBody(source);
    if (stat) return stat;
  }
  if (semantic && type === "kpi") {
    const kpi = kpiBody(source, glyphs);
    if (kpi) return kpi;
  }
  if (semantic && type === "spec") {
    const spec = specBody(source);
    if (spec) return spec;
  }
  if (semantic && type === "activity") {
    const activity = activityBody(source, glyphs);
    if (activity) return activity;
  }
  if (semantic && type === "heatmap") {
    const heatmap = heatmapBody(source, palette, paletteExplicit, glyphs);
    if (heatmap) return heatmap;
  }
  if (semantic && type === "calendar") {
    const calendar = calendarBody(source, palette, paletteExplicit);
    if (calendar) return calendar;
  }
  if (semantic && type === "waterfall") {
    const waterfall = waterfallBody(source, glyphs);
    if (waterfall) return waterfall;
  }
  if (semantic && type === "uptime") {
    const uptime = uptimeBody(source, glyphs);
    if (uptime) return uptime;
  }
  if (semantic && type === "slope") {
    const slope = slopeBody(source);
    if (slope) return slope;
  }
  if (semantic && type === "bullet") {
    const bullet = bulletBody(source, glyphs);
    if (bullet) return bullet;
  }
  if (semantic && type === "timer") {
    const timer = timerBody(source);
    if (timer) return timer;
  }
  if (semantic && type === "countdown") {
    const countdown = countdownBody(source);
    if (countdown) return countdown;
  }
  if (semantic && type === "frame") {
    const frame = frameBody(source);
    if (frame) return frame;
  }
  if (semantic && type === "bars") {
    const bars = barsBody(source, palette, paletteExplicit, glyphs);
    if (bars) return bars;
  }
  if (semantic && type === "cells") {
    const cells = cellsBody(source, glyphs);
    if (cells) return cells;
  }
  if (semantic && type === "meter") {
    const meter = meterBody(source, glyphs);
    if (meter) return meter;
  }
  if (semantic && type === "spark") {
    const spark = sparkBody(source, palette, glyphs);
    if (spark) return spark;
  }
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body"] },
    children: (semantic ? render(type, source, glyphs) : source.split(/\r?\n/)).map((line, index) =>
      coloredLine(line, index, palette, targets),
    ),
  };
}
