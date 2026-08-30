# Markdown Graph Blocks (`graph/*`)
## and the Renderer Implementation Specification

**Status:** Draft v0.1  
**Purpose:** Define a backward-compatible Markdown extension for semantic graphs, charts, structured visualizations, and graph-like UI primitives without introducing new globally significant Markdown punctuation.

# Part I — Examples Showcase

### 1. Design goals lets test this

Markdown Graph Blocks use standard fenced code blocks and namespace graph types through the code-fence info string. Three backticks then on the same line directly after those 3 backticks  should be a `graph/<type> [attributes]` codeblock language, the body, then the closing 3 backticks.

## 2. graph/table

```graph/table title="WHAT THE RESEARCH COSTS"
headers:
  - Agent
  - Tokens
  - Tool calls
  - Time
rows:
  - ["Inks and paper", "115,207", "120", "16m"]
  - ["Overprint and drift", "135,218", "164", "16m"]
  - ["Naming the patterns", "186,716", "112", "18m"]
footer:
  - Total
  - 437,141
  - 396
  - ~50m
align:
  - left
  - right
  - right
  - right
```

```graph/table title="WHAT THE RESEARCH COSTS"
headers: ["Decision", "Reason"]
align:
  - left
  - left
rows:
  - ["ease-out on enter", "feels snappier"]
  - ["180ms, not 400ms", "feels faster, more responsive"]
  - ["springs for gestures", "they carry your momentum"]
  - ["scale 0.97 on press", "it makes the UI feel alive"]
  - ["no animation at all", "you open it hundreds of times"]
```


## 3. `graph/sheet`

```graph/sheet title="RFC"
headers: ["Item", "Owner", "Status"]
align:
  - left
  - left
  - left
sections:
  - title: Scope
    rows:
      - ["CLI copies files", "priya", "done"]
      - ["Docs previews", "jon", "now"]

  - title: Out of scope
    rows:
      - ["npm package", "—", "later"]
      - ["Figma kit", "—", "later"]
```

```graph/sheet title="SURFACE"
headers: ["Name", "Kind", "Stable"]
align:
  - left
  - left
  - right
sections:
  - title: Frame
    rows:
      - ["Graph", "primitive", "yes"]
      - ["GraphBody", "primitive", "yes"]

  - title: Charts
    rows:
      - ["GraphTable", "component", "yes"]
      - ["GraphSheet", "component", "new"]
```

## 4. `graph/flow`

```graph/flow  title="OPTIMISTIC UI"
nodes:
  - label: tap
  - label: server
  - label: update
nodes:
  - label: tap
  - label: update
    tone: accent
  - label: server syncs
    stretch: true
    tone: muted
```

```graph/flow title="PUBLISH PATH"
nodes:
  - label: write
  - label: review
  - label: ship
```

---

## 5. `graph/bars`

```graph/bars title="THROUGHPUT"
from:
  label: before
  values: [3, 4, 8, 3]

to:
  label: after
  size: lg
  values: [4, 7, 13, 4]
palette: duo
processor: -> ->
```

```graph/bars title="THROUGHPUT"
before: [3, 4, 8, 3]
after:  [4, 7, 13, 4]

processor: -> edit ->
```

---

## 6. `graph/rank`

```graph/rank title="ROUTES"
items:
  - label: /docs
    value: 12400
  - label: /install
    value: 4100
  - label: /plot
    value: 860
  - label: /rank
    value: 420
```

```graph/rank title="COVERAGE"
max: 100
items:
  - label: frame
    value: 100
    display: "100%"
  - label: plot
    value: 82
    display: "82%"
  - label: invoice
    value: 41
    display: "41%"
```

---

## 7. `graph/cells`


```graph/cells title="TWO WAYS TO LEARN"
- label: fragments
  cells:
    - [1, 0, 1, 0, 0]
    - [0, 1, 0, 1, 0]
    - [1, 0, 0, 0, 1]

- label: a system
  cells:
    - [1, 1, 1, 1, 1]
    - [1, 1, 1, 1, 1]
    - [1, 1, 1, 1, 1]
```

```graph/cells title="COVERAGE"
- label: this week
  cells:
    - [1, 1, 1, 1, 1]
    - [1, 1, 1, 1, 1]
    - [1, 1, 1, 1, 1]
```

```graph/cells title="COVERAGE"
- label: this work month
  cells:
    - [1, 1, 1, 1, 1]
    - [1, 1, 1, 1, 1]
    - [1, 1, 1, 1, 1]
    - [1, 1, 1, 1, 0]
  color: accent3
```

---

## 8. abc `graph/meter`


```graph/meter title="SHIPPED"
value: 0.73
label: characters, not a progress bar
```

```graph/meter title="COVERAGE"
value: 0.92
ticks: 10
label: tests passing
```

```graph/meter title="BLUE OVERFLOW"
value: 0.73
ticks: 20
label: characters, not a progress bar
glyphs: shade
color: accent3
```


---

## 9. `graph/spark`


```graph/spark title="LATENCY"
data:
  - [2, 3, 4, 3, 6, 5, 8, 7, 9, 6, 10, 8]
label: last point is accent
```


```graph/spark title="REQUESTS"
data:
  - [4, 4, 5, 3, 6, 8, 7, 9, 8, 6, 5, 7]
label: last twelve deploys
```

```graph/spark title="REQUESTS"
data:
  - [4, 4, 5, 3, 6, 8, 7, 9, 8, 6, 5, 7]
label: last twelve deploys
color: accent2
```



---

## 10. `graph/tree`


```graph/tree title="COMPILER"
nodes:
  - label: registry/default
    children:
      - label: graph-frame
        children:
          - label: graph-frame.tsx
            meta: ui
          - label: graph-motion.ts
            meta: lib

      - label: graph-tree
        children:
          - label: graph-tree.tsx
            meta: ui
            color: accent
```


```graph/tree title="ON CALL"
nodes:
  - label: platform
    children:
      - label: api
        meta: priya
      - label: workers
        meta: jon
        color: accent3
      - label: edge
        meta: mina
```

---

## 11. `graph/timeline`


```graph/timeline title="RELEASE"
events:
  - date: "Mar 12"
    label: CLI copies the files
    color: muted
  - date: "Mar 18"
    label: Docs, live previews
    color: accent2
  - date: "Apr 02"
    color: muted
    label: Registry listed
```


```graph/timeline title="INCIDENT"
events:
  - date: "14:02"
    label: p95 crossed 800ms
  - date: "14:11"
    label: rolled back the cache flag
    color: accent
  - date: "14:40"
    color: muted
    label: write the postmortem
```

---

## 12. `graph/check`

```graph/check
items:
  - label: freeze tokens
    done: true
  - label: ship registry json
    done: true
  - label: write the postmortem
    note: still open
```

```graph/check
items:
  - label: title is a sentence
    done: true
  - label: numbers are tabular
    done: true
  - label: motion respects reduced
    note: check the timer
```

```graph/check title="SYMCOLOR"
items:
  - label: title is a sentence
    done: true
    symbol: ✓
    color: accent3
  - label: numbers are tabular
    done: true
    symbol: 🗸
  - label: fm
    done: true
    symbol: 🗹
    color: ink
  - label: motion respects reduced
    note: check the timer
```

---

## 13. `graph/stack`

```graph/stack title="TRAFFIC"
rows:
  - label: marketing
    segments:
      - label: js
        value: 48
      - label: css
        value: 22
        color: accent2
      - label: images
        value: 30
        color: accent3

  - label: docs
    segments:
      - label: js
        value: 28
      - label: css
        value: 18
      - label: images
        value: 54
```

```graph/stack title="TRAFFIC"
ticks: 28
rows:
  - label: week
    segments:
      - label: prompt
        value: 61
      - label: completion
        value: 27
      - label: cached
        value: 12
corner: ◆
```


---

## 14. `graph/funnel`


```graph/funnel title="INSTALL"
steps:
  - label: docs
    value: 12400
    display: "12,400"
  - label: copy
    value: 4100
    display: "4,100"
  - label: ship
    value: 860
    display: "860"
```

```graph/funnel title="SIGNUP"
ticks: 16
steps:
  - label: visit
    value: 8000
    display: "8,000"
  - label: start
    value: 2400
    display: "2,400"
  - label: verify
    value: 960
    display: "960"
  - label: paid
    value: 180
    display: "180"
```

```graph/funnel title="SIGNUP"
ticks: 16
steps:
  - label: visit
    value: 8000
    display: "8,000"
  - label: start
    value: 2400
    display: "2,400"
  - label: verify
    value: 960
    display: "960"
  - label: paid
    value: 180
    display: "180"
stage: visit
```

Source order defines funnel stage order.

---

## 15. `graph/gantt`


```graph/gantt title="LAUNCH"
stage: build
progress: 0.58
ticks: [q1, q2, q3, q4]
items:
  - label: design
    start: 0
    end: 0.35
    complete: 1
  - label: build
    start: 0.2
    end: 0.75
    complete: 0.55
  - label: docs
    start: 0.55
    end: 0.9
    complete: 0.2
  - label: ship
    start: 0.85
    end: 1
    complete: 0
```


```graph/gantt title="THIS WEEK"
columns: 20
ticks: [mon, wed, fri]
items:
  - label: rfc
    start: 0
    end: 0.4
    color: accent
  - label: patch
    start: 0.35
    end: 0.8
  - label: review
    start: 0.7
    end: 1
```

```graph/gantt title="THIS WEEK"
columns: 20
ticks: [mon, wed, fri]
items:
  - label: rfc
    start: 0
    end: 0.4
    color: accent
  - label: patch
    start: 0.35
    end: 0.8
  - label: review
    start: 0.7
    end: 1
stage: review
```

---

## 16. `graph/plot`


```graph/plot title="P95"
data: [2, 3, 3, 5, 4, 7, 6, 8, 5, 9, 7, 6]
labels:
  - jan
  - dec
```

```graph/plot title="ERRORS"
data: [1, 1, 4, 2, 8, 3, 2, 1, 5, 2]
labels:
  - mon
  - fri
progress: 0.7
height: 5
variant: line
```

---

## 17. `graph/waffle`


```graph/waffle title="COVERAGE"
value: 0.73
label: 73 of 100 tests green
```

```graph/waffle title="QUOTA"
value: 0.4
cells: 40
columns: 8
label: seats used
```

```graph/waffle title="QUOTA"
value: 0.2
cells: 20
columns: 4
label: testr
color: accent3
```

```graph/waffle title="QUOTA"
value: 0.2
cells: 20
columns: 4
label: testr
color: #aa1100
```

---

## 18. `graph/diff`


```graph/diff title="BUNDLED"
rows:
  - label: vendor
    value: "84 kb"
  - label: app
    value: "31 kb"
    color: accent
    type: add
  - label: sourcemaps
    value: "12 kb"
    color: accent3
    type: remove

footer:
  label: shipped
  value: "103 kb"
```

```graph/diff title="HEADCOUNT"
rows:
  - label: start
    value: "12"
  - label: hired
    value: "3"
    color: accent
    type: add
  - label: left
    value: "1"
    color: muted
    type: remove

footer:
  label: now
  value: "14"
```


```graph/diff title="CTHING"
rows:
  - label: start
    value: "12"
    type: remove
  - label: hired
    value: "3"
    color: accent
    type: remove
  - label: left
    value: "1"
    color: muted
    type: remove

footer:
  label: now
  value: "-14"
  color: #aa1100
  type: remove
```


---

## 19. `graph/invoice`


```graph/invoice title="INVOICE #1042"
from:
  name: markdown graphs
  lines:
    - kshv.me
    - GSTIN 29AXXXXX1234Z5
to:
  name: Acme Studio
  lines:
    - 14 Market Street
    - San Francisco, CA
meta:
  - label: No.
    value: "0041"
  - label: Issued
    value: Mar 12, 2026
  - label: Due
    value: Apr 11, 2026
items:
  - description: Design system
    qty: "1"
    rate: "4,200"
    amount: "4,200"
  - description: Motion pass
    qty: "1"
    rate: "1,800"
    amount: "1,800"
  - description: Docs rewrite
    qty: 8h
    rate: "180"
    amount: "1,440"
totals:
  - label: Subtotal
    value: "7,440"
  - label: Tax
    value: "0"
  - label: Amount due
    value: "7,440"
    color: accent
note: Net 30. Wire to the account on file.
```

```graph/invoice title="QUOTE"
from:
  name: markdown graphs
to:
  name: Northwind
meta:
  - label: Valid until
    value: May 01
items:
  - description: Registry install
    amount: "0"
  - description: Custom graph
    amount: "2,400"
totals:
  - label: Estimate
    value: "2,400"
    color: accent
```

---

## 20. `graph/compare`


```graph/compare title="PLANS"
columns: [Solo, Studio]
accent: Studio
rows:
  - label: Registry
    values: [true, true]
  - label: Accent picker
    values: [true, true]
  - label: Private source
    values: [false, true]
  - label: Price
    values: ["$0", "$24"]
```

```graph/compare title="RENDER"
columns: [Mermaid, SVG, This]
accent: This
rows:
  - label: Source
    values: [".md", ".svg", ".tsx"]
  - label: In git
    values: [true, false, true]
  - label: Themable
    values: [false, false, true]
```

where color: changes the column accent: color.
```graph/compare title="RENDER"
columns: [Mermaid, SVG, This]
accent: This
color: accent3
rows:
  - label: Source
    values: [".md", ".svg", ".tsx"]
  - label: In git
    values: [true, false, true]
  - label: Themable
    values: [false, false, true]
```


---

## 21. `graph/matrix`


```graph/matrix title="DETECT"
columns: [Pos, Neg]
accent: Pos
rows:
  - label: Pos
    values: [41, 3]
  - label: Neg
    values: [2, 54]
```

```graph/matrix title="P95"
columns: [iad, sfo, nrt]
accent: write
rows:
  - label: read
    values: [12, 18, 41]
  - label: write
    values: [28, 33, 67]
  - label: queue
    values: [4, 6, 9]
```

```graph/matrix title="P95 W/ accent3 instead of default accent"
columns: [iad, sfo, nrt]
accent: write
color: accent3
rows:
  - label: read
    values: [12, 18, 41]
  - label: write
    values: [28, 33, 67]
  - label: queue
    values: [4, 6, 9]
```


---

## 22. `graph/stat`

```graph/stat title="THIS WEEK"
items:
  - value: "12,400"
    label: docs
  - value: "4,100"
    label: copies
  - value: "860"
    label: shipped
    color: accent
```

```graph/stat title="P95"
items:
  - value: "142ms"
    label: read
    hint: "−18ms"
  - value: "410ms"
    label: write
    hint: "+22ms"
    color: accent
```

```graph/stat title="P95"
items:
  - value: "142ms"
    label: read
    hint: "−18ms"
  - value: "410ms"
    label: write
    hint: "+22ms"
    color: #191
```

---

## 23. `graph/kpi`


```graph/kpi title="READS"
value: "12,400"
label: this week
hint: "+18%"
data: [4, 5, 5, 6, 8, 7, 9, 8, 11, 10, 12, 14]
```

```graph/kpi title="P95"
value: "142ms"
label: read
hint: "−18ms"
data: [8, 7, 9, 6, 5, 7, 4, 5, 3, 4, 3, 2]
```


```graph/kpi title="P95 W/ accent2"
value: "142ms"
label: read
hint: "−18ms"
data: [8, 7, 9, 6, 5, 7, 4, 5, 3, 4, 3, 2]
color: accent2
```

---

## 24. `graph/spec`


```graph/spec title="SYSTEM"
rows:
  - label: Family
    value: Geist Mono
  - label: Size
    value: "14 / 21"
  - label: Tracking
    value: "+0.02em"
  - label: Figures
    value: tabular
  - label: Accent
    value: --graph-accent
    color: accent
  - label: Duo
    value: --graph-accent-2
  - label: Tri
    value: --graph-accent-3
```


```graph/spec title="SYSTEM"
rows:
  - label: Name
    value: A. Rao
  - label: City
    value: Bengaluru
  - label: Carrier
    value: Delhivery
  - label: ETA
    value: Thu
    color: accent
```

---

## 25. `graph/activity`


```graph/activity title="COMMITS"
days:
  activityDays: [2025-09-01, 371]
```
 is the same as:

```graph/activity title="COMMITS"
days:
  - { date: "2026-09-01", count: 12 }
  - { date: "2026-09-02", count: 0 }
  - { date: "2026-09-03", count: 0 }
  - { date: "2026-09-04", count: 3 }
  - { date: "2026-09-05", count: 0 }
  - { date: "2026-09-06", count: 0 }
```


```graph/activity title="SHIPPED"
weekStartsOn: 1
glyphs: ascii
days:
  activityDays: [2026-06-01, 91]
label: Jun – Aug
```

```graph/activity title="SHIPPED"
weekStartsOn: 1
glyphs: ascii
days:
  activityDays: [2026-06-01, 91]
label: Jun – Aug
color: accent2
inkFrom: 1
accentFrom: 7
```


---

## 26. `graph/heatmap`


```graph/heatmap title="DEPLOYS"
columns: ["0", "4", "8", "12", "16", "20"]
rows:
  - label: Mon
    values: [0, 1, 4, 8, 6, 1]
  - label: Tue
    values: [0, 0, 5, 9, 4, 2]
  - label: Wed
    values: [1, 0, 6, 12, 5, 1]
  - label: Thu
    values: [0, 2, 4, 7, 8, 3]
  - label: Fri
    values: [0, 1, 3, 5, 2, 0]
  - label: Sat
    values: [0, 0, 1, 0, 0, 0]
  - label: Sun
    values: [0, 0, 0, 1, 0, 0]
```


```graph/heatmap title="TESTS"
max: 10
legend: false
colorScale: [muted, muted, ink, accent]
columns: [a, b, c, d]
rows:
  - label: auth
    values: [10, 8, 4, 2]
  - label: billing
    values: [6, 10, 7, 1]
  - label: docs
    values: [2, 3, 9, 8]
```

```graph/heatmap title="HM"
max: 10
legend: false
columns: [a, b, c, d]
rows:
  - label: auth
    values: [10, 8, 4, 2]
  - label: billing
    values: [6, 10, 7, 1]
  - label: docs
    values: [2, 3, 9, 8]
```

---

## 27. `graph/calendar`


```graph/calendar title="AUGUST 2026"
year: 2026
month: 8
today: 27
marks: [12, 18, 27]
```

```graph/calendar title="SHIP WEEK"
year: 2026
month: 3
weekStartsOn: 0
marks:
  - day: 12
    color: accent
  - day: 18
```


```graph/calendar title="AUGUST 2027?!"
year: 2026
month: 8
today: 27
marks: [12, 18, 27]
color: accent3
```


---

## 28. `graph/waterfall`


```graph/waterfall title="REVENUE"
items:
  - label: Revenue
    value: 48
    color: ink
  - label: Refunds
    value: -6
    color: accent2
  - label: Hosting
    value: -4
    color: accent2
  - label: Profit
    value: 38
    color: accent
```

```graph/waterfall title="REVENUE"
items:
  - label: Start
    value: 12
    kind: start
    color: ink
  - label: Hired
    value: 4
    kind: in
    color: accent
  - label: Left
    value: 2
    kind: out
    color: muted
  - label: Now
    value: 14
    kind: end
    color: accent
```


---

## 29. `graph/uptime`


```graph/uptime title="API"
from: Jun 1
to: Aug 29
days:
  statusDays:
    length: 90
    down: [41, 42]
    degraded: [18, 60]
    default: ok
```

```graph/uptime title="WEBHOOKS"
from: Mon
to: Fri
days: [ok, ok, ok, degraded, ok, empty, empty, ok, down, ok, ok, ok]
```

---

## 30. `graph/slope`


```graph/slope title="TRAFFIC"
fromLabel: "2025"
toLabel: "2026"
items:
  - label: docs
    from: 8200
    to: 12400
    color: accent
  - label: copy
    from: 5100
    to: 4100
    color: accent2
  - label: ship
    from: 640
    to: 860
    color: accent
```

```graph/slope title="P95"
fromLabel: before
toLabel: after
items:
  - label: read
    from: 160
    to: 142
    color: muted
  - label: write
    from: 388
    to: 410
    color: accent
  - label: cache
    from: 12
    to: 12
    color: ink
```

---

## 31. `graph/bullet`

```graph/bullet title="BUDGET"
items:
  - label: Design
    value: 42
    target: 40
  - label: Motion
    value: 18
    target: 24
  - label: Docs
    value: 9
    target: 12
```

```graph/bullet title="LOAD"
items:
  - label: CPU
    value: 72
    target: 80
    max: 100
  - label: RAM
    value: 34
    target: 64
    max: 100
  - label: SSD
    value: 91
    target: 90
    max: 100
```


```graph/bullet title="LOAD"
items:
  - label: CPU
    value: 72
    target: 80
    max: 100
  - label: RAM
    value: 34
    target: 64
    max: 100
  - label: SSD
    value: 91
    target: 90
    max: 100
    color: accent3
```

---

## 32. `graph/timer`



```graph/timer title="INCIDENT"
kind: elapsed
at: "2026-08-27T08:00:00Z"
caption: api
units: [days, hours, minutes, seconds]
```

```graph/timer title="INCIDENT"
kind: elapsed
at: "2026-08-27T08:00:00Z"
caption: api
units: [days, hours, minutes, seconds]
timeFormat: 12
```

```graph/timer title="SHIPPED"
kind: ago
at: "2026-08-27T12:00:00Z"
caption: last deploy
units: [days]
```

```graph/timer title="LOFI"
title: LOCAL
kind: clock
```

```graph/timer title="LOCAL · 24H"
kind: clock
color: accent3
timeFormat: 24
```

```graph/timer title="LOCAL · 12H"
kind: clock
color: accent2
timeFormat: 12
```

---

## 33. `graph/countdown`

```graph/countdown title="blah"
to: "2027-01-01T00:00:00Z"
done: open
caption: until launch
```

```graph/countdown title="blah"
to: "2020-01-01T00:00:00Z"
done: closed
```

---

## 34. `graph/frame`

`frame` can be supported as a graph profile:


```graph/frame title="TASTE, EXPLAINED"
content: Content goes inside the frame.
caption: Same dashed border as the other graphs
```

```graph/frame title="TASTE, EXPLAINED"
content:
  - Build complete
  - Tests passing
  - Deploy pending
```

```graph/frame
content:
  - text: Build complete
    color: accent
  - text: Tests passing
    color: accent3
  - text: Deploy pending
    color: muted
caption: Last checked two minutes ago.
```

```graph/frame
content:
  - Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production Production
  - text: Degraded
    color: accent2
  - Investigating
```

---


<!-- TODO:...
## 35. `graph/line`

TODO: like the other charts but a line chart ie. heres a simplified version you can pretty up to style more like the others:

    98 │                          *********                 
       │                          |        |                
       │                          |        |                
       │                          |        |                
       │                          |        |                
       │                          |        *********        
    70 │         *********        |                 |       
       │         |        |       |                 ********
       │         |        |       |                         
       │         |        ********                          
       │         |                                          
    42 │*********                                           
       └────────────────────────────────────────────────────


## 36. `graph/scatter`

TODO: like the other charts but a line chart ie. heres a simplified version you can pretty up to style more like the others:

    98 │                               ·                    
       │                                                    
       │                                                    
       │                                                    
       │                                                    
       │                                         ·          
    70 │          ·                                         
       │                                                   ·
       │                                                    
       │                    ·                               
       │                                                    
    42 │·                                                   
       └────────────────────────────────────────────────────
        0                                                  5 -->
