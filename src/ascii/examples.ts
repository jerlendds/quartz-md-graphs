export const graphExampleTypes = [
  "table",
  "sheet",
  "bars",
  "rank",
  "cells",
  "meter",
  "spark",
  "tree",
  "timeline",
  "check",
  "stack",
  "funnel",
  "gantt",
  "waffle",
  "diff",
  "invoice",
  "compare",
  "matrix",
  "stat",
  "kpi",
  "spec",
  "waterfall",
  "uptime",
  "slope",
  "bullet",
] as const;

export const supplementalGraphTypes = [
  "flow",
  "plot",
  "activity",
  "heatmap",
  "calendar",
  "timer",
  "countdown",
  "frame",
] as const;

export type GraphExampleType = (typeof graphExampleTypes)[number];

export const graphFence = (type: string, body: string, title?: string): string =>
  `\`\`\`graph/${type}${title ? ` title=${JSON.stringify(title)}` : ""}\n${body.trim()}\n\`\`\``;
