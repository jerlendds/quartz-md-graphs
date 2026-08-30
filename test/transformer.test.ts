/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import {
  MdGraphs,
  frameAscii,
  getAccent,
  glyphScale,
  parseGraphFence,
  parseGraphMeta,
  parseInfoAttributes,
  supportedGraphTypes,
} from "../src/index";

const render = (source: string, options = {}) => {
  const transformer = MdGraphs({ accentColor: "#b7ff21", ...options });
  const ctx = {} as any;
  const processor = unified()
    .use(remarkParse)
    .use(transformer.markdownPlugins?.(ctx) ?? [])
    .use(remarkRehype)
    .use(transformer.htmlPlugins?.(ctx) ?? []);
  return processor.runSync(processor.parse(source)) as any;
};
const content = (node: any): string =>
  node.type === "text"
    ? node.value
    : (node.children ?? [])
        .map(content)
        .join(node.properties?.className?.includes("md-graph__body") ? "\n" : "");

describe("MdGraphs", () => {
  it("configures ink and muted colors through plugin options", () => {
    const css =
      MdGraphs({ inkColor: "#eeeeee", mutedColor: "#555555" }).externalResources?.({} as any)
        ?.css?.[0]?.content ?? "";
    expect(css).toContain("--md-graph-ink:#eeeeee");
    expect(css).toContain("--md-graph-muted:#555555");
    expect(css).toContain("color:var(--md-graph-ink)");
    expect(css.replace(/\s+/g, "")).toContain(".md-graph__tabletr{border:0}");
  });
  it("applies named and custom list palettes to every graph", () => {
    const named = render('```graph/frame title="NAMED"\npalette: orange\ncontent: hello\n```')
      .children[0];
    expect(named.properties.dataPalette).toBe("orange");
    expect(named.properties.dataPaletteMode).toBe("trio");

    const source = "palette:\n  - #112233\n  - #445566\n  - #778899\n  - #aabbcc\n  - #ddeeff";
    for (const type of supportedGraphTypes) {
      const figure = render(
        `\`\`\`graph/${type} title="CUSTOM"\n${source}\nvalue: 73\nitem = 42\n\`\`\``,
      ).children[0];
      expect(figure.properties.dataPalette).toBe("custom");
      expect(figure.properties.dataPaletteMode).toBe("trio");
      expect(figure.properties.style).toContain("--graph-accent-light:#112233");
      expect(figure.properties.style).toContain("--graph-accent-2-light:#445566");
      expect(figure.properties.style).toContain("--graph-accent-3-light:#778899");
      expect(figure.properties.style).toContain("--md-graph-muted:#aabbcc");
      expect(figure.properties.style).toContain("--md-graph-ink:#ddeeff");
    }

    const accentsOnly = render("```graph/flow\npalette:\n  - #111\n  - #222\n  - #333\na -> b\n```")
      .children[0];
    expect(accentsOnly.properties.style).not.toContain("--md-graph-muted:");
    expect(accentsOnly.properties.style).not.toContain("--md-graph-ink:");
  });
  it("parses quoted and token attributes", () =>
    expect(parseGraphMeta('title="SHIP WEEK" palette=duo aria-label=chart')).toEqual({
      title: "SHIP WEEK",
      palette: "duo",
      "aria-label": "chart",
    }));
  it("decodes escaped quoted attributes and reports malformed input", () => {
    expect(parseInfoAttributes('title="Latency \\"before\\"" palette=duo').attributes.title).toBe(
      'Latency "before"',
    );
    expect(parseInfoAttributes('title="unterminated').diagnostics[0]?.code).toBe(
      "GRAPH_INVALID_ATTRIBUTE",
    );
  });
  it("preserves unknown profiles and changes diagnostics by mode", () => {
    const permissive = parseGraphFence({ type: "orbit", meta: "mystery=yes", value: "a -> b" });
    const strict = parseGraphFence({
      type: "orbit",
      meta: "mystery=yes",
      value: "a -> b",
      strict: true,
    });
    expect(permissive.raw).toBe("a -> b");
    expect(permissive.diagnostics.map(({ severity }) => severity)).toEqual(["warning", "warning"]);
    expect(strict.diagnostics.map(({ severity }) => severity)).toEqual(["error", "error"]);
  });
  it("validates profile constraints and resource limits", () => {
    expect(parseGraphFence({ type: "cells", value: "101\n10" }).diagnostics[0]?.code).toBe(
      "GRAPH_MATRIX_RAGGED_ROW",
    );
    expect(
      parseGraphFence({ type: "meter", value: "value: 120\nmax: 100" }).diagnostics[0]?.code,
    ).toBe("GRAPH_METER_RANGE");
    expect(
      parseGraphFence({ type: "stat", value: "12345", limits: { maxBlockBytes: 2 } }).diagnostics[0]
        ?.code,
    ).toBe("GRAPH_LIMIT_BLOCK_BYTES");
    expect(
      parseGraphFence({ type: "flow", value: "a -> b -> c", limits: { maxEdges: 1 } })
        .diagnostics[0]?.code,
    ).toBe("GRAPH_LIMIT_EDGES");
    expect(
      parseGraphFence({
        type: "uptime",
        value: "00:00..03:00 = up\n02:00..04:00 = down",
      }).diagnostics.some(({ code }) => code === "GRAPH_UPTIME_OVERLAP"),
    ).toBe(true);
    expect(
      parseGraphFence({ type: "table", value: "| A | B |\n|---|---|\n| x |" }).diagnostics.some(
        ({ code }) => code === "GRAPH_TABLE_COLUMN_COUNT",
      ),
    ).toBe(true);
  });
  it("uses opaque source fallback for unknown and strict-invalid graphs", () => {
    const unknown = render("```graph/orbit\n# retained\na -> b\n```").children[0].children[1];
    expect(content(unknown)).toContain("# retained");
    const invalid = render("```graph/meter\nvalue: 120\nmax: 100\n```", { strict: true })
      .children[0].children[1];
    expect(content(invalid)).toContain("value: 120");
    expect(content(invalid)).not.toContain("[");
  });
  it("renders graph fences as accessible ASCII-framed figures", () => {
    const figure = render('```graph/bars title="DRAFT TO SHIPPED" palette=duo\nbefore: [3, 4]\n```')
      .children[0];
    expect(figure.properties.className).toEqual(["md-graph", "md-graph--bars"]);
    expect(figure.properties.dataPalette).toBe("duo");
    expect(content(figure.children[0])).toBe("DRAFT TO SHIPPED");
    expect(content(figure.children[1])).toContain("before");
    expect(content(figure.children[1])).toMatch(/[▁-█]/u);
  });
  it("renders bars as literal vertical block stacks", () => {
    const body = render(
      "```graph/bars\nfrom:\n label: before\n values: [3, 4]\nto:\n label: after\n size: lg\n values: [2, 5]\nprocessor: -> ->\n```",
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--bars");
    const groups = body.children.filter((child: any) =>
      child.properties?.className?.includes("md-graph__bars-group"),
    );
    expect(groups).toHaveLength(2);
    expect(groups[0].children[0].children[0].children).toHaveLength(3);
    expect(groups[0].children[0].children[1].children).toHaveLength(4);
    expect(groups[1].children[0].children[1].children).toHaveLength(5);
    expect(content(groups[0].children[1])).toBe("before");
    expect(groups[0].children[0].properties.className).toContain("md-graph__bars-tone--muted");
    expect(groups[0].children[1].properties.className).toContain("md-graph__bars-tone--muted");
    expect(groups[1].properties.className).toContain("md-graph__bars-group--lg");
    const connector = body.children.find((child: any) =>
      child.properties?.className?.includes("md-graph__bars-connector"),
    );
    expect(content(connector)).toBe("- - -▶  - - -▶");
    expect(groups[1].children[1].properties.className).toEqual(["md-graph__bars-group-label"]);

    const duo = render(
      "```graph/bars\nfrom:\n label: before\n values: [2]\nto:\n label: after\n values: [3]\npalette: duo\n```",
    ).children[0].children[1];
    expect(duo.children[0].children[0].properties.className).toContain("md-graph__color-1");

    const hash = render("```graph/bars glyphs=hash\nfrom:\n values: [2]\n```").children[0]
      .children[1];
    expect(content(hash)).toContain("##");
  });
  it("renders structured trees with branches, metadata, and node colors", () => {
    const body = render(
      '```graph/tree title="REGISTRY"\nnodes:\n  - label: registry/default\n    children:\n      - label: graph-frame\n        children:\n          - label: graph-frame.tsx\n            meta: ui\n          - label: graph-motion.ts\n            meta: lib\n      - label: graph-tree\n        children:\n          - label: graph-tree.tsx\n            meta: ui\n            color: accent3\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--tree");
    expect(body.children).toHaveLength(6);
    expect(content(body.children[0])).toBe("registry/default");
    expect(content(body.children[1])).toContain("├─ graph-frame");
    expect(content(body.children[2])).toContain("│  ├─ graph-frame.tsxui");
    expect(content(body.children[2].children[1])).toBe("ui");
    expect(body.children[5].children[0].children[1].properties.className).toContain(
      "md-graph__color-2",
    );
    expect(body.children[5].children[1].properties.className).toContain("md-graph__tree-meta");
  });
  it("renders structured timeline events with event colors and marker styles", () => {
    const body = render(
      '```graph/timeline title="SHIPPED"\nevents:\n  - date: "Mar 12"\n    label: CLI copies the files\n    color: ink\n  - date: "Mar 18"\n    label: Docs, live previews\n    color: accent2\n  - date: "Apr 02"\n    label: Registry listed\n    color: muted\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--timeline");
    expect(body.children).toHaveLength(3);
    expect(body.children[0].properties.className).toContain("md-graph__tone--ink");
    expect(content(body.children[0])).toBe("●Mar 12CLI copies the files");
    expect(content(body.children[1].children[0])).toBe("●");
    expect(body.children[1].properties.className).toContain("md-graph__color-1");
    expect(body.children[2].properties.className).toContain("md-graph__timeline-event--muted");
    expect(body.children[2].properties.className).toContain("md-graph__tone--muted");
    expect(content(body.children[2].children[0])).toBe("○");
    expect(body.children[2].properties.className).toContain("md-graph__timeline-event--last");

    const themed = render(
      "```graph/timeline\nevents:\n  - date: now\n    label: default ink\n  - date: later\n    label: muted event\n    color: muted\n```",
    ).children[0].children[1];
    expect(themed.children[0].properties.className).toContain("md-graph__tone--ink");
    expect(content(themed.children[0].children[0])).toBe("●");
    expect(themed.children[1].properties.className).toContain("md-graph__tone--muted");
    expect(content(themed.children[1].children[0])).toBe("○");
  });
  it("renders structured check items with symbols, notes, and marker colors", () => {
    const body = render(
      "```graph/check title=\"LAUNCH\"\nitems:\n  - label: freeze tokens\n    done: true\n  - label: custom mark\n    done: true\n    symbol: ✓\n    color: accent3\n  - label: brand mark\n    done: true\n    color: '#ff0088'\n  - label: write the postmortem\n    note: still open\n```",
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--check");
    expect(content(body.children[0].children[0])).toBe("[x]");
    expect(content(body.children[1].children[0])).toBe("[✓]");
    expect(body.children[1].children[0].properties.className).toContain("md-graph__color-2");
    expect(body.children[2].children[0].properties.style).toBe("color:#ff0088");
    expect(body.children[3].properties.className).toContain("md-graph__check-item--open");
    expect(content(body.children[3].children[0])).toBe("[ ]");
    expect(body.children[3].children[0].properties.className).toContain("md-graph__tone--muted");
    expect(content(body.children[3].children[1])).toBe("write the postmortemstill open");
  });
  it("renders structured proportional stacks with a shared legend", () => {
    const body = render(
      '```graph/stack title="TRAFFIC"\nticks: 24\nrows:\n  - label: marketing\n    segments:\n      - label: js\n        value: 48\n      - label: css\n        value: 22\n      - label: images\n        value: 30\n  - label: docs\n    segments:\n      - label: js\n        value: 28\n      - label: css\n        value: 18\n      - label: images\n        value: 54\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--stack");
    expect(body.children).toHaveLength(3);
    expect(content(body.children[0].children[0])).toBe("marketing");
    expect(body.children[0].children[1].children).toHaveLength(24);
    expect(body.children[1].children[1].children).toHaveLength(24);
    expect(content(body.children[2])).toBe("█ js▓ css▒ images");
    expect(body.children[2].children[0].children[0].properties.className).toContain(
      "md-graph__color-0",
    );
    expect(body.children[2].children[1].children[0].properties.className).toContain(
      "md-graph__tone--muted",
    );

    const colored = render(
      "```graph/stack\nrows:\n  - label: week\n    segments:\n      - label: prompt\n        value: 61\n        color: accent3\n      - label: completion\n        value: 27\n        color: ink\n      - label: cached\n        value: 12\n```",
    ).children[0].children[1];
    expect(colored.children[0].children[1].children[0].properties.className).toContain(
      "md-graph__color-2",
    );
    expect(colored.children[1].children[1].children[0].properties.className).toContain(
      "md-graph__tone--ink",
    );

    const presetFirstGlyph = { shade: "·", ascii: ".", hash: " ", bar: " " } as const;
    for (const [preset, firstGlyph] of Object.entries(presetFirstGlyph)) {
      const presetBody = render(
        `\`\`\`graph/stack\nglyphs: ${preset}\nrows:\n  - label: week\n    segments:\n      - label: first\n        value: 1\n      - label: second\n        value: 1\n\`\`\``,
      ).children[0].children[1];
      expect(content(presetBody.children[1].children[0].children[0])).toBe(firstGlyph);
    }
  });
  it("renders structured funnel steps with proportional ticks and colors", () => {
    const body = render(
      '```graph/funnel title="SIGNUP"\nticks: 16\nstage: start\nglyphs: shade\nsteps:\n  - label: visit\n    value: 8000\n    display: "8,000"\n    color: accent3\n  - label: start\n    value: 2400\n    display: "2,400"\n    color: ink\n  - label: verify\n    value: 960\n    display: "960"\n  - label: paid\n    value: 180\n    display: "180"\n    color: muted\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--funnel");
    expect(body.children).toHaveLength(4);
    expect(body.children[0].children[1].children).toHaveLength(16);
    expect(body.children[0].children[1].children[0].properties.className).toContain(
      "md-graph__color-2",
    );
    expect(content(body.children[0].children[1].children[0])).toBe("▓");
    expect(body.children[0].properties.className).toContain("md-graph__funnel-row--receded");
    expect(body.children[1].properties.className).not.toContain("md-graph__funnel-row--receded");
    expect(body.children[1].children[1].children[0].properties.className).toContain(
      "md-graph__tone--ink",
    );
    expect(content(body.children[0].children[2])).toBe("8,000");
    expect(content(body.children[0].children[3])).toBe("");
    expect(content(body.children[1].children[3])).toBe("30%");
    expect(content(body.children[2].children[3])).toBe("12%");
    expect(content(body.children[3].children[3])).toBe("2%");
  });
  it("renders structured gantt items, focus, playhead, ticks, and colors", () => {
    const body = render(
      '```graph/gantt title="LAUNCH"\nstage: build\nprogress: 0.58\nticks: [q1, q2, q3, q4]\nitems:\n  - label: design\n    start: 0\n    end: 0.35\n    complete: 1\n  - label: build\n    start: 0.2\n    end: 0.75\n    complete: 0.55\n    color: accent2\n  - label: docs\n    start: 0.55\n    end: 0.9\n    complete: 0.2\n    color: ink\n  - label: ship\n    start: 0.85\n    end: 1\n    complete: 0\n    color: muted\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--gantt");
    expect(body.children).toHaveLength(6);
    expect(content(body.children[0])).toContain("▾");
    expect(body.children[1].properties.className).toContain("md-graph__gantt-row--receded");
    expect(body.children[2].properties.className).not.toContain("md-graph__gantt-row--receded");
    expect(body.children[2].children[0].properties.className).toContain("md-graph__color-1");
    expect(body.children[3].children[0].properties.className).toContain("md-graph__tone--ink");
    expect(body.children[4].children[0].properties.className).toContain("md-graph__tone--muted");
    expect(body.children[1].children[1].children).toHaveLength(24);
    expect(content(body.children[5])).toBe("q1q2q3q4");
  });
  it("renders structured area and line plots with progressive reveal", () => {
    const area = render(
      '```graph/plot title="P95"\ndata: [2, 3, 3, 5, 4, 7, 6, 8, 5, 9, 7, 6]\nlabels:\n  - jan\n  - dec\n```',
    ).children[0].children[1];
    expect(area.properties.className).toContain("md-graph__body--plot");
    expect(area.children[0].children[0].children.map(content)).toEqual(["9", "0"]);
    expect(area.children[0].children[1].children).toHaveLength(7);
    expect(content(area.children[1].children[1].children[0])).toBe("jan");
    expect(content(area.children[1].children[1].children[1])).toBe("dec");
    expect(content(area)).toContain("░");
    const areaCells = area.children[0].children[1].children.flatMap(
      (row: { children: unknown[] }) => row.children,
    );
    expect(
      areaCells.filter((cell: { properties: { className: string[] } }) =>
        cell.properties.className.includes("md-graph__accent"),
      ),
    ).toHaveLength(1);

    const line = render(
      '```graph/plot title="ERRORS"\ndata: [1, 1, 4, 2, 8, 3, 2, 1, 5, 2]\nlabels:\n  - mon\n  - fri\nprogress: 0.7\nheight: 5\nvariant: line\nglyphs: ascii\n```',
    ).children[0].children[1];
    expect(line.children[0].children[1].children).toHaveLength(5);
    expect(content(line)).not.toContain("-");
    expect(content(line)).toContain("@");
    const cells = line.children[0].children[1].children.flatMap(
      (row: { children: unknown[] }) => row.children,
    );
    expect(
      cells.filter((cell: { properties: { className: string[] } }) =>
        cell.properties.className.includes("md-graph__accent"),
      ),
    ).toHaveLength(1);
  });
  it("renders structured waffles with configurable cells, columns, and glyphs", () => {
    const body = render(
      '```graph/waffle title="QUOTA"\nvalue: 0.4\ncells: 40\ncolumns: 8\nlabel: seats used\nglyphs: ascii\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--waffle");
    expect(body.properties.style).toBe("--md-graph-waffle-columns:8");
    expect(body.children[0].children).toHaveLength(40);
    expect(content(body.children[0].children[0])).toBe("@");
    expect(content(body.children[0].children[15])).toBe("@");
    expect(content(body.children[0].children[16])).toBe(".");
    expect(content(body.children[1])).toBe("40%");
    expect(content(body.children[2])).toBe("seats used");

    const defaults = render("```graph/waffle\nvalue: 0.73\n```").children[0].children[1];
    expect(defaults.children[0].children).toHaveLength(100);
    expect(defaults.properties.style).toBe("--md-graph-waffle-columns:10");
    expect(content(defaults.children[0].children[72])).toBe("█");
    expect(content(defaults.children[0].children[73])).toBe("░");

    const named = render("```graph/waffle\nvalue: 0.5\ncolor: accent3\n```").children[0]
      .children[1];
    expect(named.children[0].children[0].properties.className).toContain("md-graph__color-2");
    expect(named.children[1].properties.className).toContain("md-graph__color-2");

    const custom = render("```graph/waffle\nvalue: 0.5\ncolor: '#ff0088'\n```").children[0]
      .children[1];
    expect(custom.properties.style).toContain("--md-graph-waffle-color:#ff0088");
    expect(custom.children[0].children[0].properties.className).toContain(
      "md-graph__waffle-color--custom",
    );
    expect(custom.children[1].properties.className).toContain("md-graph__waffle-color--custom");
  });
  it("renders structured diffs with signs, colors, and a footer", () => {
    const body = render(
      '```graph/diff title="BUNDLED"\nrows:\n  - label: vendor\n    value: "84 kb"\n  - label: app\n    value: "31 kb"\n    color: accent\n    type: add\n  - label: sourcemaps\n    value: "12 kb"\n    color: accent3\n    type: remove\nfooter:\n  label: shipped\n  value: "103 kb"\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--diff");
    expect(body.children).toHaveLength(4);
    expect(content(body.children[0])).toBe("vendor84 kb");
    expect(content(body.children[1])).toBe("+app31 kb");
    expect(body.children[1].children[1].properties.className).toContain("md-graph__color-0");
    expect(content(body.children[2])).toBe("−sourcemaps12 kb");
    expect(body.children[2].children[2].properties.className).toContain("md-graph__color-2");
    expect(body.children[3].properties.className).toContain("md-graph__diff-footer");
    expect(content(body.children[3])).toBe("shipped103 kb");

    const customFooter = render(
      "```graph/diff\nrows:\n  - label: start\n    value: 12\nfooter:\n  label: now\n  value: -14\n  color: '#aa1100'\n  type: remove\n```",
    ).children[0].children[1].children[1];
    expect(customFooter.children[1].properties.style).toBe("color:#aa1100");
    expect(customFooter.children[2].properties.style).toBe("color:#aa1100");
    expect(content(customFooter.children[0])).toBe("−");
  });
  it("renders structured invoices with parties, metadata, items, totals, and notes", () => {
    const body = render(
      '```graph/invoice title="INVOICE 0041"\nfrom:\n  name: markdown graphs\n  lines:\n    - kshv.me\n    - GSTIN 29AXXXXX1234Z5\nto:\n  name: Acme Studio\n  lines:\n    - 14 Market Street\n    - San Francisco, CA\nmeta:\n  - label: No.\n    value: "0041"\n  - label: Issued\n    value: Mar 12, 2026\nitems:\n  - description: Design system\n    qty: "1"\n    rate: "4,200"\n    amount: "4,200"\n  - description: Docs rewrite\n    qty: 8h\n    rate: "180"\n    amount: "1,440"\ntotals:\n  - label: Subtotal\n    value: "5,640"\n  - label: Amount due\n    value: "5,640"\n    color: accent\nnote: Net 30. Wire to the account on file.\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--invoice");
    expect(body.properties.className).toContain("md-graph__invoice--qty");
    expect(body.properties.className).toContain("md-graph__invoice--rate");
    expect(content(body.children[0])).toContain("FROMmarkdown graphskshv.meGSTIN 29AXXXXX1234Z5");
    expect(content(body.children[0])).toContain(
      "BILL TOAcme Studio14 Market StreetSan Francisco, CA",
    );
    expect(content(body.children[1])).toBe("No.0041IssuedMar 12, 2026");
    expect(content(body.children[2])).toContain("DescriptionQtyRateAmount");
    expect(content(body.children[2])).toContain("Design system14,2004,200");
    expect(body.children[3].children[1].children[1].properties.className).toContain(
      "md-graph__color-0",
    );
    expect(content(body.children[4])).toBe("Net 30. Wire to the account on file.");

    const quote = render(
      '```graph/invoice\nfrom:\n  name: markdown graphs\nto:\n  name: Northwind\nitems:\n  - description: Registry install\n    amount: "0"\ntotals:\n  - label: Estimate\n    value: "0"\n    color: "#aa1100"\n```',
    ).children[0].children[1];
    expect(quote.properties.className).not.toContain("md-graph__invoice--qty");
    expect(content(quote.children[1])).toContain("DescriptionAmountRegistry install0");
    expect(quote.children[2].children[0].children[1].properties.style).toBe("color:#aa1100");
  });
  it("renders structured comparisons with an accented column", () => {
    const body = render(
      '```graph/compare title="PLANS"\ncolumns: [Solo, Studio]\naccent: Studio\nrows:\n  - label: Registry\n    values: [true, true]\n  - label: Private source\n    values: [false, true]\n  - label: Price\n    values: ["$0", "$24"]\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--compare");
    expect(body.children).toHaveLength(4);
    expect(content(body.children[0])).toBe("SoloStudio");
    expect(body.children[0].children[2].properties.className).toContain("md-graph__color-0");
    expect(content(body.children[1])).toBe("Registry✓✓");
    expect(body.children[1].children[2].properties.className).toContain("md-graph__color-0");
    expect(content(body.children[2])).toBe("Private source–✓");
    expect(body.children[2].children[1].properties.className).toContain(
      "md-graph__compare-value--muted",
    );
    expect(body.children[3].children[1].properties.className).toContain(
      "md-graph__compare-value--muted",
    );

    const custom = render(
      '```graph/compare\ncolumns: [A, B]\naccent: B\ncolor: "#aa1100"\nrows:\n  - label: Good\n    values: [false, true]\n```',
    ).children[0].children[1];
    expect(custom.children[0].children[2].properties.style).toBe("color:#aa1100");
    expect(custom.children[1].children[2].properties.style).toBe("color:#aa1100");
  });
  it("renders structured matrices with an accented row", () => {
    const body = render(
      '```graph/matrix title="P95"\ncolumns: [iad, sfo, nrt]\naccent: write\ncolor: accent3\nrows:\n  - label: read\n    values: [12, 18, 41]\n  - label: write\n    values: [28, 33, 67]\n  - label: queue\n    values: [4, 6, 9]\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--matrix");
    expect(body.children).toHaveLength(4);
    expect(content(body.children[0])).toBe("iadsfonrt");
    expect(body.children[0].properties.className).toContain("md-graph__matrix-head");
    expect(content(body.children[1])).toBe("read121841");
    expect(body.children[1].properties.className).not.toContain("md-graph__matrix-row--accent");
    expect(body.children[2].properties.className).toContain("md-graph__matrix-row--accent");
    expect(body.children[2].children[0].properties.className).toContain("md-graph__color-2");
    expect(body.children[2].children[3].properties.className).toContain("md-graph__color-2");

    const custom = render(
      '```graph/matrix\ncolumns: [A]\naccent: selected\ncolor: "#aa1100"\nrows:\n  - label: selected\n    values: [42]\n```',
    ).children[0].children[1];
    expect(custom.children[1].children[0].properties.style).toBe("color:#aa1100");
    expect(custom.children[1].children[1].properties.style).toBe("color:#aa1100");
  });
  it("renders structured stat items with hints and colored values", () => {
    const body = render(
      '```graph/stat title="P95"\nitems:\n  - value: "142ms"\n    label: read\n    hint: "−18ms"\n  - value: "410ms"\n    label: write\n    hint: "+22ms"\n    color: accent3\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--stat");
    expect(body.properties.style).toBe("--md-graph-stat-items:2");
    expect(body.children).toHaveLength(2);
    expect(content(body.children[0])).toBe("142msread−18ms");
    expect(body.children[0].children[0].properties.className).toContain("md-graph__tone--ink");
    expect(content(body.children[1])).toBe("410mswrite+22ms");
    expect(body.children[1].children[0].properties.className).toContain("md-graph__color-2");
    expect(body.children[1].children[1].properties.className).toContain("md-graph__stat-label");
    expect(body.children[1].children[2].properties.className).toContain("md-graph__stat-hint");

    const custom = render(
      '```graph/stat\nitems:\n  - value: "42"\n    label: answer\n    color: "#aa1100"\n```',
    ).children[0].children[1];
    expect(custom.children[0].children[0].properties.style).toBe("color:#aa1100");
  });
  it("renders structured KPIs with a colored headline and final spark mark", () => {
    const body = render(
      '```graph/kpi title="P95"\nvalue: "142ms"\nlabel: read\nhint: "−18ms"\ndata: [8, 7, 9, 6, 5, 7, 4, 5, 3, 4, 3, 2]\ncolor: accent2\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--kpi");
    expect(content(body.children[0])).toBe("142ms");
    expect(body.children[0].properties.className).toContain("md-graph__color-1");
    expect(content(body.children[1])).toBe("read−18ms");
    expect(body.children[2].children).toHaveLength(12);
    expect(body.children[2].children[0].properties.className).not.toContain("md-graph__color-1");
    expect(body.children[2].children[11].properties.className).toContain("md-graph__color-1");

    const custom = render(
      '```graph/kpi\nvalue: "42"\nlabel: answer\ndata: [1, 2]\nglyphs: ascii\ncolor: "#aa1100"\n```',
    ).children[0].children[1];
    expect(custom.children[0].properties.style).toBe("color:#aa1100");
    expect(content(custom.children[2].children[1])).toBe("@");
    expect(custom.children[2].children[1].properties.style).toBe("color:#aa1100");
  });
  it("renders structured specs with colored values", () => {
    const body = render(
      '```graph/spec title="TYPE"\nrows:\n  - label: Family\n    value: Geist Mono\n  - label: Size\n    value: "14 / 21"\n  - label: Accent\n    value: --graph-accent\n    color: accent\n  - label: Tri\n    value: --graph-accent-3\n    color: accent3\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--spec");
    expect(body.children).toHaveLength(4);
    expect(content(body.children[0])).toBe("FamilyGeist Mono");
    expect(body.children[0].children[0].properties.className).toContain("md-graph__spec-label");
    expect(content(body.children[1])).toBe("Size14 / 21");
    expect(body.children[2].children[1].properties.className).toContain("md-graph__color-0");
    expect(body.children[3].children[1].properties.className).toContain("md-graph__color-2");

    const custom = render(
      '```graph/spec\nrows:\n  - label: ETA\n    value: Thu\n    color: "#aa1100"\n```',
    ).children[0].children[1];
    expect(custom.children[0].children[1].properties.style).toBe("color:#aa1100");
  });
  it("renders generated and explicit activity calendars", () => {
    const generated = render(
      '```graph/activity title="SHIPPED"\nweekStartsOn: 1\nglyphs: ascii\ndays:\n  activityDays: [2026-06-01, 91]\nlabel: Jun – Aug\n```',
    ).children[0].children[1];
    expect(generated.properties.className).toContain("md-graph__body--activity");
    expect(generated.properties.style).toBe("--md-graph-activity-weeks:13");
    expect(generated.children[1].children[1].children).toHaveLength(91);
    expect(content(generated.children[0])).toContain("Jun");
    expect(content(generated.children[0])).toContain("Jul");
    expect(content(generated.children[0])).toContain("Aug");
    expect(content(generated.children[2])).toContain("Jun – Aug");
    expect(content(generated.children[2])).toContain("Less .-=#@ More");
    const legendMarks = generated.children[2].children[1].children.slice(1, -1);
    expect(legendMarks[0].properties.className).toContain("md-graph__tone--muted");
    expect(legendMarks[1].properties.className).toContain("md-graph__tone--muted");
    expect(legendMarks[2].properties.className).toContain("md-graph__tone--muted");
    expect(legendMarks[3].properties.className).toContain("md-graph__tone--ink");
    expect(legendMarks[4].properties.className).toContain("md-graph__color-0");
    const activeCells = generated.children[1].children[1].children.filter(
      (cell: { properties: { className: string[] } }) =>
        cell.properties.className.includes("md-graph__accent"),
    );
    expect(activeCells.length).toBeGreaterThan(0);

    const explicit = render(
      '```graph/activity\nlegend: false\ncaption: false\ndays:\n  - { date: "2026-08-03", count: 1 }\n  - { date: "2026-08-05", count: 3 }\n```',
    ).children[0].children[1];
    expect(explicit.children).toHaveLength(2);
    expect(explicit.children[1].children[1].children).toHaveLength(7);
    expect(explicit.children[1].children[1].children[2].properties.title).toBe("2026-08-04: 0");

    const controlled = render(
      '```graph/activity\ncolor: "#aa1100"\ninkFrom: 3\naccentFrom: 7\ndays:\n  - { date: "2026-08-03", count: 1 }\n  - { date: "2026-08-04", count: 3 }\n  - { date: "2026-08-05", count: 7 }\n```',
    ).children[0].children[1].children[1].children[1].children;
    expect(controlled[1].properties.className).toContain("md-graph__tone--muted");
    expect(controlled[2].properties.className).toContain("md-graph__tone--ink");
    expect(controlled[3].properties.style).toBe("color:#aa1100");
  });
  it("renders heatmap rows with a shared intensity scale", () => {
    const body = render(
      '```graph/heatmap title="REQUEST LOAD"\ncolumns: ["0", "4", "8"]\nrows:\n  - label: Mon\n    values: [0, 4, 8]\n  - label: Tue\n    values: [1, 6, 7]\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--heatmap");
    expect(body.children).toHaveLength(4);
    expect(content(body.children[0])).toBe("048");
    expect(content(body.children[1])).toBe("Mon·▒█");
    expect(body.children[1].children[1].properties.className).toContain("md-graph__tone--muted");
    expect(body.children[1].children[2].properties.className).toContain("md-graph__color-1");
    expect(body.children[1].children[3].properties.className).toContain("md-graph__accent");
    expect(content(body.children[3])).toBe("Less ·░▒▓█ More");
    const legendMarks = body.children[3].children[1].children.slice(1, -1);
    expect(legendMarks[0].properties.className).toContain("md-graph__tone--muted");
    expect(legendMarks[1].properties.className).toContain("md-graph__color-1");
    expect(legendMarks[2].properties.className).toContain("md-graph__color-1");
    expect(legendMarks[3].properties.className).toContain("md-graph__color-0");
    expect(legendMarks[4].properties.className).toContain("md-graph__color-0");

    const noLegend = render(
      "```graph/heatmap\nmax: 10\nlegend: false\ncolumns: [a]\nrows:\n  - label: auth\n    values: [8]\n```",
    ).children[0].children[1];
    expect(noLegend.children).toHaveLength(2);
    expect(noLegend.children[1].children[1].properties.className).toContain("md-graph__color-0");

    const options = render(
      "```graph/heatmap\nmax: 10\nlegend: false\ncaption: nightly suite\npalette: duo\ncolumns: [a]\nrows:\n  - label: auth\n    values: [10]\n  - label: billing\n    values: [10]\n```",
    ).children[0].children[1];
    expect(content(options.children[3])).toBe("nightly suite");
    expect(options.children[1].children[1].properties.className).toContain("md-graph__color-0");
    expect(options.children[2].children[1].properties.className).toContain("md-graph__color-1");

    const customScale = render(
      "```graph/heatmap\nmax: 10\ncolorScale: [muted, ink, '#aa1100']\ncolumns: [a, b, c]\nrows:\n  - label: api\n    values: [0, 5, 10]\n```",
    ).children[0].children[1];
    expect(customScale.children[1].children[1].properties.className).toContain(
      "md-graph__tone--muted",
    );
    expect(customScale.children[1].children[2].properties.className).toContain(
      "md-graph__tone--ink",
    );
    expect(customScale.children[1].children[3].properties.style).toBe("color:#aa1100");
  });
  it("renders semantic calendars with marks and configurable week starts", () => {
    const monday = render(
      '```graph/calendar title="AUGUST 2026"\nyear: 2026\nmonth: 8\ntoday: 27\nmarks: [12, 18, 27]\n```',
    ).children[0].children[1];
    expect(monday.properties.className).toContain("md-graph__body--calendar");
    expect(monday.children.slice(0, 7).map(content).join("")).toBe("MTWTFSS");
    expect(monday.children).toHaveLength(43);
    expect(content(monday)).toContain("[27]");
    expect(monday.children[23].properties.className).toContain("md-graph__accent");

    const sunday = render(
      "```graph/calendar\nyear: 2026\nmonth: 3\nweekStartsOn: 0\nmarks:\n  - day: 12\n    accent: true\n  - day: 18\ncolor: '#aa1100'\n```",
    ).children[0].children[1];
    expect(sunday.children.slice(0, 7).map(content).join("")).toBe("SMTWTFS");
    expect(sunday.children[18].properties.style).toBe("color:#aa1100");
    expect(sunday.children[24].properties.style).toBe("color:#aa1100");
  });
  it("renders cumulative waterfall tracks with inferred and explicit kinds", () => {
    const inferred = render(
      "```graph/waterfall\nitems:\n  - label: Revenue\n    value: 48\n    color: ink\n  - label: Refunds\n    value: -6\n    color: accent2\n  - label: Hosting\n    value: -4\n    color: accent2\n  - label: Profit\n    value: 38\n    color: accent\n```",
    ).children[0].children[1];
    expect(inferred.properties.className).toContain("md-graph__body--waterfall");
    expect(inferred.properties.style).toBe("--md-graph-waterfall-ticks:24");
    expect(inferred.children).toHaveLength(4);
    expect(content(inferred.children[1].children[2])).toBe("-6");
    expect(inferred.children[3].properties.className).toContain("md-graph__waterfall-row--end");

    const explicit = render(
      "```graph/waterfall\nticks: 12\nglyphs: ascii\nitems:\n  - label: Start\n    value: 12\n    kind: start\n  - label: Hired\n    value: 4\n    kind: in\n    color: '#aa1100'\n  - label: Left\n    value: 2\n    kind: out\n  - label: Now\n    value: 14\n    kind: end\n```",
    ).children[0].children[1];
    expect(explicit.properties.style).toBe("--md-graph-waterfall-ticks:12");
    expect(content(explicit.children[1].children[2])).toBe("+4");
    expect(content(explicit.children[2].children[2])).toBe("-2");
    expect(explicit.children[1].children[2].properties.style).toBe("color:#aa1100");
    expect(content(explicit.children[1].children[1])).toContain("@");
  });
  it("renders generated and direct uptime status grids", () => {
    const generated = render(
      '```graph/uptime title="API"\nfrom: Jun 1\nto: Aug 29\ndays:\n  statusDays:\n    length: 90\n    down: [41, 42]\n    degraded: [18, 60]\n    default: ok\n```',
    ).children[0].children[1];
    expect(generated.properties.className).toContain("md-graph__body--uptime");
    expect(generated.properties.style).toBe("--md-graph-uptime-columns:30");
    expect(generated.children[0].children).toHaveLength(90);
    expect(generated.children[0].children[41].properties.className).toContain(
      "md-graph__uptime-day--down",
    );
    expect(content(generated.children[1])).toContain("96%");
    expect(content(generated.children[1])).toContain("Jun 1");
    expect(content(generated.children[2])).toContain("up");

    const direct = render(
      "```graph/uptime\nfrom: Mon\nto: Fri\ndays: [ok, ok, ok, degraded, ok, empty, empty, ok, down, ok, ok, ok]\n```",
    ).children[0].children[1];
    expect(direct.properties.style).toBe("--md-graph-uptime-columns:12");
    expect(content(direct.children[1])).toContain("80%");
    expect(direct.children[0].children[5].properties.className).toContain(
      "md-graph__uptime-day--empty",
    );
    expect(content(direct.children[0].children[5])).toBe("-");
  });
  it("renders semantic slope comparisons with formatted values", () => {
    const body = render(
      '```graph/slope title="TRAFFIC"\nfromLabel: "2025"\ntoLabel: "2026"\nitems:\n  - label: docs\n    from: 8200\n    to: 12400\n    color: accent\n  - label: copy\n    from: 5100\n    to: 4100\n    color: accent3\n  - label: cache\n    from: 12\n    to: 12\n    color: \'#aa1100\'\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--slope");
    expect(content(body.children[0])).toBe("20252026");
    expect(content(body.children[1])).toBe("docs8,200→12,400");
    expect(body.children[2].children[3].properties.className).toContain("md-graph__color-2");
    expect(content(body.children[3])).toBe("cache12–12");
    expect(body.children[3].children[3].properties.style).toBe("color:#aa1100");
  });
  it("renders semantic bullet tracks with targets and custom colors", () => {
    const body = render(
      "```graph/bullet title=\"LOAD\"\nticks: 10\nitems:\n  - label: CPU\n    value: 72\n    target: 80\n    max: 100\n  - label: SSD\n    value: 91\n    target: 90\n    max: 100\n    display: nearly full\n    color: '#aa1100'\n```",
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--bullet");
    expect(body.properties.style).toBe("--md-graph-bullet-ticks:10");
    expect(body.children).toHaveLength(2);
    expect(body.children[0].children[2].children).toHaveLength(10);
    expect(content(body.children[0].children[4])).toBe("72 / 80");
    expect(content(body.children[1].children[4])).toBe("nearly full");
    expect(body.children[1].children[2].children[0].properties.style).toBe("color:#aa1100");

    const ascii = render(
      "```graph/bullet\nglyphs: ascii\nitems:\n  - label: CPU\n    value: 5\n    max: 10\n```",
    ).children[0].children[1];
    expect(content(ascii.children[0].children[2])).toContain("@");
  });
  it("renders live timer hooks for elapsed, ago, and clock modes", () => {
    const elapsed = render(
      '```graph/timer title="INCIDENT"\nkind: elapsed\nat: "2026-08-27T08:00:00Z"\ncaption: api\nunits: [days, hours, minutes, seconds]\ncolor: accent3\n```',
    ).children[0].children[1];
    expect(elapsed.properties.className).toContain("md-graph__body--timer");
    expect(elapsed.properties["data-timer-kind"]).toBe("elapsed");
    expect(elapsed.properties["data-timer-at"]).toBe(String(Date.parse("2026-08-27T08:00:00Z")));
    expect(elapsed.properties["data-timer-units"]).toBe("days,hours,minutes,seconds");
    expect(elapsed.children[0].properties.className).toContain("md-graph__color-2");
    expect(content(elapsed.children[1])).toBe("api");

    const ago = render('```graph/timer\nkind: ago\nat: "2026-08-27T12:00:00Z"\nunits: [days]\n```')
      .children[0].children[1];
    expect(content(ago.children[0])).toMatch(/^\d+d ago$/);

    const clockFigure = render(
      '```graph/timer title="LOFI"\ntitle: LOCAL\nkind: clock\ntimeFormat: 12\n```',
    ).children[0];
    expect(content(clockFigure.children[0])).toBe("LOCAL");
    expect(clockFigure.children[1].properties["data-timer-kind"]).toBe("clock");
    expect(clockFigure.children[1].properties["data-timer-format"]).toBe("12");
  });
  it("renders live countdown hooks and completed deadlines", () => {
    const open = render(
      '```graph/countdown title="FREEZE"\nto: "2099-01-01T00:00:00Z"\ndone: open\ncaption: until launch\ncolor: \'#aa1100\'\n```',
    ).children[0].children[1];
    expect(open.properties.className).toContain("md-graph__body--countdown");
    expect(open.properties["data-countdown-to"]).toBe(String(Date.parse("2099-01-01T00:00:00Z")));
    expect(open.properties["data-countdown-done"]).toBe("open");
    expect(open.children[0].properties.style).toBe("color:#aa1100");
    expect(content(open.children[1])).toBe("until launch");

    const closed = render(
      '```graph/countdown title="WINDOW"\nto: "2020-01-01T00:00:00Z"\ndone: closed\n```',
    ).children[0].children[1];
    expect(content(closed.children[0])).toBe("closed");
    expect(closed.children[0].properties.className).toContain("md-graph__countdown-value--done");
    expect(closed.children[0].properties.className).toContain("md-graph__tone--muted");
  });
  it("renders scalar, block, and colored-list frame content", () => {
    const scalar = render(
      '```graph/frame title="USAGE"\ncontent: Content goes inside the frame.\ncaption: Same dashed border.\n```',
    ).children[0];
    expect(scalar.children[1].properties.className).toContain("md-graph__body--frame");
    expect(content(scalar.children[1].children[0])).toBe("Content goes inside the frame.");
    expect(scalar.children[1].children[1].properties.className).toContain(
      "md-graph__frame-caption--divider",
    );

    const list = render(
      "```graph/frame corner=\"*\"\ncolor: ink\ncontent:\n  - Production\n  - text: Degraded\n    color: accent2\n  - text: Custom\n    color: '#aa1100'\ncaption: Note\ndivider: false\n```",
    ).children[0];
    expect(list.children[0].properties.className).toContain("md-graph__title--empty");
    expect(content(list.children[1].children[0])).toBe("ProductionDegradedCustom");
    expect(list.children[1].children[0].children[0].properties.className).toContain(
      "md-graph__tone--ink",
    );
    expect(list.children[1].children[0].children[1].properties.className).toContain(
      "md-graph__color-1",
    );
    expect(list.children[1].children[0].children[2].properties.style).toBe("color:#aa1100");
    expect(list.children[1].children[1].properties.className).not.toContain(
      "md-graph__frame-caption--divider",
    );
    expect(list.children.slice(-4).map(content)).toEqual(["*", "*", "*", "*"]);

    const block = render(
      "```graph/frame\ncontent: |\n  First line\n  Second line\ncaption: |\n  Supporting note\n```",
    ).children[0].children[1];
    expect(block.children[0].children.map(content)).toEqual(["First line", "Second line"]);
    expect(content(block.children[1])).toBe("Supporting note");
  });
  it("draws ranked values to a shared scale", () => {
    const body = render('```graph/rank title="ROUTES"\n/docs = 100\n/install = 25\n```').children[0]
      .children[1];
    expect(content(body)).toContain("[====================]");
    expect(content(body)).toContain("/install");
  });
  it("renders structured rank items with optional display values", () => {
    const body = render(
      '```graph/rank\nmax: 100\nitems:\n  - label: frame\n    value: 100\n    display: "100%"\n  - label: plot\n    value: 41\n    display: "41%"\n```',
    ).children[0].children[1];
    expect(content(body)).toContain("frame");
    expect(content(body)).toContain("100%");
    expect(content(body)).toContain("41%");
    expect(content(body)).toContain("[====================]");
    expect(content(body)).toContain("[========------------]");

    const ascii = render("```graph/rank glyphs=ascii\nitems:\n - label: a\n   value: 1\n```")
      .children[0].children[1];
    expect(content(ascii)).toContain("[@@@@@@@@@@@@@@@@@@@@]");

    const shade = render("```graph/rank glyphs=shade\nitems:\n - label: a\n   value: 1\n```")
      .children[0].children[1];
    expect(content(shade)).toContain("[████████████████████]");
  });
  it("renders centered structured cell grids with labels below", () => {
    const body = render(
      "```graph/cells\n- label: fragments\n  cells:\n    - [1, 0, 1]\n    - [0, 1, 0]\n  color: accent2\n```",
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--cells");
    const item = body.children[0];
    expect(item.children[0].properties.className).toContain("md-graph__cells-grid");
    expect(content(item.children[0])).toBe("█·█·█·");
    expect(content(item.children[1])).toBe("fragments");
    expect(item.children[0].children[0].children[0].properties.className).toContain(
      "md-graph__cell--active",
    );
    expect(item.children[0].children[0].children[0].properties.className).toContain(
      "md-graph__color-1",
    );
    expect(item.children[0].children[0].children[1].properties.className).toContain(
      "md-graph__cell--empty",
    );
    expect(item.children[0].children[0].children[1].properties.className).not.toContain(
      "md-graph__color-1",
    );

    const defaults = render("```graph/cells\n- label: default\n  cells:\n    - [1]\n```")
      .children[0].children[1];
    expect(defaults.children[0].children[0].children[0].children[0].properties.className).toContain(
      "md-graph__color-0",
    );

    const ascii = render(
      "```graph/cells glyphs=ascii\n- label: custom\n  cells:\n    - [1, 0]\n```",
    ).children[0].children[1];
    expect(content(ascii.children[0].children[0])).toBe("@.");
  });
  it("renders normalized meters with ticks, labels, captions, and glyphs", () => {
    const body = render(
      "```graph/meter\nvalue: 0.73\nticks: 20\nlabel: characters, not a progress bar\ncaption: shipped ratio\nglyphs: ascii\n```",
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--meter");
    const row = body.children[0];
    expect(row.children[0].children[1].children).toHaveLength(20);
    expect(content(row.children[1])).toBe("73%");
    expect(content(row.children[0])).toContain("#");
    expect(content(row.children[0])).toContain(".");
    expect(content(body.children[1])).toBe("characters, not a progress bar");
    expect(content(body.children[2])).toBe("shipped ratio");
    expect(body.children[2].properties.className).toContain("md-graph__caption");
    const css = MdGraphs().externalResources?.({} as any)?.css?.[0]?.content ?? "";
    expect(css).toMatch(/\.md-graph__body--meter\s*\{[^}]*overflow-x:\s*auto/);
    expect(css).toMatch(/\.md-graph__body--meter\s*\{[^}]*margin-bottom:\s*-1\.1rem/);
    expect(css).toMatch(/\.md-graph__body--meter\s*\{[^}]*padding-bottom:\s*\.65rem/);
    expect(css).toContain("repeat(var(--md-graph-meter-ticks, 14), minmax(2.75rem, 1fr))");
    expect(css).toContain("min-width: var(--md-graph-meter-width, 38.5rem)");
    expect(row.properties.style).toBe("--md-graph-meter-ticks:20;--md-graph-meter-width:55rem");
    expect(row.children[0].children[0].properties.className).toContain("md-graph__track");
    expect(row.children[0].children.at(-1).properties.className).toContain("md-graph__track");
    const js = MdGraphs().externalResources?.({} as any)?.js?.[0];
    expect(js?.contentType).toBe("inline");
    expect(js?.loadTime).toBe("afterDOMReady");
    expect(js && "script" in js ? js.script : "").toContain('closest(".md-graph__body--meter")');
    expect(js && "script" in js ? js.script : "").toContain("event.preventDefault()");

    const shade = render("```graph/meter\nvalue: 0.5\nticks: 4\nglyphs: shade\n```").children[0]
      .children[1];
    expect(content(shade.children[0].children[0])).toBe("[▓▓··]");

    const custom = render(
      '```graph/meter\nvalue: 0.5\nticks: 4\nglyphs: ["·", "░", "▒", "▓", "█"]\n```',
    ).children[0].children[1];
    expect(content(custom.children[0].children[0])).toBe("[▓▓··]");

    const accent3 = render(
      "```graph/meter\nvalue: 0.5\nticks: 4\nglyphs: shade\ncolor: accent3\n```",
    ).children[0].children[1];
    expect(accent3.children[0].children[0].children[1].children[0].properties.className).toContain(
      "md-graph__color-2",
    );
    expect(accent3.children[0].children[0].children[1].children[2].properties.className).toContain(
      "md-graph__track",
    );
  });
  it("renders Markdown tables as full-width semantic tables", () => {
    const body = render(
      "```graph/table\n| Agent | Tokens | Tool calls | Time |\n|:---|---:|---:|---:|\n| Inks and paper | 115,207 | 120 | 16m |\n| Total | 437,141 | 396 | ~50m |\n```",
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--table");
    expect(body.children[0].tagName).toBe("table");
    expect(body.children[0].children[0].tagName).toBe("thead");
    expect(body.children[0].children[1].children[1].properties.className).toContain(
      "md-graph__table-summary",
    );
    expect(body.children[0].children[1].children[0].children[1].properties.dataAlign).toBe("right");
  });
  it("supports YAML-style per-column table alignment overrides", () => {
    const body = render(
      "```graph/table\n| Name | Value |\n|---|---:|\n| Alpha | 42 |\n\nalign:\n  - left\n  - left\n```",
    ).children[0].children[1];
    const header = body.children[0].children[0].children[0];
    const data = body.children[0].children[1].children[0];
    expect(header.children.map((cell: any) => cell.properties.dataAlign)).toEqual(["left", "left"]);
    expect(data.children.map((cell: any) => cell.properties.dataAlign)).toEqual(["left", "left"]);
    expect(
      parseGraphFence({
        type: "table",
        value: "| A | B |\n|---|---|\nalign:\n - left",
      }).diagnostics.some(({ code }) => code === "GRAPH_TABLE_ALIGN_CONFIG"),
    ).toBe(true);
  });
  it("renders structured table headers, rows, footer, and alignments", () => {
    const body = render(
      '```graph/table title="WHAT THE RESEARCH COSTS"\nheaders:\n  - Agent\n  - Tokens\n  - Tool calls\n  - Time\nrows:\n  - ["Inks and paper", "115,207", "120", "16m"]\n  - ["Overprint and drift", "135,218", "164", "16m"]\nfooter:\n  - Total\n  - 250,425\n  - 284\n  - ~32m\nalign:\n  - left\n  - right\n  - right\n  - right\n```',
    ).children[0].children[1];
    const table = body.children[0];
    expect(table.properties.className).toContain("md-graph__table--footer");
    expect(table.children[0].tagName).toBe("thead");
    expect(table.children[1].tagName).toBe("tbody");
    expect(table.children[1].children).toHaveLength(2);
    expect(table.children[2].tagName).toBe("tfoot");
    expect(content(table.children[2])).toContain("250,425");
    expect(table.children[2].children[0].properties.className).toContain("md-graph__table-summary");
    expect(
      table.children[0].children[0].children.map((cell: any) => cell.properties.dataAlign),
    ).toEqual(["left", "right", "right", "right"]);

    const inline = render(
      '```graph/table\nheaders: ["Decision", "Reason"]\nalign:\n  - left\n  - left\nrows:\n  - ["ease-out on enter", "feels snappier"]\n```',
    ).children[0].children[1];
    expect(content(inline)).toContain("ease-out on enter");
    expect(inline.children[0].children[0].children[0].children[1].properties.dataAlign).toBe(
      "left",
    );
    const css = MdGraphs().externalResources?.({} as any)?.css?.[0]?.content ?? "";
    expect(css).toMatch(
      /\.md-graph__table--footer tbody tr:last-child td\s*\{[^}]*padding-bottom:\s*\.55rem/,
    );
  });
  it("renders structured sheets as aligned semantic table sections", () => {
    const body = render(
      '```graph/sheet title="RFC"\nheaders: ["Item", "Owner", "Status"]\nalign:\n  - left\n  - left\n  - left\nsections:\n  - title: Scope\n    rows:\n      - ["CLI copies files", "priya", "done"]\n      - ["Docs previews", "jon", "now"]\n\n  - title: Out of scope\n    rows:\n      - ["npm package", "—", "later"]\n      - ["Figma kit", "—", "later"]\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--sheet");
    const table = body.children[0];
    expect(table.properties.className).toContain("md-graph__sheet");
    expect(table.children).toHaveLength(3);
    expect(table.children[1].properties.className).toContain("md-graph__sheet-section");
    expect(content(table.children[1].children[0])).toBe("Scope");
    expect(content(table.children[2].children[0])).toBe("Out of scope");
    expect(table.children[1].children[0].children[0].properties.colSpan).toBe(3);
    expect(table.children[1].children[1].children[1].properties.dataAlign).toBe("left");
    expect(content(table.children[2])).toContain("Figma kit");
    const css = MdGraphs().externalResources?.({} as any)?.css?.[0]?.content ?? "";
    expect(css).toMatch(
      /\.md-graph__sheet-section tr:last-child td\s*\{[^}]*padding-bottom:\s*1rem/,
    );

    const surface = render(
      '```graph/sheet\nheaders: ["Name", "Kind", "Stable"]\nalign:\n  - left\n  - left\n  - right\nsections:\n  - title: Frame\n    rows:\n      - ["Graph", "primitive", "yes"]\n```',
    ).children[0].children[1];
    expect(surface.children[0].children[1].children[1].children[2].properties.dataAlign).toBe(
      "right",
    );
  });
  it("assigns series colors for multi palettes", () => {
    const body = render("```graph/spark palette=multi\napi: 1 2 3\nweb: 3 2 1\n```").children[0]
      .children[1];
    const classes = body.children.flatMap((line: any) =>
      line.children.flatMap((child: any) => child.properties?.className ?? []),
    );
    expect(classes).toContain("md-graph__color-0");
    expect(classes).toContain("md-graph__color-1");
  });
  it("renders centered structured sparks with a muted track and accented final mark", () => {
    const body = render(
      '```graph/spark title="LATENCY"\ndata:\n  - [2, 3, 4, 3, 6, 5, 8, 7, 9, 6, 10, 8]\nlabel: last point is accent\n```',
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--spark");
    expect(body.children[0].children).toHaveLength(12);
    expect(content(body.children[1])).toBe("last point is accent");
    expect(body.children[0].children[0].properties.className).toContain("md-graph__track");
    expect(body.children[0].children.at(-1).properties.className).toContain("md-graph__color-0");

    const shade = render("```graph/spark\ndata:\n  - [1, 2, 3, 4, 5]\nglyphs: shade\n```")
      .children[0].children[1];
    expect(content(shade.children[0])).toBe("░▒▒▓█");

    const accent2 = render("```graph/spark\ndata:\n  - [2, 4, 3]\ncolor: accent2\n```").children[0]
      .children[1];
    expect(accent2.children[0].children.at(-1).properties.className).toContain("md-graph__color-1");
    const css = MdGraphs().externalResources?.({} as any)?.css?.[0]?.content ?? "";
    expect(css).toMatch(/\.md-graph__sparkline\s*\{[^}]*gap:\s*\.125rem/);
  });
  it("uses the Quartz surface and two/three-tone palette gradients", () => {
    const css = MdGraphs().externalResources?.({} as any)?.css?.[0]?.content ?? "";
    const compactCss = css.replace(/\s+/g, "");
    expect(compactCss).toContain("background:var(--light,transparent)");
    expect(compactCss).toContain("font-size:.875rem");
    expect(compactCss).toContain("font:inherit;font-size:.875rem");
    expect(compactCss).toContain(".md-graph:where(*){font-size:.875rem}");
    expect(compactCss).toContain("align-items:center;gap:.6rem");
    expect(compactCss).toContain("display:flex;gap:.5rem;line-height:1");
    expect(css).not.toMatch(/\.md-graph__body--cells\s*\{[^}]*min-height/);
    expect(compactCss).toContain("place-items:center");
    expect(compactCss).toContain("transform:translate(-50%,-50%)");
    expect(compactCss).toContain("--md-graph-ink:var(--darkgray");
    expect(compactCss).toContain("--md-graph-muted:var(--dark");
    expect(compactCss).toContain(
      "linear-gradient(90deg,var(--md-graph-accent),var(--md-graph-secondary))",
    );
    expect(compactCss).toContain(
      "linear-gradient(90deg,var(--md-graph-accent),var(--md-graph-secondary),var(--md-graph-tertiary))",
    );
    expect(compactCss).not.toContain("background:#000");
  });
  it("uses duo by default and supports body colors, solid mode, and named palettes", () => {
    const defaults = render("```graph/flow\na -> b\n```").children[0];
    expect(defaults.properties.dataPalette).toBe("duo");
    expect(defaults.properties.dataPaletteMode).toBe("duo");

    const custom = render("```graph/flow\npalette: solid\naccent: lab(50% 10 20);\na -> b\n```")
      .children[0];
    expect(custom.properties.dataPaletteMode).toBe("solid");
    expect(custom.properties.style).toContain("--graph-accent-light:lab(50% 10 20)");
    expect(custom.properties.style).toContain("--graph-accent-dark:lab(50% 10 20)");
    expect(custom.properties.style).not.toContain(";;");

    const threeAccents = render(
      "```graph/flow\naccent: red\naccent2: green\naccent3: blue\na -> b\n```",
    ).children[0];
    expect(threeAccents.properties.dataPalette).toBe("duo");
    expect(threeAccents.properties.dataPaletteMode).toBe("duo");
    expect(threeAccents.properties.style).toContain("--graph-accent-3-light:blue");

    const preset = render("```graph/flow\npalette: orange\na -> b\n```").children[0];
    expect(preset.properties.dataPalette).toBe("orange");
    expect(preset.properties.dataPaletteMode).toBe("trio");
    expect(preset.properties.style).toContain("lab(71.4857% 31.7395 50.6703)");

    const ocean = render("```graph/flow\npalette: ocean\na -> b\n```").children[0];
    expect(ocean.properties.style).toContain("--graph-accent-light:oklch(0.5 0.14 228)");
    expect(ocean.properties.style).toContain("--graph-accent-dark:oklch(0.77 0.15 228)");
    expect(getAccent("sky").id).toBe("ocean");

    const css = MdGraphs().externalResources?.({} as any)?.css?.[0]?.content ?? "";
    const compactCss = css.replace(/\s+/g, "");
    expect(compactCss).toContain(".md-graph__title-text");
    expect(compactCss).toContain("background:var(--md-graph-title-gradient)");
    expect(compactCss).toContain(
      "linear-gradient(90deg,var(--md-graph-accent),var(--md-graph-secondary),var(--md-graph-tertiary))",
    );
    expect(compactCss).toContain('data-palette-mode="trio"');
    expect(compactCss).toContain(".dark.md-graph");
  });
  it("exports reusable ASCII framing and glyph utilities", () => {
    const framed = frameAscii("demo", ["value"]);
    expect(framed).toContain("[ DEMO ]");
    expect(framed.split("\n")).toHaveLength(5);
    expect(glyphScale("shade", ["x", "y"])).toEqual(["·", "░", "▒", "▓", "█"]);
  });
  it("applies accent annotations to matching rendered labels", () => {
    const body = render("```graph/flow\ntap -> update -> server\n@accent update\n```").children[0]
      .children[1];
    const accent = body.children[0].children.find(
      (child: any) =>
        child.properties?.className?.includes("md-graph__accent") && content(child) === "update",
    );
    expect(content(accent)).toBe("update");
  });
  it("draws flow edges with dashed triangle connectors", () => {
    const body = render("```graph/flow\nwrite -> review -> ship\n```").children[0].children[1];
    expect(content(body)).toBe("write  - - -▶  review  - - -▶  ship");
    expect(
      body.children[0].children.filter((child: any) =>
        child.properties?.className?.includes("md-graph__arrow"),
      ),
    ).toHaveLength(2);
  });
  it("renders structured flow nodes with per-node tone and incoming stretch", () => {
    const body = render(
      "```graph/flow\nnodes:\n - label: tap\n - label: update\n   tone: accent\n - label: server syncs\n   stretch: true\n   tone: muted\n```",
    ).children[0].children[1];
    expect(body.properties.className).toContain("md-graph__body--flow");
    const row = body.children[0];
    expect(content(row)).toBe("tap- - -▶updateserver syncs");
    expect(row.children[2].properties.className).toContain("md-graph__flow-tone--accent");
    expect(row.children[3].properties.className).toContain("md-graph__flow-connector--stretch");
    expect(row.children[4].properties.className).toContain("md-graph__flow-tone--muted");
  });
  it("supports stretch true for full-width flow connectors", () => {
    const figure = render("```graph/flow\nstretch: true\ntap -> update\n```").children[0];
    expect(figure.properties.dataStretch).toBe(true);
    const css = MdGraphs().externalResources?.({} as any)?.css?.[0]?.content ?? "";
    const compactCss = css.replace(/\s+/g, "");
    expect(compactCss).toContain('.md-graph--flow[data-stretch="true"]');
    expect(compactCss).toContain("border-top:1pxdashedcurrentColor");
  });
  it("covers every core and target-design profile", () => {
    expect(supportedGraphTypes).toHaveLength(33);
    expect(supportedGraphTypes).toEqual(expect.arrayContaining(["matrix", "check", "sheet"]));
    for (const type of supportedGraphTypes) {
      const figure = render(`\`\`\`graph/${type} title="TEST"\nvalue: 73\nitem = 42\n\`\`\``)
        .children[0];
      expect(figure.properties.dataGraph).toBe(type);
      expect(figure.children[1].properties.className).toContain("md-graph__body");
    }
  });
  it("applies the shared corner option to every graph type", () => {
    for (const type of supportedGraphTypes) {
      const figure = render(
        `\`\`\`graph/${type} title="TEST"\ncorner: "◆"\nvalue: 73\nitem = 42\n\`\`\``,
      ).children[0];
      const corners = figure.children.filter((child: { properties: { className?: string[] } }) =>
        child.properties.className?.includes("md-graph__corner"),
      );
      expect(corners).toHaveLength(4);
      expect(corners.map(content)).toEqual(["◆", "◆", "◆", "◆"]);
    }

    const metadata = render('```graph/meter title="TEST" corner="*"\nvalue: 0.5\n```').children[0];
    expect(metadata.children.slice(-4).map(content)).toEqual(["*", "*", "*", "*"]);
  });
  it("renders target-only compatibility profiles and display scalars", () => {
    const check = render("```graph/check\n[x] shipped\n[ ] pending\n```").children[0].children[1];
    expect(content(check)).toContain("✓  shipped");
    const timer = render("```graph/timer\nduration: 25m\nelapsed: 17m32s\n```").children[0]
      .children[1];
    expect(content(timer)).toContain("17:32 / 25:00");
    const invoice = render(
      "```graph/invoice\ndate: 2026-08-28\n| Item | Amount |\n|---|---:|\n| Work | 100 |\ntotal: 100\n```",
    ).children[0].children[1];
    expect(content(invoice)).toContain("date");
    expect(content(invoice)).toContain("total");
  });
  it("leaves ordinary code fences alone", () =>
    expect(render("```ts\nconst x = 1\n```").children[0].tagName).toBe("pre"));
  it("does not disturb surrounding CommonMark", () => {
    const tree = render("Before *emphasis*.\n\n```graph/flow\na -> b\n```\n\nAfter **strong**.");
    expect(tree.children[0].children[1].tagName).toBe("em");
    expect(tree.children.at(-1).children[1].tagName).toBe("strong");
  });
});
