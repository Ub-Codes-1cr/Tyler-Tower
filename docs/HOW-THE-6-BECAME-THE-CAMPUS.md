# How the 6-department office became a 26-platform campus wired to the Brain

*Reconstructed from the full Tyler Tower / Tyler Tower build session and the shipped code. This is the story of every view in the screenshots: the engineering block with 65 agents at once, the marketing and game-dev blocks with 36 and 20, the campus overview, the Brain graph, and the last frame where the corridors finally connect the divisions to the memory.*

---

## 0. Reading the screenshots first

The nine images are the same product at different zoom levels and different states. Mapping them up front makes the rest of this document concrete:

1. **Overview with the left command rail.** `localhost:4520`, the 26-platform campus, the left icon rail (home · office · tools · documents · tasks · settings), the task panel on the right showing `ALL 192`. This is the *quiet state*: no cards, no labels, no pills — only the living beings and their connections.
2. **The Brain graph, dark.** `THE BRAIN · YOUR NOTES · 350 NOTES · 76 LINKS`. The d3-force wiki-link graph of the vault, opened with `G`. This is the "memory" the divisions write into.
3. **Department focus — Delivery.** The rail docked, the Delivery Lead's chat open, the pod behind it. The six-department layer is unchanged since the upstream product.
4. **Campus overview before the final routing pass.** Twenty-six platforms with long, gently bent spokes converging toward the centre — the state that produced the "starburst" the audit flagged.
5. **Engineering block, zoomed.** The 8×8 grid: **64 desks + 1 standing = 65**, every seat occupied. Hover reads `Engineering · 65 · 6+59`.
6. **Marketing block, zoomed.** The 6×6 grid: **36 desks = 37 with the standing body**, hover `Marketing · 37 · 6+31`.
7. **Emails department pod, focused.** A six-seat department, the original office unit, with its lead at the head.
8. **Campus top-down.** The board-room spread: every division as a platform of rows of desks, seen from above.
9. **The last frame — the connection.** The office with the `EMPLOYEES` panel and a large desk grid; this is where the pieces were joined: platforms → corridors → command ring → Brain.

The rest of this file is how each of those became true.

---

## 1. The starting point: a six-department office

The upstream product (Tyler Tower, Syed Ubada, `v3.2.1-beta.2`) ships **six departments and 35 fixed seats**:

- `emails` (5), `sales` (6), `marketing` (7), `ops` (6), `fin` (4), `delivery` (7)
- Every department has a lead; seats, departments and leads are immutable by design.
- The roster is a merge chain: built-in defaults in `src/data.js` → `office.agents.json` → `<brain>/Tyler Tower/agents.json` → `office.agents.local.json`.
- A task typed into the bar is routed by a Sonnet JSON call to the best agent, which runs a real `claude -p` process and writes a deliverable into the brain.
- The brain is a folder of Markdown with `[[wiki links]]`; `graph-build.mjs` turns it into a force-laid graph baked into `src/braingraph.js` and served at `/api/brain`.
- The scene is built by `src/main.js` (three.js) and `src/builders.js`; the whole thing bundles to one 1.9 MB HTML file.

That is the "normal 6 decks." Everything below is how the fork grew it into a campus of **6 departments + 20 division benches = 26 platforms (27 with the Brain), holding 317 agents**, without rewriting the logic that runs the office.

---

## 2. The persona library: where the extra agents come from

The raw material is `brain/agency-personas/` — a library of **282 specialised personas across 18 divisions**. The division counts are exact and they drive every later decision:

```
engineering 65 · specialized 59 · marketing 37 · game-development 21 · gis 13
security 12 · design 10 · sales 9 · testing 9 · project-management 7 · paid-media 7
support 6 · spatial-computing 6 · academic 6 · product 6 · finance 5 · healthcare 3 · research 1
```

Each persona is a Markdown file (a `description`, workflow, deliverables, rules). The library is vendored into the brain, so it travels with the project.

---

## 3. Converting personas into office skill packs

An agent in this product does not get arbitrary code; it gets a **skill pack**: a folder `aa-<slug>/` with `SKILL.md` (front matter binding it to agents, plus distilled steps and rules) and side files. `scripts/tyler-convert.mjs` does the conversion, honouring the office's size limits (`SKILL.md ≤ 6000` chars, side files `≤ 4000` each / `≤ 8000` total):

1. Read `index.json` and each persona file.
2. Slice the useful sections (`## Workflow Process`, `## Technical Deliverables`, `## Critical Rules`).
3. Emit `SKILL.md` with a trigger line, a "before you write" checklist, the distilled sections, and a binding `agents: [...]` that maps the division to real office seats (`BIND` in the converter).
4. Emit `template.md` (the shape of the finished thing) and `persona.md` (a source excerpt).

The result is **282 skill packs** that the existing `skills.mjs` loader can serve — so the extra agents are, to the office, just more skills bound to seats. No new engine.

---

## 4. The resolver: 282 citizens, 1 function

The clever part is `citizen-agent.mjs`. Instead of 282 agents' worth of code, there is **one function**, `resolveCitizen(id, brainPath)`, which reads the persona index and returns a virtual agent shaped exactly like a roster agent:

```js
{ id, isCitizen: true, name, role, does, department, tools, brief, model, effort }
```

`DIV_DEPT` maps each persona division to an office department and a tool set (e.g. `marketing → ['marketing', ['canva','clarity']]`), so `mcp.promptText` and the whole chat pipeline work unchanged. Because `isCitizen` is true, `serve.mjs` routes citizen chats straight to grounded chat (no routines, no interview), and task attribution is a substring query on `aa-<slug>`. One function, 282 living agents.

---

## 5. Baking the citizens into the single file

`build.mjs` runs **before** esbuild and bakes `brain/agency-personas/citizens.json` into `src/bench-data.js`:

- It applies a **load budget**: descriptions trimmed to 160 chars, greetings to 220, demo replies to 4 rows × 220 — because 282 citizens of full text was ~469 KB the client never shows.
- It also copies `BENCHES.json`, `index.json` and `citizens.json` to `dist/` for offline and http use.

So the "60+ agents at once" are not fetched at runtime; they are compiled into the page.

---

## 6. The data model: how 20 benches become 18 divisions

`src/data.js` gains a `BENCH_PODS` array of **20 bench platforms**. The mapping is deliberate:

- **18 unique divisions** are represented; `specialized` (59 personas) is split across **three** benches (`specialized-a/b/c`) so no single platform has to hold 59 seats.
- Each pod carries `{ id, division, label, color, floor, chip, count, seats, cols, rows, swirl, pos, w, d }`.
- `seats` is the number of desks; `cols`/`rows` define the grid; `w`/`d` are the platform size **derived from the seat count**.

That is why the engineering block is 8×8 (64 desks, 65 personas with one standing) and marketing is 6×6 (36 desks, 37 personas). The hover chip reads `count · a+b` — the total and the seated/standing split.

---

## 7. The geometry problem: 26 platforms that must never touch

Hand-placing 26 platforms produces real collisions — the audit found four, including `product / spatial-computing` overlapping at 18.0 units when 20.0 was needed. So the layout became **generated, not authored**:

- `scripts/campus-calc.mjs` computes the radial campus:
  - **Ring 1** — 6 departments at `r = 60`, 60° apart, phase 3°.
  - **Ring 2** — 10 mid benches at `r = 103`, 36° apart, phase 18°.
  - **Ring 3** — 10 outer benches at `r = 164`, 36° apart, phase 6°.
  - A **moat** of 24 units around the Brain, and a minimum clearance of **9 units** between every pair.
- `scripts/campus-merge.mjs` merges the generated geometry back into the existing pod styling (colors, labels, counts) so nothing is lost, and writes `scripts/out/pods.txt`.
- `scripts/campus-probe.mjs` proves it: **19/19**, zero overlapping pairs across **351 pairs**, minimum clearance 9.0, every platform outside the moat.

The platform sizes are recomputed so the grid "scales in both axes" — `cols = clamp(round(√(seats × 1.1)), 3, 8)`, rows `= ceil(seats/cols)` — which is why every seated agent gets a desk and why the blocks read as near-squares, not stadiums.

---

## 8. The connect problem: from starburst to skybridges

The first connection pass drew each corridor as a straight spoke from the platform's near edge to a single hub point. It worked mathematically — radial spokes from a common centre cannot cross — but visually it was a **starburst**, and the audit filed it as a defect: the connections buried the floor and all aimed at one point.

Two rewrite passes followed:

**Pass 1 — bent corridors.** `makeWalkwayCurve` bent each spoke on a quadratic Bezier toward a **command ring** around the Brain, all bending the same rotational direction (a pinwheel). A `bendControl` point on the angular bisector made corridors leave their platform nearly straight and arrive at the ring tangentially. This cleared plan-view intersections and looked far better — but the verifier then proved the corridors still came within **0.57 units** of foreign platforms at ground level: too close to read or walk.

**Pass 2 — arched skybridges (the shipped design).** Ground-level curves cannot thread 26 corridors between two crowded rings, so the corridors **fly**:

- `makeWalkwayArch(from, via, to, apex)` in `src/builders.js` builds a **flat-topped causeway**: the horizontal path is still a quadratic sweep (the pinwheel), but the vertical profile holds the ground for the first and last 12 % of the run, eases to full apex, and runs level across the middle. A plain quadratic was rejected because its height `4A·t(1−t)` is still only half-apex a quarter of the way along — exactly where it would clip the platform it just left.
- Corridors land on **three nested command rings** at `r = 10 / 13 / 16`, with tiered apices `8.5 / 13 / 17.5`. Two corridors may arrive at the same angle; the different rings separate them radially as well as by height. The annuli are nested (each later ring starts where the previous ends) so no two overlap and z-fight.
- Every platform's arrival angle is a **per-platform `swirl`** solved in `campus-calc.mjs`: a greedy pass spreads arrivals, then a **joint worst-pair search** moves the two worst corridors together, because single-corridor moves cannot escape a mutual conflict.
- `scripts/campus-curves.mjs` verifies the shipped geometry in 3D: 26 corridors land on their tier ring, every arch clears every foreign platform (outside the footprint, or ≥ 6 units above it), no two centrelines come within 1.5 units (closest pair **1.81u**), arrivals spread on all three rings, and every corridor genuinely flies — **8/8**.

This is image 9: `platform → skybridge → command ring → Brain`, one unbroken chain with no floating ends.

---

## 9. Wiring the divisions to the memory

The connection to the memory is not visual — it is the task pipeline:

1. A task routed to a citizen agent runs `claude -p` with that agent's brief, skill pack and lessons.
2. The deliverable is written by `writeNote(task)` to `brain/Tyler Tower/<date> <slug>.md`, with front matter naming the agent, department, tools, skills and (for teams) the pieces.
3. `rebuildGraph()` re-reads the vault and re-lays the wiki-link graph.
4. The page polls and shows the note appear in the graph (image 2: 350 notes, 76 links), and the division's corridor state flips to `done`.

So "connecting the divisions to the memory" means: every bench writes real Markdown into the same vault the Brain draws. The 282 citizens are not decorative; each can produce a grounded note.

---

## 10. The chrome and the quiet rule

The screenshots show a **left command rail** (image 1) rather than the original top bar. That is the V4 "chrome" work: a fixed 72 px rail replaces the top bar, its contents (connectors, models, usage, calendar, approvals, clock) are rehomed into the rail and an on-demand panel, and the always-on task panel becomes toggleable. The governing rule never changed — **at rest the office shows only living beings**: zero badges, zero pills, zero cards. `tickLOD()` enforces it, and one `pointer-events:none` popup explains whatever is under the cursor.

---

## 11. Verification: every claim is a probe

The reason the views are trustworthy is the probe system. The campus is guarded by `campus-probe` (19/19), `campus-curves` (8/8), plus `ui-probe` (100/100), `soak-probe` (58/58), `state-wait` (8/8) and `dogfood` (12/12). Each phase "left a probe behind, so the claim is checkable rather than remembered." The V4 chrome/orb/grid/packet probes exist too, baselined at 10/66, as the target for the next build.

---

## 11.5 Why a block reads as "60+ agents at once"

A bench is not a card with a number on it; it is the same pod language as a department, scaled. `makeBenchPod(pod)` builds:

- a **plinth** (`makePlinth(w, d, floor)`) — a cream slab with the division's pastel floor;
- a **desk grid** laid at a 45° station rotation, `cols × rows` cells, each cell one `makeDesk` + `makeChair` + `makePerson` posed working, plus a screen;
- a **command node** at the platform's outer edge — a pedestal in the division colour — with thin `LineSegments` conduits from the node to every desk, so the hierarchy reads `BRAIN → NODE → DESKS` and no agent wires to the Brain directly;
- a plant or server rack, and a floating **label sprite** with the division name and count.

The grid pitch and the platform size are the same numbers the solver used (`CW ≈ 6.2`, `CD ≈ 5.4`), which is why the desks fill the platform edge to edge with no dead margin and why engineering is an 8×8 square: 64 seats at that pitch need exactly the 54×47.6 footprint the solver produced. That is the mechanical reason a single frame can show **65 engineering agents at once** — the platform was sized to hold them, the grid was computed to fit, and the camera LOD lets the full grid resolve when you zoom.

**Hover.** One raycast per frame returns the mesh under the cursor; `podHover3d()` reads its `userData` and `#hoverPop` prints the division, the total count and the seated/standing split — the `Engineering · 65 · 6+59` chip in the screenshot. The `6+59` is the total broken into the six-seat lead row plus the sixty-odd citizen desks, which is exactly how the seat plan was derived: one standing body, `seats = count − 1`.

**LOD.** At overview zoom the badges and tags are hidden (the quiet rule); as you zoom past the LOD threshold, `tickLOD()` reveals the seat tags and name pills. That is why the block screenshots show every desk labelled and the overview shows none — same scene, different zoom.

## 11.6 What each screenshot proves

| Screenshot | Mechanism it demonstrates |
|---|---|
| Overview + left rail | The chrome phase: rail replaces the top bar; task panel on demand; quiet rule holds (no cards/labels at rest). |
| Brain graph (350 notes, 76 links) | `graph-build.mjs` → d3-force layout → `/api/brain`; the memory every division writes into. |
| Delivery focus | The six-department layer is untouched; focus dim + docked rail + lead chat. |
| Campus overview (bent spokes) | The first connection pass: quadratic corridors toward a command ring — better than starburst, not yet collision-clean at ground level. |
| Engineering 8×8 | The generative sizing: 64 seats → 54×47.6 platform → 8×8 grid; the answer to "60+ agents at once". |
| Marketing 6×6 | The same sizing rule at 36 seats; proof the platform scales by seat count, not by a fixed template. |
| Emails pod | The original office unit unchanged; the reference the benches are cloned from. |
| Campus top-down | Board-room spread: every division a platform of rows; the layout from the solver, proven collision-free. |
| The connection frame | `platform → skybridge → command ring → Brain`; the last piece, verified in 3D by `campus-curves`. |

## 11.7 Pitfalls we hit (and the fix)

- **Hand-placed positions collide.** Never hand-place 26 platforms. Generate them and prove 351 pairs.
- **Straight spokes look like a starburst.** Bend them toward a ring, all in one rotational direction.
- **Bent ground corridors still clip at 0.57u.** Fly them; a flat-top arch clears everything.
- **A plain quadratic arch is half-height a quarter of the way along.** Hold the ground for the first/last 12 % and ease up; otherwise the departure end clips the neighbour.
- **One command ring bunches same-angle arrivals.** Use three nested rings and per-platform swirl.
- **`swirl` left out of `data.js` for departments made the verifier disagree with the scene.** The swirl must live on *both* `BENCH_PODS` and `LAYOUT`, and the verifier must mirror the builder's exact math.
- **Three rings sharing inner radius 7.5 z-fight.** Nest them: each starts where the last ends.
- **A fixed 600 ms sleep in a probe is flaky under software rendering.** Poll for state instead.

## 12. The result

- **6 department decks** (unchanged, 35 seats) **+ 20 division benches** covering **18 unique divisions** = **26 platforms**, 27 with the Brain.
- **317 agents** (35 roster + 282 citizens); the scene renders **298** with desks/bodies (263 seated, 35 roster).
- **Engineering 65 · Marketing 37 · Game-dev 21** and so on, each on a platform sized to its own seat count.
- **26 arched skybridges** landing on **3 command rings**, proven collision-free in 3D.
- The Brain, the graph, the rail, chat, deploy, approvals and the quiet rule all intact.

You may remember it as "36 decks." The exact shipped number is **26 platforms plus the Brain** — 6 + 20 — but the grouping of those 20 into named *board-rooms* (Engineering, Marketing, Game Dev, GIS, Security, …) is where the "many divisions" feeling comes from. Every one of them is the same primitive: the six-department pod language, scaled by seat count, wired to one memory.
