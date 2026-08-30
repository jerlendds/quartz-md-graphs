import type { Element, Root as HastRoot, Text } from "hast";
import type { Code, Root as MdastRoot } from "mdast";
import type { Plugin, PluggableList } from "unified";
import { visit } from "unist-util-visit";
import type { QuartzTransformerPlugin } from "@quartz-community/types";
import type { GraphNode, GraphPalette, MdGraphsOptions } from "./types";
import { renderGraphBody, supportedGraphTypes } from "./render";
import { defaultGraphLimits, parseGraphFence, parseInfoAttributes } from "./parser";
import {
  defaultAccents,
  graphPalettes,
  paletteAccents,
  paletteDarkAccents,
  paletteMode,
} from "./palettes";

const defaultOptions: MdGraphsOptions = {
  accentColor: defaultAccents[0],
  accentColor2: defaultAccents[1],
  accentColor3: defaultAccents[2],
  frame: "ascii",
  palette: "duo",
  strict: false,
  limits: defaultGraphLimits,
};

const graphCss = (accents: readonly string[]) =>
  `.md-graph {
    --graph-accent-light:${accents[0]};
    --graph-accent-2-light:${accents[1]};
    --graph-accent-3-light:${accents[2]};
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
    --md-graph-ink:var(--darkgray, #d7d7d7);
    --md-graph-muted:var(--dark, #777);
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
    content: "▶";
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
    content: "▶";
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
}`
    .replace(/\n\s*/g, "")
    .replace(/\s*{/g, "{");

const meterScrollScript = `document.addEventListener("wheel", (event) => {
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

const timerScript = `(() => {
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

const countdownScript = `(() => {
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

export function parseGraphMeta(meta = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(parseInfoAttributes(meta).attributes).map(([key, value]) => [
      key,
      String(value),
    ]),
  );
}

const text = (value: string): Text => ({ type: "text", value });

const bodyOptions = (source: string): Record<string, string> =>
  Object.fromEntries(
    source.split(/\r?\n/).flatMap((line) => {
      const match = /^\s*(accent|accent2|accent3|palette|glyphs|corner)\s*:\s*(.+?)\s*$/i.exec(
        line,
      );
      return match?.[1] && match[2] ? [[match[1].toLowerCase(), match[2]]] : [];
    }),
  );

const safeCssColor = (value: string | undefined, fallback: string): string => {
  const color = value?.trim().replace(/;+\s*$/, "") ?? "";
  return color && !/[;{}<>]/.test(color) ? color : fallback;
};

const graphElement = (node: Code, graph: GraphNode, options: MdGraphsOptions): Element => {
  const type = node.lang!.slice("graph/".length);
  const attrs = Object.fromEntries(
    Object.entries(graph.attributes).map(([key, value]) => [key, String(value)]),
  );
  const bodyTitle = /^\s*title\s*:\s*(.+?)\s*$/im
    .exec(node.value)?.[1]
    ?.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
  const title =
    type === "timer" && bodyTitle
      ? bodyTitle
      : type === "frame"
        ? (attrs.title ?? "")
        : attrs.title || type;
  const body = bodyOptions(node.value);
  const requestedPalette = (body.palette || attrs.palette || options.palette).toLowerCase();
  const palette = (
    ["solid", "mono", "duo", "trio", "multi", ...Object.keys(graphPalettes)].includes(
      requestedPalette,
    )
      ? requestedPalette
      : options.palette
  ) as GraphPalette;
  const configuredAccents = [
    options.accentColor,
    options.accentColor2,
    options.accentColor3,
  ] as const;
  const presetAccents = paletteAccents(palette, configuredAccents);
  const presetDarkAccents = paletteDarkAccents(palette, configuredAccents);
  const accentIsData = type === "stack" || type === "compare" || type === "matrix";
  const accents = [
    safeCssColor(accentIsData ? undefined : body.accent, presetAccents[0]),
    safeCssColor(body.accent2, presetAccents[1]),
    safeCssColor(body.accent3, presetAccents[2]),
  ];
  const darkAccents = [
    safeCssColor(accentIsData ? undefined : body.accent, presetDarkAccents[0]),
    safeCssColor(body.accent2, presetDarkAccents[1]),
    safeCssColor(body.accent3, presetDarkAccents[2]),
  ];
  const corner = (body.corner || attrs.corner || "+").replace(
    /^(?:"([\s\S]*)"|'([\s\S]*)')$/,
    "$1$2",
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
      dataPalette: palette,
      dataPaletteMode: paletteMode(palette),
      style: `--graph-accent-light:${accents[0]};--graph-accent-2-light:${accents[1]};--graph-accent-3-light:${accents[2]};--graph-accent-dark:${darkAccents[0]};--graph-accent-2-dark:${darkAccents[1]};--graph-accent-3-dark:${darkAccents[2]}`,
      dataStretch: attrs.stretch === "true" || /^\s*stretch\s*:\s*true\s*$/m.test(node.value),
      ...(attrs.id ? { id: attrs.id } : {}),
      ...(attrs["aria-label"] ? { ariaLabel: attrs["aria-label"] } : {}),
    },
    children: [
      {
        type: "element",
        tagName: "figcaption",
        properties: {
          className: ["md-graph__title", ...(!title ? ["md-graph__title--empty"] : [])],
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["md-graph__title-text"] },
            children: [text(title)],
          },
        ],
      },
      renderGraphBody(
        type,
        node.value,
        palette,
        supportedGraphTypes.includes(type as (typeof supportedGraphTypes)[number]) &&
          !(options.strict && graph.diagnostics.some(({ severity }) => severity === "error")),
        Boolean(body.palette || attrs.palette),
        body.glyphs || attrs.glyphs,
      ),
      ...(attrs.caption
        ? [
            {
              type: "element" as const,
              tagName: "div",
              properties: { className: ["md-graph__caption"] },
              children: [text(attrs.caption)],
            },
          ]
        : []),
      ...["tl", "tr", "bl", "br"].map((position) => ({
        type: "element" as const,
        tagName: "span",
        properties: {
          className: ["md-graph__corner", `md-graph__corner--${position}`],
          ariaHidden: "true",
        },
        children: [text(corner)],
      })),
    ],
  };
};

const remarkMdGraphs =
  (options: MdGraphsOptions): Plugin<[], MdastRoot> =>
  () =>
  (tree, file) => {
    const fileDiagnostics: GraphNode["diagnostics"] = [];
    visit(tree, "code", (node: Code) => {
      if (!node.lang?.startsWith("graph/")) return;
      const graph = parseGraphFence({
        type: node.lang.slice("graph/".length),
        meta: node.meta ?? "",
        value: node.value,
        strict: options.strict,
        limits: options.limits,
      });
      fileDiagnostics.push(...graph.diagnostics);
      const element = graphElement(node, graph, options);
      node.data = {
        ...node.data,
        graph,
        hName: element.tagName,
        hProperties: element.properties,
        hChildren: element.children,
      } as typeof node.data;
    });
    if (fileDiagnostics.length) {
      const data = file.data as typeof file.data & {
        mdGraphsDiagnostics?: GraphNode["diagnostics"];
      };
      data.mdGraphsDiagnostics = [...(data.mdGraphsDiagnostics ?? []), ...fileDiagnostics];
    }
  };

const rehypeGraphCaption: Plugin<[], HastRoot> = () => (tree) => {
  visit(tree, "element", (node: Element) => {
    const graphChild =
      node.tagName === "pre" &&
      node.children.length === 1 &&
      node.children[0]?.type === "element" &&
      Array.isArray(node.children[0].properties.className) &&
      node.children[0].properties.className.includes("md-graph")
        ? node.children[0]
        : undefined;
    if (graphChild) Object.assign(node, graphChild);
    if (
      node.tagName !== "figure" ||
      !Array.isArray(node.properties.className) ||
      !node.properties.className.includes("md-graph")
    )
      return;
    const caption = node.children.find(
      (child): child is Element =>
        child.type === "element" &&
        Array.isArray(child.properties.className) &&
        child.properties.className.includes("md-graph__caption"),
    );
    if (caption && !node.properties.ariaDescribedBy) {
      const id = `${String(node.properties.id || "md-graph")}-caption`;
      caption.properties.id = id;
      node.properties.ariaDescribedBy = [id];
    }
  });
};

export const MdGraphs: QuartzTransformerPlugin<Partial<MdGraphsOptions>> = (userOptions = {}) => {
  const options = {
    ...defaultOptions,
    ...userOptions,
    limits: { ...defaultOptions.limits, ...userOptions.limits },
  };
  return {
    name: "MdGraphs",
    markdownPlugins: (): PluggableList => [remarkMdGraphs(options)],
    htmlPlugins: (): PluggableList => [rehypeGraphCaption],
    externalResources: () => ({
      css: [
        {
          content: graphCss([options.accentColor, options.accentColor2, options.accentColor3]),
          inline: true,
        },
      ],
      js: [
        {
          contentType: "inline",
          loadTime: "afterDOMReady",
          spaPreserve: true,
          script: meterScrollScript,
        },
        {
          contentType: "inline",
          loadTime: "afterDOMReady",
          spaPreserve: true,
          script: timerScript,
        },
        {
          contentType: "inline",
          loadTime: "afterDOMReady",
          spaPreserve: true,
          script: countdownScript,
        },
      ],
      additionalHead: [],
    }),
  };
};
