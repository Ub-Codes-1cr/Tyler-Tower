# MASTER PROMPT — rebuild Tyler Tower: the 26-platform campus, 317 agents, wired to the Brain

> **How to use this file.** Paste everything below the line into Claude Code opened at the repo root. It is a single, self-contained build prompt. Work it phase by phase; do not start a phase until the previous phase's probes pass. Each phase names every file it touches and every assertion it must satisfy. If a number is given, use that number. If a probe exists, run it. If you are unsure, do the smaller thing and leave a probe behind.

---

## ROLE

You are a senior frontend + Node engineer working in a local-first product. You are precise, you verify every claim with a probe, and you never rewrite working logic to make a layout easier. You keep the code honest, the bundle small, and the rest state quiet.

## MISSION

Transform a **six-department AI office (35 seats)** into a **radial campus of 26 platforms (27 with the Brain) holding 317 agents**, where both the six original departments and **twenty new division benches covering eighteen divisions** connect to the central Brain through **arched skybridges** that are proven collision-free in 3D — without changing any application logic, any division, any agent's features, or the "quiet office" interaction contract.

The end state is what the screenshots show: a left command rail, a radial campus of board-room platforms (Engineering 65, Marketing 37, Game Dev 21, …), the Brain at the centre with nested command rings, a live wiki-link graph, and one memory that every division writes into.

---

## HARD INVARIANTS — never violate these

1. **Do not change application logic.** Routing, chat, task lifecycle, approvals, routines, teams, skills, lessons, the brain graph and the server API stay exactly as they are. This is a spatial/frontend re-architecture plus a data-scale expansion, not a behaviour rewrite.
2. **Do not change the six departments, their leads, or their seats.** `emails` (5), `sales` (6), `marketing` (7), `ops` (6), `fin` (4), `delivery` (7). Lead and department fields are immutable.
3. **Do not invent or delete agents.** The 35 roster seats stay. The 282 personas are added as a separate, virtual layer. Never fabricate a persona's content.
4. **The quiet rule at rest is sacred:** zero badges, zero pills, zero cards, zero labels, zero ticks visible when nothing is hovered or focused. Only the living beings and their connections.
5. **Every design claim must be a probe.** If you assert a number (clearance, closest pair, count), a script must check it, and the script must be committed.
6. **Keep it local-first and single-file.** `npm run build` must still produce one self-contained `dist/command-centre-v2.html` that opens by double-click.
7. **Respect the load budget.** Do not bake megabytes the client never shows. Trim at build time.
8. **Agents get no Bash/file/sub-agent tools.** Outbound actions wait for the owner's approval. Preserve this.

---

## REPO MAP (learn this before editing)

- `serve.mjs` — the whole backend: routing, runs, chat, routines, teams, API. **Do not change behaviour.**
- `build.mjs` — esbuild bundle → `dist/command-centre-v2.html`; bakes citizens into `src/bench-data.js`.
- `config.mjs`, `roster.mjs`, `skills.mjs`, `learn.mjs`, `routines.mjs`, `teams.mjs`, `mcp.mjs`, `onboard.mjs`, `usage.mjs` — subsystems. Touch only where the prompt says.
- `citizen-agent.mjs` — the one-function resolver for virtual agents.
- `graph-build.mjs` — vault → `src/braingraph.js`.
- `src/main.js` — the scene, HUD, hover raycast, LOD, rail, chat, approvals, sim. ~2,400 lines.
- `src/builders.js` — all geometry (`makePlinth`, `makePerson`, `poseWork`, `makeWalkwayArch`, `makeCommandRing`, …).
- `src/data.js` — `DEPTS`, `AGENTS`, `CAMPUS`, `LAYOUT`, `BENCH_PODS`, `BENCHES`, `WORKLINES`.
- `src/shell.html` — all CSS and DOM. `src/models.js`, `src/when.js`, `src/tasks.js`, `src/calendar.js`, `src/brain.js`, `src/braingraph.js`.
- `scripts/*-probe.mjs` — the verification suite. `scripts/campus-*.mjs` — the campus solver/verifier.
- `brain/` — the vault. `brain/agency-personas/` — the 282-persona library.
- `docs/` — plans and audits.

---

## PHASE 0 — Instruments before code

**Goal:** build the things that can catch you lying, and record a baseline.

1. Confirm the build works: `node build.mjs`, then `npm start` and load `http://localhost:4520`.
2. Ensure these probes exist and run them; record the numbers as the baseline:
   - `scripts/campus-probe.mjs`, `scripts/campus-curves.mjs`
   - `scripts/ui-probe.mjs` (100 checks), `scripts/soak-probe.mjs` (58), `scripts/state-wait.mjs` (8), `scripts/dogfood.mjs` (12)
   - `scripts/typo-probe.mjs`, `hover-probe`, `visible-probe`, `a11y-probe`, `roster-probe`, `pod-probe`
3. Expose a headless test surface (additive only, no behaviour change) so 3D probes can assert against the scene:
   ```js
   window.TYLER_SCENE = { scene, camera, renderer, view, deptRT, benchRT, LAYOUT, BENCH_PODS,
     DEPTS, clickTargets, personTargets, hoverPopHTML, setHover3d, getHover3d, getFocused, getRosterPod };
   window.TYLER_V4 = { orb: null, grid: null, packets: null }; // nulls ARE the baseline
   ```
   Read `hover3d`/`rosterPod` through arrow functions so the closure defers past their later declaration.
4. **Do not proceed until the baseline is recorded.** A failing probe at HEAD is a target, not a blocker.

---

## PHASE 1 — Persona library → office skill packs

**Input:** `brain/agency-personas/` (282 personas, 18 divisions; `index.json` lists slug, division, file, name, description).

**Write:** `scripts/tyler-convert.mjs`.

For each persona:
1. Read the persona Markdown; strip front matter.
2. Slice useful sections by heading (`## Workflow Process`/`## Workflow`/`### Phase 1`, `## Technical Deliverables`/`## Core Mission`, `## Critical Rules`/`## Rules`/`## Communication Style`), each capped.
3. Create `brain/Tyler Tower/skills/aa-<slug>/` containing:
   - `SKILL.md` with front matter:
     ```
     ---
     name: aa-<slug>
     description: <name> — <description, 160 chars>
     agents: [<bind ids>]
     ---
     ```
     then a heading, a **trigger line** ("Use this for any task needing …"), a "Before you write" checklist, the distilled sections, and a rules list ending with "stay inside <division> expertise".
   - `template.md` — the finished thing's skeleton with placeholders.
   - `persona.md` — a source excerpt for verbatim detail.
4. Enforce the office limits: `SKILL.md ≤ 6000`, each side file `≤ 4000`, side files total `≤ 8000`. Trim strategically, never truncate mid-sentence without the `[… trimmed]` marker.
5. The `agents:` binding maps division → real office seats via a `BIND` table (e.g. `engineering: ['pco','scout','dlead']`). These bindings make the office load the pack with the existing `skills.mjs` loader — **do not change `skills.mjs`.**

**Gate:** `node scripts/tyler-convert.mjs --all` reports 282 converted; `node check.mjs` shows no skill problems.

---

## PHASE 2 — The citizen resolver (282 agents, 1 function)

**Write:** `citizen-agent.mjs`.

```js
export function resolveCitizen(id, brainPath) { ... }  // -> { agent, skillText } | null
```

- Normalise `id` (`aa-<slug>` → `<slug>`).
- Read `<brain>/agency-personas/index.json`; find the persona by slug; return `null` if absent (never throw).
- Map division → office department + tool set with a `DIV_DEPT` table, reusing **roster tool names** so `mcp.promptText` works unchanged (e.g. `marketing: ['marketing', ['canva','clarity']]`, `finance: ['fin', ['xero']]`, `support: ['emails', ['gmail']]`).
- Build the skill text from `aa-<slug>/SKILL.md` (+ `template.md`), falling back to a capped persona excerpt.
- Return an agent shaped like a roster agent: `{ id, isCitizen: true, name, role, does, department, tools, brief, model, effort }`.

**Wire it into `serve.mjs` (behaviour-preserving):**
- In `chat()`: if the id is not a roster agent, `resolveCitizen(agentId, BRAIN)`; throw a clean `unknown agent` only if it also fails; append the skill text as a `SKILL PACK` block.
- In the `/api/chat` handler: a citizen skips routines and the interview, answering with grounded chat; a missing citizen returns `400`, never a throw.
- Task attribution for a citizen is a substring query on `aa-<slug>` in the task's skills list.

**Gate:** a citizen chat returns a real, grounded reply; an unknown id returns `400`.

---

## PHASE 3 — Bake the citizens into the single file

**Edit:** `build.mjs`, before esbuild.

1. If `brain/agency-personas/citizens.json` exists, read it.
2. Apply the **load budget**: `description` → 160 chars, `greeting` → 220, `demo` → at most 4 rows × 220 chars. Trim at word boundaries.
3. Write `src/bench-data.js` exporting `CITIZENS` and `CITIZEN_GENERATED`.
4. Copy `BENCHES.json`, `index.json`, `citizens.json` into `dist/` for offline/http use.
5. Do **not** change the esbuild config; the bundle stays one HTML file.

**Gate:** `node build.mjs` prints `baked src/bench-data.js (282 citizens, trimmed)` and `built dist/command-centre-v2.html`.

---

## PHASE 4 — The data model: 20 benches, 18 divisions

**Edit:** `src/data.js`. Add `BENCH_PODS` (20 entries). Each entry:

```js
{ id: 'bench-engineering', division: 'engineering', label: 'Engineering',
  color: '#3B82F6', floor: '#E3ECFD', chip: '#3B82F6',
  count: 65, seats: 64, cols: 8, rows: 8, swirl: 30, pos: [163.1, 17.1], w: 54, d: 47.6 }
```

Rules:
- **18 unique divisions.** `specialized` (59 personas) is split across **three** benches `specialized-a/b/c` so no platform holds 59 seats.
- `seats` = personas − 1 (one standing body); `count` = personas.
- Chip colours are pastel-friendly and legible on cream; floors are a light tint of the chip.
- `cols = clamp(round(sqrt(seats * 1.1)), 3, 8)`, `rows = ceil(seats / cols)`.
- Add `BENCH_WORKLINES` (2–3 monitor lines per pod) so the desk-screen rotation never meets an unknown key; merge into `WORKLINES`.
- Keep `CAMPUS`, `LAYOUT` (add a `swirl` per department), and derive the compat `BENCHES` array from `BENCH_PODS`.

**Gate:** parsing `src/data.js` finds 20 pods, the largest is engineering with 64 seats, and the seat sum covers the seated citizens.

---

## PHASE 5 — Generate the campus (do not hand-place)

**Write:** `scripts/campus-calc.mjs` (solver) and `scripts/campus-merge.mjs` (merge), plus `scripts/campus-probe.mjs` (proof).

Solver:
1. Assign pods to rings by footprint (largest → outer).
2. Rings: departments `r = 60` at 60°, phase 3°; mid benches `r = 103` at 36°, phase 18°; outer benches `r = 164` at 36°, phase 6°.
3. Size each platform from its grid: `w = cols * CW + margin`, `d = rows * CD + margin` (use `CW ≈ 6.2`, `CD ≈ 5.4`, margin ≈ 2.2).
4. Rotate each platform by its ring so the grid faces the centre.
5. Set `CAMPUS = { brain, deptRing, midRing, outerRing, clearance: 9, moat: 24, swirl, ringR }`.

Merge: read the generated geometry, merge it back onto the **existing** pod styling so colours/labels/counts are never lost, and write `scripts/out/pods.txt`.

Probe (`campus-probe.mjs`) must assert:
- exactly 20 bench platforms + 6 departments + 1 Brain;
- **zero** overlapping platform pairs and minimum clearance `9.0` across all **351** pairs (separating-axis on the oriented rectangles);
- every platform outside the 24-unit moat;
- every grid fits its seat count; the largest is engineering 64;
- one frame shows the whole campus (`fitOverviewZoom` covers the radius);
- hover/click/roster/chat still work.

**Gate:** `node scripts/campus-probe.mjs` → **19/19**.

Then paste the solved `BENCH_PODS` and `LAYOUT` into `src/data.js`.

---

## PHASE 6 — Connect: arched skybridges + three command rings

This is the phase the last screenshot is about. Ground-level curves do not fit — prove it, then fly.

**Step 6a — the builder.** In `src/builders.js`:
- Add `skyBridgePoints(from, via, to, apex, n)` and `makeWalkwayArch(from, via, to, apex, w = 1.0)`.
- Horizontal path = a quadratic Bezier `from → via → to` (the pinwheel sweep).
- Vertical profile = **flat-top**, not a plain quadratic: hold ground for the first/last `RAMP = 0.12` of the run, ease to apex with a smoothstep `u*u*(3-2u)`, stay level across the middle. (A plain quadratic height `4A·t(1−t)` is still half-apex a quarter of the way along, which clips the platform it just left.)
- Build the tube from the sampled points (a `CatmullRomCurve3` through the samples is fine); cream slab material; `castShadow`/`receiveShadow`.
- Add `makeCommandRing(rInner, rOuter, color)` — a flat `RingGeometry` annulus.

**Step 6b — the routing.** In `src/main.js`:
- `CAMPUS_TIER = { dept: {ring:10, apex:8.5}, mid: {ring:13, apex:13}, outer: {ring:16, apex:17.5} }`.
- `spokeTier(kind, pos)` → `dept` for departments, else `outer` if `hypot(x,z) > 130`, else `mid`.
- `nearEdge(pos,w,d)` → step out from the centre until clear of the footprint on both axes, `+ 1.2`.
- `addSpoke(kind,key,pos,w,d,swirl)` → `from = nearEdge`, `to = polar(theta + swirl, tierRing)`, `via = bendControl(from,to)`.
- `bendControl(p0,p2)` → point on the angular bisector at `max(hypot(p0)*0.52, 14)`.
- Build **three nested** command rings: dept `7.5 → 10.5`, mid `10.9 → 13.5`, outer `13.9 → 16.5` (each starts where the last ended, so no z-fight).
- For each department and each bench pod, add `makeWalkwayArch(from, via, to, apex)`.
- Add one **command node** per bench at its outer edge, with thin conduits from the node to each desk (`BRAIN → NODE → DESKS`). Agents never wire to the Brain directly.

**Step 6c — solve the swirls.** In `campus-calc.mjs`:
- For each platform, `arrival` angle = `theta + swirl`.
- Greedy: pick the swirl whose arrival is farthest from already-placed arrivals, penalise steep bends, and penalise 3D proximity to placed arches.
- Then a **joint worst-pair pass**: find the two corridors whose 3D curves are closest; jointly search all swirl pairs and move both only to a jointly-clean configuration. (Single-corridor moves cannot escape a mutual conflict.) Repeat until the minimum 3D gap is acceptable or no clean joint move exists.
- Store the solved `swirl` on each `BENCH_PODS` entry and each `LAYOUT` department.

**Step 6d — verify in 3D.** `scripts/campus-curves.mjs` must mirror the shipped math exactly (`nearEdge` + `bendControl` + flat-top profile + tier rings) and assert:
1. 26 corridors built;
2. every corridor lands on its own tier ring (abs `r − ring| < 0.01`);
3. every arch clears every foreign platform — outside the footprint at any height, or ≥ 6u above it;
4. no two centrelines within `w + 0.5` in 3D (report the closest pair; expect ≈ 1.8u);
5. arrivals spread on each of the three rings (closest angular gap > 1.5°);
6. every corridor genuinely flies (apex > 6u).

**Gate:** `node scripts/campus-curves.mjs` → **8/8**, closest pair ≈ 1.8u. If check 3 or 4 fails, do not lower the threshold — raise the offending apex, widen the tier ring, or re-run the joint search.

---

## PHASE 7 — Chrome and the quiet rule

**Goal:** the left command rail and an on-demand panel, with the quiet rule intact.

- Replace the always-on top bar with a fixed left rail (`width: 72px`), seven items (home · office · tools · documents · tasks · settings · exit), each a `<button class="nav-item">` with `aria-label` + `title`, exactly one `.is-on`.
- Rehome every top-bar element (connectors, models, usage gauge, calendar, approvals, clock) into the rail and a right-side popover. **Nothing is dropped.**
- Make the task panel `display: none` by default; rail **tasks** or `B` toggles it. It docks right at `top:18px; right:18px; width:400px`.
- `tasks.panelWidth()` must return `0` when the panel is closed, so `fitOverviewZoom()`, `overviewPos()`, `focusTarget()` and the badge clamps keep working with a zero-width panel. Verify all call sites individually.
- `#wires` (the MCP loom) re-anchors to the popover; `mcp.tick` gets the new anchor. **Do not change `mcp.tick`'s signature.**
- The quiet rule at rest: 0 badges, 0 pills, 0 cards, 0 nav labels. One `pointer-events:none` hover popup, three answers only.

**Gate:** `chrome-probe` (or equivalent) passes; `campus-probe` and `campus-curves` remain green **unchanged**; the quiet-rule screenshot shows nothing at rest.

---

## PHASE 8 — Wire the divisions to the memory

The connection is the pipeline, and it already exists — verify it end to end for a citizen:
1. `POST /api/tasks` for a citizen's department routes to a citizen agent.
2. `run()` builds the system prompt from the agent's brief, skill pack and lessons.
3. `writeNote(task)` writes `brain/Tyler Tower/<date> <slug>.md` with front matter (agent, department, task id, tools, skills, routine/model when relevant).
4. `rebuildGraph()` re-lays the vault; `/api/brain` returns the updated graph; the Brain graph view shows the new node.

**Gate:** submit a citizen task; a new note appears in the brain and in the graph (image 2 behaviour).

---

## PHASE 9 — Dark mode and accessibility

- Dark mode = token swap **plus** explicit overrides for what tokens cannot reach (scene relight, orb/ring/bridge materials if added, `clearDimCache()` before retint).
- Any new 3D object that is clickable must be in the tab order with `focus`/`blur`/`pointerdown`/`Enter`/`Space` handlers and an `aria-label`.
- `prefers-reduced-motion` gates rotation and choreographed travel.
- Status is never signalled by colour alone (pair with a shape/tick).

**Gate:** `a11y-probe` PASS in both themes.

---

## PHASE 10 — Performance

- Gate non-essential geometry by zoom, the way `tickLOD()` already gates overlays: hide skybridges + command rings below the overview threshold (`z < 0.85`), keep conduits visible. This is the largest draw-call saving available.
- Keep the hover path at **one raycast per frame** (gated by `hoverDirty`).
- Keep the bundle inside budget: new source should be a small fraction of ~1.9 MB; nothing new is baked except the trimmed citizens.

**Gate:** `soak-probe` 58/58; no console errors; a perf reading recorded (even if the environment is software-rendered).

---

## PHASE 11 — Verification and screenshots

Run the full suite and require:
```
campus-probe   19/19
campus-curves   8/8   (unchanged)
ui-probe      100/100
soak-probe     58/58
state-wait      8/8
dogfood        12/12  (live server)
typo/hover/visible/a11y/roster/pod  PASS
```
Then capture the views that tell the story:
- overview (quiet, full campus) — image 1
- Brain graph (dark) — image 2
- a department focus (e.g. Delivery) — image 3
- one **block** zoomed: Engineering (64 desks) — image 5
- a second block: Marketing (36 desks) — image 6
- the connection frame: corridor → ring → Brain — image 9

Fix any probe that fails **at the source**, not by relaxing the probe.

---

## PHASE 12 — Document and commit

- Write/update `docs/V2-CAMPUS-PLAN.md` (the layout + connection derivation), `docs/HOW-THE-6-BECAME-THE-CAMPUS.md` (the narrative), and `README.md` (counts, architecture, testing).
- Write a clear commit message stating exactly what changed and the evidence (probe counts, closest pair).
- Commit and push to `origin main` **only when every gate above is green**.

---

## EXACT MATH APPENDIX

**Ring placement:**
```
dept  i: theta = 60° * i + 3°   r = 60
mid   i: theta = 36° * i + 18°  r = 103
outer i: theta = 36° * i + 6°   r = 164
```

**Platform size:** `cols = clamp(round(sqrt(seats*1.1)), 3, 8)`, `rows = ceil(seats/cols)`, `w = cols*6.2 + 2.2`, `d = rows*5.4 + 2.2`.

**Near edge (departure point):**
```
r = hypot(x,z); ux = x/r; uz = z/r
tx = (w/2)/|ux|; tz = (d/2)/|uz|
edge = min(tx,tz) + 1.2
from = [x - ux*edge, z - uz*edge]
```

**Arrival + control:**
```
phi = atan2(z,x) + swirl
to  = [cos(phi)*tierRing, sin(phi)*tierRing]
via = [cos(bis)*rc, sin(bis)*rc],  bis = atan2(from.z+to.z, from.x+to.x), rc = max(hypot(from)*0.52, 14)
```

**Flat-top height profile:**
```
u = t < R ? t/R : (t > 1-R ? (1-t)/R : 1)     // R = 0.12
y = apex * u*u*(3 - 2*u)
```

**Tiers:** `dept {ring:10, apex:8.5}`, `mid {ring:13, apex:13}`, `outer {ring:16, apex:17.5}`; nested rings `7.5–10.5`, `10.9–13.5`, `13.9–16.5`.

**Collision test:** axis-aligned rect distance (negative inside); a sample is a violation of check 3 only if `rectDist < 1.2` **and** `y < 6`. Corridor separation is 3D centreline distance ≥ `w + 0.5`.

---

## DATA CONTRACTS (exact shapes — match these)

**`BENCH_PODS` entry**
```js
{ id, division, label, color, floor, chip, count, seats, cols, rows, swirl, pos: [x, z], w, d }
```

**`CAMPUS`**
```js
{ brain: { r:0, w:16, d:16 }, deptRing:60, midRing:103, outerRing:164,
  clearance:9, moat:24, swirl:18, ringR:11 }
```

**`LAYOUT` department entry**
```js
{ pos:[x,z], w, d, swirl }
```

**Solved `swirl` values** (example, re-solve if you change rings):
```
dept: emails 24, delivery 24, sales -14, marketing 6, fin 14, ops 10
benches (sample): engineering 30, marketing 14, specialized-a 0, game-development 0,
  specialized-b -10, specialized-c -24, gis -46, security 6, design 10, sales -6,
  testing 0, paid-media 10, project-management 10, academic 0, product -10,
  spatial-computing 6, support -18, finance -46, healthcare 38, research 24
```

**`resolveCitizen` return**
```js
{ agent: { id, isCitizen:true, name, role, does, department, tools, brief, model:'', effort:'' },
  skillText }
```

**`window.TYLER_SCENE`** — the probe surface (see Phase 0).

**Note front matter written by `writeNote`** — `agent`, `department`, `task`, `done`, `tools`, `skills`, `routine`, `model`, `effort`, `approved`, `team`.

---

## PROBE SPECIFICATIONS (write these, don't wish for them)

**`campus-probe.mjs`** — 19 assertions:
counts (20 benches, 6 departments, 1 Brain); pairwise overlap = 0 and min clearance ≥ 9 over all 351 pairs; every platform outside the moat; every grid fits its seats; largest is engineering 64; seat total ≥ seated citizens; overview fits (`needs overview zoom < 1`); 20 badges built; 20 runtimes built; 282 citizens loaded; 317 agents have bodies; hover popup fires; roster opens; **no page errors**.

**`campus-curves.mjs`** — 8 assertions (see Phase 6d). Mirror `nearEdge`, `bendControl`, the flat-top `skyHeight`, and the tier rings exactly. Report the closest 3D pair and the per-tier arrival gaps.

**`ui-probe.mjs`** — 100 checks across boot, shell, departments, divisions/rosters, search, chat, deploy, hover. Replace any fixed sleep with `waitFor(predicate)`.

**`state-wait.mjs` / `dogfood.mjs`** — timing-safe smoke and a live-server journey. `dogfood` must reach 12/12 against `npm start`.

**Golden type guard (`typo-probe`)** — the twenty `--division-*` typefaces must be byte-identical to the original desks.

**Quiet rule (inside the screenshot probe)** — at rest: `badges === 0`, `pills === 0`, no visible `.division-card`, rail closed, `0` console errors.

---

## DIAGNOSTICS COOKBOOK

- **"Why is the closest pair 0.5u?"** Two corridors cross near the hub where one is descending. Raise the higher tier's apex or shift one `swirl` by a candidate step; re-run `campus-calc`'s joint pass.
- **"A corridor enters a platform."** The failure is almost always the *departure* end (low, near a neighbour). The fix is the ramp fraction and the apex, not the plan path.
- **"The solver says no clean joint move."** Your tier rings are too close; widen `dept/mid/outer` separation by 1–2 units and re-run.
- **"campus-probe parses 0 pods."** The regex is reading the old pod shape. Update the parser to the new `swirl`-bearing line; do not reformat `data.js`.
- **"The rail sits off-screen after a click."** The `open` class was applied in the same synchronous block as `display:block`. Force a committed frame — `void rail.offsetWidth` — before adding `open`.
- **"Panel width NaN after hiding it."** `panelWidth()` must return `0` (not `offsetWidth` of a null) when the panel is closed.
- **"Bundle grew by 400 KB."** You baked untrimmed citizen text. Re-apply the load budget in `build.mjs`.
- **"Dark mode half-tints."** Recolour themed objects from `userData.state` (or a theme pass), not from a numeric speed that happens to be zero.

---

## TROUBLESHOOTING MATRIX

| Symptom | Likely cause | Action |
|---|---|---|
| Overlapping platforms | hand-placed or stale geometry | re-run solver; never nudge |
| Starburst look | straight/one-ring routing | bend + three rings + swirl |
| Corridors clip at ground | using a plain quadratic arch | flat-top profile + higher apex |
| Verifier/scene disagree | swirl missing on departments, or math drift | put swirl on `BENCH_PODS` **and** `LAYOUT`; mirror the builder |
| Rings z-fight | shared inner radius | nest rings |
| Probe flaky on CI/software GL | fixed sleeps | poll state |
| Behaviour would need to change | layout constraint | pick the layout that preserves behaviour |

---

## GLOSSARY

- **Deck / platform / pod** — one raised slab holding desks and agents.
- **Bench** — a division platform on ring 2 or ring 3.
- **Department** — one of the six immutable office units on ring 1.
- **Citizen** — a persona-backed virtual agent resolved by `citizen-agent.mjs`.
- **Swirl** — a platform's arrival-angle offset from its radial angle, solved to spread corridors.
- **Skybridge** — an arched corridor (`makeWalkwayArch`) from a platform to a command ring.
- **Command ring** — a nested annulus around the Brain that every skybridge lands on.
- **Command node** — a division-coloured pedestal on a bench, feeding its desks.
- **Quiet rule** — nothing is drawn at rest but the living beings.
- **Probe** — a committed script that proves one design claim.

---

## WORKED EXAMPLE — one full solve, end to end

So you know what "done" feels like at each step, here is a concrete run of the pipeline:

1. **Personas.** `index.json` reports 282 across 18 divisions. `tyler-convert.mjs --all` writes 282 folders under `brain/Tyler Tower/skills/`, each `SKILL.md` ≤ 6000 chars. `npm run check` shows 285 skills (282 + 3 shipped) and no problems.
2. **Resolver.** `resolveCitizen('engineering-backend-architect', BRAIN)` returns an agent with `department: 'delivery'`, `tools: ['notion']`, and the pack's skill text.
3. **Bake.** `node build.mjs` bakes 282 trimmed citizens into `src/bench-data.js`; bundle size barely moves because the text was trimmed.
4. **Data.** `BENCH_PODS` has 20 rows; engineering is `seats 64, cols 8, rows 8`; the seat sum is 263; `specialized` appears on three ids.
5. **Campus.** `campus-calc.mjs` places 26 platforms; `campus-probe.mjs` prints `19 passed, 0 failed`, `closest 9.0`.
6. **Connect.** `campus-calc.mjs` solves swirls; `campus-curves.mjs` prints `8 passed, 0 failed`, `closest pair 1.81u`, `tiers: dept=6 outer=10 mid=10`.
7. **Build & run.** `node build.mjs` → `1947 KB`; `npm start`; the overview is quiet, engineering zoom shows 65 agents, the Brain graph shows the vault.
8. **Prove.** Full suite green; six screenshots captured.
9. **Ship.** Commit `Skybridges: arched corridors, 3 command rings, collision-free in 3D`; push `origin main`.

Every number in that run is asserted by a committed script. If any number is missing, you are not done.

---

## WORKING STYLE / CADENCE

- **Instrument → build → verify → document → commit.** One phase at a time. Never two.
- **Prove the failure first.** Before you "fix" the starburst, screenshot it and file it. Before you claim an arch is needed, show the 0.57u ground gap.
- **Prefer the smaller change.** If a gradient of changes reaches the same visual, ship the one with fewer moving parts.
- **Never relax a probe to pass.** If `campus-curves` says 1.4u and you wanted 1.5u, change the geometry, not the threshold.
- **Keep comments explanatory.** When a number looks arbitrary (a ramp fraction, a tier radius), say why next to it — the next reader is a probe.
- **Leave a trail.** Every phase updates `docs/` and the README so the claim is checkable, not remembered.

---

## DEFINITION OF DONE

You are finished when all of the following are true and provable:

1. The office still routes, chats, deploys, approves, schedules and runs teams exactly as before.
2. The campus is 26 platforms + Brain, zero collisions, min clearance 9, outside the moat.
3. Twenty benches cover eighteen divisions; the large blocks (Engineering 65, Marketing 37, Game Dev 21) show all their agents in one frame.
4. Twenty-six skybridges land on three nested command rings with tiered apices; the closest 3D pair is ≥ 1.5u; no corridor clips a foreign platform.
5. The quiet rule holds at rest; one raycast per frame; the left rail carries every top-bar element with full ARIA.
6. A citizen task writes a note that appears in the live Brain graph.
7. `campus-probe` 19/19, `campus-curves` 8/8, `ui-probe` 100/100, `soak` 58/58, `state-wait` 8/8, `dogfood` 12/12, and the type/hover/a11y/roster/pod probes all PASS.
8. `npm run build` emits one self-contained HTML within budget.
9. `README.md` and both `docs/` files describe the shipped state truthfully.
10. The work is committed and pushed, with the probe numbers in the commit message.

---

## ACCEPTANCE CHECKLIST

- [ ] 20 `BENCH_PODS` + 6 departments + 1 Brain; 18 unique divisions; `specialized` split across 3 benches.
- [ ] 26 platforms, zero overlaps, min clearance 9.0 (351 pairs), all outside the 24u moat.
- [ ] Engineering 64 seats, Marketing 36, every seated citizen has a desk; largest pod parses.
- [ ] 317 agents total (35 roster + 282 citizens); scene renders 298 bodies.
- [ ] 26 arched skybridges on 3 nested command rings; closest 3D pair ≈ 1.8u; all clear foreign platforms.
- [ ] `campus-probe` 19/19, `campus-curves` 8/8, `ui-probe` 100/100, `soak` 58/58, `state-wait` 8/8, `dogfood` 12/12.
- [ ] Quiet rule at rest; one raycast per frame; left rail with full ARIA; on-demand panel (`panelWidth()` = 0 when closed).
- [ ] Citizen task writes a note; graph gains a node.
- [ ] Dark mode + reduced-motion + keyboard parity; status never colour-only.
- [ ] `npm run build` still emits one self-contained HTML; bundle within budget.
- [ ] `README.md`, `docs/V2-CAMPUS-PLAN.md`, `docs/HOW-THE-6-BECAME-THE-CAMPUS.md` updated; committed and pushed.

---

## IF SOMETHING FAILS — the rules of thumb

- **Platform overlap:** re-run the solver with a larger clearance; never hand-nudge positions.
- **Corridor clips a foreign platform:** raise that tier's apex, widen its ring, or move the corridor's `swirl` via the joint search — do not lower the 6u clearance.
- **Two corridors too close:** the joint worst-pair pass is doing its job; if it reports no clean joint move, widen the tier-ring separation and re-run.
- **Roster/board slow under software rendering:** replace fixed sleeps in probes with state polling (`waitFor`), never by relaxing the assertion.
- **Bundle grows:** trim at build time; do not bake what the client never shows.
- **A behaviour would have to change to make a layout work:** stop. Choose the layout that preserves behaviour.

You are done when the campus overview is quiet, every block is full, and every division is visibly connected to the one Brain — and a probe proves each of those three claims.
