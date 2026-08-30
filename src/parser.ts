import { supportedGraphTypes } from "./render";
import type {
  GraphAnnotation,
  GraphDiagnostic,
  GraphLimits,
  GraphNode,
  GraphScalar,
} from "./types";

const STANDARD_ATTRIBUTES = new Set([
  "title",
  "id",
  "caption",
  "frame",
  "palette",
  "glyphs",
  "aria-label",
  "version",
  "format",
  "stretch",
  "corner",
]);
const supported = new Set<string>(supportedGraphTypes);

export const defaultGraphLimits: GraphLimits = {
  maxBlockBytes: 64 * 1024,
  maxRows: 1_000,
  maxColumns: 100,
  maxPoints: 10_000,
  maxNodes: 2_000,
  maxEdges: 5_000,
  maxDepth: 100,
};

function scalar(value: string): GraphScalar {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function decodeQuoted(value: string): string {
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value) as string;
    } catch {
      return value.slice(1, value.endsWith('"') ? -1 : undefined);
    }
  }
  if (value.startsWith("'")) return value.slice(1, value.endsWith("'") ? -1 : undefined);
  return value;
}

export function parseInfoAttributes(meta = ""): {
  attributes: Record<string, GraphScalar>;
  diagnostics: GraphDiagnostic[];
} {
  const attributes: Record<string, GraphScalar> = {};
  const diagnostics: GraphDiagnostic[] = [];
  const token = /([A-Za-z][\w-]*)\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?!["'])[^\s]+)/gy;
  let cursor = 0;
  while (cursor < meta.length) {
    while (/\s/.test(meta[cursor] ?? "")) cursor++;
    if (cursor >= meta.length) break;
    token.lastIndex = cursor;
    const match = token.exec(meta);
    if (!match?.[1] || match[2] === undefined) {
      diagnostics.push({
        severity: "error",
        code: "GRAPH_INVALID_ATTRIBUTE",
        message: `Malformed graph attribute near: ${meta.slice(cursor)}`,
      });
      break;
    }
    attributes[match[1]] = scalar(decodeQuoted(match[2]));
    cursor = token.lastIndex;
  }
  return { attributes, diagnostics };
}

function annotations(source: string): GraphAnnotation[] {
  return source.split(/\r?\n/).flatMap((line) => {
    const match = /^\s*@([\w-]+)(?:\s+(\S+))?(.*)$/.exec(line);
    if (!match?.[1]) return [];
    const args = parseInfoAttributes(match[3] ?? "").attributes;
    return [{ name: match[1], ...(match[2] ? { target: decodeQuoted(match[2]) } : {}), args }];
  });
}

function profileDiagnostics(type: string, source: string): GraphDiagnostic[] {
  const result: GraphDiagnostic[] = [];
  const lines = source.split(/\r?\n/);
  if (["table", "invoice", "compare", "frame", "matrix", "sheet"].includes(type)) {
    const table = lines
      .filter((line) => line.includes("|"))
      .map((line) =>
        line
          .replace(/^\s*\||\|\s*$/g, "")
          .split(/(?<!\\)\|/)
          .map((cell) => cell.trim()),
      );
    if (table.length) {
      const expected = table[0]!.length;
      const alignment = table[1];
      if (!alignment || !alignment.every((cell) => /^:?-{3,}:?$/.test(cell)))
        result.push({
          severity: "error",
          code: "GRAPH_TABLE_ALIGNMENT",
          message: "Table requires a valid GFM alignment row.",
        });
      for (const [index, row] of table.entries())
        if (row.length !== expected)
          result.push({
            severity: "error",
            code: "GRAPH_TABLE_COLUMN_COUNT",
            message: `Table row has ${row.length} columns; expected ${expected}.`,
            line: index + 1,
          });
      if (type === "table") {
        const alignIndex = lines.findIndex((line) => /^\s*align\s*:/i.test(line));
        if (alignIndex >= 0) {
          const inline = lines[alignIndex]!.replace(/^\s*align\s*:\s*/i, "").trim();
          const configured = inline
            ? inline
                .replace(/^\[|\]$/g, "")
                .split(",")
                .map((value) => decodeQuoted(value.trim()))
            : lines.slice(alignIndex + 1).flatMap((line) => {
                const match = /^\s*-\s*(\S+)\s*$/.exec(line);
                return match?.[1] ? [decodeQuoted(match[1])] : [];
              });
          if (
            configured.length !== expected ||
            configured.some((value) => !/^(left|center|right)$/i.test(value))
          )
            result.push({
              severity: "error",
              code: "GRAPH_TABLE_ALIGN_CONFIG",
              message: `Table align must contain ${expected} left, center, or right values.`,
            });
        }
      }
    }
  }
  if (type === "cells") {
    const rows = lines.filter((line) => /^\s*[01](?:\s*[01])+\s*$/.test(line));
    const widths = rows.map((line) => line.replace(/\s/g, "").length);
    if (new Set(widths).size > 1)
      result.push({
        severity: "error",
        code: "GRAPH_MATRIX_RAGGED_ROW",
        message: "Matrix rows must have equal width.",
      });
  }
  if (type === "meter") {
    const keyed = Object.fromEntries(
      lines.flatMap((line) => {
        const match = /^\s*(min|max|value)\s*:\s*(-?[\d.]+)/.exec(line);
        return match?.[1] && match[2] ? [[match[1], Number(match[2])]] : [];
      }),
    );
    const min = keyed.min ?? 0,
      max = keyed.max ?? 1;
    if (keyed.value !== undefined && (keyed.value < min || keyed.value > max))
      result.push({
        severity: "error",
        code: "GRAPH_METER_RANGE",
        message: `Meter value must be between ${min} and ${max}.`,
      });
  }
  if (type === "waffle") {
    const values = lines.flatMap((line) => {
      const match = /=\s*(-?[\d.]+)/.exec(line);
      return match ? [Number(match[1])] : [];
    });
    if (values.some((value) => value < 0))
      result.push({
        severity: "error",
        code: "GRAPH_INVALID_NUMBER",
        message: "Waffle values cannot be negative.",
      });
    const total = values.reduce((sum, value) => sum + value, 0);
    if (values.length && total !== 100)
      result.push({
        severity: "warning",
        code: "GRAPH_WAFFLE_TOTAL",
        message: `Waffle values total ${total}; expected 100.`,
      });
  }
  if (type === "gantt") {
    for (const [index, line] of lines.entries()) {
      const match = /:\s*(\d{4}-\d{2}-\d{2})\s*\.\.\s*(\d{4}-\d{2}-\d{2})/.exec(line);
      if (match?.[1] && match[2] && Date.parse(match[2]) < Date.parse(match[1]))
        result.push({
          severity: "error",
          code: "GRAPH_INTERVAL_REVERSED",
          message: "Interval end precedes its start.",
          line: index + 1,
        });
    }
  }
  if (type === "plot") {
    let section: string | undefined;
    let sectionPoints = 0;
    const finishSection = () => {
      if (section && sectionPoints === 0)
        result.push({
          severity: "error",
          code: "GRAPH_PLOT_EMPTY_SERIES",
          message: `Plot series ${section} has no points.`,
        });
    };
    for (const [index, line] of lines.entries()) {
      const heading = /^\s*\[([^\]]+)\]\s*$/.exec(line);
      if (heading?.[1]) {
        finishSection();
        section = heading[1];
        sectionPoints = 0;
        continue;
      }
      if (!line.includes(",")) continue;
      const coordinate = /^\s*([+-]?[\d.]+)\s*,\s*([+-]?[\d.]+)\s*$/.exec(line);
      if (
        !coordinate ||
        !Number.isFinite(Number(coordinate[1])) ||
        !Number.isFinite(Number(coordinate[2]))
      )
        result.push({
          severity: "error",
          code: "GRAPH_INVALID_NUMBER",
          message: "Plot coordinates must be finite numbers.",
          line: index + 1,
        });
      else sectionPoints++;
    }
    finishSection();
  }
  if (type === "uptime") {
    let previousEnd = -1;
    for (const [index, line] of lines.entries()) {
      const match = /^(\d{2}):(\d{2})\.\.(\d{2}):(\d{2})\s*=/.exec(line.trim());
      if (!match) continue;
      const start = Number(match[1]) * 60 + Number(match[2]);
      const end = Number(match[3]) * 60 + Number(match[4]);
      if (end < start)
        result.push({
          severity: "error",
          code: "GRAPH_INTERVAL_REVERSED",
          message: "Uptime interval end precedes its start.",
          line: index + 1,
        });
      if (start < previousEnd)
        result.push({
          severity: "error",
          code: "GRAPH_UPTIME_OVERLAP",
          message: "Uptime intervals overlap.",
          line: index + 1,
        });
      previousEnd = Math.max(previousEnd, end);
    }
  }
  if (type === "countdown") {
    const target = lines.map((line) => /^\s*target\s*:\s*(.+)$/.exec(line)?.[1]).find(Boolean);
    if (
      target &&
      (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(target) ||
        !Number.isFinite(Date.parse(target)))
    )
      result.push({
        severity: "error",
        code: "GRAPH_COUNTDOWN_TARGET",
        message: "Countdown target must be an absolute datetime.",
      });
  }
  return result;
}

export function parseGraphFence(input: {
  type: string;
  meta?: string;
  value: string;
  strict?: boolean;
  limits?: Partial<GraphLimits>;
}): GraphNode {
  const limits = { ...defaultGraphLimits, ...input.limits };
  const parsed = parseInfoAttributes(input.meta);
  const diagnostics = [...parsed.diagnostics];
  if (!supported.has(input.type))
    diagnostics.push({
      severity: input.strict ? "error" : "warning",
      code: "GRAPH_UNKNOWN_PROFILE",
      message: `Unknown graph profile: ${input.type}`,
    });
  for (const attribute of Object.keys(parsed.attributes))
    if (!STANDARD_ATTRIBUTES.has(attribute) && !attribute.startsWith("x-"))
      diagnostics.push({
        severity: input.strict ? "error" : "warning",
        code: "GRAPH_UNKNOWN_ATTRIBUTE",
        message: `Unknown graph attribute: ${attribute}`,
      });
  const bytes = new TextEncoder().encode(input.value).byteLength;
  if (bytes > limits.maxBlockBytes)
    diagnostics.push({
      severity: "error",
      code: "GRAPH_LIMIT_BLOCK_BYTES",
      message: `Graph block exceeds ${limits.maxBlockBytes} bytes.`,
    });
  const rows = input.value.split(/\r?\n/);
  if (rows.length > limits.maxRows)
    diagnostics.push({
      severity: "error",
      code: "GRAPH_LIMIT_ROWS",
      message: `Graph block exceeds ${limits.maxRows} rows.`,
    });
  if (Math.max(0, ...rows.map((row) => row.length)) > limits.maxColumns)
    diagnostics.push({
      severity: "error",
      code: "GRAPH_LIMIT_COLUMNS",
      message: `Graph row exceeds ${limits.maxColumns} columns.`,
    });
  const pointCount = rows.filter((row) => /^\s*[+-]?[\d.]+\s*,\s*[+-]?[\d.]+\s*$/.test(row)).length;
  const edgeCount = rows.reduce((count, row) => count + (row.match(/->/g)?.length ?? 0), 0);
  const treeRows = rows.filter((row) => /^\s*[-*+]\s+/.test(row));
  const nodeCount =
    new Set(rows.flatMap((row) => (row.includes("->") ? row.split(/\s*->\s*/) : []))).size +
    treeRows.length;
  const depth = Math.max(
    0,
    ...treeRows.map((row) => Math.floor((/^\s*/.exec(row)?.[0].length ?? 0) / 2) + 1),
  );
  const counts: Array<[number, number, string, string]> = [
    [pointCount, limits.maxPoints, "GRAPH_LIMIT_POINTS", "points"],
    [nodeCount, limits.maxNodes, "GRAPH_LIMIT_NODES", "nodes"],
    [edgeCount, limits.maxEdges, "GRAPH_LIMIT_EDGES", "edges"],
    [depth, limits.maxDepth, "GRAPH_LIMIT_DEPTH", "tree depth"],
  ];
  for (const [actual, maximum, code, label] of counts)
    if (actual > maximum)
      diagnostics.push({ severity: "error", code, message: `Graph exceeds ${maximum} ${label}.` });
  diagnostics.push(...profileDiagnostics(input.type, input.value));
  return {
    kind: "graph",
    type: input.type,
    attributes: parsed.attributes,
    data: { kind: "opaque", raw: input.value },
    annotations: annotations(input.value),
    diagnostics,
    raw: input.value,
  };
}
