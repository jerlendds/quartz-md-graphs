import { readFile, writeFile } from "node:fs/promises";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { MdGraphs } from "../dist/index.js";

const blocks = [
  [
    'rank title="ROUTES"',
    "/docs = 12400\n/install = 4100\n/plot = 860\n/rank = 420\n@accent /docs",
  ],
  [
    'flow title="OPTIMISTIC UI"',
    "stretch: true\ntap -> server -> update\ntap -> update -> server-syncs\n@accent update",
  ],
  [
    'bars title="THROUGHPUT" palette=duo',
    "before: [3, 4, 8, 3]\nafter: [4, 7, 13, 4]\nprocessor: →",
  ],
  ['meter title="BUILD"', "value: 73\nmax: 100\nlabel: complete"],
  [
    'spark title="REQUESTS" palette=multi',
    "api: 12 14 13 19 23 21 28 34\nweb: 8 10 14 12 17 19 18 23",
  ],
  [
    'gantt title="LAUNCH"',
    "Research : 2026-08-01 .. 2026-08-05\nDesign : 2026-08-04 .. 2026-08-10\nBuild : 2026-08-08 .. 2026-08-21\nQA : 2026-08-20 .. 2026-08-25",
  ],
  [
    'heatmap title="REQUEST LOAD"',
    "x: Mon Tue Wed Thu Fri\ny: 00 06 12 18\n00 | 0 1 1 0 0\n06 | 1 2 3 2 1\n12 | 2 4 5 4 2\n18 | 1 3 4 3 1",
  ],
  [
    'waterfall title="REVENUE" palette=duo',
    "Starting revenue = 120000\nNew customers = +24000\nExpansion = +8000\nChurn = -13000\nRefunds = -4000\nEnding revenue = total",
  ],
  [
    'table title="RESEARCH COST"',
    "| Agent | Tokens | Time |\n|---|---:|---:|\n| Inks and paper | 115207 | 16m |\n| Naming patterns | 186716 | 18m |",
  ],
  [
    'cells title="TWO WAYS TO LEARN"',
    "fragments:\n  10100\n  01010\n  10001\n\nsystem:\n  11111\n  11111",
  ],
  [
    'tree title="COMPILER"',
    "- document\n  - block\n    - paragraph\n    - graph\n  - inline\n    - text\n    - link",
  ],
  [
    'timeline title="RELEASE"',
    "2026-08-01 | done | API frozen\n2026-08-08 | done | parser shipped\n2026-08-28 | current | v1",
  ],
  ['stack title="TRAFFIC" palette=multi', "desktop = 52\nmobile = 38\ntablet = 10"],
  [
    'funnel title="SIGNUP"',
    "Visited = 12400\nStarted = 7400\nVerified = 5100\nActivated = 3800\nPaid = 920",
  ],
  [
    'plot title="LATENCY" palette=duo',
    "x: requests\ny: latency_ms\n[baseline]\n10, 31\n20, 35\n30, 41\n[new]\n10, 22\n20, 24\n30, 29",
  ],
  ['waffle title="USERS" palette=duo', "size: 10x10\npaid = 37\nfree = 63"],
  [
    'diff title="CONFIG CHANGE"',
    "- timeout = 400ms\n+ timeout = 180ms\n- easing = linear\n+ easing = ease-out",
  ],
  [
    'invoice title="INVOICE #1042"',
    "date: 2026-08-28\ncurrency: USD\n| Item | Qty | Amount |\n|---|---:|---:|\n| Research | 12 | 3000 |\n| Engineering | 20 | 6000 |\nsubtotal: 9000\ntax: 720\ntotal: 9720",
  ],
  [
    'compare title="APPROACHES"',
    "winner: system\n| | fragments | system |\n|---|---|---|\n| setup | low | medium |\n| consistency | low | high |\n| composable | partial | yes |",
  ],
  ['stat title="MONTHLY REVENUE"', "value: $184,200\nchange: +12.4%\nperiod: vs last month"],
  ['kpi title="API"', "requests: 2.4M\np95: 183ms\nerrors: 0.07%\nuptime: 99.98%"],
  [
    'spec title="SYSTEM"',
    "Runtime: Node.js 24\nLanguage: TypeScript\nParser: micromark\nRenderer: HAST\nOutput: HTML",
  ],
  [
    'activity title="COMMITS"',
    "2026-08-21 = 3\n2026-08-22 = 0\n2026-08-23 = 7\n2026-08-24 = 12\n2026-08-25 = 4",
  ],
  [
    'calendar title="AUGUST 2026"',
    "2026-08-03 = release\n2026-08-11 = conference\n2026-08-28 = launch",
  ],
  [
    'uptime title="API · LAST 24H"',
    "00:00..03:42 = up\n03:42..03:47 = down\n03:47..12:18 = up\n12:18..12:21 = degraded\n12:21..24:00 = up",
  ],
  [
    'slope title="BEFORE / AFTER"',
    "before: 2025\nafter: 2026\nSearch = 42 -> 68\nCheckout = 61 -> 79\nProfile = 74 -> 71",
  ],
  [
    'bullet title="QUARTER"',
    "Revenue = 72 / 80 / 100\nMargin = 61 / 65 / 100\nNPS = 48 / 55 / 100",
  ],
  ['timer title="FOCUS"', "duration: 25m\nelapsed: 17m32s\nstate: running"],
  [
    'countdown title="LAUNCH"',
    "target: 2026-09-01T09:00:00Z\nunits: [days, hours, minutes, seconds]",
  ],
  [
    'frame title="USAGE"',
    "Content goes inside the frame.\nSame dashed border as the other graphs.",
  ],
  [
    'matrix title="P95"',
    "| | iad | sfo | nrt |\n|---|---:|---:|---:|\n| read | 12 | 18 | 41 |\n| write | 28 | 33 | 67 |\n| queue | 4 | 6 | 9 |",
  ],
  [
    'check title="REVIEW"',
    "[x] title is a sentence\n[x] numbers are tabular\n[ ] motion respects reduced motion",
  ],
  [
    'sheet title="SURFACE"',
    "| Name | Kind | Stable |\n|---|---|---|\n| Frame | primitive | yes |\n| Graph | primitive | yes |\n| GraphBody | primitive | yes |",
  ],
];
const fixturePath = process.argv[3] ?? "render-me-example.md";
const fixtureMarkdown = await readFile(fixturePath, "utf8");
const graphFences = [...fixtureMarkdown.matchAll(/^```graph\/[^\n]*\n[\s\S]*?^```\s*$/gm)].map(
  ([fence]) => fence,
);
const source = graphFences.length
  ? graphFences.join("\n\n")
  : blocks.map(([info, body]) => `\`\`\`graph/${info}\n${body}\n\`\`\``).join("\n\n");
const plugin = MdGraphs();
const ctx = {};
const processor = unified()
  .use(remarkParse)
  .use(plugin.markdownPlugins?.(ctx) ?? [])
  .use(remarkRehype)
  .use(plugin.htmlPlugins?.(ctx) ?? []);
const tree = processor.runSync(processor.parse(source));

const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const attributeName = (key) =>
  ({
    className: "class",
    dataGraph: "data-graph",
    dataFrame: "data-frame",
    dataPalette: "data-palette",
    dataStretch: "data-stretch",
    dataAlign: "data-align",
    dataPaletteMode: "data-palette-mode",
    ariaLabel: "aria-label",
    ariaDescribedBy: "aria-describedby",
    tabIndex: "tabindex",
  })[key] ?? key;
const html = (node) => {
  if (node.type === "root") return node.children.map(html).join("\n");
  if (node.type === "text") return escape(node.value);
  if (node.type !== "element") return "";
  const attrs = Object.entries(node.properties ?? {})
    .map(
      ([key, value]) =>
        ` ${attributeName(key)}="${escape(Array.isArray(value) ? value.join(" ") : value)}"`,
    )
    .join("");
  return `<${node.tagName}${attrs}>${node.children.map(html).join("")}</${node.tagName}>`;
};
const css =
  plugin
    .externalResources?.(ctx)
    ?.css?.map(({ content }) => content)
    .join("\n") ?? "";
const js =
  plugin
    .externalResources?.(ctx)
    ?.js?.filter(({ contentType }) => contentType === "inline")
    .map(({ script }) => script)
    .join("\n") ?? "";
const document = `<!doctype html><meta charset="utf-8"><title>md-graphs visual fixtures</title><style>:root{--light:#09090a;--darkgray:#d8d8d8;--dark:#666;--codeFont:"DejaVu Sans Mono",monospace}*{box-sizing:border-box}body{margin:0 auto;padding:40px;max-width:900px;background:var(--light);color:var(--darkgray)}${css}</style><main>${html(tree)}</main><script>${js}</script>`;
await writeFile(process.argv[2] ?? "/tmp/md-graphs-fixtures.html", document);
