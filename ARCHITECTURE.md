# Architecture

`MdGraphs` is a Quartz 5 transformer with three deliberately separate layers:

1. `src/parser.ts` recognizes graph metadata, preserves raw source, extracts annotations, applies resource limits, and returns structured diagnostics.
2. `src/render.ts` maps supported profiles to text-first ASCII drawings and emits safe HAST nodes. It never evaluates graph source or generates executable code.
3. `src/transformer.ts` connects those layers to remark/rehype, attaches graph data and diagnostics, supplies the shared frame theme, and preserves ordinary Markdown behavior.

Unknown profiles and strict-invalid graphs use an opaque framed-source fallback. All content reaches HTML as HAST text nodes, so the downstream HTML renderer performs escaping.

The dashed frame, title treatment, typography, and color variables are shared across profiles. Semantic renderers only decide layout and which marks are accents. `mono`, `duo`, and `multi` palettes rotate CSS color classes without changing the parsed data.
