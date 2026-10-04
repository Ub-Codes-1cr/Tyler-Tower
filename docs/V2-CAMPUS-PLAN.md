# Tyler Tower v2 — the radial campus

A spatial re-architecture only. The data, the logic, the 20 divisions, the 317 agents,
the hover popup, the chat and the task rail all stay exactly as they are. What changes is
**where things stand**.

## Why the room has to be re-engineered

The current positions in `src/data.js` are hand-placed. They produce real collisions, not
just tight packing:

| Pair | Centre distance | Needs | Verdict |
|---|---|---|---|
| product / spatial-computing | 18.0 | 20.0 | **overlapping** |
| game-development / marketing | 32.2 | 30.0 | 2.2 clearance |
| security / support | 34.0 | 30.0 | 4.0 clearance |
| engineering / specialized-a | 40.3 | 34.0 | 6.3 clearance |

And the 26 walkways all aimed at roughly the same point, which is why the screenshots read as a
starburst rather than a campus.

Hand-placing 26 platforms that must never touch is not maintainable. So the layout is
**generated** instead, and a probe proves the result.

## The four rules the layout must satisfy

1. **No collisions.** Every platform's footprint is clear of every other by at least
   `CLEARANCE` world units, proven by separating-axis test on the oriented rectangles.
2. **A moat.** Nothing stands within `MOAT` of the Brain's slab.
3. **One skybridge each.** Every platform gets exactly one arched skybridge from its near
   edge onto a command ring around the Brain. The arches fly, so they clear every plinth,
   desk, tag and each other — proven in 3D, not in plan view.
4. **Everything visible.** One frame shows the Brain, all 20 divisions and every agent.

## The layout

```
                     ring 3 — OUTER      r = 164   10 divisions
                ┌───────────────────────────────────────┐
                │  the largest benches (square grids,   │
                │  up to 8×8, every seated citizen desks)│
                │   ┌───────────────────────────────┐   │
                │   │   ring 2 — MID      r = 103   │   │
                │   │   smaller benches (up to 3×3) │   │
                │   │   ┌───────────────────────┐   │   │
                │   │   │ ring 1 — INNER  r = 60│   │   │
                │   │   │  6 DEPARTMENTS      │   │   │
                │   │   │   ┌───────────────┐   │   │   │
                │   │   │   │  ◉ THE BRAIN  │   │   │   │
                │   │   │   │ command rings │   │   │
                 │   │   │  r 10 / 13/16 │   │   │   │
                │   │   │   └───────────────┘   │   │   │
                │   │   └───────────────────────┘   │   │
                │   └───────────────────────────────┘   │
                └───────────────────────────────────────┘
                     moat r = 24 — crossed only by skybridges
```

**Ring 1 · departments (6).** Radius 60, 60° apart, phase 3°. Unchanged in size — they are the
reference and their seat grid is untouched. The phase guarantees no department shares a hub
angle with a bench.

**Ring 2 · mid benches (10).** Radius 103, 36° apart, phase 18°. Small benches: 1–8 seats.

**Ring 3 · outer benches (10).** Radius 164, 36° apart, phase 6°. The large ones — engineering
is 8×8 with all 64 seats on the floor.

Pods are split between rings 2 and 3 **by footprint**, largest first into ring 3. All three
phases are proven distinct by `campus-calc.mjs` (closest hub angles: 3.0°).

## Sizing rule

The grid scales in **both axes** so a big division gets a roughly square platform, never a
stadium: columns = clamp(round(√(seats × 1.1)), 3, 8), rows = ceil(seats / cols). Cell pitch
6.2 × 5.4 with a 2.2 margin. Result: 262 seated citizens + 35 roster agents = **297 bodies**,
up from 211. Every seated citizen gets a desk; the 20 standing citizens stay reachable via
roster, hover and search.

## Connection: three command rings and 26 arched skybridges

Each tier lands on its own concentric command ring around the Brain, so a corridor is
platform → skybridge → ring → Brain, one unbroken chain with no floating ends:

| Tier | Ring radius | Apex | Corridors |
|---|---|---|---|
| departments | 10 | 8.5 | 6 |
| mid benches | 13 | 13 | 10 |
| outer benches | 16 | 17.5 | 10 |

**Why they fly.** 26 ground-level corridors converging on one small centre cannot be
threaded between two crowded rings — the first attempt cleared the platforms by 0.57u and
was rejected. Arches make plan-view collision impossible by construction: the causeway is
at its tier's apex wherever it is over a platform.

**Why the shape is flat-topped, not a plain arch.** A quadratic bezier's height is
`4A·t(1-t)`, so it is still only half-apex a quarter of the way along — exactly where it
would clip the neighbouring platform it just departed. The shipped profile
(`skyHeight` in `src/builders.js`) holds the ground for the first and last 12% of the run,
eases to full apex, runs level across the middle, and eases down. The horizontal path is
still a quadratic, so the shape reads as a level causeway on a curve.

**Three rings instead of one.** Two corridors may legitimately arrive at the same angle;
putting them on different rings separates them radially as well as by height.

Each platform's arrival angle is a per-platform `swirl` (solved in `scripts/campus-calc.mjs`,
stored on `BENCH_PODS` and `LAYOUT`). The solver spreads arrivals, then does a joint
worst-pair search, because single-corridor moves cannot escape a mutual conflict.

## Hierarchy inside a division

Each bench gets a **command node** — a plinth with its division's label — and a thin
conduit from that node out to each of its desks. The chain reads:

```
THE BRAIN  →  20 DIVISION COMMAND NODES  →  317 AGENTS
```

Agents never connect to the Brain directly.

## What does not change

- `src/data.js` values for counts, labels, colours, divisions, desk counts
- `src/bench-data.js` and all 282 citizens
- the hover popup, raycasting, click routing
- the rail: roster, chat, task plate, DEPLOY
- the task panel, board, calendar, Brain graph
- all keyboard behaviour

## Verification

`scripts/campus-probe.mjs` asserts, numerically:

1. 20 bench platforms + 6 departments + 1 Brain exist
2. **zero** overlapping platform pairs, minimum 9-unit clearance (351 pairs tested)
3. every platform is outside the 24-unit moat
4. every platform grid fits its desk count; 263 seated citizens + 35 roster = 298 bodies
5. one frame shows everything (`fitOverviewZoom` covers the campus radius)
6. hover, click, roster, chat and deploy still work end to end (`campus-shot.mjs` proves
   the quiet rule holds on the new layout: 0 badges, 0 pills, rail closed, 0 errors)

`scripts/campus-curves.mjs` asserts the skybridges, in 3D, against the same math
`src/main.js` runs (8/8):

1. 26 corridors built
2. every corridor lands on its own tier's command ring
3. every arch clears every platform it does not belong to — outside the footprint
   horizontally, or at least 6u above it
4. no two corridor centrelines come within 1.5u of each other in 3D (closest pair: 1.81u)
5. arrivals spread on all three rings (no bunching at one arc)
6. every corridor actually flies (apex above 6u) — none is a flat ground ribbon

Plus `npm run check`, the seven existing probes, `state-wait.mjs` (state-based waits for the
timing-sensitive smoke checks) and `dogfood.mjs` (12-step live journey: 12/12).

Current tallies: campus-probe 19/19, campus-curves 8/8, ui-probe 100/100, soak 58/58,
state-wait 8/8, dogfood 12/12.

## Deferred

**The 19 unseated citizens.** All 282 citizens still load and every one of them is reachable
through hover, the roster and search, but only 263 have a desk and a body, so the scene draws
298 of the 317 roster entries. Giving the remaining 19 a body needs 19 more desks, which means
resizing platforms and re-proving clearance — a data-scale change, not a routing one.