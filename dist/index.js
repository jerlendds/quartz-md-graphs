import { createRequire } from 'module';

createRequire(import.meta.url);

// node_modules/unist-util-is/lib/index.js
var convert = (
  // Note: overloads in JSDoc can’t yet use different `@template`s.
  /**
   * @type {(
   *   (<Condition extends string>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & {type: Condition}) &
   *   (<Condition extends Props>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Condition) &
   *   (<Condition extends TestFunction>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Predicate<Condition, Node>) &
   *   ((test?: null | undefined) => (node?: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node) &
   *   ((test?: Test) => Check)
   * )}
   */
  /**
   * @param {Test} [test]
   * @returns {Check}
   */
  (function(test) {
    if (test === null || test === void 0) {
      return ok;
    }
    if (typeof test === "function") {
      return castFactory(test);
    }
    if (typeof test === "object") {
      return Array.isArray(test) ? anyFactory(test) : (
        // Cast because `ReadonlyArray` goes into the above but `isArray`
        // narrows to `Array`.
        propertiesFactory(
          /** @type {Props} */
          test
        )
      );
    }
    if (typeof test === "string") {
      return typeFactory(test);
    }
    throw new Error("Expected function, string, or object as test");
  })
);
function anyFactory(tests) {
  const checks = [];
  let index = -1;
  while (++index < tests.length) {
    checks[index] = convert(tests[index]);
  }
  return castFactory(any);
  function any(...parameters) {
    let index2 = -1;
    while (++index2 < checks.length) {
      if (checks[index2].apply(this, parameters)) return true;
    }
    return false;
  }
}
function propertiesFactory(check) {
  const checkAsRecord = (
    /** @type {Record<string, unknown>} */
    check
  );
  return castFactory(all);
  function all(node) {
    const nodeAsRecord = (
      /** @type {Record<string, unknown>} */
      /** @type {unknown} */
      node
    );
    let key;
    for (key in check) {
      if (nodeAsRecord[key] !== checkAsRecord[key]) return false;
    }
    return true;
  }
}
function typeFactory(check) {
  return castFactory(type);
  function type(node) {
    return node && node.type === check;
  }
}
function castFactory(testFunction) {
  return check;
  function check(value, index, parent) {
    return Boolean(
      looksLikeANode(value) && testFunction.call(
        this,
        value,
        typeof index === "number" ? index : void 0,
        parent || void 0
      )
    );
  }
}
function ok() {
  return true;
}
function looksLikeANode(value) {
  return value !== null && typeof value === "object" && "type" in value;
}

// node_modules/unist-util-visit-parents/lib/color.node.js
function color(d) {
  return "\x1B[33m" + d + "\x1B[39m";
}

// node_modules/unist-util-visit-parents/lib/index.js
var empty = [];
var CONTINUE = true;
var EXIT = false;
var SKIP = "skip";
function visitParents(tree, test, visitor, reverse) {
  let check;
  if (typeof test === "function" && typeof visitor !== "function") {
    reverse = visitor;
    visitor = test;
  } else {
    check = test;
  }
  const is2 = convert(check);
  const step = reverse ? -1 : 1;
  factory(tree, void 0, [])();
  function factory(node, index, parents) {
    const value = (
      /** @type {Record<string, unknown>} */
      node && typeof node === "object" ? node : {}
    );
    if (typeof value.type === "string") {
      const name = (
        // `hast`
        typeof value.tagName === "string" ? value.tagName : (
          // `xast`
          typeof value.name === "string" ? value.name : void 0
        )
      );
      Object.defineProperty(visit2, "name", {
        value: "node (" + color(node.type + (name ? "<" + name + ">" : "")) + ")"
      });
    }
    return visit2;
    function visit2() {
      let result = empty;
      let subresult;
      let offset;
      let grandparents;
      if (!test || is2(node, index, parents[parents.length - 1] || void 0)) {
        result = toResult(visitor(node, parents));
        if (result[0] === EXIT) {
          return result;
        }
      }
      if ("children" in node && node.children) {
        const nodeAsParent = (
          /** @type {UnistParent} */
          node
        );
        if (nodeAsParent.children && result[0] !== SKIP) {
          offset = (reverse ? nodeAsParent.children.length : -1) + step;
          grandparents = parents.concat(nodeAsParent);
          while (offset > -1 && offset < nodeAsParent.children.length) {
            const child = nodeAsParent.children[offset];
            subresult = factory(child, offset, grandparents)();
            if (subresult[0] === EXIT) {
              return subresult;
            }
            offset = typeof subresult[1] === "number" ? subresult[1] : offset + step;
          }
        }
      }
      return result;
    }
  }
}
function toResult(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "number") {
    return [CONTINUE, value];
  }
  return value === null || value === void 0 ? empty : [value];
}

// node_modules/unist-util-visit/lib/index.js
function visit(tree, testOrVisitor, visitorOrReverse, maybeReverse) {
  let reverse;
  let test;
  let visitor;
  if (typeof testOrVisitor === "function" && typeof visitorOrReverse !== "function") {
    test = void 0;
    visitor = testOrVisitor;
    reverse = visitorOrReverse;
  } else {
    test = testOrVisitor;
    visitor = visitorOrReverse;
    reverse = maybeReverse;
  }
  visitParents(tree, test, overload, reverse);
  function overload(node, parents) {
    const parent = parents[parents.length - 1];
    const index = parent ? parent.children.indexOf(node) : void 0;
    return visitor(node, index, parent);
  }
}

// src/accents.ts
var DEFAULT_ACCENT_ID = "ocean";
var gradientSwatch = (angle, a, b, c, mid) => `linear-gradient(${angle}deg, ${a} 0%, ${b} ${mid}%, ${c} 100%)`;
var legacyAccentIds = {
  paper: "theme",
  gold: "sunset",
  lime: "neon",
  sky: "ocean",
  dusk: "aurora",
  coral: "fire",
  mist: "prism"
};
var accents = [
  {
    id: "theme",
    label: "Theme",
    kind: "solid",
    light: "var(--dark)",
    dark: "var(--light)",
    swatch: "var(--darkgray)",
    duo: { light: "var(--darkgray)", dark: "var(--gray)" },
    tri: { light: "var(--gray)", dark: "var(--darkgray)" }
  },
  {
    id: "mint",
    label: "Mint",
    kind: "solid",
    light: "oklch(0.52 0.14 163)",
    dark: "oklch(0.77 0.15 163)",
    swatch: "oklch(0.77 0.15 163)",
    duo: { light: "oklch(0.58 0.1 163)", dark: "oklch(0.68 0.1 163)" },
    tri: { light: "oklch(0.45 0.08 163)", dark: "oklch(0.58 0.08 163)" }
  },
  {
    id: "orange",
    label: "Orange",
    kind: "solid",
    light: "oklch(0.58 0.16 55)",
    dark: "oklch(0.76 0.14 55)",
    swatch: "oklch(0.76 0.14 55)",
    duo: { light: "oklch(0.5 0.12 55)", dark: "oklch(0.66 0.12 55)" },
    tri: { light: "oklch(0.42 0.08 55)", dark: "oklch(0.55 0.08 55)" }
  },
  {
    id: "green",
    label: "Green",
    kind: "solid",
    light: "oklch(0.5 0.14 145)",
    dark: "oklch(0.74 0.14 145)",
    swatch: "oklch(0.74 0.14 145)",
    duo: { light: "oklch(0.58 0.1 145)", dark: "oklch(0.64 0.1 145)" },
    tri: { light: "oklch(0.42 0.08 145)", dark: "oklch(0.55 0.08 145)" }
  },
  {
    id: "cyan",
    label: "Cyan",
    kind: "solid",
    light: "oklch(0.5 0.1 210)",
    dark: "oklch(0.76 0.1 210)",
    swatch: "oklch(0.76 0.1 210)",
    duo: { light: "oklch(0.58 0.08 210)", dark: "oklch(0.66 0.08 210)" },
    tri: { light: "oklch(0.42 0.06 210)", dark: "oklch(0.55 0.06 210)" }
  },
  {
    id: "blue",
    label: "Blue",
    kind: "solid",
    light: "oklch(0.5 0.18 255)",
    dark: "oklch(0.7 0.12 255)",
    swatch: "oklch(0.7 0.12 255)",
    duo: { light: "oklch(0.58 0.12 255)", dark: "oklch(0.62 0.1 255)" },
    tri: { light: "oklch(0.42 0.1 255)", dark: "oklch(0.52 0.08 255)" }
  },
  {
    id: "purple",
    label: "Purple",
    kind: "solid",
    light: "oklch(0.5 0.16 300)",
    dark: "oklch(0.72 0.12 300)",
    swatch: "oklch(0.72 0.12 300)",
    duo: { light: "oklch(0.58 0.12 300)", dark: "oklch(0.62 0.1 300)" },
    tri: { light: "oklch(0.42 0.08 300)", dark: "oklch(0.55 0.08 300)" }
  },
  {
    id: "pink",
    label: "Pink",
    kind: "solid",
    light: "oklch(0.55 0.18 8)",
    dark: "oklch(0.74 0.14 8)",
    swatch: "oklch(0.74 0.14 8)",
    duo: { light: "oklch(0.5 0.12 8)", dark: "oklch(0.64 0.1 8)" },
    tri: { light: "oklch(0.42 0.08 8)", dark: "oklch(0.55 0.08 8)" }
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
      52
    ),
    duo: { light: "oklch(0.55 0.14 74)", dark: "oklch(0.86 0.12 74)" },
    tri: { light: "oklch(0.52 0.12 89)", dark: "oklch(0.92 0.1 89)" }
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
      48
    ),
    duo: { light: "oklch(0.48 0.18 259)", dark: "oklch(0.68 0.18 259)" },
    tri: { light: "oklch(0.5 0.14 248)", dark: "oklch(0.72 0.15 248)" }
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
      46
    ),
    duo: { light: "oklch(0.48 0.14 162)", dark: "oklch(0.89 0.18 162)" },
    tri: { light: "oklch(0.5 0.12 220)", dark: "oklch(0.8 0.15 220)" }
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
      45
    ),
    duo: { light: "oklch(0.5 0.14 307)", dark: "oklch(0.7 0.14 307)" },
    tri: { light: "oklch(0.48 0.14 244)", dark: "oklch(0.7 0.13 244)" }
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
      45
    ),
    duo: { light: "oklch(0.52 0.18 1)", dark: "oklch(0.68 0.2 1)" },
    tri: { light: "oklch(0.55 0.14 72)", dark: "oklch(0.82 0.15 72)" }
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
      45
    ),
    duo: { light: "oklch(0.52 0.16 313)", dark: "oklch(0.69 0.19 313)" },
    tri: { light: "oklch(0.55 0.18 21)", dark: "oklch(0.66 0.2 21)" }
  }
];
var accentById = new Map(accents.map((accent) => [accent.id, accent]));
var resolveAccentId = (id) => legacyAccentIds[id] ?? id;
var getAccent = (id) => accentById.get(resolveAccentId(id)) ?? accentById.get(DEFAULT_ACCENT_ID);
var isAccentId = (value) => Boolean(value && accentById.has(resolveAccentId(value)));
var accentSets = (id) => {
  const accent = getAccent(id);
  return {
    light: [accent.light, accent.duo.light, accent.tri.light],
    dark: [accent.dark, accent.duo.dark, accent.tri.dark]
  };
};

// src/palettes.ts
var defaultAccents = [
  "lab(92.9449% -44.411 80.292)",
  "lab(89.622% -60.7933 21.1414)",
  "lab(77.5288% -33.8221 -35.2522)"
];
var graphPalettes = {
  greenday: [
    "lab(75.3083% -50.8817 16.5941)",
    "lab(64.2127% -33.5133 10.9937)",
    "lab(52.3473% -26.752 8.78495)"
  ],
  orange: [
    "lab(71.4857% 31.7395 50.6703)",
    "lab(59.9849% 27.1583 43.2884)",
    "lab(47.4458% 17.612 27.6482)"
  ],
  smelly: [
    "lab(71.5613% -39.2213 32.0347)",
    "lab(59.4864% -27.9865 22.5741)",
    "lab(48.8016% -22.3829 17.9859)"
  ],
  bluebee: [
    "lab(72.927% -27.9603 -18.655)",
    "lab(61.1772% -22.4508 -14.9579)",
    "lab(48.266% -16.9089 -11.2492)"
  ],
  indigosea: [
    "lab(64.6212% -3.42974 -41.9226)",
    "lab(55.4566% -3.21141 -35.0042)",
    "lab(43.9603% -2.77504 -28.0458)"
  ],
  purple: [
    "lab(65.9315% 23.8296 -37.7086)",
    "lab(54.6046% 19.7722 -31.452)",
    "lab(46.7671% 15.6163 -25.232)"
  ],
  pink: [
    "lab(68.1924% 46.0132 8.22219)",
    "lab(57.0643% 32.9593 5.82368)",
    "lab(46.8598% 26.3926 4.64644)"
  ],
  fire: [
    "lab(63.1816% 61.0248 26.574)",
    "lab(83.7092% 15.1838 49.0253)",
    "lab(91.052% 3.18348 41.0078)"
  ],
  deepsea: [
    "lab(73.7018% -27.0253 -40.4936)",
    "lab(61.4794% 5.08663 -63.0304)",
    "lab(66.9883% -8.56626 -50.0439)"
  ],
  pinkteam: [
    "lab(59.5163% 79.0474 -13.7787)",
    "lab(63.2046% 32.0657 -40.4435)",
    "lab(64.9393% -11.5563 -42.2452)"
  ],
  burning: [
    "lab(59.7009% 67.0661 59.0563)",
    "lab(60.382% 65.0115 2.28822)",
    "lab(78.9059% 22.0683 64.7554)"
  ],
  blueteam: [
    "lab(71.6811% -31.5902 -32.9072)",
    "lab(61.1151% 48.3187 -49.9469)",
    "lab(58.4679% 63.9384 31.5448)"
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
  prism: accentSets("prism").light
};
var darkGraphPalettes = Object.fromEntries(
  ["theme", "mint", "green", "cyan", "blue", "sunset", "ocean", "neon", "aurora", "prism"].map(
    (id) => [id, accentSets(id).dark]
  )
);
var paletteMode = (palette) => palette === "solid" || palette === "mono" ? "solid" : palette === "duo" ? "duo" : "trio";
var paletteAccents = (palette, fallback) => palette in graphPalettes ? graphPalettes[palette] : fallback;
var paletteDarkAccents = (palette, fallback) => darkGraphPalettes[palette] ?? paletteAccents(palette, fallback);

// src/ascii/frame.ts
var MIN_INNER = 48;
var widthOf = (value) => [...value].length;
var padEnd = (value, size) => {
  const extra = size - widthOf(value);
  return extra > 0 ? value + " ".repeat(extra) : [...value].slice(0, size).join("");
};
var padStart = (value, size) => {
  const extra = size - widthOf(value);
  return extra > 0 ? " ".repeat(extra) + value : [...value].slice(-size).join("");
};
var dash = (count) => "-".repeat(Math.max(0, count));
var rule = dash;
var fillTrack = (filled, total, on = "=", off = "-") => {
  const count = Math.min(total, Math.max(0, filled));
  return on.repeat(count) + off.repeat(total - count);
};
var col = (value, size, align = "left") => align === "right" ? padStart(value, size) : padEnd(value, size);
var colWidth = (values) => Math.max(0, ...values.map(widthOf));
var frameAscii = (title, lines, minInner = MIN_INNER) => {
  const caption = `[ ${title.trim().toUpperCase()} ]`;
  const contentWidth = Math.max(0, ...lines.map(widthOf));
  const inner = Math.max(minInner, contentWidth, caption.length + 4);
  const span = inner + 2;
  const label = ` ${caption} `;
  const leftover = Math.max(0, span - label.length);
  const left = Math.floor(leftover / 2);
  const right = leftover - left;
  const empty2 = `| ${" ".repeat(inner)} |`;
  return [
    `+${dash(left)}${label}${dash(right)}+`,
    empty2,
    ...lines.map((line) => `| ${padEnd(line, inner)} |`),
    empty2,
    `+${dash(span)}+`
  ].join("\n");
};

// src/ascii/graphs.ts
var SPARK_GLYPHS = ["\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"];
var STACK_GLYPHS = ["\u2588", "\u2593", "\u2592", "\u2591", "#", "=", "+", "-"];
var GLYPH_PRESETS = {
  shade: ["\xB7", "\u2591", "\u2592", "\u2593", "\u2588"],
  ascii: [".", "-", "=", "#", "@"],
  hash: [" ", "#"],
  bar: [" ", "\u2588"]
};
var clamp01 = (value) => Math.min(1, Math.max(0, value));
var glyphScale = (glyphs, fallback) => {
  if (!glyphs) return fallback;
  const preset = GLYPH_PRESETS[glyphs.trim().toLowerCase()];
  if (preset) return preset;
  const custom = /^\s*\[([\s\S]*)\]\s*$/.exec(glyphs)?.[1]?.split(",").map((entry) => {
    const token = entry.trim();
    const quoted = /^(?:"([\s\S]*)"|'([\s\S]*)')$/.exec(token);
    return quoted ? quoted[1] ?? quoted[2] ?? "" : token;
  });
  return custom && custom.length >= 2 && custom.every((entry) => entry.length > 0) ? custom : fallback;
};
var glyphAt = (scale, ratio) => scale[Math.round(clamp01(ratio) * (scale.length - 1))] ?? scale.at(-1) ?? "\u2588";
var sparkGlyphs = (values, glyphs) => {
  const peak = Math.max(...values, 1);
  const scale = glyphScale(glyphs, SPARK_GLYPHS);
  return values.map((value) => glyphAt(scale, value / peak));
};
var meterTrack = (value, ticks, glyphs) => {
  const scale = glyphScale(glyphs, ["-", "="]);
  const active = scale.length > 2 ? scale.at(-2) : scale.at(-1);
  return fillTrack(Math.round(clamp01(value) * ticks), ticks, active, scale[0]);
};
var miniBars = (values, height, glyphs) => {
  const peak = Math.max(...values, 1);
  const fill = glyphScale(glyphs, ["\u2588"]).at(-1);
  return Array.from(
    { length: height },
    (_, row) => values.map((value) => {
      const level = Math.round(value / peak * (height - 1));
      return height - 1 - row <= level ? fill : " ";
    }).join(" ")
  );
};

// src/render.ts
var supportedGraphTypes = [
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
  "sheet"
];
var text = (value) => ({ type: "text", value });
var clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
var number = (value) => Number(value.replace(/[,$%]/g, ""));
var meaningful = (source) => source.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.trim() && !line.trimStart().startsWith("#"));
var properties = (source) => {
  const result = {};
  for (const line of meaningful(source)) {
    const match = /^([\w.-]+)\s*:\s*(.+)$/.exec(line.trim());
    if (match?.[1] && match[2]) result[match[1]] = match[2];
  }
  return result;
};
var data = (source) => meaningful(source).flatMap((line) => {
  const match = /^(.+?)\s*=\s*([+-]?[\d,.]+)(?:\s|$)/.exec(line.trim());
  return match?.[1] && match[2] && Number.isFinite(number(match[2])) ? [{ label: match[1].trim(), value: number(match[2]) }] : [];
});
var rankData = (source) => {
  if (!/^\s*items\s*:\s*$/im.test(source)) return data(source);
  const items = [];
  let item;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label };
      items.push(item);
      continue;
    }
    if (!item) continue;
    const value = /^\s+value\s*:\s*([+-]?[\d,.]+)\s*$/i.exec(line)?.[1];
    if (value && Number.isFinite(number(value))) item.value = number(value);
    const display = /^\s+display\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (display) item.display = display.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
  }
  return items.filter(
    (item2) => Boolean(item2.label) && Number.isFinite(item2.value)
  );
};
var bar = (ratio, width = 24, glyphs) => {
  const scale = glyphScale(glyphs, ["\xB7", "\u25A0"]);
  const filled = Math.round(clamp(ratio) * width);
  return `[${scale.at(-1).repeat(filled)}${scale[0].repeat(width - filled)}]`;
};
var asciiBar = (ratio, ticks, marker, glyphs) => {
  const scale = glyphScale(glyphs, ["-", "="]);
  const filled = Math.round(clamp(ratio) * ticks);
  const markerIndex = marker === void 0 ? -1 : Math.round(clamp(marker) * ticks) - 1;
  const cells = [...fillTrack(filled, ticks, scale.at(-1), scale[0])].map(
    (cell, index) => index === markerIndex ? "|" : cell
  );
  return `[ ${cells.join(" ")} ]`;
};
var rankBar = (ratio, ticks, glyphs) => {
  const scale = glyphScale(glyphs, ["-", "="]);
  const empty2 = scale[0];
  const filled = scale.at(-1);
  const count = Math.round(clamp(ratio) * ticks);
  return `[ ${[...Array(count).fill(filled), ...Array(ticks - count).fill(empty2)].join(" ")} ]`;
};
var aligned = (items, width = 24, glyphs) => {
  const labelWidth = Math.max(1, colWidth(items.map(({ label }) => label)));
  const max = Math.max(1, ...items.map(({ value }) => Math.abs(value)));
  return items.map(
    ({ label, value }) => `${col(label, labelWidth)}  ${bar(Math.abs(value) / max, width, glyphs)}  ${value.toLocaleString("en-US")}`
  );
};
var spark = (values, glyphs) => {
  const min = Math.min(...values);
  const range = Math.max(1, Math.max(...values) - min);
  const scale = glyphScale(glyphs, SPARK_GLYPHS);
  return values.map((value) => glyphAt(scale, (value - min) / range)).join("");
};
var sparkData = (source) => {
  const lines = source.split(/\r?\n/);
  const dataIndex = lines.findIndex((line) => /^\s*data\s*:/i.test(line));
  if (dataIndex >= 0) {
    const inline = /^\s*data\s*:\s*\[([^\]]+)\]\s*$/i.exec(lines[dataIndex])?.[1];
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
var sparkBody = (source, palette, glyphs) => {
  const series = sparkData(source);
  if (!series.length) return void 0;
  const props = properties(source);
  const mode = paletteMode(palette);
  const explicitColor = /^(accent2|accent3)$/i.test(props.color ?? "") ? Number(props.color.slice(-1)) - 1 : props.color?.toLowerCase() === "accent" ? 0 : void 0;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--spark"] },
    children: [
      ...series.map((values, seriesIndex) => {
        const marks = sparkGlyphs(values, glyphs ?? props.glyphs);
        const colorIndex = explicitColor ?? (mode === "solid" ? 0 : mode === "duo" ? seriesIndex % 2 : seriesIndex % 3);
        return {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__sparkline"] },
          children: marks.map((mark, index) => ({
            type: "element",
            tagName: "span",
            properties: {
              className: [
                "md-graph__spark-mark",
                ...index === marks.length - 1 ? ["md-graph__accent", `md-graph__color-${colorIndex}`] : ["md-graph__track"]
              ]
            },
            children: [text(mark)]
          }))
        };
      }),
      ...props.label || props.caption ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__caption", "md-graph__spark-caption"] },
          children: [text(props.label ?? props.caption)]
        }
      ] : []
    ]
  };
};
var parseSequence = (value) => value.replace(/^\[|\]$/g, "").split(/[\s,]+/).map(number).filter(Number.isFinite);
var durationSeconds = (value) => {
  const units = { d: 86400, h: 3600, m: 60, s: 1 };
  let seconds = 0;
  for (const match of value.matchAll(/([\d.]+)\s*([dhms])/g))
    seconds += Number(match[1]) * units[match[2]];
  return seconds;
};
var clock = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor(safe % 3600 / 60);
  const rest = safe % 60;
  return `${hours ? `${hours}:` : ""}${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(rest).padStart(2, "0")}`;
};
var tableLines = (source) => meaningful(source).filter((line) => line.includes("|")).filter((line) => !/^\s*\|?\s*:?-{3}/.test(line)).map(
  (line) => line.replace(/^\s*\||\|\s*$/g, "").split("|").map((cell) => cell.trim()).join("  \u2502  ")
);
var yamlScalar = (value) => {
  const trimmed = value.trim();
  const quoted = /^(?:"([\s\S]*)"|'([\s\S]*)')$/.exec(trimmed);
  return quoted ? quoted[1] ?? quoted[2] ?? "" : trimmed;
};
var yamlArray = (value) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return void 0;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map((cell2) => String(cell2));
  } catch {
  }
  const cells = [];
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
var tableSection = (source, name) => {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${name}\\s*:`, "i").test(line));
  if (start < 0) return [];
  const inline = lines[start].replace(new RegExp(`^${name}\\s*:\\s*`, "i"), "").trim();
  if (inline) return [inline];
  const values = [];
  for (const line of lines.slice(start + 1)) {
    if (/^[A-Za-z][\w-]*\s*:/.test(line)) break;
    const item = /^\s+-\s*(.+?)\s*$/.exec(line)?.[1];
    if (item) values.push(item);
  }
  return values;
};
var tableAlignmentConfig = (source) => {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => /^\s*align\s*:/i.test(line));
  if (start < 0) return void 0;
  const inline = lines[start].replace(/^\s*align\s*:\s*/i, "").trim();
  const values = inline ? yamlArray(inline) ?? inline.replace(/^\[|\]$/g, "").split(",") : lines.slice(start + 1).flatMap((line) => {
    const match = /^\s*-\s*(left|center|right)\s*$/i.exec(line);
    return match?.[1] ? [match[1]] : [];
  });
  const alignments = values.map((value) => yamlScalar(value).trim().toLowerCase());
  return alignments.every((value) => ["left", "center", "right"].includes(value)) ? alignments : void 0;
};
var splitTableRow = (line) => {
  const cells = [];
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
var parseTable = (source) => {
  const structuredHeaders = tableSection(source, "headers");
  if (structuredHeaders.length) {
    const header2 = yamlArray(structuredHeaders[0]) ?? structuredHeaders.map(yamlScalar);
    const rows2 = tableSection(source, "rows").flatMap((value) => {
      const parsed = yamlArray(value);
      return parsed ? [parsed] : [];
    });
    const footerValues = tableSection(source, "footer");
    const footer = footerValues.length ? yamlArray(footerValues[0]) ?? footerValues.map(yamlScalar) : void 0;
    const configuredAlignments2 = tableAlignmentConfig(source);
    const alignments2 = configuredAlignments2?.length === header2.length ? configuredAlignments2 : header2.map((_, index) => index === 0 ? "left" : "right");
    if (header2.length < 2 || !rows2.length || rows2.some((row) => row.length !== header2.length) || footer && footer.length !== header2.length)
      return void 0;
    return { header: header2, alignments: alignments2, rows: rows2, footer };
  }
  const lines = meaningful(source).filter((line) => line.includes("|"));
  if (lines.length < 2) return void 0;
  const header = splitTableRow(lines[0]);
  const divider = splitTableRow(lines[1]);
  if (header.length < 2 || divider.length !== header.length || !divider.every((cell) => /^:?-{3,}:?$/.test(cell)))
    return void 0;
  const dividerAlignments = divider.map(
    (cell) => cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "left"
  );
  const rows = lines.slice(2).map(splitTableRow);
  if (rows.some((row) => row.length !== header.length)) return void 0;
  const configuredAlignments = tableAlignmentConfig(source);
  const alignments = configuredAlignments?.length === header.length ? configuredAlignments : dividerAlignments;
  return { header, alignments, rows, footer: void 0 };
};
var tableCell = (tagName, value, alignment) => ({
  type: "element",
  tagName,
  properties: {
    ...tagName === "th" ? { scope: "col" } : {},
    ...alignment ? { dataAlign: alignment } : {}
  },
  children: [text(value)]
});
var tableBody = (source) => {
  const parsed = parseTable(source);
  if (!parsed) return void 0;
  const row = (cells, header = false, summary = false) => ({
    type: "element",
    tagName: "tr",
    properties: {
      ...!header && (summary || /^(total|subtotal|net|grand total)$/i.test(cells[0]?.trim() ?? "")) ? { className: ["md-graph__table-summary"] } : {}
    },
    children: cells.map(
      (cell, index) => tableCell(header ? "th" : "td", cell, parsed.alignments[index])
    )
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
          className: ["md-graph__table", ...parsed.footer ? ["md-graph__table--footer"] : []]
        },
        children: [
          {
            type: "element",
            tagName: "thead",
            properties: {},
            children: [row(parsed.header, true)]
          },
          {
            type: "element",
            tagName: "tbody",
            properties: {},
            children: parsed.rows.map((cells) => row(cells))
          },
          ...parsed.footer ? [
            {
              type: "element",
              tagName: "tfoot",
              properties: {},
              children: [row(parsed.footer, false, true)]
            }
          ] : []
        ]
      }
    ]
  };
};
var sheetSections = (source) => {
  const sections = [];
  let section;
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
    const cells = row ? yamlArray(row) : void 0;
    if (cells) section.rows.push(cells);
  }
  return sections.filter(({ rows }) => rows.length);
};
var sheetBody = (source) => {
  const headerValues = tableSection(source, "headers");
  if (!headerValues.length) return void 0;
  const header = yamlArray(headerValues[0]) ?? headerValues.map(yamlScalar);
  const sections = sheetSections(source);
  if (header.length < 2 || !sections.length || sections.some(({ rows }) => rows.some((row) => row.length !== header.length)))
    return void 0;
  const configured = tableAlignmentConfig(source);
  const alignments = configured?.length === header.length ? configured : header.map((_, index) => index === 0 ? "left" : "right");
  const cells = (values, tagName = "td") => values.map((value, index) => tableCell(tagName, value, alignments[index]));
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
              { type: "element", tagName: "tr", properties: {}, children: cells(header, "th") }
            ]
          },
          ...sections.map((section, index) => ({
            type: "element",
            tagName: "tbody",
            properties: {
              className: ["md-graph__sheet-section"],
              dataSectionIndex: index
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
                    children: [text(section.title)]
                  }
                ]
              },
              ...section.rows.map((row) => ({
                type: "element",
                tagName: "tr",
                properties: {},
                children: cells(row)
              }))
            ]
          }))
        ]
      }
    ]
  };
};
var parseFlowNodes = (source) => {
  const rows = [];
  let row;
  let node;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*nodes\s*:\s*$/i.test(line)) {
      row = [];
      rows.push(row);
      node = void 0;
      continue;
    }
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label && row) {
      node = { label, tone: "default", stretch: false };
      row.push(node);
      continue;
    }
    const tone = /^\s*tone\s*:\s*(accent|muted|default)\s*$/i.exec(line)?.[1];
    if (tone && node) node.tone = tone;
    const stretch = /^\s*stretch\s*:\s*(true|false)\s*$/i.exec(line)?.[1];
    if (stretch && node) node.stretch = stretch === "true";
  }
  return rows.length && rows.every((nodes) => nodes.length) ? rows : void 0;
};
var flowBody = (source) => {
  const rows = parseFlowNodes(source);
  if (!rows) return void 0;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--flow"] },
    children: rows.map((nodes) => ({
      type: "element",
      tagName: "div",
      properties: { className: ["md-graph__flow-row"] },
      children: nodes.flatMap((node, index) => [
        ...index ? [
          {
            type: "element",
            tagName: "span",
            properties: {
              className: [
                "md-graph__flow-connector",
                ...node.stretch ? ["md-graph__flow-connector--stretch"] : [],
                ...node.tone === "accent" ? ["md-graph__flow-tone--accent"] : []
              ]
            },
            children: node.stretch ? [] : [text("- - -\u25B6")]
          }
        ] : [],
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["md-graph__flow-node", `md-graph__flow-tone--${node.tone}`]
          },
          children: [text(node.label)]
        }
      ])
    }))
  };
};
var textColorClasses = (color2) => {
  if (!color2) return [];
  if (color2 === "dark" || color2 === "light") return [`md-graph__tone--${color2}`];
  const index = color2 === "accent" ? 0 : Number(color2.slice(-1)) - 1;
  return ["md-graph__accent", `md-graph__color-${index}`];
};
var parseTreeNodes = (source) => {
  if (!/^nodes\s*:\s*$/im.test(source)) return void 0;
  const roots = [];
  const stack = [];
  let current;
  for (const line of source.split(/\r?\n/)) {
    const label = /^(\s*)-\s*label\s*:\s*(.+?)\s*$/i.exec(line);
    if (label?.[2]) {
      const indent = label[1].length;
      const node = { label: yamlScalar(label[2]), children: [] };
      while (stack.length && stack.at(-1).indent >= indent) stack.pop();
      if (stack.length) stack.at(-1).node.children.push(node);
      else roots.push(node);
      stack.push({ indent, node });
      current = node;
      continue;
    }
    if (!current) continue;
    const meta = /^\s+meta\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (meta) current.meta = yamlScalar(meta);
    const color2 = /^\s+color\s*:\s*(accent|accent2|accent3|dark|light)\s*$/i.exec(line)?.[1];
    if (color2) current.color = color2;
  }
  return roots.length ? roots : void 0;
};
var flattenTree = (nodes, prefix = "", root = true) => {
  const singleRoot = root && nodes.length === 1;
  return nodes.flatMap((node, index) => {
    const last = index === nodes.length - 1;
    const branch = singleRoot ? "" : `${prefix}${last ? "\u2514\u2500 " : "\u251C\u2500 "}`;
    const childPrefix = singleRoot ? "" : `${prefix}${last ? "   " : "\u2502  "}`;
    return [{ ...node, branch }, ...flattenTree(node.children, childPrefix, false)];
  });
};
var treeBody = (source) => {
  const nodes = parseTreeNodes(source);
  if (!nodes) return void 0;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--tree"] },
    children: flattenTree(nodes).map((node) => {
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
                children: [text(node.branch)]
              },
              {
                type: "element",
                tagName: "span",
                properties: {
                  className: ["md-graph__tree-label", ...textColorClasses(node.color)]
                },
                children: [text(node.label)]
              }
            ]
          },
          ...node.meta ? [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__tree-meta"] },
              children: [text(node.meta)]
            }
          ] : []
        ]
      };
    })
  };
};
var timelineColorClasses = (color2 = "ink") => {
  if (color2 === "muted" || color2 === "ink") return [`md-graph__tone--${color2}`];
  return textColorClasses(color2);
};
var parseTimelineEvents = (source) => {
  if (!/^events\s*:\s*$/im.test(source)) return void 0;
  const events = [];
  let event;
  for (const line of source.split(/\r?\n/)) {
    const date = /^\s*-\s*date\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (date) {
      event = { date: yamlScalar(date) };
      events.push(event);
      continue;
    }
    if (!event) continue;
    const label = /^\s+label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) event.label = yamlScalar(label);
    const color2 = /^\s+color\s*:\s*(accent|accent2|accent3|muted|ink)\s*$/i.exec(line)?.[1];
    if (color2) event.color = color2;
  }
  const parsed = events.filter(
    (event2) => Boolean(event2.date && event2.label)
  );
  return parsed.length ? parsed : void 0;
};
var timelineBody = (source) => {
  const events = parseTimelineEvents(source);
  if (!events) return void 0;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--timeline"] },
    children: events.map((event, index) => {
      const color2 = event.color ?? "ink";
      const colorClasses = timelineColorClasses(color2);
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "md-graph__timeline-event",
            ...colorClasses,
            ...color2 === "muted" ? ["md-graph__timeline-event--muted"] : [],
            ...index === events.length - 1 ? ["md-graph__timeline-event--last"] : []
          ]
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__timeline-marker"] },
            children: [text(color2 === "muted" ? "\u25CB" : "\u25CF")]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__timeline-date"] },
            children: [text(event.date)]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__timeline-label"] },
            children: [text(event.label)]
          }
        ]
      };
    })
  };
};
var parseCheckItems = (source) => {
  if (!/^items\s*:\s*$/im.test(source)) return void 0;
  const items = [];
  let item;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label), done: false };
      items.push(item);
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
      const color2 = yamlScalar(colorSource);
      if (/^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
        color2
      )) {
        item.color = color2;
      }
    }
  }
  return items.filter(({ label }) => Boolean(label)).length ? items : void 0;
};
var checkBody = (source) => {
  const items = parseCheckItems(source);
  if (!items) return void 0;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--check"] },
    children: items.map((item) => {
      const hex = item.color?.startsWith("#") ? item.color : void 0;
      const named = hex ? "accent" : item.color ?? (item.done ? "accent" : "muted");
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "md-graph__check-item",
            ...!item.done ? ["md-graph__check-item--open"] : []
          ]
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["md-graph__check-marker", ...timelineColorClasses(named)],
              ...hex ? { style: `color:${hex}` } : {}
            },
            children: [text(`[${item.done ? item.symbol ?? "x" : " "}]`)]
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__check-copy"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__check-label"] },
                children: [text(item.label)]
              },
              ...item.note ? [
                {
                  type: "element",
                  tagName: "span",
                  properties: { className: ["md-graph__check-note"] },
                  children: [text(item.note)]
                }
              ] : []
            ]
          }
        ]
      };
    })
  };
};
var parseStackRows = (source) => {
  if (!/^rows\s*:\s*$/im.test(source)) return void 0;
  const rows = [];
  let row;
  let segment;
  let inSegments = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s{4}segments\s*:\s*$/i.test(line)) {
      inSegments = true;
      continue;
    }
    const label = /^(\s*)-\s*label\s*:\s*(.+?)\s*$/i.exec(line);
    if (label?.[2]) {
      if (label[1].length <= 2) {
        row = { label: yamlScalar(label[2]), segments: [] };
        rows.push(row);
        segment = void 0;
        inSegments = false;
      } else if (row && inSegments) {
        segment = { label: yamlScalar(label[2]) };
        row.segments.push(segment);
      }
      continue;
    }
    const value = /^\s+value\s*:\s*([+-]?[\d.]+)\s*$/i.exec(line)?.[1];
    if (segment && value && Number.isFinite(Number(value))) segment.value = Number(value);
    const color2 = /^\s+color\s*:\s*(accent|accent2|accent3|muted|ink)\s*$/i.exec(line)?.[1];
    if (segment && color2) segment.color = color2;
  }
  const parsed = rows.filter((row2) => row2.segments.some((entry) => Number.isFinite(entry.value)));
  return parsed.length ? parsed : void 0;
};
var stackCounts = (segments, ticks) => {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0) || 1;
  const raw = segments.map((segment) => Math.max(0, segment.value) / total * ticks);
  const counts = raw.map(Math.floor);
  let remaining = ticks - counts.reduce((sum, count) => sum + count, 0);
  const order = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; remaining > 0; index++, remaining--)
    counts[order[index % order.length].index]++;
  return counts;
};
var stackBody = (source, glyphs) => {
  const rows = parseStackRows(source);
  if (!rows) return void 0;
  const props = properties(source);
  const ticks = Math.max(1, Math.round(Number(props.ticks) || 24));
  const scale = glyphScale(glyphs ?? props.glyphs, STACK_GLYPHS);
  const legend = [...new Set(rows.flatMap((row) => row.segments.map(({ label }) => label)))];
  const accentedLabel = legend.includes(props.accent ?? "") ? props.accent : legend[0];
  const explicitColors = /* @__PURE__ */ new Map();
  for (const row of rows) {
    for (const segment of row.segments) {
      if (segment.color && !explicitColors.has(segment.label)) {
        explicitColors.set(segment.label, segment.color);
      }
    }
  }
  const segmentColor = (label) => timelineColorClasses(
    explicitColors.get(label) ?? (label === accentedLabel ? "accent" : "muted")
  );
  const glyphFor = (label) => scale[legend.indexOf(label) % scale.length] ?? "\u2588";
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--stack"],
      style: `--md-graph-stack-ticks:${ticks}`
    },
    children: [
      ...rows.map((row) => {
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
              children: [text(row.label)]
            },
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__stack-track"] },
              children: row.segments.flatMap(
                (segment, index) => Array.from({ length: counts[index] ?? 0 }, () => ({
                  type: "element",
                  tagName: "span",
                  properties: {
                    className: ["md-graph__stack-cell", ...segmentColor(segment.label)]
                  },
                  children: [text(glyphFor(segment.label))]
                }))
              )
            }
          ]
        };
      }),
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__stack-legend"] },
        children: legend.map((label) => ({
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__stack-key"] },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__stack-key-glyph", ...segmentColor(label)] },
              children: [text(glyphFor(label))]
            },
            text(` ${label}`)
          ]
        }))
      }
    ]
  };
};
var parseFunnelSteps = (source) => {
  if (!/^steps\s*:\s*$/im.test(source)) return void 0;
  const steps = [];
  let step;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      step = { label: yamlScalar(label) };
      steps.push(step);
      continue;
    }
    if (!step) continue;
    const value = /^\s+value\s*:\s*([+-]?[\d.]+)\s*$/i.exec(line)?.[1];
    if (value && Number.isFinite(Number(value))) step.value = Number(value);
    const display = /^\s+display\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (display) step.display = yamlScalar(display);
    const color2 = /^\s+color\s*:\s*(accent|accent2|accent3|ink|muted)\s*$/i.exec(line)?.[1];
    if (color2) step.color = color2;
  }
  const parsed = steps.filter((step2) => step2.label && Number.isFinite(step2.value));
  return parsed.length ? parsed : void 0;
};
var funnelBody = (source, glyphs) => {
  const steps = parseFunnelSteps(source);
  if (!steps) return void 0;
  const props = properties(source);
  const ticks = Math.max(1, Math.round(Number(props.ticks) || 20));
  const peak = Math.max(steps[0]?.value ?? 0, 1);
  const focusedStage = steps.some(({ label }) => label === props.stage) ? props.stage : void 0;
  const scale = glyphScale(glyphs ?? props.glyphs, ["-", "\u2588"]);
  const empty2 = scale[0] ?? "-";
  const filled = scale.length > 2 ? scale.at(-2) : scale.at(-1) ?? "\u2588";
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--funnel"],
      style: `--md-graph-funnel-ticks:${ticks}`
    },
    children: steps.map((step, stepIndex) => {
      const ratio = Math.max(0, step.value) / peak;
      const count = Math.min(ticks, Math.max(step.value > 0 ? 1 : 0, Math.round(ratio * ticks)));
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "md-graph__funnel-row",
            ...focusedStage && step.label !== focusedStage ? ["md-graph__funnel-row--receded"] : []
          ]
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__funnel-label"] },
            children: [text(step.label)]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__funnel-track"] },
            children: Array.from({ length: ticks }, (_, index) => ({
              type: "element",
              tagName: "span",
              properties: {
                className: [
                  "md-graph__funnel-cell",
                  ...index < count ? [
                    "md-graph__funnel-cell--filled",
                    ...timelineColorClasses(step.color ?? "accent")
                  ] : ["md-graph__funnel-cell--empty"]
                ]
              },
              children: [text(index < count ? filled : empty2)]
            }))
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__funnel-value"] },
            children: [text(step.display ?? step.value.toLocaleString("en-US"))]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__funnel-percent"] },
            children: [text(stepIndex === 0 ? "" : `${Math.round(ratio * 100)}%`)]
          }
        ]
      };
    })
  };
};
var parseGanttItems = (source) => {
  if (!/^items\s*:\s*$/im.test(source)) return void 0;
  const items = [];
  let item;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label), complete: 1 };
      items.push(item);
      continue;
    }
    if (!item) continue;
    const numeric = /^\s+(start|end|complete)\s*:\s*([+-]?[\d.]+)\s*$/i.exec(line);
    if (numeric?.[1] && numeric[2] && Number.isFinite(Number(numeric[2]))) {
      item[numeric[1].toLowerCase()] = Number(numeric[2]);
    }
    const color2 = /^\s+color\s*:\s*(accent|accent2|accent3|muted|ink)\s*$/i.exec(line)?.[1];
    if (color2) item.color = color2;
  }
  const parsed = items.filter(
    (item2) => item2.label && Number.isFinite(item2.start) && Number.isFinite(item2.end)
  );
  return parsed.length ? parsed : void 0;
};
var ganttBody = (source, glyphs) => {
  const items = parseGanttItems(source);
  if (!items) return void 0;
  const props = properties(source);
  const columns = Math.max(1, Math.round(Number(props.columns) || 24));
  const progress = Number(props.progress);
  const hasProgress = Number.isFinite(progress);
  const tickLabels = yamlArray(props.ticks ?? "") ?? [];
  const focusedStage = items.some(({ label }) => label === props.stage) ? props.stage : void 0;
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade);
  const filledGlyph = scale.at(-1) ?? "\u2588";
  const remainingGlyph = scale[1] ?? scale[0] ?? "\u2591";
  const track = (children, className) => ({
    type: "element",
    tagName: "span",
    properties: { className },
    children
  });
  const rows = [];
  if (hasProgress) {
    const playhead = Math.round(clamp(progress) * (columns - 1));
    rows.push({
      type: "element",
      tagName: "div",
      properties: { className: ["md-graph__gantt-row", "md-graph__gantt-progress-row"] },
      children: [
        { type: "element", tagName: "span", properties: {}, children: [text("")] },
        track(
          Array.from({ length: columns }, (_, index) => ({
            type: "element",
            tagName: "span",
            properties: {
              className: [
                "md-graph__gantt-cell",
                ...index === playhead ? ["md-graph__accent"] : []
              ]
            },
            children: [text(index === playhead ? "\u25BE" : " ")]
          })),
          ["md-graph__gantt-track", "md-graph__gantt-playhead"]
        )
      ]
    });
  }
  for (const item of items) {
    const start = Math.min(columns - 1, Math.max(0, Math.round(clamp(item.start) * columns)));
    const end = Math.min(columns, Math.max(start + 1, Math.round(clamp(item.end) * columns)));
    const completed = Math.round(clamp(item.complete) * (end - start));
    const color2 = item.color ?? (item.label === focusedStage ? "accent" : "ink");
    rows.push({
      type: "element",
      tagName: "div",
      properties: {
        className: [
          "md-graph__gantt-row",
          ...focusedStage && item.label !== focusedStage ? ["md-graph__gantt-row--receded"] : []
        ]
      },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__gantt-label", ...timelineColorClasses(color2)] },
          children: [text(item.label)]
        },
        track(
          Array.from({ length: columns }, (_, index) => {
            const inside = index >= start && index < end;
            const done = inside && index < start + completed;
            return {
              type: "element",
              tagName: "span",
              properties: {
                className: [
                  "md-graph__gantt-cell",
                  ...done ? ["md-graph__gantt-cell--done", ...timelineColorClasses(color2)] : inside ? ["md-graph__gantt-cell--remaining"] : ["md-graph__gantt-cell--empty"]
                ]
              },
              children: [text(done ? filledGlyph : inside ? remainingGlyph : "-")]
            };
          }),
          ["md-graph__gantt-track"]
        )
      ]
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
          children: tickLabels.map((label, index) => ({
            type: "element",
            tagName: "span",
            properties: {
              className: ["md-graph__gantt-tick"],
              style: `left:${tickLabels.length === 1 ? 0 : index / (tickLabels.length - 1) * 100}%`
            },
            children: [text(label)]
          }))
        }
      ]
    });
  }
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--gantt"],
      style: `--md-graph-gantt-columns:${columns}`
    },
    children: rows
  };
};
var plotBody = (source, glyphs) => {
  const props = properties(source);
  const values = parseSequence(props.data ?? "");
  if (!values.length) return void 0;
  const labels = tableSection(source, "labels").map(yamlScalar);
  const height = Math.max(1, Math.round(Number(props.height) || 7));
  const variant = props.variant === "line" ? "line" : "area";
  const progress = Number.isFinite(Number(props.progress)) ? clamp(Number(props.progress)) : 1;
  const revealed = Math.min(values.length, Math.max(0, Math.ceil(progress * values.length)));
  const peak = Math.max(...values, 1);
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade);
  const cap = scale.at(-1) ?? "\u2588";
  const fill = scale[1] ?? scale[0] ?? "\u2591";
  const rows = Array.from({ length: height }, (_, row) => ({
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__plot-row"] },
    children: values.map((value, column) => {
      const capRow = height - 1 - Math.round(Math.max(0, value) / peak * (height - 1));
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
            ...isCap ? ["md-graph__plot-cell--cap"] : [],
            ...isArea ? ["md-graph__plot-cell--fill"] : [],
            ...accented && isCap ? ["md-graph__accent"] : isCap ? ["md-graph__tone--ink"] : []
          ]
        },
        children: [text(isCap ? cap : isArea ? fill : " ")]
      };
    })
  }));
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--plot"],
      style: `--md-graph-plot-columns:${values.length};--md-graph-plot-height:${height}`
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
                children: [text(String(peak))]
              },
              { type: "element", tagName: "span", properties: {}, children: [text("0")] }
            ]
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__plot-canvas"] },
            children: rows
          }
        ]
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
                children: [text(labels[0] ?? "")]
              },
              {
                type: "element",
                tagName: "span",
                properties: {},
                children: [text(labels.at(-1) ?? labels[0] ?? "")]
              }
            ]
          }
        ]
      }
    ]
  };
};
var waffleBody = (source, glyphs) => {
  const props = properties(source);
  if (!props.value || !Number.isFinite(Number(props.value))) return void 0;
  const value = clamp(Number(props.value));
  const cells = Math.max(1, Math.round(Number(props.cells) || 100));
  const columns = Math.max(1, Math.round(Number(props.columns) || 10));
  const filled = Math.round(value * cells);
  const requestedGlyphs = glyphs ?? props.glyphs;
  const scale = glyphScale(requestedGlyphs, GLYPH_PRESETS.shade);
  const active = scale.at(-1) ?? "\u2588";
  const empty2 = !requestedGlyphs || requestedGlyphs.trim().toLowerCase() === "shade" ? scale[1] ?? scale[0] ?? "\u2591" : scale[0] ?? " ";
  const requestedColor = yamlScalar(props.color ?? "accent");
  const hexColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(requestedColor) ? requestedColor : void 0;
  const namedColor = /^(accent|accent2|accent3|muted|ink)$/.test(requestedColor) ? requestedColor : "accent";
  const colorClasses = hexColor ? ["md-graph__waffle-color--custom"] : timelineColorClasses(namedColor);
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--waffle"],
      style: `--md-graph-waffle-columns:${columns}${hexColor ? `;--md-graph-waffle-color:${hexColor}` : ""}`
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__waffle-grid"] },
        children: Array.from({ length: cells }, (_, index) => ({
          type: "element",
          tagName: "span",
          properties: {
            className: [
              "md-graph__waffle-cell",
              ...index < filled ? ["md-graph__waffle-cell--filled", ...colorClasses] : ["md-graph__waffle-cell--empty"]
            ]
          },
          children: [text(index < filled ? active : empty2)]
        }))
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__waffle-percent", ...colorClasses] },
        children: [text(`${Math.round(value * 100)}%`)]
      },
      ...props.label ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__waffle-label"] },
          children: [text(yamlScalar(props.label))]
        }
      ] : []
    ]
  };
};
var parseDiff = (source) => {
  if (!/^rows\s*:\s*$/im.test(source)) return void 0;
  const rows = [];
  let current;
  let footer;
  let inFooter = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^footer\s*:\s*$/i.test(line)) {
      inFooter = true;
      footer = {};
      current = footer;
      continue;
    }
    const rowLabel = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    const footerLabel = inFooter ? /^\s+label\s*:\s*(.+?)\s*$/i.exec(line)?.[1] : void 0;
    if (rowLabel) {
      current = { label: yamlScalar(rowLabel) };
      rows.push(current);
      continue;
    }
    if (footerLabel && footer) footer.label = yamlScalar(footerLabel);
    if (!current) continue;
    const value = /^\s+value\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (value) current.value = yamlScalar(value);
    const colorSource = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (colorSource) {
      const color2 = yamlScalar(colorSource);
      if (/^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
        color2
      )) {
        current.color = color2;
      }
    }
    const type = /^\s+type\s*:\s*(add|remove)\s*$/i.exec(line)?.[1];
    if (type) current.type = type;
  }
  const parsedRows = rows.filter(({ label, value }) => Boolean(label && value !== void 0));
  const parsedFooter = footer?.label && footer.value !== void 0 ? footer : void 0;
  return parsedRows.length ? { rows: parsedRows, footer: parsedFooter } : void 0;
};
var diffColor = (color2) => {
  if (color2?.startsWith("#"))
    return { classes: ["md-graph__diff-color--custom"], style: `color:${color2}` };
  return { classes: timelineColorClasses(color2 ?? "ink") };
};
var diffBody = (source) => {
  const parsed = parseDiff(source);
  if (!parsed) return void 0;
  const entry = (item, footer = false) => {
    const tone = diffColor(item.color);
    const sign = item.type === "add" ? "+" : item.type === "remove" ? "\u2212" : "";
    return {
      type: "element",
      tagName: "div",
      properties: {
        className: ["md-graph__diff-row", ...footer ? ["md-graph__diff-footer"] : []]
      },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["md-graph__diff-sign", ...tone.classes],
            ...tone.style ? { style: tone.style } : {}
          },
          children: [text(sign)]
        },
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["md-graph__diff-label", ...tone.classes],
            ...tone.style ? { style: tone.style } : {}
          },
          children: [text(item.label)]
        },
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["md-graph__diff-value", ...tone.classes],
            ...tone.style ? { style: tone.style } : {}
          },
          children: [text(item.value)]
        }
      ]
    };
  };
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--diff"] },
    children: [
      ...parsed.rows.map((row) => entry(row)),
      ...parsed.footer ? [entry(parsed.footer, true)] : []
    ]
  };
};
var parseInvoice = (source) => {
  if (!/^items\s*:\s*$/im.test(source)) return void 0;
  const invoice = { meta: [], items: [], totals: [] };
  let section = "";
  let current;
  for (const line of source.split(/\r?\n/)) {
    const heading = /^(from|to|meta|items|totals)\s*:\s*$/i.exec(line)?.[1]?.toLowerCase();
    if (heading) {
      section = heading;
      current = void 0;
      if (heading === "from" || heading === "to") {
        invoice[heading] = { lines: [] };
        current = invoice[heading];
      }
      continue;
    }
    const note = /^note\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (note) {
      invoice.note = yamlScalar(note);
      continue;
    }
    if (section === "from" || section === "to") {
      const party = invoice[section];
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
        invoice.meta.push(current);
      } else if (section === "items") {
        current = { description: yamlScalar(first[2]) };
        invoice.items.push(current);
      } else if (section === "totals") {
        current = { label: yamlScalar(first[2]) };
        invoice.totals.push(current);
      }
      continue;
    }
    if (!current) continue;
    const field = /^\s+(value|qty|rate|amount)\s*:\s*(.+?)\s*$/i.exec(line);
    if (field?.[1] && field[2]) current[field[1].toLowerCase()] = yamlScalar(field[2]);
    const colorSource = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (colorSource && section === "totals") {
      const color2 = yamlScalar(colorSource);
      if (/^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
        color2
      )) {
        current.color = color2;
      }
    }
  }
  invoice.meta = invoice.meta.filter(({ label, value }) => Boolean(label && value !== void 0));
  invoice.items = invoice.items.filter(
    ({ description, amount }) => Boolean(description && amount !== void 0)
  );
  invoice.totals = invoice.totals.filter(
    ({ label, value }) => Boolean(label && value !== void 0)
  );
  return invoice.items.length ? invoice : void 0;
};
var invoiceBody = (source) => {
  const invoice = parseInvoice(source);
  if (!invoice) return void 0;
  const showQty = invoice.items.some(({ qty }) => qty !== void 0);
  const showRate = invoice.items.some(({ rate }) => rate !== void 0);
  const tableCells = (values, header = false) => values.map((value, index) => ({
    type: "element",
    tagName: "span",
    properties: {
      className: [
        "md-graph__invoice-cell",
        ...header ? ["md-graph__invoice-cell--header"] : [],
        ...index > 0 ? ["md-graph__invoice-cell--numeric"] : []
      ]
    },
    children: [text(value)]
  }));
  const parties = [["FROM", invoice.from], ["BILL TO", invoice.to]];
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: [
        "md-graph__body",
        "md-graph__body--invoice",
        ...showQty ? ["md-graph__invoice--qty"] : [],
        ...showRate ? ["md-graph__invoice--rate"] : []
      ]
    },
    children: [
      ...invoice.from || invoice.to ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__invoice-parties"] },
          children: parties.map(([heading, party]) => ({
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__invoice-party"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__invoice-kicker"] },
                children: [text(heading)]
              },
              ...party?.name ? [
                {
                  type: "element",
                  tagName: "span",
                  properties: { className: ["md-graph__invoice-party-name"] },
                  children: [text(party.name)]
                }
              ] : [],
              ...(party?.lines ?? []).map((line) => ({
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__invoice-party-line"] },
                children: [text(line)]
              }))
            ]
          }))
        }
      ] : [],
      ...invoice.meta.length ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__invoice-meta"] },
          children: invoice.meta.map((item) => ({
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__invoice-meta-item"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__invoice-kicker"] },
                children: [text(item.label)]
              },
              {
                type: "element",
                tagName: "span",
                properties: {},
                children: [text(item.value)]
              }
            ]
          }))
        }
      ] : [],
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__invoice-table"] },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: {
              className: ["md-graph__invoice-table-row", "md-graph__invoice-table-head"]
            },
            children: tableCells(
              ["Description", ...showQty ? ["Qty"] : [], ...showRate ? ["Rate"] : [], "Amount"],
              true
            )
          },
          ...invoice.items.map((item) => ({
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__invoice-table-row"] },
            children: tableCells([
              item.description,
              ...showQty ? [item.qty ?? ""] : [],
              ...showRate ? [item.rate ?? ""] : [],
              item.amount
            ])
          }))
        ]
      },
      ...invoice.totals.length ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__invoice-totals"] },
          children: invoice.totals.map((total) => {
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
                  children: [text(total.label)]
                },
                {
                  type: "element",
                  tagName: "span",
                  properties: {
                    className: ["md-graph__invoice-total-value", ...tone.classes],
                    ...tone.style ? { style: tone.style } : {}
                  },
                  children: [text(total.value)]
                }
              ]
            };
          })
        }
      ] : [],
      ...invoice.note ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__invoice-note"] },
          children: [text(invoice.note)]
        }
      ] : []
    ]
  };
};
var compareBody = (source) => {
  const props = properties(source);
  const columns = yamlArray(props.columns ?? "");
  if (!columns?.length || !/^rows\s*:\s*$/im.test(source)) return void 0;
  const rows = [];
  let row;
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
  if (!parsedRows.length) return void 0;
  const accented = columns.indexOf(yamlScalar(props.accent ?? ""));
  const colorSource = yamlScalar(props.color ?? "accent");
  const color2 = /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
    colorSource
  ) ? colorSource : "accent";
  const tone = diffColor(color2);
  const accentProperties = () => ({
    className: ["md-graph__compare-accent", ...tone.classes],
    ...tone.style ? { style: tone.style } : {}
  });
  const tableRow = (label, values, header = false) => ({
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__compare-row", ...header ? ["md-graph__compare-head"] : []],
      style: `--md-graph-compare-columns:${columns.length}`
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["md-graph__compare-label"] },
        children: [text(label)]
      },
      ...values.map((value, index) => {
        const normalized = value.trim().toLowerCase();
        const positive = normalized === "true";
        const negative = normalized === "false";
        const selected = index === accented;
        const display = positive ? "\u2713" : negative ? "\u2013" : value;
        return {
          type: "element",
          tagName: "span",
          properties: selected && (header || positive) ? accentProperties() : {
            className: [
              "md-graph__compare-value",
              ...negative || !selected && !positive ? ["md-graph__compare-value--muted"] : []
            ]
          },
          children: [text(display)]
        };
      })
    ]
  });
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--compare"] },
    children: [
      tableRow("", columns, true),
      ...parsedRows.map((row2) => tableRow(row2.label, row2.values))
    ]
  };
};
var matrixBody = (source) => {
  const props = properties(source);
  const columns = yamlArray(props.columns ?? "");
  if (!columns?.length || !/^rows\s*:\s*$/im.test(source)) return void 0;
  const rows = [];
  let row;
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
  if (!parsedRows.length) return void 0;
  const accented = yamlScalar(props.accent ?? "");
  const colorSource = yamlScalar(props.color ?? "accent");
  const color2 = /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
    colorSource
  ) ? colorSource : "accent";
  const tone = diffColor(color2);
  const tableRow = (label, values, header = false) => {
    const selected = !header && label === accented;
    return {
      type: "element",
      tagName: "div",
      properties: {
        className: [
          "md-graph__matrix-row",
          ...header ? ["md-graph__matrix-head"] : [],
          ...selected ? ["md-graph__matrix-row--accent"] : []
        ],
        style: `--md-graph-matrix-columns:${columns.length}`
      },
      children: [label, ...values].map((value, index) => ({
        type: "element",
        tagName: "span",
        properties: {
          className: [
            "md-graph__matrix-cell",
            ...index ? ["md-graph__matrix-cell--value"] : ["md-graph__matrix-cell--label"],
            ...selected ? tone.classes : []
          ],
          ...selected && tone.style ? { style: tone.style } : {}
        },
        children: [text(value)]
      }))
    };
  };
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--matrix"] },
    children: [
      tableRow("", columns, true),
      ...parsedRows.map((item) => tableRow(item.label, item.values))
    ]
  };
};
var statBody = (source) => {
  if (!/^items\s*:\s*$/im.test(source)) return void 0;
  const items = [];
  let item;
  for (const line of source.split(/\r?\n/)) {
    const first = /^\s*-\s*(value|label)\s*:\s*(.+?)\s*$/i.exec(line);
    if (first?.[1] && first[2]) {
      item = { [first[1].toLowerCase()]: yamlScalar(first[2]) };
      items.push(item);
      continue;
    }
    if (!item) continue;
    const field = /^\s+(value|label|hint)\s*:\s*(.+?)\s*$/i.exec(line);
    if (field?.[1] && field[2]) {
      item[field[1].toLowerCase()] = yamlScalar(field[2]);
    }
    const colorSource = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (colorSource) {
      const color2 = yamlScalar(colorSource);
      if (/^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
        color2
      )) {
        item.color = color2;
      }
    }
  }
  const parsed = items.filter(({ value, label }) => Boolean(value !== void 0 && label));
  if (!parsed.length) return void 0;
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--stat"],
      style: `--md-graph-stat-items:${parsed.length}`
    },
    children: parsed.map((entry) => {
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
              ...tone.style ? { style: tone.style } : {}
            },
            children: [text(entry.value)]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__stat-label"] },
            children: [text(entry.label)]
          },
          ...entry.hint ? [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__stat-hint"] },
              children: [text(entry.hint)]
            }
          ] : []
        ]
      };
    })
  };
};
var kpiBody = (source, glyphs) => {
  const props = properties(source);
  const values = parseSequence(props.data ?? "");
  if (props.value === void 0 || !props.label || !values.length) return void 0;
  const colorSource = yamlScalar(props.color ?? "accent");
  const color2 = /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
    colorSource
  ) ? colorSource : "accent";
  const tone = diffColor(color2);
  const marks = sparkGlyphs(values, glyphs ?? props.glyphs);
  const accentedProperties = (className) => ({
    className: [...className, ...tone.classes],
    ...tone.style ? { style: tone.style } : {}
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
        children: [text(yamlScalar(props.value))]
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
            children: [text(yamlScalar(props.label))]
          },
          ...props.hint ? [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__kpi-hint"] },
              children: [text(yamlScalar(props.hint))]
            }
          ] : []
        ]
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__kpi-spark"] },
        children: marks.map((mark, index) => ({
          type: "element",
          tagName: "span",
          properties: index === marks.length - 1 ? accentedProperties(["md-graph__kpi-mark", "md-graph__kpi-mark--last"]) : { className: ["md-graph__kpi-mark"] },
          children: [text(mark)]
        }))
      }
    ]
  };
};
var specBody = (source) => {
  if (!/^rows\s*:\s*$/im.test(source)) return void 0;
  const rows = [];
  let row;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      row = { label: yamlScalar(label) };
      rows.push(row);
      continue;
    }
    if (!row) continue;
    const value = /^\s+value\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (value) row.value = yamlScalar(value);
    const colorSource = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (colorSource) {
      const color2 = yamlScalar(colorSource);
      if (/^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
        color2
      )) {
        row.color = color2;
      }
    }
  }
  const parsed = rows.filter(({ label, value }) => Boolean(label && value !== void 0));
  if (!parsed.length) return void 0;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--spec"] },
    children: parsed.map((entry) => {
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
            children: [text(entry.label)]
          },
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["md-graph__spec-value", ...tone.classes],
              ...tone.style ? { style: tone.style } : {}
            },
            children: [text(entry.value)]
          }
        ]
      };
    })
  };
};
var generatedActivityDays = (start, length) => {
  const [year, month, day] = start.split("-").map(Number);
  const origin = Date.UTC(year, month - 1, day);
  if (!Number.isFinite(origin)) return [];
  return Array.from({ length: Math.max(0, Math.round(length)) }, (_, index) => {
    const time = origin + index * 864e5;
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
var parseActivityDays = (source) => {
  if (!/^days\s*:\s*$/im.test(source)) return void 0;
  const generated = /^\s+activityDays\s*:\s*\[\s*([\d-]+)\s*,\s*(\d+)\s*\]\s*$/im.exec(source);
  if (generated?.[1] && generated[2]) {
    const days2 = generatedActivityDays(generated[1], Number(generated[2]));
    return days2.length ? days2 : void 0;
  }
  const days = [];
  let current;
  for (const line of source.split(/\r?\n/)) {
    const inline = /^\s*-\s*\{\s*date\s*:\s*["']?([\d-]+)["']?\s*,\s*count\s*:\s*([\d.]+)\s*\}\s*$/i.exec(line);
    if (inline?.[1] && inline[2]) {
      days.push({ date: inline[1], count: Number(inline[2]) });
      continue;
    }
    const date = /^\s*-\s*date\s*:\s*["']?([\d-]+)["']?\s*$/i.exec(line)?.[1];
    if (date) {
      current = { date };
      days.push(current);
      continue;
    }
    const count = /^\s+count\s*:\s*([\d.]+)\s*$/i.exec(line)?.[1];
    if (current && count) current.count = Number(count);
  }
  const parsed = days.filter(
    ({ date, count }) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(count)
  );
  return parsed.length ? parsed : void 0;
};
var activityBody = (source, glyphs) => {
  const supplied = parseActivityDays(source);
  if (!supplied) return void 0;
  const props = properties(source);
  const weekStartsOn = props.weekStartsOn === "1" ? 1 : 0;
  const ordered = [...supplied].sort((a, b) => a.date.localeCompare(b.date));
  const firstTime = Date.parse(`${ordered[0].date}T00:00:00Z`);
  const lastTime = Date.parse(`${ordered.at(-1).date}T00:00:00Z`);
  const byDate = new Map(ordered.map((day) => [day.date, day.count]));
  const days = [];
  for (let time = firstTime; time <= lastTime; time += 864e5) {
    const date = new Date(time).toISOString().slice(0, 10);
    days.push({ date, count: byDate.get(date) ?? 0 });
  }
  const firstDow = new Date(firstTime).getUTCDay();
  const leading = (firstDow - weekStartsOn + 7) % 7;
  const weeks = Math.ceil((leading + days.length) / 7);
  const requestedMax = Number(props.max);
  const peak = Number.isFinite(requestedMax) && requestedMax > 0 ? requestedMax : Math.max(...days.map(({ count }) => count), 1);
  const colorSource = yamlScalar(props.color ?? "accent");
  const activityColor = /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
    colorSource
  ) ? colorSource : "accent";
  const requestedInkFrom = Number(props.inkFrom);
  const requestedAccentFrom = Number(props.accentFrom);
  const inkFrom = Number.isFinite(requestedInkFrom) ? Math.max(0, requestedInkFrom) : peak * 0.75;
  const accentFrom = Number.isFinite(requestedAccentFrom) ? Math.max(0, requestedAccentFrom) : peak;
  const activityTone = (count) => {
    if (count <= 0 || count < inkFrom) return diffColor("muted");
    if (count >= accentFrom) return diffColor(activityColor);
    return diffColor("ink");
  };
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade);
  const slots = [
    ...Array.from({ length: leading }, () => void 0),
    ...days,
    ...Array.from({ length: weeks * 7 - leading - days.length }, () => void 0)
  ];
  const monthSlots = /* @__PURE__ */ new Map();
  let previousMonth = -1;
  days.forEach((day, index) => {
    const date = /* @__PURE__ */ new Date(`${day.date}T00:00:00Z`);
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
  const caption = props.caption?.toLowerCase() === "false" ? void 0 : yamlScalar(
    props.caption ?? props.label ?? `${days.reduce((sum, day) => sum + day.count, 0)} contributions`
  );
  const weekday = (target) => (target - weekStartsOn + 7) % 7;
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: [
        "md-graph__body",
        "md-graph__body--activity",
        ...weeks <= 54 ? ["md-graph__body--activity-fit"] : []
      ],
      style: `--md-graph-activity-weeks:${weeks}`
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
            children: [...monthSlots].map(([week, month]) => ({
              type: "element",
              tagName: "span",
              properties: { style: `grid-column:${week + 1}` },
              children: [text(month)]
            }))
          }
        ]
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
              [weekday(5), "F"]
            ].map(([row, label]) => ({
              type: "element",
              tagName: "span",
              properties: { style: `grid-row:${Number(row) + 1}` },
              children: [text(String(label))]
            }))
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-graph__activity-grid"] },
            children: slots.map((day) => {
              const ratio = day ? clamp(day.count / peak) : 0;
              const mark = glyphAt(scale, ratio);
              const tone = activityTone(day?.count ?? 0);
              return {
                type: "element",
                tagName: "span",
                properties: {
                  className: ["md-graph__activity-cell", ...tone.classes],
                  ...tone.style ? { style: tone.style } : {},
                  ...day ? { title: `${day.date}: ${day.count}` } : {}
                },
                children: [text(mark)]
              };
            })
          }
        ]
      },
      ...caption || legend ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__activity-footer"] },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__activity-caption"] },
              children: [text(caption ?? "")]
            },
            ...legend ? [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__activity-legend"] },
                children: [
                  text("Less "),
                  ...scale.map((mark, index) => {
                    const representative = index / Math.max(1, scale.length - 1) * peak;
                    const tone = activityTone(representative);
                    return {
                      type: "element",
                      tagName: "span",
                      properties: {
                        className: ["md-graph__activity-legend-mark", ...tone.classes],
                        ...tone.style ? { style: tone.style } : {}
                      },
                      children: [text(mark)]
                    };
                  }),
                  text(" More")
                ]
              }
            ] : []
          ]
        }
      ] : []
    ]
  };
};
var heatmapBody = (source, palette, paletteExplicit, glyphs) => {
  const props = properties(source);
  const columns = yamlArray(props.columns ?? "");
  if (!columns?.length || !/^rows\s*:\s*$/im.test(source)) return void 0;
  const rows = [];
  let row;
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
  if (!parsedRows.length) return void 0;
  const requestedMax = Number(props.max);
  const peak = Number.isFinite(requestedMax) && requestedMax > 0 ? requestedMax : Math.max(...parsedRows.flatMap(({ values }) => values), 1);
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade);
  const validHeatmapColor = (value) => /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
    value
  );
  const requestedColorScale = yamlArray(props.colorScale ?? "")?.filter(validHeatmapColor);
  const colors = requestedColorScale?.length ? requestedColorScale : ["muted", "accent2", "accent2", "accent", "accent"];
  const mode = paletteExplicit ? paletteMode(palette) : "solid";
  const rowColor = (index) => {
    if (mode === "solid") return "accent";
    if (mode === "duo") return index % 2 ? "accent2" : "accent";
    return ["accent", "accent2", "accent3"][index % 3];
  };
  const tone = (value, rowIndex = 0) => {
    const ratio = clamp(value / peak);
    const color2 = colors[Math.round(ratio * Math.max(0, colors.length - 1))] ?? "muted";
    return diffColor(paletteExplicit && color2 === "accent" ? rowColor(rowIndex) : color2);
  };
  const rowElement = (label, values, header = false, rowIndex = 0) => ({
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__heatmap-row", ...header ? ["md-graph__heatmap-head"] : []],
      style: `--md-graph-heatmap-columns:${columns.length}`
    },
    children: [label, ...values].map((value, index) => {
      const numeric = typeof value === "number" ? value : void 0;
      const cellTone = numeric === void 0 ? void 0 : tone(numeric, rowIndex);
      return {
        type: "element",
        tagName: "span",
        properties: {
          className: [
            "md-graph__heatmap-cell",
            ...index ? ["md-graph__heatmap-cell--value"] : ["md-graph__heatmap-cell--label"],
            ...cellTone?.classes ?? []
          ],
          ...cellTone?.style ? { style: cellTone.style } : {},
          ...numeric === void 0 ? {} : { title: `${label} / ${columns[index - 1]}: ${numeric}` }
        },
        children: [
          text(numeric === void 0 ? String(value) : glyphAt(scale, clamp(numeric / peak)))
        ]
      };
    })
  });
  const legend = props.legend?.toLowerCase() !== "false";
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--heatmap"] },
    children: [
      rowElement("", columns, true),
      ...parsedRows.map(({ label, values }, index) => rowElement(label, values, false, index)),
      ...props.caption || legend ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__heatmap-footer"] },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__heatmap-caption"] },
              children: [text(props.caption ? yamlScalar(props.caption) : "")]
            },
            ...legend ? [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__heatmap-legend"] },
                children: [
                  text("Less "),
                  ...scale.map((mark, index) => {
                    const cellTone = tone(index / Math.max(1, scale.length - 1) * peak);
                    return {
                      type: "element",
                      tagName: "span",
                      properties: {
                        className: ["md-graph__heatmap-legend-mark", ...cellTone.classes]
                      },
                      children: [text(mark)]
                    };
                  }),
                  text(" More")
                ]
              }
            ] : []
          ]
        }
      ] : []
    ]
  };
};
var calendarBody = (source, palette, paletteExplicit) => {
  const props = properties(source);
  const year = Number(props.year);
  const month = Number(props.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12)
    return void 0;
  const marks = [];
  const inlineMarks = yamlArray(props.marks ?? "");
  if (inlineMarks) {
    for (const value of inlineMarks) {
      const day = Number(value);
      if (Number.isInteger(day)) marks.push({ day });
    }
  } else if (/^marks\s*:\s*$/im.test(source)) {
    let mark;
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
  const explicitColor = /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
    colorSource
  ) ? colorSource : "accent";
  const mode = paletteExplicit ? paletteMode(palette) : "solid";
  const marked = new Map(marks.map((mark, index) => [mark.day, { ...mark, index }]));
  const markColor = (index) => {
    if (props.color || mode === "solid") return explicitColor;
    if (mode === "duo") return index % 2 ? "accent2" : "accent";
    return ["accent", "accent2", "accent3"][index % 3];
  };
  const weekdayNames = weekStartsOn === 0 ? ["S", "M", "T", "W", "T", "F", "S"] : ["M", "T", "W", "T", "F", "S", "S"];
  const calendarCell = (value, classes, style) => ({
    type: "element",
    tagName: "span",
    properties: { className: ["md-graph__calendar-cell", ...classes], ...style ? { style } : {} },
    children: [text(value)]
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
        const tone = selected ? diffColor(markColor(entry?.index ?? 0)) : void 0;
        return calendarCell(
          day === today ? `[${day}]` : String(day),
          ["md-graph__calendar-day", ...tone?.classes ?? []],
          tone?.style
        );
      })
    ]
  };
};
var waterfallBody = (source, glyphs) => {
  if (!/^items\s*:\s*$/im.test(source)) return void 0;
  const props = properties(source);
  const items = [];
  let item;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label) };
      items.push(item);
      continue;
    }
    if (!item) continue;
    const value = /^\s+value\s*:\s*([+-]?[\d.]+)\s*$/i.exec(line)?.[1];
    if (value) item.value = Number(value);
    const kind = /^\s+kind\s*:\s*(start|in|out|end)\s*$/i.exec(line)?.[1];
    if (kind) item.kind = kind;
    const color2 = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (color2) {
      const parsed2 = yamlScalar(color2);
      if (/^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
        parsed2
      ))
        item.color = parsed2;
    }
  }
  const parsed = items.filter(({ label, value }) => Boolean(label) && Number.isFinite(value));
  if (!parsed.length) return void 0;
  const resolved = parsed.map((entry, index) => ({
    ...entry,
    kind: entry.kind ?? (index === 0 ? "start" : index === parsed.length - 1 ? "end" : entry.value < 0 ? "out" : "in")
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
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade);
  const full = scale.at(-1);
  const empty2 = scale[0];
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--waterfall"],
      style: `--md-graph-waterfall-ticks:${ticks}`
    },
    children: segments.map((entry) => {
      const from = Math.min(entry.start, entry.end);
      const to = Math.max(entry.start, entry.end);
      const tone = diffColor(entry.color ?? (entry.kind === "end" ? "accent" : "ink"));
      const display = entry.kind === "in" ? `+${Math.abs(entry.value)}` : entry.kind === "out" ? `-${Math.abs(entry.value)}` : String(entry.value);
      return {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "md-graph__waterfall-row",
            ...entry.kind === "end" ? ["md-graph__waterfall-row--end"] : []
          ]
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__waterfall-label"] },
            children: [text(entry.label)]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__waterfall-track"] },
            children: Array.from({ length: ticks }, (_, index) => {
              const point = low + (index + 0.5) / ticks * span;
              const active = point >= from && point <= to;
              return {
                type: "element",
                tagName: "span",
                properties: {
                  className: [
                    "md-graph__waterfall-tick",
                    ...active ? tone.classes : ["md-graph__waterfall-tick--empty"]
                  ],
                  ...active && tone.style ? { style: tone.style } : {}
                },
                children: [text(active ? full : empty2)]
              };
            })
          },
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["md-graph__waterfall-value", ...tone.classes],
              ...tone.style ? { style: tone.style } : {}
            },
            children: [text(display)]
          }
        ]
      };
    })
  };
};
var uptimeBody = (source, glyphs) => {
  const props = properties(source);
  const validStatus = (value) => /^(?:ok|degraded|down|empty)$/i.test(value);
  let days = (yamlArray(props.days ?? "") ?? []).map((value) => value.toLowerCase()).filter(validStatus);
  if (!days.length && /^\s+statusDays\s*:\s*$/im.test(source)) {
    const length = Number(/^\s+length\s*:\s*(\d+)\s*$/im.exec(source)?.[1]);
    const fallback = /^\s+default\s*:\s*(ok|degraded|down|empty)\s*$/im.exec(source)?.[1]?.toLowerCase() ?? "ok";
    const indices = (name) => new Set(
      (yamlArray(
        new RegExp(`^\\s+${name}\\s*:\\s*(\\[[^\\]]*\\])\\s*$`, "im").exec(source)?.[1] ?? ""
      ) ?? []).map(Number).filter(Number.isInteger)
    );
    const down = indices("down");
    const degraded = indices("degraded");
    if (Number.isInteger(length) && length > 0 && validStatus(fallback)) {
      days = Array.from(
        { length },
        (_, index) => down.has(index) ? "down" : degraded.has(index) ? "degraded" : fallback
      );
    }
  }
  if (!days.length) return void 0;
  const columns = Math.max(1, Math.round(Number(props.columns) || 30));
  const actualColumns = Math.min(columns, days.length);
  const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade);
  const statusGlyph = (status) => status === "empty" ? "-" : status === "ok" ? scale.at(-1) : status === "degraded" ? glyphAt(scale, 0.5) : scale[0];
  const statusTone = (status) => status === "ok" ? diffColor("accent") : diffColor("muted");
  const measured = days.filter((status) => status !== "empty");
  const percent = measured.length ? Math.round(measured.filter((status) => status === "ok").length / measured.length * 100) : 0;
  const legendStatus = ["ok", "degraded", "down"];
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--uptime"],
      style: `--md-graph-uptime-columns:${actualColumns}`
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__uptime-grid"] },
        children: days.map((status) => {
          const tone = statusTone(status);
          return {
            type: "element",
            tagName: "span",
            properties: {
              className: [
                "md-graph__uptime-day",
                `md-graph__uptime-day--${status}`,
                ...tone.classes
              ]
            },
            children: [text(statusGlyph(status))]
          };
        })
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
            children: [text(`${percent}%`)]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__uptime-from"] },
            children: [text(yamlScalar(props.from ?? ""))]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__uptime-to"] },
            children: [text(yamlScalar(props.to ?? ""))]
          }
        ]
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__uptime-legend"] },
        children: legendStatus.flatMap((status, index) => {
          const tone = statusTone(status);
          return [
            ...index ? [text("  ")] : [],
            {
              type: "element",
              tagName: "span",
              properties: { className: ["md-graph__uptime-legend-mark", ...tone.classes] },
              children: [text(statusGlyph(status))]
            },
            text(` ${status === "ok" ? "up" : status}`)
          ];
        })
      }
    ]
  };
};
var slopeBody = (source) => {
  if (!/^items\s*:\s*$/im.test(source)) return void 0;
  const props = properties(source);
  const items = [];
  let item;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label) };
      items.push(item);
      continue;
    }
    if (!item) continue;
    const value = /^\s+(from|to)\s*:\s*([+-]?[\d,.]+)\s*$/i.exec(line);
    if (value?.[1] && value[2]) item[value[1]] = number(value[2]);
    const color2 = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (color2) {
      const parsed2 = yamlScalar(color2);
      if (/^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
        parsed2
      ))
        item.color = parsed2;
    }
  }
  const parsed = items.filter(
    ({ label, from, to }) => Boolean(label) && Number.isFinite(from) && Number.isFinite(to)
  );
  if (!parsed.length) return void 0;
  const row = (label, from, marker, to, tone, header = false) => ({
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__slope-row", ...header ? ["md-graph__slope-head"] : []]
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["md-graph__slope-label"] },
        children: [text(label)]
      },
      {
        type: "element",
        tagName: "span",
        properties: { className: ["md-graph__slope-from"] },
        children: [text(from)]
      },
      {
        type: "element",
        tagName: "span",
        properties: {
          className: ["md-graph__slope-marker", ...tone?.classes ?? []],
          ...tone?.style ? { style: tone.style } : {}
        },
        children: [text(marker)]
      },
      {
        type: "element",
        tagName: "span",
        properties: {
          className: ["md-graph__slope-to", ...tone?.classes ?? []],
          ...tone?.style ? { style: tone.style } : {}
        },
        children: [text(to)]
      }
    ]
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
        void 0,
        true
      ),
      ...parsed.map((item2) => {
        const tone = diffColor(item2.color ?? "accent");
        return row(
          item2.label,
          item2.from.toLocaleString("en-US"),
          item2.from === item2.to ? "\u2013" : "\u2192",
          item2.to.toLocaleString("en-US"),
          tone
        );
      })
    ]
  };
};
var bulletBody = (source, glyphs) => {
  if (!/^items\s*:\s*$/im.test(source)) return void 0;
  const props = properties(source);
  const items = [];
  let item;
  for (const line of source.split(/\r?\n/)) {
    const label = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (label) {
      item = { label: yamlScalar(label) };
      items.push(item);
      continue;
    }
    if (!item) continue;
    const numeric = /^\s+(value|target|max)\s*:\s*([+-]?[\d,.]+)\s*$/i.exec(line);
    if (numeric?.[1] && numeric[2])
      item[numeric[1]] = number(numeric[2]);
    const display = /^\s+display\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (display) item.display = yamlScalar(display);
    const color2 = /^\s+color\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    if (color2) {
      const parsed2 = yamlScalar(color2);
      if (/^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
        parsed2
      ))
        item.color = parsed2;
    }
  }
  const parsed = items.filter(({ label, value }) => Boolean(label) && Number.isFinite(value));
  if (!parsed.length) return void 0;
  const ticks = Math.max(1, Math.round(Number(props.ticks) || 20));
  const scale = glyphScale(glyphs ?? props.glyphs, ["-", "="]);
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--bullet"],
      style: `--md-graph-bullet-ticks:${ticks}`
    },
    children: parsed.map((item2) => {
      const maximum = Math.max(1, item2.max ?? item2.target ?? item2.value);
      const filled = Math.round(clamp(item2.value / maximum) * ticks);
      const marker = item2.target === void 0 ? -1 : Math.round(clamp(item2.target / maximum) * ticks) - 1;
      const tone = diffColor(item2.color ?? "accent");
      const display = item2.display ?? (item2.target === void 0 ? item2.value.toLocaleString("en-US") : `${item2.value.toLocaleString("en-US")} / ${item2.target.toLocaleString("en-US")}`);
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["md-graph__bullet-row"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-label"] },
            children: [text(item2.label)]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-bracket"] },
            children: [text("[")]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-track"] },
            children: Array.from({ length: ticks }, (_, index) => {
              const active = index < filled;
              const isMarker = index === marker;
              return {
                type: "element",
                tagName: "span",
                properties: {
                  className: [
                    "md-graph__bullet-tick",
                    ...active && !isMarker ? tone.classes : ["md-graph__bullet-tick--muted"]
                  ],
                  ...active && !isMarker && tone.style ? { style: tone.style } : {}
                },
                children: [text(isMarker ? "|" : active ? scale.at(-1) : scale[0])]
              };
            })
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-bracket"] },
            children: [text("]")]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__bullet-display"] },
            children: [text(display)]
          }
        ]
      };
    })
  };
};
var timerBody = (source) => {
  const props = properties(source);
  const kindSource = props.kind ?? "elapsed";
  const kind = /^(?:elapsed|ago|clock)$/i.test(kindSource) ? kindSource.toLowerCase() : "elapsed";
  const atSource = props.at ? yamlScalar(props.at) : "";
  const at = atSource ? Number.isFinite(Number(atSource)) ? Number(atSource) : Date.parse(atSource) : Number.NaN;
  if (kind !== "clock" && !Number.isFinite(at)) return void 0;
  const units = (yamlArray(props.units ?? "") ?? ["days", "hours", "minutes", "seconds"]).filter(
    (unit) => /^(?:days|hours|minutes|seconds)$/.test(unit)
  );
  const timeFormat = props.timeFormat === "12" ? "12" : "24";
  const formatDuration = (milliseconds) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1e3));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds % 86400 / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const remainder = seconds % 60;
    if (units.length === 1 && units[0] === "days") return `${days}d`;
    if (units.join(",") === "days,hours,minutes,seconds")
      return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    return units.map(
      (unit) => unit === "days" ? `${days}d` : unit === "hours" ? `${hours}h` : unit === "minutes" ? `${minutes}m` : `${remainder}s`
    ).join(" ");
  };
  const now = Date.now();
  const initial = kind === "clock" ? new Date(now).toLocaleTimeString("en-US", {
    hour12: timeFormat === "12",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }) : `${formatDuration(now - at)}${kind === "ago" ? " ago" : ""}`;
  const colorSource = yamlScalar(props.color ?? "accent");
  const color2 = /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
    colorSource
  ) ? colorSource : "accent";
  const tone = diffColor(color2);
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--timer"],
      "data-timer-kind": kind,
      "data-timer-at": Number.isFinite(at) ? String(at) : "",
      "data-timer-units": units.join(","),
      "data-timer-format": timeFormat
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: {
          className: ["md-graph__timer-value", ...tone.classes],
          ...tone.style ? { style: tone.style } : {}
        },
        children: [text(initial)]
      },
      ...props.caption ? [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__timer-caption"] },
          children: [text(yamlScalar(props.caption))]
        }
      ] : []
    ]
  };
};
var countdownBody = (source) => {
  const props = properties(source);
  const toSource = props.to ? yamlScalar(props.to) : "";
  const deadline = toSource ? Number.isFinite(Number(toSource)) ? Number(toSource) : Date.parse(toSource) : Number.NaN;
  if (!Number.isFinite(deadline)) return void 0;
  const done = yamlScalar(props.done ?? "done");
  const remaining = deadline - Date.now();
  const format = (milliseconds) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1e3));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds % 86400 / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const remainder = seconds % 60;
    return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };
  const colorSource = yamlScalar(props.color ?? "accent");
  const color2 = /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
    colorSource
  ) ? colorSource : "accent";
  const tone = diffColor(remaining <= 0 ? "muted" : color2);
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["md-graph__body", "md-graph__body--countdown"],
      "data-countdown-to": String(deadline),
      "data-countdown-done": done,
      "data-countdown-color": color2
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: {
          className: [
            "md-graph__countdown-value",
            ...remaining <= 0 ? ["md-graph__countdown-value--done"] : [],
            ...tone.classes
          ],
          ...tone.style ? { style: tone.style } : {}
        },
        children: [text(remaining <= 0 ? done : format(remaining))]
      },
      ...props.caption ? [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__countdown-caption"] },
          children: [text(yamlScalar(props.caption))]
        }
      ] : []
    ]
  };
};
var frameBody = (source) => {
  const topProperty = (name) => new RegExp(`^${name}\\s*:\\s*(.+?)\\s*$`, "im").exec(source)?.[1];
  const validColor = (value) => /^(?:accent|accent2|accent3|muted|ink|#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(
    value
  );
  const scalarOrBlock = (name) => {
    const lines2 = source.split(/\r?\n/);
    const index = lines2.findIndex((line) => new RegExp(`^${name}\\s*:`).test(line));
    if (index < 0) return void 0;
    const rest = lines2[index].replace(new RegExp(`^${name}\\s*:\\s*`), "");
    if (rest.trim() !== "|") return rest.trim() ? yamlScalar(rest) : void 0;
    const block = [];
    for (let cursor = index + 1; cursor < lines2.length; cursor++) {
      const line = lines2[cursor];
      if (line && !/^\s+/.test(line)) break;
      block.push(line.replace(/^ {2}/, ""));
    }
    return block.join("\n").trimEnd();
  };
  const defaultColorSource = yamlScalar(topProperty("color") ?? "ink");
  const defaultColor = validColor(defaultColorSource) ? defaultColorSource : "ink";
  const captionColorSource = yamlScalar(topProperty("captionColor") ?? "muted");
  const captionColor = validColor(captionColorSource) ? captionColorSource : "muted";
  const lines = [];
  const contentHeader = /^content[ \t]*:[ \t]*(.*)$/im.exec(source)?.[1] ?? "";
  if (contentHeader.trim() && contentHeader.trim() !== "|") {
    lines.push({ text: yamlScalar(contentHeader) });
  } else if (contentHeader.trim() === "|") {
    const block = scalarOrBlock("content");
    if (block) lines.push(...block.split("\n").map((text3) => ({ text: text3 })));
  } else if (/^content[ \t]*:[ \t]*$/im.test(source)) {
    let current;
    let inContent = false;
    for (const line of source.split(/\r?\n/)) {
      if (/^content\s*:\s*$/.test(line)) {
        inContent = true;
        continue;
      }
      if (inContent && line && !/^\s+/.test(line)) break;
      if (!inContent) continue;
      const entry = /^\s{2}-\s+text\s*:\s*(.+?)\s*$/.exec(line)?.[1] ?? /^\s{2}-\s+(.+?)\s*$/.exec(line)?.[1];
      if (entry) {
        current = { text: yamlScalar(entry) };
        lines.push(current);
        continue;
      }
      const color2 = /^\s{4}color\s*:\s*(.+?)\s*$/.exec(line)?.[1];
      if (current && color2) {
        const parsed = yamlScalar(color2);
        if (validColor(parsed)) current.color = parsed;
      }
    }
  }
  if (!lines.length) return void 0;
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
        children: lines.map((line) => {
          const tone = diffColor(line.color ?? defaultColor);
          return {
            type: "element",
            tagName: "div",
            properties: {
              className: ["md-graph__frame-line", ...tone.classes],
              ...tone.style ? { style: tone.style } : {}
            },
            children: [text(line.text)]
          };
        })
      },
      ...caption ? [
        {
          type: "element",
          tagName: "div",
          properties: {
            className: [
              "md-graph__frame-caption",
              ...divider ? ["md-graph__frame-caption--divider"] : [],
              ...diffColor(captionColor).classes
            ],
            ...diffColor(captionColor).style ? { style: diffColor(captionColor).style } : {}
          },
          children: [text(caption)]
        }
      ] : []
    ]
  };
};
var parseBarsGroups = (source) => {
  const groups = [];
  let group;
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
    const size = /^\s+size\s*:\s*(sm|md|lg)\s*$/i.exec(line)?.[1];
    if (size) group.size = size;
    const tone = /^\s+tone\s*:\s*(accent|secondary|tertiary|muted)\s*$/i.exec(line)?.[1];
    if (tone) group.tone = tone;
    const values = /^\s+values\s*:\s*\[([^\]]*)\]\s*$/i.exec(line)?.[1];
    if (values)
      group.values = values.split(",").map(Number).filter((value) => Number.isFinite(value) && value >= 0);
  }
  const structured = groups.filter(({ values }) => values.length);
  if (structured.length) return structured;
  const legacy = meaningful(source).flatMap((line) => {
    const match = /^([^:]+):\s*\[([^\]]+)\]$/.exec(line.trim());
    if (!match?.[1] || !match[2]) return [];
    const values = match[2].split(",").map(Number).filter(Number.isFinite);
    return values.length ? [{ label: match[1].trim(), values, size: "md" }] : [];
  });
  return legacy.length ? legacy : void 0;
};
var barsBody = (source, palette, paletteExplicit, glyphs) => {
  const groups = parseBarsGroups(source);
  if (!groups) return void 0;
  const processor = /^\s*processor\s*:\s*(.+?)\s*$/im.exec(source)?.[1];
  const connector = processor ? processor.trim().split(/\s+/).map((part) => part === "->" || part === "\u2192" ? "- - -\u25B6" : part).join("  ") : "- - -\u25B6";
  const toneClass = (group, index) => group.tone === "muted" ? "md-graph__bars-tone--muted" : group.tone === "secondary" || !group.tone && paletteExplicit && paletteMode(palette) !== "solid" && index === 0 && groups.length > 1 ? "md-graph__color-1" : group.tone === "tertiary" ? "md-graph__color-2" : !group.tone && !paletteExplicit && index === 0 && groups.length > 1 ? "md-graph__bars-tone--muted" : "md-graph__color-0";
  const labelToneClass = (group, index) => group.tone || index === 0 && groups.length > 1 ? [toneClass(group, index)] : [];
  const mark = glyphScale(glyphs, ["\u2588"]).at(-1);
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body", "md-graph__body--bars"] },
    children: groups.flatMap((group, groupIndex) => [
      ...groupIndex ? [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__bars-connector"] },
          children: [text(connector)]
        }
      ] : [],
      {
        type: "element",
        tagName: "div",
        properties: {
          className: ["md-graph__bars-group", `md-graph__bars-group--${group.size}`]
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
                ariaLabel: String(value)
              },
              children: Array.from({ length: Math.round(value) }, () => ({
                type: "element",
                tagName: "span",
                properties: { ariaHidden: "true" },
                children: [text(mark)]
              }))
            }))
          },
          {
            type: "element",
            tagName: "div",
            properties: {
              className: ["md-graph__bars-group-label", ...labelToneClass(group, groupIndex)]
            },
            children: [text(group.label)]
          }
        ]
      }
    ])
  };
};
var parseCellGrids = (source) => {
  const grids = [];
  let grid;
  for (const line of source.split(/\r?\n/)) {
    const itemLabel = /^\s*-\s*label\s*:\s*(.+?)\s*$/i.exec(line)?.[1];
    const sectionLabel = /^(?!\s)([^:]+)\s*:\s*$/.exec(line)?.[1];
    if (itemLabel || sectionLabel) {
      grid = { label: itemLabel ?? sectionLabel, cells: [], color: "accent" };
      grids.push(grid);
      continue;
    }
    if (!grid || /^\s*cells\s*:\s*$/i.test(line)) continue;
    const color2 = /^\s+color\s*:\s*(accent|accent2|accent3)\s*$/i.exec(line)?.[1];
    if (color2) {
      grid.color = color2;
      continue;
    }
    const array = /^\s*-\s*\[([01,\s]+)\]\s*$/.exec(line)?.[1];
    const compact = /^\s*([01](?:\s*[01])+?)\s*$/.exec(line)?.[1];
    const values = array ? array.split(",").map((value) => Number(value.trim())) : compact ? [...compact.replace(/\s/g, "")].map(Number) : [];
    if (values.length) grid.cells.push(values);
  }
  const parsed = grids.filter(({ cells }) => cells.length);
  return parsed.length ? parsed : void 0;
};
var cellGlyphPair = (glyphs = "shade") => {
  const scale = glyphScale(glyphs, GLYPH_PRESETS.shade);
  return [scale[0], scale.at(-1)];
};
var meterGlyphPair = (glyphs) => {
  const scale = glyphScale(glyphs, ["-", "="]);
  return [scale[0], scale.length > 2 ? scale.at(-2) : scale.at(-1)];
};
var cellsBody = (source, glyphs) => {
  const grids = parseCellGrids(source);
  if (!grids) return void 0;
  const [empty2, active] = cellGlyphPair(glyphs);
  const colorClass = (color2) => color2 === "accent2" ? "md-graph__color-1" : color2 === "accent3" ? "md-graph__color-2" : "md-graph__color-0";
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
                  ...value ? [colorClass(grid.color)] : []
                ],
                ariaHidden: "true"
              },
              children: [text(value ? active : empty2)]
            }))
          }))
        },
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__cells-label"] },
          children: [text(grid.label)]
        }
      ]
    }))
  };
};
var meterBody = (source, glyphs) => {
  const props = properties(source);
  const shorthand = /([\d.]+)\s*\/\s*([\d.]+)/.exec(source);
  if (!props.value && !shorthand) return void 0;
  const value = number(props.value ?? shorthand?.[1] ?? "0");
  const explicitMax = props.max ?? shorthand?.[2];
  const max = explicitMax ? number(explicitMax) || 1 : 1;
  const ratio = clamp(value / max);
  const ticks = Math.max(1, Math.round(number(props.ticks ?? "14") || 14));
  const meterGlyphs = glyphs ?? props.glyphs;
  const [empty2, active] = meterGlyphPair(meterGlyphs);
  const meterColor = /^(accent2|accent3)$/i.test(props.color ?? "") ? Number(props.color.slice(-1)) - 1 : 0;
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
          style: `--md-graph-meter-ticks:${ticks};--md-graph-meter-width:${ticks * 2.75}rem`
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
                children: [text("[")]
              },
              {
                type: "element",
                tagName: "span",
                properties: {
                  className: ["md-graph__meter-cells"]
                },
                children: Array.from({ length: ticks }, (_, index) => ({
                  type: "element",
                  tagName: "span",
                  properties: {
                    className: [
                      "md-graph__meter-cell",
                      index < filled ? `md-graph__color-${meterColor}` : "md-graph__track"
                    ]
                  },
                  children: [text(index < filled ? active : empty2)]
                }))
              },
              {
                type: "element",
                tagName: "span",
                properties: { className: ["md-graph__track"] },
                children: [text("]")]
              }
            ]
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__meter-value"] },
            children: [text(`${Math.round(ratio * 100)}%`)]
          }
        ]
      },
      ...props.label ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__meter-label"] },
          children: [text(props.label)]
        }
      ] : [],
      ...props.caption ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__caption", "md-graph__meter-caption"] },
          children: [text(props.caption)]
        }
      ] : []
    ]
  };
};
function render(type, source, glyphs) {
  const props = properties(source);
  const items = data(source);
  switch (type) {
    case "rank": {
      const rankedItems = rankData(source);
      const ticks = Number(props.ticks) || 20;
      const max = number(props.max ?? "") || Math.max(1, ...rankedItems.map(({ value }) => value));
      const labelWidth = Math.max(14, ...rankedItems.map(({ label }) => label.length));
      return rankedItems.map(
        ({ label, value, display }) => `${label.padEnd(labelWidth)}	${rankBar(value / max, ticks, glyphs ?? props.glyphs)}	${display ?? value.toLocaleString("en-US")}`
      );
    }
    case "funnel":
      return aligned(items, 20, glyphs ?? props.glyphs);
    case "meter": {
      const shorthand = /([\d.]+)\s*\/\s*([\d.]+)/.exec(source);
      const value = number(props.value ?? shorthand?.[1] ?? "0");
      const max = number(props.max ?? shorthand?.[2] ?? "100") || 100;
      return [
        `${props.label ?? ""}	${asciiBar(value / max, 15)}	${Math.round(value / max * 100)}%`
      ];
    }
    case "bars": {
      const series = meaningful(source).flatMap((line) => {
        const match = /^([^:]+):\s*(\[[^\]]+\])$/.exec(line.trim());
        return match?.[1] && match[2] ? [{ name: match[1], values: parseSequence(match[2]) }] : [];
      });
      const max = Math.max(1, ...series.flatMap(({ values }) => values));
      const groups = series.map(
        ({ name, values }) => `${values.map((value) => glyphAt(glyphScale(glyphs ?? props.glyphs, SPARK_GLYPHS), value / max)).join(" ")}
${name}`
      );
      return groups.length > 1 ? groups.flatMap(
        (group, index) => index < groups.length - 1 ? [group, "- - -\u25B6"] : [group]
      ) : groups;
    }
    case "spark":
      return meaningful(source).flatMap((line) => {
        const match = /^([^:]+):\s*(.+)$/.exec(line);
        if (!match?.[1] || !match[2] || /^\|/.test(line)) return [];
        const values = parseSequence(match[2]);
        return values.length ? [`${match[1].padEnd(12)} ${spark(values, glyphs ?? props.glyphs)}`] : [];
      });
    case "flow":
      return meaningful(source).filter((line) => line.includes("->")).map((line) => line.trim().replace(/\s*->\s*/g, "  - - -\u25B6  "));
    case "cells": {
      const scale = glyphScale(glyphs ?? props.glyphs, GLYPH_PRESETS.shade);
      const empty2 = scale[0];
      const full = scale.at(-1);
      return meaningful(source).map(
        (line) => /^\s*[01](?:\s*[01])+$/.test(line) ? line.replace(/1/g, full).replace(/0/g, empty2).replace(/\s/g, " ") : line
      );
    }
    case "tree": {
      return meaningful(source).map((line) => {
        const match = /^(\s*)[-*+]\s+(.+)$/.exec(line);
        if (!match?.[1] && !match?.[2]) return line;
        const depth = Math.floor((match?.[1]?.length ?? 0) / 2);
        return `${depth ? "\u2502  ".repeat(depth - 1) + "\u251C\u2500 " : ""}${match?.[2] ?? line}`;
      });
    }
    case "timeline": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["\xB7", "\u25CF"]);
      return meaningful(source).map((line) => {
        const cells = line.split("|").map((cell) => cell.trim());
        return cells.length >= 2 ? `${scale.at(-1)}  ${cells[0]}  ${cells.slice(1).join(`  ${scale[0]}  `)}` : line;
      });
    }
    case "gantt": {
      const full = glyphScale(glyphs ?? props.glyphs, ["\u25A0"]).at(-1);
      const tasks = meaningful(source).flatMap((line) => {
        const match = /^(.+?)\s*:\s*(\S+)(?:\s*\.\.\s*(\S+))?$/.exec(line);
        if (!match?.[1] || !match[2]) return [];
        const start = Date.parse(match[2]), end = Date.parse(match[3] ?? match[2]);
        return Number.isFinite(start) && Number.isFinite(end) ? [{ label: match[1].trim(), start, end }] : [];
      });
      const min = Math.min(...tasks.map((task) => task.start)), max = Math.max(...tasks.map((task) => task.end)), span = Math.max(864e5, max - min);
      const labelWidth = Math.max(1, ...tasks.map((task) => task.label.length));
      return tasks.map(
        (task) => `${task.label.padEnd(labelWidth)}  ${" ".repeat(Math.round((task.start - min) / span * 28))}${full.repeat(Math.max(1, Math.round((task.end - task.start + 864e5) / span * 28)))}`
      );
    }
    case "plot": {
      const pointGlyph = glyphScale(glyphs ?? props.glyphs, ["\u25CF"]).at(-1);
      const lines = meaningful(source);
      const points = lines.flatMap((line) => {
        const match = /^([+-]?[\d.]+)\s*,\s*([+-]?[\d.]+)$/.exec(line.trim());
        return match ? [{ x: number(match[1]), y: number(match[2]) }] : [];
      });
      if (!points.length) return lines;
      const width = 32, height = 7, minX = Math.min(...points.map((p) => p.x)), maxX = Math.max(...points.map((p) => p.x)), minY = Math.min(...points.map((p) => p.y)), maxY = Math.max(...points.map((p) => p.y));
      const grid = Array.from({ length: height }, () => Array(width).fill(" "));
      for (const point of points)
        grid[height - 1 - Math.round(clamp((point.y - minY) / Math.max(1, maxY - minY)) * (height - 1))][Math.round(clamp((point.x - minX) / Math.max(1, maxX - minX)) * (width - 1))] = pointGlyph;
      return grid.map((row) => `\u2502${row.join("")}`).concat(`\u2514${"\u2500".repeat(width)}`);
    }
    case "stack": {
      const full = glyphScale(glyphs ?? props.glyphs, ["\u25A0"]).at(-1);
      return items.length ? [
        `${items.map(({ label, value }) => `${label} ${full.repeat(Math.max(1, Math.round(value / 5)))}`).join("  ")}`
      ] : tableLines(source);
    }
    case "waffle": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["\xB7", "\u25A0"]);
      const size = /^(\d+)x(\d+)$/.exec(props.size ?? "10x10");
      const cols = Number(size?.[1] ?? 10), rows = Number(size?.[2] ?? 10), total = cols * rows;
      let cursor = 0;
      const cells = items.flatMap(
        (item, series) => Array(
          Math.round(
            item.value / Math.max(
              100,
              items.reduce((sum, d) => sum + d.value, 0)
            ) * total
          )
        ).fill(String(series + 1))
      );
      return Array.from(
        { length: rows },
        () => Array.from({ length: cols }, () => cells[cursor++] ? scale.at(-1) : scale[0]).join(" ")
      ).concat(items.map((item, index) => `${index + 1}  ${item.label}  ${item.value}`));
    }
    case "activity":
      return aligned(
        items.map((item) => ({ ...item, label: item.label.slice(5) })),
        12,
        glyphs ?? props.glyphs
      );
    case "calendar": {
      const dates = meaningful(source).flatMap((line) => {
        const match = /^(\d{4})-(\d{2})-(\d{2})\s*=\s*(.+)$/.exec(line);
        return match ? [
          {
            year: Number(match[1]),
            month: Number(match[2]),
            day: Number(match[3]),
            value: match[4]
          }
        ] : [];
      });
      if (!dates.length) return meaningful(source);
      const { year, month } = dates[0], first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(), days = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const marked = new Map(dates.map((date) => [date.day, date.value]));
      const cells = Array(first).fill("  ").concat(
        Array.from(
          { length: days },
          (_, index) => marked.has(index + 1) ? String(index + 1).padStart(2) + "\u25CF" : String(index + 1).padStart(2) + " "
        )
      );
      return [
        "Su  Mo  Tu  We  Th  Fr  Sa",
        ...Array.from(
          { length: Math.ceil(cells.length / 7) },
          (_, row) => cells.slice(row * 7, row * 7 + 7).join(" ")
        )
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
        return match?.[1] ? [`${match[1].padEnd(14)} ${match[2]}  \u2500\u2500\u2500\u2500\u2500>  ${match[3]}`] : [];
      });
    case "bullet": {
      const compact = meaningful(source).flatMap((line) => {
        const match = /^(.+?)\s*=\s*([\d.]+)\s*\/\s*([\d.]+)\s*\/\s*([\d.]+)/.exec(line);
        return match?.[1] ? [
          {
            label: match[1],
            value: number(match[2]),
            target: number(match[3]),
            max: number(match[4])
          }
        ] : [];
      });
      const bullets = compact.length ? compact : [
        {
          label: "",
          value: number(props.value ?? "0"),
          target: number(props.target ?? "0"),
          max: number(props.max ?? "100")
        }
      ];
      return bullets.map(
        ({ label, value, target, max }) => `${label.padEnd(12)}	${asciiBar(value / max, 20, target / max, glyphs ?? props.glyphs)}	${value} / ${target}`
      );
    }
    case "uptime": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["\xB7", "\u25A8", "\u25A0"]);
      return meaningful(source).map(
        (line) => line.replace(/\s*=\s*up$/, `  ${scale.at(-1).repeat(5)} up`).replace(/\s*=\s*down$/, `  ${scale[0].repeat(5)} down`).replace(/\s*=\s*degraded$/, `  ${glyphAt(scale, 0.5).repeat(5)} degraded`)
      );
    }
    case "heatmap": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["\xB7", ...SPARK_GLYPHS]);
      return meaningful(source).filter((line) => !/^[xy]:/.test(line)).map(
        (line) => line.replace(/\b0\b/g, scale[0]).replace(/\b[1-9]\b/g, (value) => glyphAt(scale, Number(value) / 9))
      );
    }
    case "diff":
      return meaningful(source).map(
        (line) => line.startsWith("+") ? `+ ${line.slice(1).trim()}` : line.startsWith("-") ? `\u2212 ${line.slice(1).trim()}` : line.replace(/\s*->\s*/, "  \u2500\u2500>  ")
      );
    case "stat":
      return [props.value ?? "", [props.change, props.period].filter(Boolean).join("  ")];
    case "kpi":
    case "spec":
      return Object.entries(props).map(([key, value]) => `${key.padEnd(16)} ${value}`);
    case "timer":
      return [
        `${clock(durationSeconds(props.elapsed ?? "0s"))} / ${clock(durationSeconds(props.duration ?? "0s"))}`,
        props.state ?? ""
      ];
    case "countdown": {
      const delta = Math.max(0, (Date.parse(props.target ?? "") - Date.now()) / 1e3);
      if (!Number.isFinite(delta)) return [props.target ?? ""];
      const days = Math.floor(delta / 86400);
      return [
        `${days}d ${clock(delta % 86400)}`,
        (props.units ?? "days hours minutes seconds").replace(/[[\],]/g, " ").replace(/\s+/g, "  ")
      ];
    }
    case "check": {
      const scale = glyphScale(glyphs ?? props.glyphs, ["\xB7", "\u2713"]);
      return meaningful(source).map(
        (line) => line.replace(/^\s*[-*]?\s*\[[xX]\]\s*/, `${scale.at(-1)}  `).replace(/^\s*[-*]?\s*\[ \]\s*/, `${scale[0]}  `)
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
      const meta = Object.entries(props).filter(([key]) => !["subtotal", "tax", "total"].includes(key)).map(([key, value]) => `${key.padEnd(12)} ${value}`);
      const totals = ["subtotal", "tax", "total"].flatMap(
        (key) => props[key] ? [`${key.padEnd(12)} ${props[key]}`] : []
      );
      return [
        ...meta,
        ...meta.length ? [""] : [],
        ...table,
        ...totals.length ? [""] : [],
        ...totals
      ];
    }
    default:
      return meaningful(source);
  }
}
var ACCENT_GLYPHS = /([=#@■█●✓+▨▁▂▃▄▅▆▇]+)/g;
var escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var coloredLine = (line, lineIndex, palette, targets) => {
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
          children: coloredLine(marks, Math.floor(lineIndex / 2) + 1, palette, targets).children
        },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__bars-label"] },
          children: [text(label)]
        }
      ]
    };
  }
  if (line.includes("	")) {
    const [label = "", barValue = "", value = ""] = line.split("	");
    const barMatch = /^\[\s*(.*?)\s*\]$/.exec(barValue);
    const cells = barMatch?.[1]?.split(/\s+/).filter(Boolean) ?? [];
    const barChildren = [text("[")];
    barChildren.push({
      type: "element",
      tagName: "span",
      properties: { className: ["md-graph__bar-cells"] },
      children: cells.map((cell) => ({
        type: "element",
        tagName: "span",
        properties: {
          className: !["-", ".", "\xB7", "\u2591"].includes(cell) && cell !== "|" ? ["md-graph__accent", "md-graph__color-0"] : cell === "|" ? ["md-graph__marker"] : ["md-graph__track"]
        },
        children: [text(cell)]
      }))
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
          children: coloredLine(label.trimEnd(), lineIndex, palette, targets).children
        },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__ascii-bar"] },
          children: barChildren
        },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["md-graph__bar-value"] },
          children: [text(value)]
        }
      ]
    };
  }
  const children = [];
  let cursor = 0, glyphIndex = 0;
  const targetPattern = targets.length ? targets.sort((a, b) => b.length - a.length).map(escapeRegExp).join("|") : "(?!)";
  const pattern = new RegExp(`(- - -\u25B6)|([-.\xB7])|${ACCENT_GLYPHS.source}|(${targetPattern})`, "g");
  for (const match of line.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) children.push(text(line.slice(cursor, start)));
    const connector = match[0] === "- - -\u25B6";
    const track = /^[-.·]+$/.test(match[0]);
    const connectorTargeted = connector && targets.some(
      (target) => line.slice(start + match[0].length).trimStart().startsWith(target)
    );
    const colorIndex = paletteMode(palette) === "solid" ? 0 : paletteMode(palette) === "duo" ? (lineIndex + glyphIndex) % 2 : (lineIndex + glyphIndex) % 4;
    children.push({
      type: "element",
      tagName: "span",
      properties: {
        className: track ? ["md-graph__track"] : connector ? [
          "md-graph__arrow",
          ...connectorTargeted ? ["md-graph__accent", `md-graph__color-${colorIndex}`] : []
        ] : ["md-graph__accent", `md-graph__color-${colorIndex}`]
      },
      children: [text(match[0])]
    });
    cursor = start + match[0].length;
    glyphIndex++;
  }
  if (cursor < line.length) children.push(text(line.slice(cursor)));
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__line"] },
    children: children.length ? children : [text(" ")]
  };
};
function renderGraphBody(type, source, palette, semantic = true, paletteExplicit = false, glyphs) {
  const targets = source.split(/\r?\n/).flatMap((line) => {
    const match = /^\s*@(accent|highlight)\s+(?:"([^"]+)"|(\S+))/.exec(line);
    return match?.[2] || match?.[3] ? [match[2] ?? match[3]] : [];
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
    const spark2 = sparkBody(source, palette, glyphs);
    if (spark2) return spark2;
  }
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["md-graph__body"] },
    children: (semantic ? render(type, source, glyphs) : source.split(/\r?\n/)).map(
      (line, index) => coloredLine(line, index, palette, targets)
    )
  };
}

// src/parser.ts
var STANDARD_ATTRIBUTES = /* @__PURE__ */ new Set([
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
  "corner"
]);
var supported = new Set(supportedGraphTypes);
var defaultGraphLimits = {
  maxBlockBytes: 64 * 1024,
  maxRows: 1e3,
  maxColumns: 100,
  maxPoints: 1e4,
  maxNodes: 2e3,
  maxEdges: 5e3,
  maxDepth: 100
};
function scalar(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}
function decodeQuoted(value) {
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, value.endsWith('"') ? -1 : void 0);
    }
  }
  if (value.startsWith("'")) return value.slice(1, value.endsWith("'") ? -1 : void 0);
  return value;
}
function parseInfoAttributes(meta = "") {
  const attributes = {};
  const diagnostics = [];
  const token = /([A-Za-z][\w-]*)\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?!["'])[^\s]+)/gy;
  let cursor = 0;
  while (cursor < meta.length) {
    while (/\s/.test(meta[cursor] ?? "")) cursor++;
    if (cursor >= meta.length) break;
    token.lastIndex = cursor;
    const match = token.exec(meta);
    if (!match?.[1] || match[2] === void 0) {
      diagnostics.push({
        severity: "error",
        code: "GRAPH_INVALID_ATTRIBUTE",
        message: `Malformed graph attribute near: ${meta.slice(cursor)}`
      });
      break;
    }
    attributes[match[1]] = scalar(decodeQuoted(match[2]));
    cursor = token.lastIndex;
  }
  return { attributes, diagnostics };
}
function annotations(source) {
  return source.split(/\r?\n/).flatMap((line) => {
    const match = /^\s*@([\w-]+)(?:\s+(\S+))?(.*)$/.exec(line);
    if (!match?.[1]) return [];
    const args = parseInfoAttributes(match[3] ?? "").attributes;
    return [{ name: match[1], ...match[2] ? { target: decodeQuoted(match[2]) } : {}, args }];
  });
}
function profileDiagnostics(type, source) {
  const result = [];
  const lines = source.split(/\r?\n/);
  if (["table", "invoice", "compare", "frame", "matrix", "sheet"].includes(type)) {
    const table = lines.filter((line) => line.includes("|")).map(
      (line) => line.replace(/^\s*\||\|\s*$/g, "").split(/(?<!\\)\|/).map((cell) => cell.trim())
    );
    if (table.length) {
      const expected = table[0].length;
      const alignment = table[1];
      if (!alignment || !alignment.every((cell) => /^:?-{3,}:?$/.test(cell)))
        result.push({
          severity: "error",
          code: "GRAPH_TABLE_ALIGNMENT",
          message: "Table requires a valid GFM alignment row."
        });
      for (const [index, row] of table.entries())
        if (row.length !== expected)
          result.push({
            severity: "error",
            code: "GRAPH_TABLE_COLUMN_COUNT",
            message: `Table row has ${row.length} columns; expected ${expected}.`,
            line: index + 1
          });
      if (type === "table") {
        const alignIndex = lines.findIndex((line) => /^\s*align\s*:/i.test(line));
        if (alignIndex >= 0) {
          const inline = lines[alignIndex].replace(/^\s*align\s*:\s*/i, "").trim();
          const configured = inline ? inline.replace(/^\[|\]$/g, "").split(",").map((value) => decodeQuoted(value.trim())) : lines.slice(alignIndex + 1).flatMap((line) => {
            const match = /^\s*-\s*(\S+)\s*$/.exec(line);
            return match?.[1] ? [decodeQuoted(match[1])] : [];
          });
          if (configured.length !== expected || configured.some((value) => !/^(left|center|right)$/i.test(value)))
            result.push({
              severity: "error",
              code: "GRAPH_TABLE_ALIGN_CONFIG",
              message: `Table align must contain ${expected} left, center, or right values.`
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
        message: "Matrix rows must have equal width."
      });
  }
  if (type === "meter") {
    const keyed = Object.fromEntries(
      lines.flatMap((line) => {
        const match = /^\s*(min|max|value)\s*:\s*(-?[\d.]+)/.exec(line);
        return match?.[1] && match[2] ? [[match[1], Number(match[2])]] : [];
      })
    );
    const min = keyed.min ?? 0, max = keyed.max ?? 1;
    if (keyed.value !== void 0 && (keyed.value < min || keyed.value > max))
      result.push({
        severity: "error",
        code: "GRAPH_METER_RANGE",
        message: `Meter value must be between ${min} and ${max}.`
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
        message: "Waffle values cannot be negative."
      });
    const total = values.reduce((sum, value) => sum + value, 0);
    if (values.length && total !== 100)
      result.push({
        severity: "warning",
        code: "GRAPH_WAFFLE_TOTAL",
        message: `Waffle values total ${total}; expected 100.`
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
          line: index + 1
        });
    }
  }
  if (type === "plot") {
    let section;
    let sectionPoints = 0;
    const finishSection = () => {
      if (section && sectionPoints === 0)
        result.push({
          severity: "error",
          code: "GRAPH_PLOT_EMPTY_SERIES",
          message: `Plot series ${section} has no points.`
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
      if (!coordinate || !Number.isFinite(Number(coordinate[1])) || !Number.isFinite(Number(coordinate[2])))
        result.push({
          severity: "error",
          code: "GRAPH_INVALID_NUMBER",
          message: "Plot coordinates must be finite numbers.",
          line: index + 1
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
          line: index + 1
        });
      if (start < previousEnd)
        result.push({
          severity: "error",
          code: "GRAPH_UPTIME_OVERLAP",
          message: "Uptime intervals overlap.",
          line: index + 1
        });
      previousEnd = Math.max(previousEnd, end);
    }
  }
  if (type === "countdown") {
    const target = lines.map((line) => /^\s*target\s*:\s*(.+)$/.exec(line)?.[1]).find(Boolean);
    if (target && (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(target) || !Number.isFinite(Date.parse(target))))
      result.push({
        severity: "error",
        code: "GRAPH_COUNTDOWN_TARGET",
        message: "Countdown target must be an absolute datetime."
      });
  }
  return result;
}
function parseGraphFence(input) {
  const limits = { ...defaultGraphLimits, ...input.limits };
  const parsed = parseInfoAttributes(input.meta);
  const diagnostics = [...parsed.diagnostics];
  if (!supported.has(input.type))
    diagnostics.push({
      severity: input.strict ? "error" : "warning",
      code: "GRAPH_UNKNOWN_PROFILE",
      message: `Unknown graph profile: ${input.type}`
    });
  for (const attribute of Object.keys(parsed.attributes))
    if (!STANDARD_ATTRIBUTES.has(attribute) && !attribute.startsWith("x-"))
      diagnostics.push({
        severity: input.strict ? "error" : "warning",
        code: "GRAPH_UNKNOWN_ATTRIBUTE",
        message: `Unknown graph attribute: ${attribute}`
      });
  const bytes = new TextEncoder().encode(input.value).byteLength;
  if (bytes > limits.maxBlockBytes)
    diagnostics.push({
      severity: "error",
      code: "GRAPH_LIMIT_BLOCK_BYTES",
      message: `Graph block exceeds ${limits.maxBlockBytes} bytes.`
    });
  const rows = input.value.split(/\r?\n/);
  if (rows.length > limits.maxRows)
    diagnostics.push({
      severity: "error",
      code: "GRAPH_LIMIT_ROWS",
      message: `Graph block exceeds ${limits.maxRows} rows.`
    });
  if (Math.max(0, ...rows.map((row) => row.length)) > limits.maxColumns)
    diagnostics.push({
      severity: "error",
      code: "GRAPH_LIMIT_COLUMNS",
      message: `Graph row exceeds ${limits.maxColumns} columns.`
    });
  const pointCount = rows.filter((row) => /^\s*[+-]?[\d.]+\s*,\s*[+-]?[\d.]+\s*$/.test(row)).length;
  const edgeCount = rows.reduce((count, row) => count + (row.match(/->/g)?.length ?? 0), 0);
  const treeRows = rows.filter((row) => /^\s*[-*+]\s+/.test(row));
  const nodeCount = new Set(rows.flatMap((row) => row.includes("->") ? row.split(/\s*->\s*/) : [])).size + treeRows.length;
  const depth = Math.max(
    0,
    ...treeRows.map((row) => Math.floor((/^\s*/.exec(row)?.[0].length ?? 0) / 2) + 1)
  );
  const counts = [
    [pointCount, limits.maxPoints, "GRAPH_LIMIT_POINTS", "points"],
    [nodeCount, limits.maxNodes, "GRAPH_LIMIT_NODES", "nodes"],
    [edgeCount, limits.maxEdges, "GRAPH_LIMIT_EDGES", "edges"],
    [depth, limits.maxDepth, "GRAPH_LIMIT_DEPTH", "tree depth"]
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
    raw: input.value
  };
}

// src/transformer.ts
var defaultOptions = {
  accentColor: defaultAccents[0],
  accentColor2: defaultAccents[1],
  accentColor3: defaultAccents[2],
  inkColor: "var(--darkgray, #d7d7d7)",
  mutedColor: "var(--dark, #777)",
  frame: "ascii",
  palette: "duo",
  strict: false,
  limits: defaultGraphLimits
};
var graphCss = (accents2, ink, muted) => `.md-graph {
    --graph-accent-light:${accents2[0]};
    --graph-accent-2-light:${accents2[1]};
    --graph-accent-3-light:${accents2[2]};
    --graph-accent-dark:var(--graph-accent-light);
    --graph-accent-2-dark:var(--graph-accent-2-light);
    --graph-accent-3-dark:var(--graph-accent-3-light);
    --graph-accent:var(--graph-accent-light);
    --graph-accent-2:var(--graph-accent-2-light);
    --graph-accent-3:var(--graph-accent-3-light);
    --md-graph-accent:var(--graph-accent);
    --md-graph-secondary:var(--graph-accent-2);
    --md-graph-tertiary:var(--graph-accent-3);
    --md-graph-title-gradient:linear-gradient(90deg, var(--md-graph-accent), var(--md-graph-secondary), var(--md-graph-tertiary));
    --md-graph-ink:${ink};
    --md-graph-muted:${muted};
    position:relative;
    box-sizing:border-box;
    margin:1.5rem 0;
    padding:1.65rem 2rem 1.1rem;
    border:1px dashed var(--md-graph-muted);
    color:var(--md-graph-ink);
    background:var(--light, transparent);
    font-family:var(--codeFont, ui-monospace, SFMono-Regular, Consolas, monospace);
    font-size:.875rem;
    line-height:1.7;
    overflow:visible
}

.md-graph :where(*) {
    font-size: .875rem
}

.md-graph__title {
    position: absolute;
    top: 0;
    left: 50%;
    max-width: calc(100% - 3rem);
    padding: 0 .65rem;
    color: var(--md-graph-accent);
    background: var(--light, #fff);
    font-size: .875rem;
    font-weight: 500;
    letter-spacing: .04em;
    line-height: 1;
    text-transform: uppercase;
    transform: translate(-50%, -50%);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.md-graph__title-text::before {
    content: "[ "
}

.md-graph__title-text::after {
    content: " ]"
}

.md-graph__title--empty {
    display: none
}

.md-graph__body {
    display: block;
    max-width: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-size: .875rem;
    white-space: pre;
    overflow-x: auto
}

.md-graph__body--table {
    overflow-x: auto;
    white-space: normal
}

.md-graph__table {
    width: 100%;
    margin: 0;
    border: 0;
    border-spacing: 0;
    border-collapse: collapse;
    table-layout: auto;
    background: none;
    color: inherit;
    font: inherit
}

.md-graph__table th, .md-graph__table td {
    padding: .45rem 1rem;
    border: 0;
    border-right: 1px dashed var(--md-graph-muted);
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 400;
    text-align: left;
    white-space: nowrap
}

.md-graph__table th:first-child, .md-graph__table td:first-child {
    padding-left: .25rem
}

.md-graph__table th:last-child, .md-graph__table td:last-child {
    padding-right: .25rem;
    border-right: 0
}

.md-graph__table [data-align="center"] {
    text-align: center
}

.md-graph__table [data-align="right"] {
    text-align: right;
    font-variant-numeric: tabular-nums
}

.md-graph__table thead tr {
    border-bottom: 1px dashed var(--md-graph-muted)
}

.md-graph__table thead th {
    padding-top: 0;
    padding-bottom: .55rem
}

.md-graph__table tbody tr:first-child td {
    padding-top: .55rem
}

.md-graph__table tbody tr:last-child td {
    padding-bottom: 0
}

.md-graph__table--footer tbody tr:last-child td {
    padding-bottom: .55rem
}

.md-graph__table-summary {
    border-top: 1px dashed var(--md-graph-muted)
}

.md-graph__table-summary td {
    padding-top: .55rem
}

.md-graph__table tfoot tr:last-child td {
    padding-bottom: 0
}

.md-graph__body--sheet {
    overflow-x: auto;
    white-space: normal
}

.md-graph__sheet-heading th {
    padding: .65rem .25rem .3rem;
    border: 0;
    color: var(--md-graph-muted);
    font: inherit;
    font-weight: 400;
    text-align: left
}

.md-graph__sheet-section + .md-graph__sheet-section .md-graph__sheet-heading th {
    padding-top: .85rem;
    border-top: 1px dashed var(--md-graph-muted)
}

.md-graph__sheet-section .md-graph__sheet-heading + tr td {
    padding-top: .25rem
}

.md-graph__sheet-section tr:last-child td {
    padding-bottom: 1rem
}

.md-graph__sheet-section:last-child tr:last-child td {
    padding-bottom: 0
}

.md-graph__body--flow {
    display: flex;
    flex-direction: column;
    gap: .85rem;
    overflow: visible
}

.md-graph__flow-row {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 1.7em
}

.md-graph__flow-node {
    flex: 0 0 auto;
    white-space: nowrap
}

.md-graph__flow-connector {
    flex: 0 0 auto;
    margin: 0 .8rem;
    color: var(--md-graph-muted);
    white-space: nowrap
}

.md-graph__flow-connector--stretch {
    flex: 1 1 3rem;
    min-width: 3rem;
    height: 0;
    border-top: 1px dashed currentColor;
    font-size: 0;
    line-height: 0
}

.md-graph__flow-connector--stretch::after {
    content: "\u25B6";
    position: relative;
    float: right;
    top: -.05rem;
    right: -.3rem;
    font-size: .875rem
}

.md-graph__flow-tone--accent {
    color: var(--md-graph-accent)
}

.md-graph__flow-tone--muted {
    color: var(--md-graph-muted)
}

.md-graph__body--tree {
    display: flex;
    flex-direction: column;
    gap: .1rem;
    overflow-x: auto;
    white-space: normal
}

.md-graph__tree-row {
    display: grid;
    grid-template-columns: minmax(max-content, 1fr) max-content;
    align-items: baseline;
    gap: 2rem;
    width: 100%;
    min-width: max-content
}

.md-graph__tree-name {
    white-space: pre
}

.md-graph__tree-branch, .md-graph__tree-meta {
    color: var(--md-graph-muted)
}

.md-graph__tree-meta {
    min-width: 2ch;
    text-align: right
}

.md-graph__body--timeline {
    display: flex;
    flex-direction: column;
    gap: .35rem;
    overflow-x: auto;
    white-space: normal
}

.md-graph__timeline-event {
    position: relative;
    display: grid;
    grid-template-columns: 1ch 6rem minmax(max-content, 1fr);
    align-items: baseline;
    column-gap: 1.25rem;
    min-width: max-content;
    min-height: 2.15rem
}

.md-graph__timeline-marker {
    position: relative;
    z-index: 1;
    text-align: center
}

.md-graph__timeline-marker::after {
    content: "";
    position: absolute;
    z-index: -1;
    top: 1.15rem;
    bottom: -1.35rem;
    left: 50%;
    border-left: 1px solid var(--md-graph-muted);
    transform: translateX(-50%)
}

.md-graph__timeline-event--last .md-graph__timeline-marker::after {
    display: none
}

.md-graph__timeline-event--muted {
    color: var(--md-graph-muted)
}

.md-graph__body--check {
    display: flex;
    flex-direction: column;
    gap: .55rem;
    overflow-x: auto
}

.md-graph__check-item {
    display: grid;
    grid-template-columns: max-content minmax(max-content, 1fr);
    align-items: baseline;
    gap: 1.25rem;
    min-width: max-content
}

.md-graph__check-marker {
    white-space: pre
}

.md-graph__check-copy {
    display: flex;
    flex-direction: column
}

.md-graph__check-item--open .md-graph__check-label,
.md-graph__check-note {
    color: var(--md-graph-muted)
}

.md-graph__body--stack {
    display: flex;
    flex-direction: column;
    gap: .55rem;
    width: 100%;
    overflow-x: auto
}

.md-graph__stack-row {
    display: grid;
    grid-template-columns: 7rem minmax(calc(var(--md-graph-stack-ticks, 24) * 1.05rem), 1fr);
    align-items: center;
    gap: 1.5rem;
    width: 100%;
    min-width: max-content
}

.md-graph__stack-track {
    display: flex;
    justify-content: space-between;
    width: 100%;
    line-height: 1
}

.md-graph__stack-cell {
    display: inline-block;
    width: 1ch;
    text-align: center
}

.md-graph__stack-legend {
    display: flex;
    gap: 1.25rem;
    margin-top: .55rem;
    min-width: max-content
}

.md-graph__stack-key {
    white-space: nowrap
}

.md-graph__body--funnel {
    display: flex;
    flex-direction: column;
    gap: .45rem;
    width: 100%;
    overflow-x: auto
}

.md-graph__funnel-row {
    display: grid;
    grid-template-columns: 6rem minmax(calc(var(--md-graph-funnel-ticks, 20) * 1.05rem), 1fr) 5rem 3rem;
    align-items: center;
    gap: 1.25rem;
    width: 100%;
    min-width: max-content
}

.md-graph__funnel-track {
    display: flex;
    justify-content: space-between;
    width: 100%;
    line-height: 1
}

.md-graph__funnel-cell {
    display: inline-block;
    width: 1ch;
    text-align: center
}

.md-graph__funnel-cell--empty,
.md-graph__funnel-percent {
    color: var(--md-graph-muted)
}

.md-graph__funnel-value,
.md-graph__funnel-percent {
    text-align: right;
    font-variant-numeric: tabular-nums
}

.md-graph__funnel-row--receded {
    opacity: .4
}

.md-graph__body--gantt {
    display: flex;
    flex-direction: column;
    gap: .35rem;
    width: 100%;
    overflow-x: auto
}

.md-graph__gantt-row {
    display: grid;
    grid-template-columns: 6rem minmax(calc(var(--md-graph-gantt-columns, 24) * 1.05rem), 1fr);
    align-items: center;
    gap: 1.5rem;
    width: 100%;
    min-width: max-content
}

.md-graph__gantt-track {
    display: grid;
    grid-template-columns: repeat(var(--md-graph-gantt-columns, 24), 1fr);
    width: 100%;
    line-height: 1
}

.md-graph__gantt-cell {
    display: inline-block;
    width: 1ch;
    justify-self: center;
    text-align: center
}

.md-graph__gantt-cell--remaining,
.md-graph__gantt-cell--empty,
.md-graph__gantt-axis {
    color: var(--md-graph-muted)
}

.md-graph__gantt-row--receded {
    opacity: .4
}

.md-graph__gantt-progress-row {
    min-height: 1rem
}

.md-graph__gantt-axis-row {
    margin-top: .65rem
}

.md-graph__gantt-axis {
    position: relative;
    height: 1.7em
}

.md-graph__gantt-tick {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap
}

.md-graph__gantt-tick:first-child {
    transform: none
}

.md-graph__gantt-tick:last-child {
    transform: translateX(-100%)
}

.md-graph__body--plot {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-x: auto
}

.md-graph__plot-chart {
    display: grid;
    grid-template-columns: 2rem minmax(calc(var(--md-graph-plot-columns, 12) * 1.5rem), 1fr);
    gap: 1.25rem;
    width: 100%;
    min-width: max-content
}

.md-graph__plot-y-axis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: var(--md-graph-muted);
    line-height: 1
}

.md-graph__plot-canvas {
    display: grid;
    grid-template-rows: repeat(var(--md-graph-plot-height, 7), 1rem);
    padding-bottom: .55rem;
    border-bottom: 1px dashed var(--md-graph-muted)
}

.md-graph__plot-row {
    display: grid;
    grid-template-columns: repeat(var(--md-graph-plot-columns, 12), 1fr);
    align-items: end
}

.md-graph__plot-cell {
    width: 1ch;
    justify-self: center;
    text-align: center;
    line-height: 1
}

.md-graph__plot-cell--fill {
    color: var(--md-graph-muted)
}

.md-graph__plot-label-row {
    display: grid;
    grid-template-columns: 2rem minmax(calc(var(--md-graph-plot-columns, 12) * 1.5rem), 1fr);
    gap: 1.25rem;
    margin-top: 1.25rem;
    color: var(--md-graph-muted);
    width: 100%;
    min-width: max-content
}

.md-graph__plot-x-axis {
    display: flex;
    justify-content: space-between;
    width: 100%
}

.md-graph__body--waffle {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-x: auto
}

.md-graph__waffle-grid {
    display: grid;
    grid-template-columns: repeat(var(--md-graph-waffle-columns, 10), 1ch);
    justify-content: space-between;
    row-gap: .7rem;
    width: calc(100% - 4rem);
    min-width: calc(var(--md-graph-waffle-columns, 10) * 2rem);
    margin-inline: 2rem;
    line-height: 1
}

.md-graph__waffle-cell {
    width: 1ch;
    text-align: center
}

.md-graph__waffle-cell--empty,
.md-graph__waffle-label {
    color: var(--md-graph-muted)
}

.md-graph__waffle-color--custom {
    color: var(--md-graph-waffle-color)
}

.md-graph__waffle-percent {
    margin-top: 1.25rem;
    font-variant-numeric: tabular-nums
}

.md-graph__waffle-label {
    margin-top: .65rem
}

.md-graph__body--diff {
    display: flex;
    flex-direction: column;
    gap: .35rem;
    width: 100%;
    overflow-x: auto
}

.md-graph__diff-row {
    display: grid;
    grid-template-columns: 1ch minmax(max-content, 1fr) max-content;
    align-items: baseline;
    gap: 1rem;
    min-width: max-content
}

.md-graph__diff-value {
    text-align: right;
    font-variant-numeric: tabular-nums
}

.md-graph__diff-footer {
    margin-top: .4rem;
    padding-top: .7rem;
    border-top: 1px dashed var(--md-graph-muted)
}

.md-graph__body--invoice {
    display: flex;
    flex-direction: column;
    gap: 1.65rem;
    width: 100%;
    overflow-x: auto
}

.md-graph__invoice-parties {
    display: grid;
    grid-template-columns: repeat(2, minmax(12rem, 1fr));
    gap: 2rem;
    min-width: 28rem
}

.md-graph__invoice-party,
.md-graph__invoice-meta-item {
    display: flex;
    flex-direction: column;
    gap: .15rem
}

.md-graph__invoice-kicker,
.md-graph__invoice-party-line,
.md-graph__invoice-cell--header,
.md-graph__invoice-total-label,
.md-graph__invoice-note {
    color: var(--md-graph-muted)
}

.md-graph__invoice-meta {
    display: flex;
    gap: 3rem;
    min-width: max-content
}

.md-graph__invoice-table {
    min-width: 30rem
}

.md-graph__invoice-table-row {
    display: grid;
    grid-template-columns: minmax(12rem, 1fr) 8rem;
    column-gap: 1.5rem;
    padding: .45rem 0
}

.md-graph__invoice--qty.md-graph__invoice--rate .md-graph__invoice-table-row {
    grid-template-columns: minmax(12rem, 1fr) 4rem 7rem 7rem
}

.md-graph__invoice--qty:not(.md-graph__invoice--rate) .md-graph__invoice-table-row,
.md-graph__invoice--rate:not(.md-graph__invoice--qty) .md-graph__invoice-table-row {
    grid-template-columns: minmax(12rem, 1fr) 7rem 7rem
}

.md-graph__invoice-table-head {
    margin-bottom: .15rem;
    border-bottom: 1px dashed var(--md-graph-muted)
}

.md-graph__invoice-cell--numeric {
    text-align: right;
    font-variant-numeric: tabular-nums
}

.md-graph__invoice-totals {
    display: flex;
    flex-direction: column;
    align-self: flex-end;
    gap: .2rem;
    width: min(50%, 22rem);
    min-width: 18rem;
    padding-top: .65rem;
    border-top: 1px dashed var(--md-graph-muted)
}

.md-graph__invoice-total {
    display: grid;
    grid-template-columns: 1fr max-content;
    gap: 2rem
}

.md-graph__invoice-total-value {
    text-align: right;
    font-variant-numeric: tabular-nums
}

.md-graph__invoice-note {
    margin-top: .25rem
}

.md-graph__body--compare {
    display: flex;
    flex-direction: column;
    gap: .35rem;
    width: 100%;
    overflow-x: auto
}

.md-graph__compare-row {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) repeat(var(--md-graph-compare-columns, 2), minmax(5rem, max-content));
    align-items: baseline;
    gap: 1.5rem;
    min-width: max-content
}

.md-graph__compare-row > :not(:first-child) {
    text-align: right;
    font-variant-numeric: tabular-nums
}

.md-graph__compare-head {
    margin-bottom: .45rem;
    color: var(--md-graph-muted)
}

.md-graph__compare-value--muted {
    color: var(--md-graph-muted)
}

.md-graph__body--matrix {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-x: auto
}

.md-graph__matrix-row {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) repeat(var(--md-graph-matrix-columns, 2), minmax(5rem, max-content));
    min-width: max-content
}

.md-graph__matrix-cell {
    padding: .45rem .75rem
}

.md-graph__matrix-cell:first-child {
    padding-left: 0
}

.md-graph__matrix-cell--value {
    border-left: 1px dashed var(--md-graph-muted);
    text-align: right;
    font-variant-numeric: tabular-nums
}

.md-graph__matrix-head {
    color: var(--md-graph-muted);
    border-bottom: 1px dashed var(--md-graph-muted)
}

.md-graph__body--stat {
    display: grid;
    grid-template-columns: repeat(var(--md-graph-stat-items, 3), minmax(max-content, 1fr));
    gap: 2rem;
    width: 100%;
    overflow-x: auto
}

.md-graph__stat-item {
    display: flex;
    flex-direction: column;
    min-width: max-content
}

.md-graph__stat-value {
    font-size: 2.25rem;
    line-height: 1.2;
    font-variant-numeric: tabular-nums
}

.md-graph__stat-label,
.md-graph__stat-hint {
    color: var(--md-graph-muted)
}

.md-graph__stat-label {
    margin-top: .35rem
}

.md-graph__body--kpi {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%
}

.md-graph__kpi-value {
    font-size: 2.25rem;
    line-height: 1.2;
    font-variant-numeric: tabular-nums
}

.md-graph__kpi-meta {
    display: flex;
    gap: 1rem;
    margin-top: .25rem;
    color: var(--md-graph-muted)
}

.md-graph__kpi-spark {
    display: flex;
    align-items: flex-end;
    gap: .1rem;
    margin-top: .75rem;
    color: var(--md-graph-muted);
    line-height: 1
}

.md-graph__body--spec {
    display: flex;
    flex-direction: column;
    gap: .35rem;
    width: 100%;
    overflow-x: auto
}

.md-graph__spec-row {
    display: grid;
    grid-template-columns: 9rem minmax(max-content, 1fr);
    gap: 3.5rem;
    min-width: max-content
}

.md-graph__spec-label {
    color: var(--md-graph-muted)
}

.md-graph__body--activity {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: calc(var(--md-graph-activity-weeks, 13) * .75rem + 3.25rem);
    overflow-x: auto;
    color: var(--md-graph-muted)
}

.md-graph__body--activity-fit {
    overflow-x: visible
}

.md-graph__activity-month-row,
.md-graph__activity-main {
    display: grid;
    grid-template-columns: 2rem minmax(calc(var(--md-graph-activity-weeks, 13) * .75rem), 1fr);
    gap: 1.25rem
}

.md-graph__activity-months {
    display: grid;
    grid-template-columns: repeat(var(--md-graph-activity-weeks, 13), 1ch);
    justify-content: space-between;
    min-height: 1.7rem
}

.md-graph__activity-months > span {
    white-space: nowrap
}

.md-graph__activity-months > span:last-child {
    transform: translateX(calc(-100% + 1ch))
}

.md-graph__activity-weekdays {
    display: grid;
    grid-template-rows: repeat(7, 1ch);
    align-items: center;
    row-gap: .25rem
}

.md-graph__activity-grid {
    display: grid;
    grid-template-rows: repeat(7, 1ch);
    grid-auto-flow: column;
    grid-auto-columns: 1ch;
    justify-content: space-between;
    row-gap: .25rem;
    line-height: 1
}

.md-graph__activity-cell {
    width: 1ch;
    text-align: center
}

.md-graph__activity-footer {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
    margin-top: 1.15rem;
    min-width: max-content
}

.md-graph__activity-legend {
    display: flex;
    align-items: baseline
}

.md-graph__body--heatmap {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: max-content;
    overflow-x: auto;
    color: var(--md-graph-muted)
}

.md-graph__heatmap-row {
    display: grid;
    grid-template-columns: 7rem repeat(var(--md-graph-heatmap-columns, 4), minmax(2rem, 1fr));
    align-items: center;
    min-width: 36rem
}

.md-graph__heatmap-head {
    margin-bottom: .45rem
}

.md-graph__heatmap-cell {
    min-width: 1ch
}

.md-graph__heatmap-cell--label {
    color: var(--md-graph-ink)
}

.md-graph__heatmap-cell--value {
    justify-self: center;
    width: 1ch;
    text-align: center;
    line-height: 1
}

.md-graph__heatmap-footer {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
    margin-top: 1.15rem;
    min-width: max-content
}

.md-graph__heatmap-legend {
    display: flex;
    align-items: baseline;
    margin-left: auto
}

.md-graph__body--calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    align-items: center;
    width: 100%;
    row-gap: .3rem
}

.md-graph__calendar-cell {
    justify-self: center;
    min-width: 3ch;
    text-align: center
}

.md-graph__calendar-weekday {
    color: var(--md-graph-muted);
    margin-bottom: .45rem
}

.md-graph__calendar-empty {
    color: transparent
}

.md-graph__body--waterfall {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-x: auto
}

.md-graph__waterfall-row {
    display: grid;
    grid-template-columns: 6rem minmax(calc(var(--md-graph-waterfall-ticks, 24) * 1.5ch), 1fr) 4rem;
    align-items: center;
    gap: 2rem;
    min-width: max-content
}

.md-graph__waterfall-row--end {
    border-top: 1px dashed var(--md-graph-muted);
    margin-top: .35rem;
    padding-top: .35rem
}

.md-graph__waterfall-track {
    display: grid;
    grid-template-columns: repeat(var(--md-graph-waterfall-ticks, 24), 1ch);
    justify-content: space-between;
    min-width: calc(var(--md-graph-waterfall-ticks, 24) * 1.5ch);
    line-height: 1
}

.md-graph__waterfall-tick {
    width: 1ch;
    text-align: center
}

.md-graph__waterfall-tick--empty {
    color: var(--md-graph-muted)
}

.md-graph__waterfall-value {
    justify-self: end
}

.md-graph__body--uptime {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    overflow-x: auto;
    color: var(--md-graph-muted)
}

.md-graph__uptime-grid,
.md-graph__uptime-meta {
    width: max(calc(var(--md-graph-uptime-columns, 30) * 1.3ch), 12rem)
}

.md-graph__uptime-grid {
    display: grid;
    grid-template-columns: repeat(var(--md-graph-uptime-columns, 30), 1ch);
    justify-content: start;
    column-gap: .15rem;
    row-gap: .35rem;
    line-height: 1
}

.md-graph__uptime-day {
    width: 1ch;
    text-align: center
}

.md-graph__uptime-meta {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    margin-top: .75rem
}

.md-graph__uptime-legend {
    display: flex;
    align-items: baseline;
    margin-top: 1rem
}

.md-graph__body--slope {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-x: auto
}

.md-graph__slope-row {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) 7rem 2rem 7rem;
    align-items: center;
    min-width: 32rem
}

.md-graph__slope-head {
    color: var(--md-graph-muted);
    margin-bottom: .55rem
}

.md-graph__slope-from {
    color: var(--md-graph-muted)
}

.md-graph__slope-from,
.md-graph__slope-to {
    justify-self: end
}

.md-graph__slope-marker {
    justify-self: center
}

.md-graph__body--bullet {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-x: auto
}

.md-graph__bullet-row {
    display: grid;
    grid-template-columns: 7rem 1ch minmax(calc(var(--md-graph-bullet-ticks, 20) * 1.5ch), 1fr) 1ch 6rem;
    align-items: center;
    gap: .5rem;
    min-width: max-content
}

.md-graph__bullet-track {
    display: grid;
    grid-template-columns: repeat(var(--md-graph-bullet-ticks, 20), 1ch);
    justify-content: space-between;
    min-width: calc(var(--md-graph-bullet-ticks, 20) * 1.5ch);
    line-height: 1
}

.md-graph__bullet-tick {
    width: 1ch;
    text-align: center
}

.md-graph__bullet-bracket,
.md-graph__bullet-tick--muted,
.md-graph__bullet-display {
    color: var(--md-graph-muted)
}

.md-graph__bullet-display {
    justify-self: end
}

.md-graph__body--timer {
    display: flex;
    flex-direction: column;
    gap: .25rem;
    overflow: visible
}

.md-graph__timer-value {
    font-size: 2.25rem;
    line-height: 1.25
}

.md-graph__timer-caption {
    color: var(--md-graph-muted)
}

.md-graph__body--countdown {
    display: flex;
    flex-direction: column;
    gap: .25rem;
    overflow: visible
}

.md-graph__countdown-value {
    font-size: 2.25rem;
    line-height: 1.25
}

.md-graph__countdown-value--done,
.md-graph__countdown-caption {
    color: var(--md-graph-muted)
}

.md-graph__body--frame {
    display: flex;
    flex-direction: column;
    overflow: visible;
    white-space: normal
}

.md-graph__frame-content {
    display: flex;
    flex-direction: column;
    gap: .2rem
}

.md-graph__frame-line,
.md-graph__frame-caption {
    white-space: pre-wrap
}

.md-graph__frame-caption {
    margin-top: .75rem
}

.md-graph__frame-caption--divider {
    border-top: 1px dashed var(--md-graph-muted);
    padding-top: .75rem
}

.md-graph__body--cells {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    overflow: visible;
    white-space: normal
}

.md-graph__cells-item {
    display: flex;
    flex-direction: column;
    align-items: center
}

.md-graph__cells-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .6rem
}

.md-graph__cells-row {
    display: flex;
    gap: .5rem;
    line-height: 1
}

.md-graph__cell {
    display: inline-block;
    width: 1ch;
    text-align: center
}

.md-graph__cell--active {
    color: var(--md-graph-accent)
}

.md-graph__cell--empty, .md-graph__cells-label {
    color: var(--md-graph-muted)
}

.md-graph__cells-label {
    margin-top: .75rem
}

.md-graph__body--meter {
    width: 100%;
    margin-bottom: -1.1rem;
    padding-bottom: .65rem;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    touch-action: pan-x;
    white-space: normal
}

.md-graph__meter-row {
    display: grid;
    grid-template-columns: minmax(12rem, 1fr) max-content;
    align-items: center;
    gap: .75rem;
    width: max-content;
    min-width: 100%
}

.md-graph__meter-bar {
    display: grid;
    grid-template-columns: max-content minmax(var(--md-graph-meter-width, 38.5rem), 1fr) max-content;
    align-items: center;
    width: 100%
}

.md-graph__meter-cells {
    display: grid;
    grid-template-columns: repeat(var(--md-graph-meter-ticks, 14), minmax(2.75rem, 1fr));
    width: 100%;
    min-width: var(--md-graph-meter-width, 38.5rem);
    padding: 0 2rem;
    text-align: center
}

.md-graph__meter-label, .md-graph__meter-caption {
    color: var(--md-graph-muted)
}

.md-graph__meter-label {
    margin-top: .65rem
}

.md-graph__meter-value {
    min-width: max-content;
    color: var(--md-graph-accent);
    text-align: right;
    font-variant-numeric: tabular-nums
}

.md-graph__body--spark {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .55rem;
    min-height: 4.75rem;
    overflow-x: auto;
    white-space: normal
}

.md-graph__sparkline {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: .125rem;
    min-height: 1.25rem;
    line-height: 1
}

.md-graph__spark-mark {
    display: inline-block;
    width: 1ch;
    text-align: center
}

.md-graph__spark-caption {
    color: var(--md-graph-muted);
    line-height: 1.4;
    text-align: center
}

.md-graph__line {
    min-height: 1.7em
}

.md-graph__accent, .md-graph__color-0 {
    color: var(--md-graph-accent)
}

.md-graph__color-1 {
    color: var(--md-graph-secondary, var(--md-graph-accent))
}

.md-graph__color-2, .md-graph__color-3 {
    color: var(--md-graph-tertiary, var(--md-graph-accent))
}

.md-graph__tone--dark {
    color: var(--dark)
}

.md-graph__tone--light {
    color: var(--light)
}

.md-graph__tone--ink {
    color: var(--md-graph-ink)
}

.md-graph__tone--muted {
    color: var(--md-graph-muted)
}

.md-graph__arrow, .md-graph__track {
    color: var(--md-graph-muted)
}

.md-graph__arrow.md-graph__accent {
    color: var(--md-graph-accent)
}

.md-graph__corner {
    position: absolute;
    z-index: 1;
    display: grid;
    width: 1em;
    height: 1em;
    place-items: center;
    color: var(--md-graph-muted);
    background: var(--light, transparent);
    font-size: .875rem;
    line-height: 1;
    pointer-events: none
}

.md-graph__corner--tl {
    top: 0;
    left: 0;
    transform: translate(-50%, -50%)
}

.md-graph__corner--tr {
    top: 0;
    right: 0;
    transform: translate(50%, -50%)
}

.md-graph__corner--bl {
    bottom: 0;
    left: 0;
    transform: translate(-50%, 50%)
}

.md-graph__corner--br {
    right: 0;
    bottom: 0;
    transform: translate(50%, 50%)
}

.md-graph__line--bar {
    display: grid;
    grid-template-columns: minmax(7rem, max-content) minmax(12rem, 1fr) max-content;
    align-items: center;
    gap: 1.5rem;
    width: 100%
}

.md-graph__ascii-bar {
    display: flex;
    align-items: center;
    min-width: 0
}

.md-graph__bar-cells {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(auto-fit, minmax(.6em, 1fr));
    padding: 0 .65rem;
    text-align: center
}

.md-graph__bar-value {
    min-width: 5.5em;
    color: var(--md-graph-muted);
    text-align: right;
    font-variant-numeric: tabular-nums
}

.md-graph__marker {
    color: var(--md-graph-ink)
}

@media (max-width:600px) {
    .md-graph__line--bar {
        grid-template-columns: minmax(5rem, max-content) minmax(10rem, 1fr);
        gap: .75rem
    }

    .md-graph__bar-value {
        grid-column: 2;
        min-width: 0;
        text-align: right
    }
}

.md-graph--flow[data-stretch="true"] .md-graph__line {
    display: flex;
    align-items: center;
    width: 100%
}

.md-graph--flow[data-stretch="true"] .md-graph__arrow {
    display: inline-block;
    flex: 1 1 3rem;
    min-width: 3rem;
    height: 0;
    margin: 0 .8rem;
    border-top: 1px dashed currentColor;
    font-size: 0;
    line-height: 0
}

.md-graph--flow[data-stretch="true"] .md-graph__arrow::after {
    content: "\u25B6";
    position: relative;
    float: right;
    top: -.05rem;
    right: -.3rem;
    font-size: .875rem
}

.md-graph--bars .md-graph__body {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 3rem;
    min-height: 6.5rem
}

.md-graph__line--bars {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end
}

.md-graph__bars-marks {
    font-size: 2.6rem;
    line-height: 1;
    letter-spacing: .08em
}

.md-graph__bars-label {
    margin-top: .5rem
}

.md-graph--bars .md-graph__line:not(.md-graph__line--bars) {
    padding-bottom: .15rem
}

.md-graph--bars .md-graph__accent {
    background: none
}

.md-graph--bars .md-graph__color-0 {
    color: var(--md-graph-accent)
}

.md-graph--bars .md-graph__color-1 {
    color: var(--md-graph-secondary, var(--md-graph-accent))
}

.md-graph--bars .md-graph__color-2, .md-graph--bars .md-graph__color-3 {
    color: var(--md-graph-tertiary, var(--md-graph-accent))
}

.md-graph--bars .md-graph__body--bars {
    gap: 3.75rem;
    min-height: 9rem;
    overflow: visible
}

.md-graph__bars-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end
}

.md-graph__bars-stacks {
    display: flex;
    align-items: flex-end;
    gap: .25em;
    font-size: .875rem;
    line-height: .56
}

.md-graph__bars-group--sm .md-graph__bars-stacks {
    font-size: .7rem
}

.md-graph__bars-group--lg .md-graph__bars-stacks {
    font-size: 1rem
}

.md-graph__bars-stack {
    display: flex;
    flex-direction: column-reverse
}

.md-graph__bars-stack>span {
    display: block
}

.md-graph__bars-group-label {
    margin-top: .55rem
}

.md-graph__bars-connector {
    align-self: flex-end;
    margin-bottom: .15rem;
    color: var(--md-graph-muted);
    white-space: nowrap
}

.md-graph__bars-tone--muted {
    color: var(--md-graph-muted)
}

.md-graph__caption {
    margin-top: .8rem;
    color: var(--md-graph-muted);
    font-size: .875rem
}

.md-graph[data-frame="none"] {
    border: 0
}

.md-graph[data-frame="none"] .md-graph__title {
    position: static;
    display: block;
    padding: 0 0 .8rem;
    transform: none;
    background: none
}

.md-graph[data-frame="none"] .md-graph__corner {
    display: none
}

.md-graph[data-palette-mode="duo"] {
    --md-graph-gradient: linear-gradient(90deg, var(--md-graph-accent), var(--md-graph-secondary))
}

.md-graph[data-palette-mode="trio"] {
    --md-graph-gradient: linear-gradient(90deg, var(--md-graph-accent), var(--md-graph-secondary), var(--md-graph-tertiary))
}

@supports (background-clip:text) {
    .md-graph__title-text {
        color: transparent;
        background: var(--md-graph-title-gradient);
        background-clip: text
    }
}

@media (prefers-color-scheme:dark) {
    .md-graph {
        --graph-accent: var(--graph-accent-dark);
        --graph-accent-2: var(--graph-accent-2-dark);
        --graph-accent-3: var(--graph-accent-3-dark)
    }

    .md-graph__title {
        background: var(--light, #161618)
    }
}

.dark .md-graph {
    --graph-accent: var(--graph-accent-dark);
    --graph-accent-2: var(--graph-accent-2-dark);
    --graph-accent-3: var(--graph-accent-3-dark)
}

@media (max-width:600px) {
    .md-graph {
        padding-right: 1rem;
        padding-left: 1rem
    }

    .md-graph--bars .md-graph__body {
        gap: 1.25rem
    }

    .md-graph__bars-marks {
        font-size: 1.8rem
    }
}`.replace(/\n\s*/g, "").replace(/\s*{/g, "{");
var meterScrollScript = `document.addEventListener("wheel", (event) => {
  const meter = event.target instanceof Element
    ? event.target.closest(".md-graph__body--meter")
    : null;
  if (!(meter instanceof HTMLElement) || meter.scrollWidth <= meter.clientWidth) return;

  const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
    ? event.deltaX
    : event.deltaY;
  if (!rawDelta) return;
  const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? meter.clientWidth
      : 1;
  const previous = meter.scrollLeft;
  meter.scrollLeft += rawDelta * scale;
  if (meter.scrollLeft !== previous) event.preventDefault();
}, { passive: false });`;
var timerScript = `(() => {
  if (window.__mdGraphTimerInterval) clearInterval(window.__mdGraphTimerInterval);
  const pad = (value) => String(value).padStart(2, "0");
  const duration = (milliseconds, units) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const values = {
      days: Math.floor(seconds / 86400),
      hours: Math.floor((seconds % 86400) / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60,
    };
    if (units.length === 1 && units[0] === "days") return values.days + "d";
    if (units.join(",") === "days,hours,minutes,seconds")
      return values.days + "d " + pad(values.hours) + ":" + pad(values.minutes) + ":" + pad(values.seconds);
    const suffix = { days: "d", hours: "h", minutes: "m", seconds: "s" };
    return units.map((unit) => values[unit] + suffix[unit]).join(" ");
  };
  const update = () => document.querySelectorAll(".md-graph__body--timer").forEach((timer) => {
    const output = timer.querySelector(".md-graph__timer-value");
    if (!output) return;
    const kind = timer.dataset.timerKind || "elapsed";
    const format = timer.dataset.timerFormat || "24";
    const now = Date.now();
    if (kind === "clock") {
      output.textContent = new Date(now).toLocaleTimeString("en-US", {
        hour12: format === "12", hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
      return;
    }
    const at = Number(timer.dataset.timerAt);
    const units = (timer.dataset.timerUnits || "days,hours,minutes,seconds").split(",");
    output.textContent = duration(now - at, units) + (kind === "ago" ? " ago" : "");
  });
  update();
  window.__mdGraphTimerInterval = window.setInterval(update, 1000);
})();`;
var countdownScript = `(() => {
  if (window.__mdGraphCountdownInterval) clearInterval(window.__mdGraphCountdownInterval);
  const pad = (value) => String(value).padStart(2, "0");
  const update = () => document.querySelectorAll(".md-graph__body--countdown").forEach((countdown) => {
    const output = countdown.querySelector(".md-graph__countdown-value");
    if (!output) return;
    const remaining = Number(countdown.dataset.countdownTo) - Date.now();
    if (remaining <= 0) {
      output.textContent = countdown.dataset.countdownDone || "done";
      output.classList.add("md-graph__countdown-value--done");
      output.style.color = "var(--md-graph-muted)";
      return;
    }
    const seconds = Math.floor(remaining / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    output.textContent = days + "d " + pad(hours) + ":" + pad(minutes) + ":" + pad(seconds % 60);
  });
  update();
  window.__mdGraphCountdownInterval = window.setInterval(update, 1000);
})();`;
function parseGraphMeta(meta = "") {
  return Object.fromEntries(
    Object.entries(parseInfoAttributes(meta).attributes).map(([key, value]) => [
      key,
      String(value)
    ])
  );
}
var text2 = (value) => ({ type: "text", value });
var bodyOptions = (source) => Object.fromEntries(
  source.split(/\r?\n/).flatMap((line) => {
    const match = /^\s*(accent|accent2|accent3|palette|glyphs|corner)\s*:\s*(.+?)\s*$/i.exec(
      line
    );
    return match?.[1] && match[2] ? [[match[1].toLowerCase(), match[2]]] : [];
  })
);
var customPalette = (source) => {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => /^palette[ \t]*:[ \t]*$/.test(line));
  if (start < 0) return void 0;
  const colors = [];
  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index];
    if (line && !/^[ \t]+/.test(line)) break;
    const value = /^[ \t]+-[ \t]+(#[0-9a-f]+)[ \t]*$/i.exec(line)?.[1];
    if (value) colors.push(value);
  }
  if (colors.length < 3 || colors.length > 5 || colors.some((color2) => !/^#[0-9a-f]{3}(?:[0-9a-f]{1}|[0-9a-f]{3}|[0-9a-f]{5})?$/i.test(color2)))
    return void 0;
  return colors;
};
var safeCssColor = (value, fallback) => {
  const color2 = value?.trim().replace(/;+\s*$/, "") ?? "";
  return color2 && !/[;{}<>]/.test(color2) ? color2 : fallback;
};
var graphElement = (node, graph, options) => {
  const type = node.lang.slice("graph/".length);
  const attrs = Object.fromEntries(
    Object.entries(graph.attributes).map(([key, value]) => [key, String(value)])
  );
  const bodyTitle = /^\s*title\s*:\s*(.+?)\s*$/im.exec(node.value)?.[1]?.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
  const title = type === "timer" && bodyTitle ? bodyTitle : type === "frame" ? attrs.title ?? "" : attrs.title || type;
  const body = bodyOptions(node.value);
  const listedPalette = customPalette(node.value);
  const requestedPalette = (body.palette || attrs.palette || options.palette).toLowerCase();
  const palette = listedPalette ? "trio" : ["solid", "mono", "duo", "trio", "multi", ...Object.keys(graphPalettes)].includes(
    requestedPalette
  ) ? requestedPalette : options.palette;
  const configuredAccents = [
    options.accentColor,
    options.accentColor2,
    options.accentColor3
  ];
  const listedAccents = listedPalette ? [listedPalette[0], listedPalette[1], listedPalette[2]] : void 0;
  const presetAccents = listedAccents ?? paletteAccents(palette, configuredAccents);
  const presetDarkAccents = listedAccents ?? paletteDarkAccents(palette, configuredAccents);
  const accentIsData = type === "stack" || type === "compare" || type === "matrix";
  const accents2 = [
    safeCssColor(accentIsData ? void 0 : body.accent, presetAccents[0]),
    safeCssColor(body.accent2, presetAccents[1]),
    safeCssColor(body.accent3, presetAccents[2])
  ];
  const darkAccents = [
    safeCssColor(accentIsData ? void 0 : body.accent, presetDarkAccents[0]),
    safeCssColor(body.accent2, presetDarkAccents[1]),
    safeCssColor(body.accent3, presetDarkAccents[2])
  ];
  const corner = (body.corner || attrs.corner || "+").replace(
    /^(?:"([\s\S]*)"|'([\s\S]*)')$/,
    "$1$2"
  );
  const className = ["md-graph", `md-graph--${type}`];
  if (attrs["x-html-class"]) className.push(...attrs["x-html-class"].split(/\s+/));
  return {
    type: "element",
    tagName: "figure",
    properties: {
      className,
      dataGraph: type,
      dataFrame: attrs.frame || options.frame,
      dataPalette: listedPalette ? "custom" : palette,
      dataPaletteMode: paletteMode(palette),
      style: `--graph-accent-light:${accents2[0]};--graph-accent-2-light:${accents2[1]};--graph-accent-3-light:${accents2[2]};--graph-accent-dark:${darkAccents[0]};--graph-accent-2-dark:${darkAccents[1]};--graph-accent-3-dark:${darkAccents[2]}${listedPalette?.[3] ? `;--md-graph-muted:${listedPalette[3]}` : ""}${listedPalette?.[4] ? `;--md-graph-ink:${listedPalette[4]}` : ""}`,
      dataStretch: attrs.stretch === "true" || /^\s*stretch\s*:\s*true\s*$/m.test(node.value),
      ...attrs.id ? { id: attrs.id } : {},
      ...attrs["aria-label"] ? { ariaLabel: attrs["aria-label"] } : {}
    },
    children: [
      {
        type: "element",
        tagName: "figcaption",
        properties: {
          className: ["md-graph__title", ...!title ? ["md-graph__title--empty"] : []]
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__title-text"] },
            children: [text2(title)]
          }
        ]
      },
      renderGraphBody(
        type,
        node.value,
        palette,
        supportedGraphTypes.includes(type) && !(options.strict && graph.diagnostics.some(({ severity }) => severity === "error")),
        Boolean(listedPalette || body.palette || attrs.palette),
        body.glyphs || attrs.glyphs
      ),
      ...attrs.caption ? [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["md-graph__caption"] },
          children: [text2(attrs.caption)]
        }
      ] : [],
      ...["tl", "tr", "bl", "br"].map((position) => ({
        type: "element",
        tagName: "span",
        properties: {
          className: ["md-graph__corner", `md-graph__corner--${position}`],
          ariaHidden: "true"
        },
        children: [text2(corner)]
      }))
    ]
  };
};
var remarkMdGraphs = (options) => () => (tree, file) => {
  const fileDiagnostics = [];
  visit(tree, "code", (node) => {
    if (!node.lang?.startsWith("graph/")) return;
    const graph = parseGraphFence({
      type: node.lang.slice("graph/".length),
      meta: node.meta ?? "",
      value: node.value,
      strict: options.strict,
      limits: options.limits
    });
    fileDiagnostics.push(...graph.diagnostics);
    const element = graphElement(node, graph, options);
    node.data = {
      ...node.data,
      graph,
      hName: element.tagName,
      hProperties: element.properties,
      hChildren: element.children
    };
  });
  if (fileDiagnostics.length) {
    const data2 = file.data;
    data2.mdGraphsDiagnostics = [...data2.mdGraphsDiagnostics ?? [], ...fileDiagnostics];
  }
};
var rehypeGraphCaption = () => (tree) => {
  visit(tree, "element", (node) => {
    const graphChild = node.tagName === "pre" && node.children.length === 1 && node.children[0]?.type === "element" && Array.isArray(node.children[0].properties.className) && node.children[0].properties.className.includes("md-graph") ? node.children[0] : void 0;
    if (graphChild) Object.assign(node, graphChild);
    if (node.tagName !== "figure" || !Array.isArray(node.properties.className) || !node.properties.className.includes("md-graph"))
      return;
    const caption = node.children.find(
      (child) => child.type === "element" && Array.isArray(child.properties.className) && child.properties.className.includes("md-graph__caption")
    );
    if (caption && !node.properties.ariaDescribedBy) {
      const id = `${String(node.properties.id || "md-graph")}-caption`;
      caption.properties.id = id;
      node.properties.ariaDescribedBy = [id];
    }
  });
};
var MdGraphs = (userOptions = {}) => {
  const options = {
    ...defaultOptions,
    ...userOptions,
    limits: { ...defaultOptions.limits, ...userOptions.limits }
  };
  return {
    name: "MdGraphs",
    markdownPlugins: () => [remarkMdGraphs(options)],
    htmlPlugins: () => [rehypeGraphCaption],
    externalResources: () => ({
      css: [
        {
          content: graphCss(
            [options.accentColor, options.accentColor2, options.accentColor3],
            safeCssColor(options.inkColor, defaultOptions.inkColor),
            safeCssColor(options.mutedColor, defaultOptions.mutedColor)
          ),
          inline: true
        }
      ],
      js: [
        {
          contentType: "inline",
          loadTime: "afterDOMReady",
          spaPreserve: true,
          script: meterScrollScript
        },
        {
          contentType: "inline",
          loadTime: "afterDOMReady",
          spaPreserve: true,
          script: timerScript
        },
        {
          contentType: "inline",
          loadTime: "afterDOMReady",
          spaPreserve: true,
          script: countdownScript
        }
      ],
      additionalHead: []
    })
  };
};

// src/ascii/examples.ts
var graphExampleTypes = [
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
  "bullet"
];
var supplementalGraphTypes = [
  "flow",
  "plot",
  "activity",
  "heatmap",
  "calendar",
  "timer",
  "countdown",
  "frame"
];
var graphFence = (type, body, title) => `\`\`\`graph/${type}${title ? ` title=${JSON.stringify(title)}` : ""}
${body.trim()}
\`\`\``;

export { GLYPH_PRESETS, MdGraphs, SPARK_GLYPHS, STACK_GLYPHS, accentSets, accents, col, colWidth, dash, defaultAccents, defaultGraphLimits, fillTrack, frameAscii, getAccent, glyphAt, glyphScale, graphExampleTypes, graphFence, graphPalettes, isAccentId, legacyAccentIds, meterTrack, miniBars, padEnd, padStart, parseGraphFence, parseGraphMeta, parseInfoAttributes, rule, sparkGlyphs, supplementalGraphTypes, supportedGraphTypes, widthOf };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map