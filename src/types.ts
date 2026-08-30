export type GraphPaletteName =
  | "greenday"
  | "orange"
  | "smelly"
  | "bluebee"
  | "indigosea"
  | "purple"
  | "pink"
  | "fire"
  | "deepsea"
  | "pinkteam"
  | "burning"
  | "blueteam"
  | "theme"
  | "mint"
  | "green"
  | "cyan"
  | "blue"
  | "sunset"
  | "ocean"
  | "neon"
  | "aurora"
  | "prism";

export type GraphPalette =
  | "solid"
  | "duo"
  | "trio"
  | GraphPaletteName
  /** @deprecated Use solid. */
  | "mono"
  /** @deprecated Use trio. */
  | "multi";

export type GraphScalar = string | number | boolean | null | GraphScalar[];

export interface GraphDiagnostic {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  line?: number;
  hint?: string;
}

export interface GraphLimits {
  maxBlockBytes: number;
  maxRows: number;
  maxColumns: number;
  maxPoints: number;
  maxNodes: number;
  maxEdges: number;
  maxDepth: number;
}

export interface GraphAnnotation {
  name: string;
  target?: string;
  args: Record<string, GraphScalar>;
}

export interface GraphNode {
  kind: "graph";
  type: string;
  attributes: Record<string, GraphScalar>;
  data: { kind: "opaque"; raw: string };
  annotations: GraphAnnotation[];
  diagnostics: GraphDiagnostic[];
  raw: string;
}

export interface MdGraphsOptions {
  /** CSS color used for titles and highlighted data. */
  accentColor: string;
  /** Second CSS color used by duo and trio palettes. */
  accentColor2: string;
  /** Third CSS color used by trio palettes. */
  accentColor3: string;
  /** Default frame treatment. */
  frame: "ascii" | "none";
  /** Default series palette; a block-level palette attribute takes precedence. */
  palette: GraphPalette;
  /** Treat unknown profiles, attributes, and invalid records as errors. */
  strict: boolean;
  /** Bounds applied before parsing or rendering document-controlled data. */
  limits: GraphLimits;
}
