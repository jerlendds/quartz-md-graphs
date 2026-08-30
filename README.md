# md-graphs

<details>
  <summary>View demo...</summary>

  ![demo.png](https://github.com/user-attachments/assets/494b83b4-8382-4977-93d7-8b041ad59dab)

</details>

Quartz 5 transformer for semantic `graph/*` fenced blocks. Graphs use a quiet dashed ASCII-style frame, a centered title on the top edge, and one configurable accent color. Inspired by the [markdown-graphs](https://mdx-graphs.kshv.me) MDX package. Credit for most of this code should go to [keshav-exe](https://github.com/keshav-exe)! Thank you for creating a cool open source ASCII chart library I could adapt for Quartz 5 :)

````md
```graph/rank title="ROUTES" palette=duo
/docs    = 12400
/install = 4100
/plot    = 860
```
````

```ts
import { MdGraphs } from "@quartz-community/md-graphs";

MdGraphs({ palette: "duo", frame: "ascii", strict: false });
```

## Options

| Option         | Values                 | Default       |
| -------------- | ---------------------- | ------------- |
| `accentColor`  | Any CSS color          | Lime LAB      |
| `accentColor2` | Any CSS color          | Green LAB     |
| `accentColor3` | Any CSS color          | Cyan LAB      |
| `palette`      | Mode or named preset   | `duo`         |
| `frame`        | `ascii`, `none`        | `ascii`       |
| `strict`       | Boolean                | `false`       |
| `limits`       | Parser resource limits | Safe defaults |

Block attributes override plugin defaults. Palette modes are `solid`, `duo`, and `trio`; deprecated `mono` and `multi` remain aliases for backward compatibility. Named three-color presets are `greenday`, `orange`, `smelly`, `bluebee`, `indigosea`, `purple`, `pink`, `fire`, `deepsea`, `pinkteam`, `burning`, and `blueteam`.

The reference accent catalog also provides Quartz-aware `theme`, `mint`, `green`, `cyan`, `blue`, `sunset`, `ocean`, `neon`, `aurora`, and `prism` presets. These presets define separate light and dark triples. Legacy IDs such as `sky`, `lime`, and `dusk` resolve through the exported accent helpers.

Colors can be overridden inside any graph body. A trailing semicolon is optional:

```yaml
palette: trio
accent: lab(92.9449% -44.411 80.292);
accent2: lab(89.622% -60.7933 21.1414);
accent3: lab(77.5288% -33.8221 -35.2522);
```

The title gradient always uses all three supplied accents. The selected palette mode independently controls series coloring.

Flow graphs accept repeated structured `nodes` groups. A node's `tone` can be `default`, `accent`, or `muted`; `stretch: true` stretches the connector entering that node. The legacy `a -> b` syntax remains supported.

```yaml
nodes:
  - label: tap
  - label: update
    tone: accent
  - label: server syncs
    stretch: true
    tone: muted
```

Tree graphs use nested `nodes` and `children`. Optional `meta` text is muted and right-aligned; `color: accent`, `accent2`, `accent3`, `dark`, or `light` applies a solid Quartz-aware color only to that node label. Branch lines remain muted. Legacy Markdown-list trees remain supported.

```yaml
nodes:
  - label: platform
    children:
      - label: api
        meta: priya
      - label: workers
        meta: jon
        color: accent
```

Timeline graphs accept structured `events` with `date`, `label`, and an optional `color` of `accent`, `accent2`, `accent3`, `muted`, or `ink`. `ink` is the default. The selected color applies to the marker, date, and label; `muted` uses a hollow marker while every other color uses a solid marker. Muted connector lines join adjacent events. Legacy pipe-delimited timeline records remain supported.

Stack graphs accept structured `rows`, each containing a `label` and a list of `{ label, value, color? }` segments. `ticks` controls the proportional bar width and defaults to `24`; `glyphs` accepts `shade`, `ascii`, `hash`, `bar`, or a custom array and otherwise defaults to `█▓▒░#=+-`. The first segment is accented by default and the remainder are muted; `accent` can name a different segment label, while an individual segment can set `color` to `accent`, `accent2`, `accent3`, `muted`, or `ink`. A shared legend is generated from segment labels.

Funnel graphs accept structured `steps` with `label`, `value`, optional `display`, and optional `color`. Bars and percentages are relative to the first step; the first percentage is omitted. `ticks` defaults to `20`, while each step's filled glyphs can use `accent`, `accent2`, `accent3`, `ink`, or `muted`. Set `stage` to an exact step label to focus that row and recede the others. Shared `shade`, `ascii`, `hash`, and `bar` glyph presets and custom glyph arrays are supported.

Gantt graphs accept structured `items` with normalized `start` and `end` positions, optional normalized `complete`, and optional `color` (`accent`, `accent2`, `accent3`, `muted`, or `ink`). `columns` defaults to `24`; `progress` draws a `▾` playhead, `ticks` places labels evenly beneath the track, and `stage` focuses an exact row label while receding the others. `glyphs` accepts the shared presets or a custom array. Item highlighting uses `color`; the former `accent: true` shorthand is not supported.

Plot graphs accept an inline numeric `data` array and first/last `labels`. `height` defaults to `7`; `variant` defaults to `area`, which fills beneath each cap, while `line` draws caps only. `progress` defaults to `1` and controls how many columns are revealed, with the final revealed column accented. Shared glyph presets and custom glyph arrays are supported.

Waffle graphs accept a normalized `value`, optional muted `label`, total `cells` (default `100`), and `columns` (default `10`). Cells fill row-first from the top-left and columns spread across the available frame width. The percentage is rendered beneath the grid. `color` changes both filled cells and the percentage and accepts `accent`, `accent2`, `accent3`, `muted`, `ink`, or a hex color. Shared glyph presets and custom glyph arrays are supported; the default shade treatment uses `█` for filled cells and `░` for empty cells.

Diff graphs accept structured `rows` with `label`, `value`, optional `color`, and optional `type`, plus an optional `footer` with the same fields. `type: add` renders `+`, `type: remove` renders `−`, and omitted types have no sign; this behavior is independent of color and also applies to footers. Named colors are `accent`, `accent2`, `accent3`, `muted`, and `ink`; rows and footers also accept validated hex colors. The footer is separated by a dashed rule.

Invoice graphs accept optional `from` and `to` parties with names and address lines, metadata entries, item rows, totals, and a muted note. Quantity and rate columns appear only when at least one item supplies them. Total `color` values apply to the total value and accept `accent`, `accent2`, `accent3`, `muted`, `ink`, or a validated hex color.

Compare graphs accept `columns`, an `accent` column label, and structured rows with labels and value arrays. Boolean values render as `✓` and `–`. The selected column's heading and positive checks use `color`; textual values remain ink, while non-selected textual values and false values recede. `color` accepts `accent`, `accent2`, `accent3`, `muted`, `ink`, or a validated hex value.

Matrix graphs accept `columns`, structured labeled rows, and an `accent` row label. Dashed rules separate the heading and numeric columns, and values use right-aligned tabular figures. The selected row's label and values use `color`, which accepts `accent`, `accent2`, `accent3`, `muted`, `ink`, or a validated hex value.

Stat graphs accept structured items with a headline `value`, muted `label`, optional muted `hint`, and optional `color`. Items distribute evenly across the frame and retain a minimum content width for horizontal overflow. `color` applies only to the headline value and accepts `accent`, `accent2`, `accent3`, `muted`, `ink`, or a validated hex value.

KPI graphs accept a headline `value`, muted `label`, optional muted `hint`, and numeric `data` array. The data renders as a compact sparkline with only its final glyph sharing the headline color. `color` accepts `accent`, `accent2`, `accent3`, `muted`, `ink`, or a validated hex value. `glyphs` accepts the shared presets or a custom array.

Spec graphs accept structured rows with muted labels, values, and optional value colors. Rows use a fixed label column and flexible value column. `color` applies only to the value and accepts `accent`, `accent2`, `accent3`, `muted`, `ink`, or a validated hex value.

Activity graphs accept explicit ISO-date/count records or `days: { activityDays: [start, length] }`, which expands the deterministic weekday pulse generator used by the examples. Missing dates become empty days. `weekStartsOn` accepts Sunday (`0`) or Monday (`1`); `max` locks the intensity scale; `legend` defaults to true; and `caption` overrides the computed contribution total or hides it with `false`. `label` remains a caption alias. Low activity is muted, the upper intermediate band is ink, and peak activity uses `color` (`accent` by default, any named graph color, or hex). `inkFrom` defaults to 75% of the resolved maximum, and `accentFrom` defaults to the maximum, allowing both thresholds to be customized. The default five-step legend is muted → muted → muted → ink → accent. Shared glyph presets and custom glyph arrays are supported.

Heatmaps accept `columns` plus labeled `rows` of numeric `values`. All cells share one intensity scale; `max` can lock its upper bound, `legend: false` hides the Less/More key, and `caption` adds a note beneath the matrix. The default glyph scale is `shade`, and the default low-to-high `colorScale` is `[muted, accent2, accent2, accent, accent]`. `colorScale` accepts any list of named graph colors or validated hex values and maps it evenly across both cells and legend glyphs. `palette` defaults to `mono`; `duo` alternates primary-accent cells between the first two accents by row, while `multi` cycles all three. Shared glyph presets and custom glyph arrays are supported.

Calendars require a full `year` and a `month` from 1–12. Weeks start on Monday by default; set `weekStartsOn: 0` for Sunday. `marks` accepts either a compact array of day numbers or structured `{ day, accent }` entries, while `today` wraps that day in brackets. `color` accepts named graph colors or hex. `palette` defaults to `mono`; `duo` alternates two accents across marks and `multi` cycles all three.

Waterfalls accept structured `items` with a `label`, numeric `value`, optional `color`, and optional `kind` (`start`, `in`, `out`, or `end`). When omitted, kind is inferred as start for the first item, end for the last, and in/out from the sign of intermediate values. Tracks share one cumulative scale. `ticks` controls the character width and defaults to 24; `glyphs` accepts shared presets or a custom array.

Uptime graphs accept a direct `days` array containing `ok`, `degraded`, `down`, or `empty`, or a compact `days: { statusDays: { length, down, degraded, default } }` generator using zero-based status indices. Empty days render as a muted `-`. `columns` controls days per row and defaults to 30; short series are not padded. `from` and `to` label the range. The percentage is successful days divided by non-empty measured days. `glyphs` accepts shared presets or custom arrays.

Slope graphs accept `fromLabel`, `toLabel`, and structured items containing `label`, numeric `from` and `to` values, and an optional named or hex `color`. Source values remain muted while the direction marker and destination use the row color. Values receive thousands separators, and unchanged rows use a dash instead of an arrow.

Bullet graphs accept structured items containing `label`, `value`, and optional `target`, `max`, `display`, and named or hex `color`. `max` defaults to the target, or the value when no target exists. `ticks` controls track width and defaults to 20. Target positions interrupt the track with `|`; `color` applies only to filled glyphs. Glyph presets and custom arrays are supported, with the native `-`/`=` track retained when omitted.

Timer graphs update live once per second in the browser. `kind: elapsed` counts upward from `at`, `ago` renders a relative duration, and `clock` displays local time. `at` accepts an ISO date string or numeric timestamp. `units` selects duration fields, `caption` adds muted supporting text, `timeFormat` selects a 12- or 24-hour clock, and `color` accepts named graph colors or hex. A body-level `title` can override the fence title for timer blocks.

Countdown graphs update live once per second toward a required `to` deadline, which accepts an ISO date string or numeric timestamp. Before the deadline they render `days HH:MM:SS` in the optional named or hex `color`. At and after the deadline they switch to muted `done` text, which defaults to `done`. `caption` adds a muted line beneath the value.

Frame graphs accept `content` as a scalar, YAML block scalar, or ordered list of plain strings and `{ text, color }` entries. Lists render as separate lines without automatic bullets. Top-level `color` defaults content to `ink`, while each structured line can override it with a named graph color or hex. `caption` supports scalar or block text, defaults to `captionColor: muted`, and adds a dashed separator unless `divider: false`. Titles are optional, and `corner` controls the four frame corner glyphs.

```yaml
events:
  - date: "Mar 12"
    label: CLI copies the files
  - date: "Mar 18"
    label: Docs, live previews
    color: accent
  - date: "Apr 02"
    label: Registry listed
```

Bar graphs use structured groups. Every numeric value is rendered as a vertical stack containing that exact number of `█` glyphs. Group sizes are `sm`, `md`, or `lg`.

```yaml
from:
  label: before
  values: [3, 4, 8, 3]
to:
  label: after
  size: lg
  values: [4, 7, 13, 4]
```

Rank graphs accept structured items. `max` sets a shared scale, and `display` optionally replaces the formatted numeric label without changing the bar value.

```yaml
max: 100
items:
  - label: frame
    value: 100
    display: "100%"
  - label: plot
    value: 82
    display: "82%"
```

Every `graph/*` block accepts `glyphs`. Shared scales are `shade: ·░▒▓█`, `ascii: .-=#@`, `hash: [space, #]`, and `bar: [space, █]`; custom arrays are also supported. Charts that encode intensity use the whole scale, binary cells use its first and last glyphs, and meters use its first and second-to-last glyphs. Omitting `glyphs` preserves each graph type's native default. Rank also supports `ticks` (default `20`) and `palette`. Set `corner` on any graph to replace the frame's default `+` glyph.

Cell graphs accept labeled `0`/`1` matrices. Active cells use a solid accent glyph, empty cells use the muted spacer glyph, and labels render below centered grids. The default `shade` glyphs are `·` and `█`; the same alternate and custom `glyphs` options are supported.

Each cell grid can select `color: accent`, `accent2`, or `accent3`. The default is `accent`; the color applies only to active cells.

Meters use normalized `value` numbers from `0` to `1`, with `ticks` defaulting to `14`. Their default glyphs are filled `=` and empty `-`; `glyphs: shade` uses the first shade (`·`) for empty slots and the second-to-last shade (`▓`) for filled slots. Custom glyph arrays follow the same first/second-to-last mapping. Set `color: accent`, `accent2`, or `accent3` to choose the solid color for filled glyphs; the default is `accent`. The muted label renders below the meter, and the percentage uses the base accent. They also support a muted `caption`, shared glyph presets, palette, and corner options. Legacy `value`/`max` and `value / max` forms remain supported.

Meter ticks use fixed-width slots. If the requested tick count exceeds the available frame width, the meter body scrolls horizontally inside the fixed outer border using its native scrollbar, touch panning, trackpad input, or horizontal scroll events.

Spark graphs accept one or more numeric arrays under `data`. Values scale against each series maximum, previous marks use Quartz's muted color, and the final mark uses the series accent. Set `color: accent`, `accent2`, or `accent3` to override the final mark's solid color. `label` and `caption` render as the muted line below the centered sparkline.

Tables support structured `headers`, `rows`, and an optional `footer`. Headers may use a block list or inline array; each row is an array. A footer is rendered as a semantic `<tfoot>` summary. Existing GFM table syntax remains supported.

```yaml
headers: ["Decision", "Reason"]
rows:
  - ["ease-out on enter", "feels snappier"]
  - ["180ms, not 400ms", "feels faster, more responsive"]
```

Table columns use `align`; provide exactly one `left`, `center`, or `right` value per column. GFM tables use their separator-row alignment when `align` is omitted:

```text
align:
  - left
  - right
  - right
  - right
```

Sheets use the same headers and alignment model but group rows under muted section headings. Each section is rendered as a semantic `<tbody>`, and later sections receive a dashed separator.

```yaml
headers: ["Item", "Owner", "Status"]
align:
  - left
  - left
  - left
sections:
  - title: Scope
    rows:
      - ["CLI copies files", "priya", "done"]
  - title: Out of scope
    rows:
      - ["npm package", "—", "later"]
```

Frames use Quartz's `--light` CSS variable for their background and title cutout, `--darkgray` for bright/default text, and `--dark` for muted text, tracks, captions, and borders. They do not impose a black or white surface, so graphs blend into the active Quartz light or dark theme.

Reusable adapters from the original ASCII implementation are exported for integrations: frame utilities (`frameAscii`, `fillTrack`, `col`, and related helpers), graph glyph utilities (`glyphScale`, `sparkGlyphs`, `meterTrack`, and `miniBars`), the canonical example type catalog, and the light/dark accent catalog. The Quartz renderer consumes the same helpers, so these exports and fenced graphs share behavior.

The normative syntax and profile specification is [markdown-graph-blocks-spec.md](markdown-graph-blocks-spec.md).

Permissive mode preserves unknown profiles as framed source and reports diagnostics. Strict mode upgrades unknown profiles and attributes to errors and falls back to source rendering when semantic validation fails. Diagnostics are attached to `file.data.mdGraphsDiagnostics`; the graph node, raw source, annotations, attributes, and diagnostics are retained as `node.data.graph`.
