# Tyler Tower V4 — The Orb Campus

**A component-upgrade plan. No logic is rewritten.**

Status: proposed · Author: frontend design · Reference: `assets/tyler/` + owner mock (orb + dotted grid)

---

## 0. Mandate

V3.6 shipped a working product with a proven interaction model. Fourteen phases, a
100-item screenshot audit, twelve headless probes. The logic is correct and stays
correct. This plan changes **components** — the chrome, the central node, the way
connections are drawn — and leaves every behaviour intact.

### 0.1 What must not change

This is the load-bearing list. Every phase below is checked against it.

| Invariant | Where it lives |
|---|---|
| **The rest state shows only living beings.** Zero cards, labels, pills, badges. | `tickLOD()` `main.js:1965-2051` |
| **One raycast per frame**, gated by `hoverDirty` | `processHover3d()` `main.js:2417` |
| **One popup, `pointer-events:none`, three answers** | `#hoverPop` `shell.html` |
| **Click routing: agent → chat+plate, desk → roster, desk+citizen → chat** | `main.js:736-783` |
| **Slugs pinned to meshes at bind time**, never re-derived | `bench-data.js` binding pass |
| **Task attribution as substring query** (`aa-<slug>` in task text) | `citizenTasks()` |
| **Roster: 20-row cap, expander, 120 ms debounce, two distinct empty states** | `buildPodRail()` |
| **Deploy: five states, 5-char minimum, `friendlyTaskError()`** | `submitPodGoal()` |
| **Golden `--division-*` typography**, byte-identical across 20 divisions | `shell.html:17-30` |
| **Board lanes, calendar card kinds, brain-graph three surfaces** | `tasks.js`, `calendar.js`, `braingraph.js` |
| **Keyboard map** (1-6, B, G, P, C, X, V, D, +/-/0, Tab, Esc) | `main.js:784-808` |
| **Dark mode by token swap + explicit surface overrides** | `shell.html:1164-1198` |
| **Every design claim is a probe** | `scripts/*-probe.mjs` |

### 0.2 What changes

1. **Chrome** — the 52 px top bar and the always-on right task panel become a **left
   icon rail** plus an on-demand task panel. Owner mock.
2. **The Brain** becomes a **glowing orb**: wireframe shell, armillary rings, glow
   nucleus, slow rotation on a tilted axis. Owner mock + V4.0 §14.1.
3. **Connections** — a **dotted light grid** of dashed ground chords from every
   division command node to the orb. Owner mock + V4.0 §14.2/§16.2.
4. **Packets** — pooled volumetric pulses travelling Core → Node → Desk and back.
   V4.0 §14.3/§16.

### 0.3 The three corrections this plan makes to the V4.0 draft

The draft spec is directionally right and mechanically wrong in three places. Fixed
here, not in code.

**Correction 1 — `dashOffset` does not exist.** Verified against the installed three:

```
node_modules/three/src/materials/LineDashedMaterial.js
  → scale, dashSize, gapSize          ← the entire property set
node_modules/three/.../linedashed.glsl.js
  → uniform float scale, diffuse, opacity, dashSize, totalSize
```

The shader derives dashes purely from `lineDistance`, `scale`, `dashSize`, `gapSize`.
Assigning `material.dashOffset` writes a property nothing reads. Six of the seven
rows in the draft's state matrix would render as static dashes forever, and no probe
would catch it because nothing errors. §3.4 below implements travel correctly by
offsetting the `lineDistance` attribute itself.

**Correction 2 — additive blending dies on a cream page.** The draft sets
`blending: AdditiveBlending, opacity: 0.65, color: #2B6BEB`. The page is
`--cream: #FDFFF8` (luminance ≈ 0.99). Additive blending adds light to a near-white
surface; the wireframe computes to approximately the page colour and disappears.
Additive is a dark-background technique and this product renders dark-on-light.
V3.6 already learned this — every "glow" in the shipped scene is a sprite or a CSS
shadow, never an additive material. §2.5 specifies the alternative.

**Correction 3 — a 14.5-radius orb swallows the command rings.** The three command
rings are `RingGeometry(7.5, T.ring + 0.5)` — annuli whose **inner edge is r = 7.5**.
The six department-tier skybridges land on the first annulus at r = 10.5. An orb of
radius 14.5 encloses rings 1 and 2 entirely, intersects ring 3, and the six
department corridors descend *through* it. `campus-curves.mjs` asserts *"every
corridor lands on its own tier's command ring"*; that assertion passes today and
cannot pass under the draft's radius. §2.2 sets the orb to **r = 7.0**, which clears
the innermost ring edge by 0.5 units and is *smaller* than the 16×16 slab it
replaces. Visual presence comes from a glow sprite at scale 14 — a sprite is not a
collider and does not touch `campus-curves.mjs`.

---

## 1. Phase 0 — Instruments first

V3.6's single best practice: Phase 0 built the things that could catch us lying, and
recorded a baseline of failures (`badge visible: 0 / 20`) as the measure of
everything after. Same discipline here. **No phase begins until its probes exist.**

Four new scripts in `scripts/`, all headless Chromium driving the built file:

**`orb-probe.mjs`** — 18 assertions.
- Orb group exists, named `brainOrb`, positioned at `(0, 7.0, 0)`.
- Contains exactly three primary geometries: one `LineSegments` shell, one
  `ringsGroup`, one nucleus mesh.
- Rotation axis unit vector equals `(0.397, 0.917, 0.000)` within 0.001.
- `core-probe` moat assertion: orb bounding sphere radius 7.0 < 7.5 ring inner
  edge. Clearance 0.5.
- Orb bounds do not intersect any of the three command-ring annuli.
- Full 360° rotation completes in 120 s ± 2 s (measured from `group.rotation`).
- Hover reduces angular velocity to ≤ 30% of rest within 500 ms.
- Shell opacity reaches ≥ 0.9 within 500 ms of hover, ≤ 0.7 at rest.
- Nucleus glow sprite present, `scale.x === scale.y`, `depthWrite === false`.
- `setTheme(true)` and `setTheme(false)` both change shell colour.
- Every material on the orb has `depthWrite` explicitly stated (no defaults).
- Reduced-motion: orb rotation is 0 and `prefers-reduced-motion` is honoured.
- Orb registers exactly one entry in `clickTargets`.
- Raycast against orb centre yields `kind === 'brain'`.
- `THE BRAIN` string is unchanged in `hoverPopHTML`.

**`grid-probe.mjs`** — 18 assertions.
- Exactly 26 dashed chords in the `dottedGrid` group, 1:1 with pod ids.
- Every chord elevation strictly `0.25 ± 0.001`, clear of the shadow plane
  (`y = -7.0`) and plinth floors (`y = 0.12`).
- Every chord material `depthWrite === false`.
- Every chord lands on its pod's command-node world position, not the pod centre.
- **No two chord centrelines come within 2.0u of each other in 2D** — the direct
  analogue of `campus-curves.mjs` check #4, and the assertion that kills P051.
- No chord terminates inside the orb's r = 7.0 sphere.
- Chord count survives focus, zoom, dark-mode toggle and a resize.
- Chord `lineDistance` attribute offsets under `setLineState('streaming')`.
- Chord returns to baseline offset under `setLineState('idle')`.

**`packet-probe.mjs`** — 13 assertions.
- Pool constructed with exactly 128 pre-allocated meshes.
- **`scene.children` mesh count does not grow** across 1,000 dispatches — the real
  zero-allocation assertion. (The draft's "pool never drops below 0" is trivially
  true of a count and passes while packets are being silently discarded.)
- Zero packets visible at rest.
- Every dispatched packet reaches `progress >= 1.0` and returns to the pool.
- `onArrive` fires exactly once per packet.
- Peak concurrent packets ≤ 128.
- Dropped-packet count is 0 at the designed dispatch rate.

**`chrome-probe.mjs`** — 17 assertions.
- `#rail-nav` exists, is `position: fixed`, left-anchored, 7 icons.
- Exactly one `.nav-item.is-on` at rest.
- Every icon has an `aria-label` and a `title`.
- `#topbar` is removed from the DOM **and** from `focusTarget()`/`fitOverviewZoom()`
  call sites.
- `#tpanel` defaults to `display: none` and opens on rail activation.
- `#licence` remains bottom-centre and unobstructed.
- `#zoomCtl` is bottom-right and clear of the rail.
- **Quiet rule holds with the new chrome**: 0 badges, 0 pills, 0 `.division-card`
  visible, 0 `.nav-item` labels visible at rest.
- Existing 12 probes still pass unchanged.

**Baseline first.** Before any edit, run all sixteen and record the failures. Four of
these will fail at HEAD (`grid-probe` — no grid; `orb-probe` — no orb;
`chrome-probe` — no rail; `packet-probe` — no engine). That is the expected
starting state and it is what every later phase is measured against.

### 1.1 Measured baseline — 4 Oct 2026, at HEAD

Four probes written, **66 assertions**, run against `dist/command-centre-v2.html`
in headless Chromium at 1512×900:

```
CHROME-PROBE:  6/17 · ERRORS(0)
ORB-PROBE:     1/18 · ERRORS(0)
GRID-PROBE:    2/18 · ERRORS(0)
PACKET-PROBE:  1/13 · ERRORS(0)
                       ─────────
                       10/66 · ERRORS(0)
```

`ERRORS(0)` across all four is itself a result: the four probes attach to a page that
throws nothing and shut down cleanly, so they are safe to leave in the suite.

**The ten that already pass are the ones that must not break.** They are the shipped
behaviour the chrome restructure is most likely to damage:

| Passing assertion | Why it matters |
|---|---|
| chrome · `#wires` draws (27 paths, 31 circles) | the MCP loom `mcp.tick` projects; anchor changes, must not lose the SVG |
| chrome · overview zoom still fits (`view.zoom = 0.30`) | `fitOverviewZoom()` re-derives `panelFrac` from `panelWidth()`; a zero-width panel must not produce `NaN` |
| chrome · `#zoomCtl` inside viewport, clear of the rail | 448 px → 24 px offset change |
| chrome · **quiet rule holds** (0 badges / 0 pills / 0 cards / 0 nav labels) | P001–P020; the single most important assertion in the suite |
| chrome · canvas present and sized (1512×900) | the chrome must not displace the scene |
| chrome · `#licence` bottom-centre, unobstructed | P017 blend-mode collision |
| orb · brain still called `THE BRAIN` | P085 naming drift |
| grid · conduit fan is 20, not duplicated | P058 — measured `userData.part === 'conduit'` = **20**, and no other line objects exist in the scene |
| grid/packet · `ERRORS(0)` | no throw on attach or on 1,000 dispatches |

**The fifty-six that fail are the build target**, grouped by owning phase:

| Phase | Failing assertions |
|---|---|
| Phase 1 · chrome | 1–7, 9, 10, 16, 17 (11) — no `#rail-nav`, topbar mounted, 5 orphaned topbar elements, always-on panel, mark bottom-left |
| Phase 2 · orb | 1–17 (17) — no orb at all |
| Phase 3 · grid | 1–16 (16) — no grid at all |
| Phase 4 · packets | 1–12 (12) — no engine, no `dispatchRate` |

**Two measurements worth keeping.** `grid-probe` confirms the node→desk conduit fan
is exactly 20 objects and that the scene contains **no other `Line`/`LineSegments`
objects** — the skybridges are `TubeGeometry` meshes. So the dotted grid's 26 chords
would be the first real line geometry in the scene, and the conduit fan they must not
duplicate is already precisely counted. `chrome-probe` #9 shows the always-on panel
painting a real `400 × 814` box at rest — the thing §2.3 turns off.

**Four probe bugs found and fixed by running the baseline** — recorded because it is
the argument for Phase 0 existing at all:

1. `#tpanel` is `position:fixed`, so `offsetParent` is `null` on a *visible* fixed
   element. The first version of that assertion passed at HEAD for the wrong reason.
   Now gated on `checkVisibility()` + a real rect.
2. In three, `LineSegments extends Line`, so `isLineSegments && !isLine` matches
   nothing and the P058 check passed vacuously with `conduits=0`. Now counted by
   `userData.part`.
3. `hoverPopHTML` was not on the probe surface, so the P085 naming guard passed on
   empty markup. Now exposed and required to return non-empty text.
4. `packet-probe`'s "pool never drops below 0" — inherited from the V4.0 draft — is
   trivially true of a count. Replaced with scene-graph growth + a counted `dropped`.

### 1.2 Probe surface

Phase 0 added one additive change to `src/main.js`. The scene graph was previously
unreachable from a headless probe, so all three 3D probes had nothing to assert
against. Same intent as the existing `window.__divisionDebug()`:

```js
window.TYLER_SCENE = { scene, camera, renderer, view, deptRT, benchRT, LAYOUT, BENCH_PODS,
  DEPTS, clickTargets, personTargets, hoverPopHTML,
  setHover3d, getHover3d, getFocused, getRosterPod };
window.TYLER_V4 = { orb: null, grid: null, packets: null };   // the nulls ARE the baseline
```

Additive only — no behaviour changes, `npm run build` byte-identical in size
(1947 KB before and after). `hover3d` and `rosterPod` are read through arrow
functions because they are declared at `main.js:2317` and `:2320`, well below the
exposure point; the closure defers evaluation past their initialisation.

### 1.3 Registration

```bash
npm run probe:chrome    npm run probe:orb
npm run probe:grid      npm run probe:packets
npm run probe:v4        # all four, in sequence
```

---

## 2. Phase 1 — Chrome: the left command rail

New file `src/railnav.js`. Replaces `#topbar`; `#tpanel` survives but becomes
on-demand.

### 2.1 Anatomy

```
┌─────┐  position:fixed; left:0; top:0; bottom:0
│  ⌂  │  width:72px; z-index:24
│  ⛁  │  ← active: .is-on → rounded-square plate, cream 94%, radius 12
│  ⚒  │     icons: 22px, --grey at rest → var(--ink) when .is-on or :hover
│  ▤  │  gap:8px; padding:18px 0
│  ☰  │
│  ·  │
│  ·  │  flex spacer
│  ⚙  │  bottom-anchored group: settings, exit
└─────┘
```

Seven items, matching the mock top-to-bottom: **home · office/database (active) ·
tools · documents · tasks/list · — · settings · exit**.

Each is a `<button class="nav-item">` with `aria-label` and `title`. Active state is
a single `.is-on`. This is the first genuinely new component in V4 and the only one
that removes a top-level surface, so it goes first and alone.

### 2.2 Where the top bar's contents go

Nothing is dropped. Seven items, seven new homes:

| Old | New |
|---|---|
| `.brand` "TYLER TOWER V3" | Rail header, rotated vertical wordmark or a small cap at rail top |
| `#topconn` connector tiles | Rail item **office** → opens a right-side system popover: connectors, models, usage gauge |
| `#topmodels` claude/chatgpt | Same popover, second block |
| `#topCal` "◷ CALENDAR" | Rail item **tasks** → calendar full-screen (unchanged) |
| `#topAppr` ⚠ *n* | Rail item **documents** → approval queue; amber `.nav-badge` with count, `amberPulse` when > 0 |
| `#clock` + `.tm-usage` | Rail footer, stacked, 10px mono, right-aligned in a 72px rail it becomes two stacked lines under the icon row |
| — | **tools** and **exit** are new |

`#wires`, the SVG loom that runs dashed conduits from the bar down to each pod, now
anchors to the **office** popover's left edge. `#topconn.focus` (absolutely centred
in a focused department) becomes a popover header row reading the department name.
`mcp.tick` receives the popover anchor instead of the bar.

### 2.3 Task panel becomes on-demand

`#tpanel` keeps every line of its logic — command bar, model/effort pickers, REPEAT,
TEAM, chips, `.tp-rows`, FLIP animation, 250 ms bar refresh, 15 s timestamp
refresh. Only its mount policy changes:

- Default `display: none`
- Rail **tasks** item, or `B`, toggles it
- It docks right at `top: 18px; right: 18px; width: 400px` (top offset freed by the
  removed topbar)
- `tasks.panelWidth()` becomes `panel.offsetParent ? panel.offsetWidth : 0` — so
  `fitOverviewZoom()`, `overviewPos()`, `focusTarget()` and both `tickLOD()` badge
  clamps all keep working, now with a panel that is sometimes zero-width
- `RAIL_SIDE` stays `left` for all six departments. The panel is *usually* absent
  now, so a focused pod centres in the full frame; `focusTarget()`'s `boardW` term
  already handles a zero-width panel

`#boardDim`/`#board` z-order unchanged. `#zoomCtl` moves to `right: 24px; bottom:
20px` (the 448 px offset existed only to clear the always-on panel).

### 2.4 Tokens

Seven additions to `:root`, consistent with the existing system and the V4.0 §15.1
intent, corrected:

```css
--core-blue:     #2B6BEB;   /* 4.73:1 on cream — passes ≥3:1 */
--core-blue-dim: rgba(43,107,235,.14);
--core-line:     #5A5A5A;   /* chord rest colour, --grey */
--core-line-dim: rgba(90,90,90,.38);
--nav-w:         72px;
--nav-gap:       8px;
--nav-icon:      22px;
```

Status colours are untouched: `#1E9070` done, `#F2B84B` waiting, `#C94F3D` error,
`#C8A438` lead. **`--core-blue` is a fifth semantic role — system flow — and must be
documented as such** in `HOVER-REVEAL.md`'s successor, because the draft used
`#C8A438` for artifact return, colliding with gold-as-lead.

**The draft's `#coreDiagnostics` bar is not built.** The mock does not show it, and a
per-frame tokens/sec readout is P001–P020 — a permanent HUD in the rest state. The
network's health is instead expressed *in the orb itself* (nucleus hue and pulse
rate, §2.6) and read on hover in `#hoverPop`, which already has the three-slot
structure for it. `aria-live` telemetry is not a design problem worth solving.

---

## 3. Phase 2 — The orb

New file `src/brain3d.js`. Replaces the etched-slab presentation **at overview
only** — see §3.7.

### 3.1 Config

```js
export const ORB = {
  radius: 7.0,          // clears the innermost command ring edge (7.5) by 0.5
  icoDetail: 2,         // 320 faces → ~480 wireframe edges, not detail 3's ~1920
  axis: new THREE.Vector3(0.397, 0.917, 0).normalize(),
  periodSec: 120,       // 0.5 RPM
  hoverPeriodSec: 420,  // 71% slowdown, eased, not stepped
  ringCount: 7,
  meridianCount: 12,
  shellHex: 0x1E5FA8,   // darkened from the draft's 0x2B6BEB for cream contrast
  shellHexDark: 0x7FD3B4,
  ringHex: 0x1E9070,
  nucleusHex: 0x0F1B33,
  glowScale: 14,
  y: 7.0
};
```

`icoDetail: 2`, not 3. At `MIN_ZOOM 0.30` against a 207-unit world radius, detail-3's
~1,920 1px line segments resolve to an aliased grey blob — `LineBasicMaterial`
linewidth is locked at 1px by WebGL and MSAA does not help line rasterisation.
Detail 2 is ~480 edges: still reads as a geodesic shell, still cheap.

### 3.2 Shell

`IcosahedronGeometry(7.0, 2)` → `WireframeGeometry` → `LineSegments`.

```js
mat = new THREE.LineBasicMaterial({
  color: ORB.shellHex,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,        // explicit — the draft left the default true
  blending: THREE.NormalBlending
});
```

`NormalBlending`, not additive — see Correction 2. `depthWrite: false` because the
nucleus and glow sit inside the shell and would otherwise z-fight.

`shellHex` is darkened from the draft's `#2B6BEB` to `#1E5FA8` (~5.6:1 on cream) so
a 1px line at 0.55 opacity still reads as a deliberate blue structure rather than a
faint tint.

### 3.3 Armillary rings

Seven latitude circles + twelve meridian loops, as `Line` objects in a
`ringsGroup`. Radius `cos(φ) × 7.0`; `y = sin(φ) × 7.0`; both groups pre-rotated by
the axis tilt. 48 segments each. `LineBasicMaterial({color: 0x1E9070, opacity: 0.30,
depthWrite: false})`.

**Store the material on the instance** (`this.ringMat = ringMat`). The draft created
it as a function-local, which makes `setTheme()` structurally unable to theme the
rings — a bug that would have shipped as emerald orb + untinted green rings in dark
mode.

### 3.4 Nucleus and glow

Two objects, both `depthWrite: false`:

- **Nucleus** — `SphereGeometry(3.0, 24, 16)`, `MeshBasicMaterial({color:
  0x0F1B33})`. Flat, dark, reads as a dense core. The draft specified a Fresnel
  shader and shipped a flat ink ball with a three-way colour contradiction
  (constructor `0x15161A` vs `setTheme(false)` `0xFDFFF8` vs `setTheme(true)`
  `0x0F1013`). One colour, one theme branch, no ambiguity.
- **Glow sprite** — 256² canvas, `createRadialGradient` from
  `rgba(30,95,168,0.34)` at r=0 to `rgba(30,95,168,0)` at r=128, `SpriteMaterial`
  `{opacity: 0.9, depthWrite: false, blending: NormalBlending}`, `scale 14`,
  `renderOrder: -1`. This is where the orb's visual scale comes from — the mock's
  orb is far larger than 14 units of geometry, and a sprite buys that for free
  without touching any collision assertion.

### 3.5 Kinematics

```js
tick(dt, hovered) {
  const target = hovered ? 1 / ORB.hoverPeriodSec : 1 / ORB.periodSec;
  this.rate += (target - this.rate) * (1 - Math.exp(-dt * 4));   // 400ms, per §14.1
  this.group.rotateOnAxis(ORB.axis, 2 * Math.PI * this.rate * dt);

  const o = hovered ? 0.92 : 0.55;
  this.shellMat.opacity += (o - this.shellMat.opacity) * (1 - Math.exp(-dt * 6));
  this.glowMat.opacity += ((hovered ? 1.0 : 0.9) - this.glowMat.opacity)
                        * (1 - Math.exp(-dt * 6));
}
```

Exponential decay, not the draft's `* 0.1` per frame. The 0.1 form is
frame-rate-dependent — at 144 fps it converges 2.4× faster than at 60 — and it
contradicts §14.1's own stated `k = 1 − exp(−dt·4)`. The house convention is
already `k = 1 - Math.exp(-(dt||0.016) * 7)` in `poseWork` (`builders.js:195`);
this matches it.

`reducedMotion()` — the helper defined at `main.js` and never called — is finally
wired here, the one place it was written for:

```js
if (reducedMotion()) { this.rate = 0; return; }   // static pose, no rotation
```

A continuously rotating sphere is the single most motion-sensitive object in the
product. `prefers-reduced-motion` currently gates 2 of ~14 animations; this makes it
gate the one that matters most.

### 3.6 Health encoding

The draft's `#coreDiagnostics` telemetry moves into the orb's own material:

| Condition | Encoding |
|---|---|
| Nominal | nucleus `0x0F1B33`, glow opacity 0.9 |
| Queue > 8 tasks | nucleus lerps toward `0x3A2F14` amber over 600 ms; glow pulses ±0.08 at 1.6 s |
| Any task waiting approval | one amber tick sprite at the orb's north pole, `amberPulse` |
| Live error | nucleus toward `0x3A1512`, glow pulse rate doubles |

Read on hover in `#hoverPop` using the existing three slots —
`.hp-name` `THE BRAIN`, `.hp-sub` `344 notes · 317 active agents`, `.hp-hint`
`click to open the graph (G)`. No fourth line. No status claim without a data
source.

### 3.7 The etched floor survives

The draft's diff table retires the etched canvas sprite. **It does not.** That
sprite is the only place the vault's real wiki-link graph is visible in 3D, and four
read-feedback mechanisms depend on it: the green glint sprite, the dashed
`LineDashedMaterial` line to the reading desk, the 2.6 s `.readlab` pill, and
`read()`'s √degree-weighted note pick.

The orb therefore has **two states**:

- **Rest / overview** — wireframe shell + armillary rings + glow, as the mock shows
- **Focused (`G`)** — shell opacity drops to 0.25 and the etched floor sprite fades
  *in* at `y = 1.3`, `scale 17 × 10.2`, `renderOrder 4`

`G` becomes `flyTo([0, 7.0, 0], 3.1, 700)` with a 400 ms crossfade. `brain.js`,
`braingraph.js`, `#brainOv`, `#tpBrain` and `.badge.brainTag` are untouched. The
orb is the rest-state identity of the Brain; the graph is what you get when you ask
for it.

---

## 4. Phase 3 — The dotted light grid

New class in `src/connectors.js`, alongside the existing `loadConnectors()` data
loader. No change to that function or its consumers.

### 4.1 Construction

One dashed chord per pod, Brain → command node:

```js
const A = new THREE.Vector3(0, 0.25, 0);                     // orb footprint
const B = new THREE.Vector3(node.x, 0.25, node.z);           // pedestal foot
```

**`node`, not `pod.pos`** — the chord must terminate at the pedestal, or the
`BRAIN → NODE → AGENTS` hierarchy that `V2-CAMPUS-PLAN.md:112` exists to express is
skipped. `userData = { podId, dept, division, baseColor, state }` on each.

```js
new THREE.LineDashedMaterial({
  color: 0x5A5A5A,          // --grey, matches the draft
  dashSize: 1.2, gapSize: 0.8, scale: 1.0,
  transparent: true, opacity: 0.38,
  depthWrite: false
});
```

26 objects, 2 vertices each, 1 draw call each. Negligible against the existing
~5,000.

### 4.2 Line travel — the working replacement for `dashOffset`

Because the uniform does not exist, travel is a `lineDistance` offset:

```js
setTravel(entry, units) {
  const attr = entry.line.geometry.getAttribute('lineDistance');
  const arr = attr.array;                      // [0, chordLength]
  arr[0] = units; arr[1] = entry.len + units;
  attr.needsUpdate = true;
}
```

Read by `linedashed.glsl` as `vLineDistance`, so the dash pattern genuinely
translates. The geometry is allocated once at build; only the two floats change per
frame, so this stays allocation-free. `grid-probe` asserts the attribute moves.

### 4.3 Rim routing — killing the starburst

The mock shows 26 chords converging through one point. That is P051 and P052
verbatim, both filed and both marked FIXED in `V2-CAMPUS-PLAN.md` and
`README.md:451-474`. The fix already exists in the codebase and must be applied to
the chords as well as the skybridges:

```js
// every chord lands on the orb's rim, never inside it
const RIM = 7.6;   // orb radius 7.0 + 0.6 clearance
function rimTarget(theta, lane) {
  const c = Math.cos(theta), s = Math.sin(theta);
  const m = Math.max(Math.abs(c), Math.abs(s));
  return [c / m * RIM - s * lane, s / m * RIM + c * lane];
}
```

And the same 64-bin azimuth de-confliction the bridges use:

```js
const NBIN = 64, TAU = Math.PI * 2;
spokes.forEach(s => s.bin = wrap(Math.round(s.theta / TAU * NBIN), NBIN));
```

Two chords sharing a bin spread **2.0u** apart tangentially. This is the assertion
`grid-probe` exists to hold.

### 4.4 State matrix

Six states, all reachable from real task lifecycle events. `setLineState(podId,
state)` writes colour, opacity, and a travel rate.

| State | Colour | Dash/gap | Opacity | Travel | Trigger |
|---|---|---|---|---|---|
| `idle` | `#5A5A5A` | 1.2 / 0.8 | 0.38 | 0 | default |
| `syncing` | `#151414` | 0.6 / 0.6 | 0.60 | +2.0 u/s | 20 s server poll |
| `streaming` | `#2B6BEB` | 2.0 / 1.0 | 0.85 | +8.0 u/s | `POST /api/tasks` |
| `approval` | `#F2B84B` | 1.5 / 0.5 | 0.95 | ±3.0 u/s pulse | `requestApproval()` |
| `error` | `#C94F3D` | 0.4 / 0.4 | 1.00 | stutter | task failure |
| `done` | `#1E9070` | 1.0 / 1.0 | 0.80 | −8.0 u/s (inbound) | task resolution |

Every colour is an existing semantic token. `error` and `approval` are never
signalled by colour alone — a pod in either state also gets the existing amber
`amberPulse` tick or a red perimeter ring, satisfying the §2.4 contrast rule.

The draft implemented three of six. All six ship.

### 4.5 Sub-chords: do not build them

The draft's §14.2 diagram shows secondary `y = 0.15` sub-chords fanning to each
desk. **These already exist** — `main.js:391-414`, `LineSegments` at opacity 0.28
from each command node to every desk. Building them again is P058 (*"Walkways + MCP
wires + connector tiles triple-draw one connection"*) made worse. The grid replaces
the *primary* span only; conduits keep the *secondary*.

---

## 5. Phase 4 — Packet engine

New file `src/packetEngine.js`. The draft's `DataFlowEngine` is sound and is adopted
essentially as written — pooled `SphereGeometry(0.35, 8, 8)`, per-instance material,
`visible = false` at rest, reverse-iteration recycle, `lerpVectors` with a
`sin(πp) × 1.2` vertical hop, `onArrive` hooks. This is the only place in the
codebase that allocates nothing at runtime, and it is the right pattern.

Two changes:

**Silent drops become counted.** `if (!mesh) return;` discards a packet under load
with no trace. Replace with `this.dropped++;` and surface it in `orb-probe` and
`#hoverPop`'s `.hp-sub` when non-zero.

**`geometry` is shared; material is not.** 128 unique `MeshBasicMaterial` instances
means 128 shader-state changes per frame at full load. Acceptable at the designed
dispatch rate (2–6 concurrent). If `packet-probe` ever shows 40+ concurrent,
collapse to four shared materials keyed by colour with `mesh.material = POOL[col]`.

### 5.1 Lifecycle

**Instruction ingress** — `POST /api/tasks` resolves:
`dispatch(orbSurface → commandNode, 0x2B6BEB, 24)` → node cap sprite pulses → 2–4
sub-pulses down the existing conduits to the assigned desks → target agent
`poseWork` mode `read`/`sip` → `type`, screen texture inverted flash `#CFE0FF` for
380 ms (the existing behaviour, unchanged), chord state → `streaming`.

**Artifact return** — task resolution:
`dispatch(desk → commandNode → orb, 0xC8A438, 20)` → orb nucleus ripple (a 400 ms
scale pulse on a 0.5-opacity ring sprite) → chord state → `done` at −8.0 u/s inbound.

`#C8A438` is gold-as-lead in the existing palette; the collision is resolved in
§2.4 — the packet is *system flow*, so it takes `--core-blue` for instruction and a
**green** `#1E9070` for completion, matching `done`. Gold stays lead-only.

**Dispatch rate** — inverse to camera distance, per the draft's LOD claim, which
§5.3 actually implements:

```js
const density = clamp((view.zoom - 0.3) / 2.0, 0, 1);   // 0 at overview
const rate = 0.4 + density * 5.6;                        // concurrent cap 1 → 6
```

---

## 6. Phase 5 — Layout

### 6.1 Keep the generated campus

The mock's scattered arrangement is attractive and **this plan does not adopt it**.
`V2-CAMPUS-PLAN.md` exists because hand-placing 26 platforms that must never touch
is unmaintainable — the shipped `data.js` positions had four real collisions
including `product / spatial-computing` overlapping at 18.0 against 20.0 needed. The
`campus-calc.mjs` solver, the 64-bin swirl de-confliction, and the 351-pair
separating-axis proof are verified assets. Scattering by hand throws them away.

What the mock contributes is **perception**: pods at irregular radii read as organic
rather than orbital. That is achievable inside the solver — widen the ring radii
spread and vary pod footprint by seat count (already true: Engineering is 54×47.6,
Research 23×9.8). One optional addition, `campus-calc.mjs` re-run with a per-ring
radius jitter of ±6%, still proven collision-free before shipping.

### 6.2 Skybridges become a zoom layer

The mock shows no skybridges. They stay — they carry the `BRAIN → NODE` structural
half of the hierarchy and `campus-curves.mjs` guards them at 8/8 — but they become
LOD, which is the geometry gating `tickLOD()` never did (§4.6 of the audit):

```js
// in tickLOD(), with the existing badge/badgeScale work
const showBridges = !focused && z > 0.85;
skybridges.forEach(b => { b.visible = showBridges; });
rings.forEach(r => { r.visible = showBridges; });
```

At the default overview zoom of 0.30 the mock's clean field is what you see. Zoom
past 0.85 and the campus structure resolves. This is the single largest draw-call
saving available: 26 tubes (96×6 segments each) plus 3 annuli, removed at rest.

Conduits stay visible at all zooms — they are thin `LineSegments` and they are the
legible half of the hierarchy.

---

## 7. Phase 6 — Wiring

### 7.1 Loop integration

The draft's `loop()` rewrite is rejected — it changes the signature to
`dt`-from-`lastTime`, drops `syncOverviewBtn()`, and calls `tasks.tick(dt)` /
`mcp.tick(dt)` when the real signatures are `tasks.tick(now)` and
`mcp.tick(now, dt, view, camera, focused, focusDim)`. `mcp.tick` needs `view`,
`camera`, `focused` and `focusDim` to project the wire loom. That loop breaks MCP.

Correct insertion into the existing sequence, order preserved:

```js
const dt = Math.min(0.05, (now - last) / 1000);
tickTween(now); applyCamera(); tickDim(dt); tickSim(now, dt);
if (hero) hero.tick(now, dt);

const brainHovered = hover3d && hover3d.kind === 'brain';
orb.tick(dt, brainHovered);
grid.tick(dt, view.zoom);
packets.tick(dt);

processHover3d();     // unchanged — one raycast per frame
tickLOD();            // + the skybridge/ring gate from §6.2
tasks.tick(now);
mcp.tick(now, dt, view, camera, focused, focusDim);
syncOverviewBtn();
renderer.render(scene, camera);
requestAnimationFrame(loop);
```

`orb.tick` before `processHover3d` would use last frame's hover — the opposite
ordering hazard the existing comment about hover-before-LOD was written to avoid.

### 7.2 Raycast registration

One entry, one proxy. **Do not put the sphere in `clickTargets`.** At r = 7.0 it
would still be the largest single hit volume in the frame and would occlude the
inner-ring pods. Register the **glow sprite** only — sprites raycast on their
quad, and a transparent sprite still tests its full rectangle, so set
`sprite.material.alphaTest = 0.01` and accept a slightly generous square.

```js
orb.hitProxy.userData = { part: 'orb', dept: 'brain', kind: 'brain' };
clickTargets.push(orb.hitProxy);
```

`podHover3d()` gains one branch (`ud.part === 'orb'`), returning the §3.6 content.
The existing `userData.dept === 'brain'` branch on the slab is **removed with the
slab** — merging a second brain userData shape into `clickTargets` is the hazard the
draft walks into at §16.3.

### 7.3 State wiring

The draft defines `setTheme()`, `setLineState()`, `dispatch()` and `relinkTheme()`
and calls none of them. All four get call sites:

| Function | Called from |
|---|---|
| `orb.setTheme(bool)` / `grid.relinkTheme(bool)` | existing `setDark()` in `main.js` |
| `grid.setLineState(pod, state)` | task lifecycle hooks: `addTask`, `cancelScheduled`, `rtAct`, `resolveApproval`, `tasks.poll` |
| `packets.dispatch(...)` | `POST /api/tasks` success, task resolution, `requestApproval` |
| `orb.setHealth(...)` | `tasks.pending` count, `requestApproval`, task failure |

And one bug fixed while wiring: the draft's `relinkTheme()` only recolours lines
where `speed === 0.0`, so a chord mid-`streaming` at toggle time keeps blue while
every other chord goes grey — a half-themed network. Recolour from `userData.state`,
not from `speed`.

---

## 8. Phase 7 — Dark mode

Orb materials join the existing two-pass strategy (`shell.html:1164-1198`): token
swap, then explicit overrides for what tokens cannot reach.

| | Light | Dark |
|---|---|---|
| Shell | `#1E5FA8` @ 0.55 | `#7FD3B4` @ 0.45 |
| Rings | `#1E9070` @ 0.30 | `#5ADEB7` @ 0.28 |
| Nucleus | `#0F1B33` | `#0F1013` |
| Glow sprite | `rgba(30,95,168,.34)` | `rgba(125,211,180,.28)` |
| Chord idle | `#5A5A5A` @ 0.38 | `#8E95A3` @ 0.34 |

`#7FD3B4` is already the Brain-overlay live accent, so the orb and the full-screen
graph read as one system. The scene **relights** as it does today — hemi
`#8E95A3`/`#14151A` @ 0.75, key `#E4E9F2` @ 1.5, shadow opacity 0.13 → 0.35 — plus
`clearDimCache()` before retint, or the dim twins hold stale orb materials.

Chord state colours are **not** themed. `#2B6BEB`, `#F2B84B`, `#C94F3D`, `#1E9070`
are semantic in both themes; only the `idle` baseline is a surface colour and
themes.

---

## 9. Phase 8 — Accessibility

The orb is the highest-risk element in the product for motion sensitivity and for
pointer-only affordance. Five requirements:

1. **`prefers-reduced-motion` gates rotation to zero.** `reducedMotion()` finally
   called (§3.5). The armillary rings and shell hold a static pose.
2. **Keyboard parity.** The orb is reachable by `G` and registered in
   `clickTargets`, so it must be in the tab order alongside the twenty bench badges.
   `wireDivisionTarget`-equivalent handlers attach `focus`, `blur`, `pointerdown`
   (touch) and `Enter`/`Space` — the `HOVER-REVEAL.md:63` contract. Hover-only
   status readouts are not acceptable; the §3.6 health line appears on focus too.
3. **`aria-label` on the proxy.** `role="img"`, `aria-label="The Brain — 344 notes,
   317 agents. Press G to open the graph."` Static markup carries exactly one ARIA
   attribute today (`#licence`); the orb is the first 3D object to get one.
4. **No `aria-live` telemetry.** The draft's `#coreDiagnostics` with
   `aria-live="polite"` on a per-frame token counter would flood a screen reader.
   Health changes are `role="status"` on a node that updates only on *state
   transitions* — approval requested, task failed — never on a timer.
5. **Reduced-motion for packets.** Choreographed travel pauses; a single static
   arrow sprite marks direction instead.

Contrast: `--core-blue #2B6BEB` on `--cream #FDFFF8` measures **4.73:1**, clearing
the ≥3:1 threshold `readableChip()` enforces for decorative-but-stateful marks. The
darkened shell `#1E5FA8` measures ~5.6:1. Both pass; `a11y-core-probe` asserts it in
both themes rather than trusting the arithmetic.

---

## 10. Phase 9 — Performance

The audit's honest finding (§4.6): `tickLOD()` gates **zero geometry**, ~5,000–6,500
draw calls at overview, no `InstancedMesh` on the live path. V4 adds 26 lines, 26
rings-worth of geometry, ~480 wireframe edges, one sprite and up to 128 pooled
meshes. It must pay for itself.

| Change | Saving at overview |
|---|---|
| Skybridges + command rings hidden below `z 0.85` | **29 objects, ~2,700 tube segments** |
| Orb `icoDetail: 2` not 3 | ~1,440 line vertices |
| Chords `depthWrite: false`, `renderOrder: -1` | no z-sort churn |
| Packets `visible = false` at rest | 0 draw calls when idle |
| `dimTwin` memoised by `material.uuid` | unchanged, extended to orb |

The bridge gate is the whole ballgame and it is what makes the mock's clean field
achievable at 60 fps rather than merely drawn.

Two known costs accepted with eyes open:

- **`tickLOD()` does ~26 forced layouts per frame** via `offsetHeight`/`offsetWidth`
  interleaved with `toScreen()` writes. Adding the bridge gate costs three more
  booleans and no layout reads, so it does not worsen this — but a `perf-probe`
  should measure it, and the fix (cache `offsetWidth` on resize) is a separate
  change.
- **`renderer.setPixelRatio(min(dpr, 2))` is read once at construction** and never
  re-read. A window moved to a different-DPI display keeps the boot ratio. Out of
  scope here; worth a line in the debt register.

Bundle: `dist/command-centre-v2.html` is 1.9 MB, `mcplogos.js` 342 KB,
`bench-data.js` 432 KB. Phase 9 of the original work established a **build-time
trimming budget** as a design rule. V4 adds roughly 14 KB of source
(`brain3d.js` + `packetEngine.js` + grid) — under 1% of the bundle, and well inside
the existing budget discipline. `build.mjs` needs no change; nothing new is baked.

---

## 11. Phase 10 — Verification

The governing practice from `README.md:222-224`: *"Each one left a probe behind, so
the claim is checkable rather than remembered."*

```
npm run check          → roster, skills, routines, config validation (unchanged)
orb-probe              → 14/14
grid-probe             → 12/12
packet-probe           → 10/10
chrome-probe           → 16/16
campus-probe           → 19/19   (unchanged — proves the orb did not break layout)
campus-curves          →  8/8    (unchanged — proves the orb did not break bridges)
typo / hover / visible / a11y / roster / pod   → all PASS
soak-probe             → 58/58
ui-probe               → 100/100
state-wait             →  8/8
dogfood                → 12/12 against the live server
```

`campus-probe` and `campus-curves` are the two that matter most here, because they
are what §0.3's orb-radius correction is protecting. Both must stay green
**unchanged**.

`grid-probe` needs its own collision check rather than reusing `campus-curves`'
3D centrelines — chords are 2D ground-plane spans at `y = 0.25` and the skybridge
math does not apply.

**Screenshots.** `campus-shot.mjs` re-run to assert the quiet rule holds with the
new chrome: 0 badges, 0 pills, 0 `.division-card` visible, 0 nav labels visible,
rail closed, 0 console errors. Plus four new captures — `orb-rest.png`,
`orb-hover.png`, `orb-focus.png`, `grid-streaming.png` — for the same twelve-screenshots
audit loop that produced the original hundred problems.

**The V4.0 draft's four probes are corrected, not adopted.** `curve-probe` /
`dotted-probe` naming collapses to one `grid-probe`. `a11y-core-probe.mjs` was
specified in §17.4 but missing from the diagram and the checklist; it is folded into
`chrome-probe` and `grid-probe` rather than shipped as a fourth script. And no probe
reports a PASS count or a frame rate before it has been run — `perf-probe (PASS
60fps)` was asserted for code that does not exist, which is precisely the failure
mode the probe system exists to prevent.

---

## 12. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Orb reads as a blue blob at overview | Med | `icoDetail: 2`; the mock's scale comes from the glow sprite, not geometry |
| 26 chords re-create the P051 starburst | **High** | §4.3 rim routing + 64-bin de-confliction, held by `grid-probe` |
| Chord network duplicates conduits / MCP wires (P058) | **High** | §4.5 — sub-chords explicitly not built |
| Orb occludes inner-ring hover targets | Med | §7.2 — sprite proxy only, never the sphere |
| `setDark` leaves stale orb dim-twins | Low | `clearDimCache()` before retint |
| Removing the topbar strands `#topconn`/`#clock`/`#topAppr` | **High** | §2.2 — seven items, seven homes, asserted by `chrome-probe` |
| Always-on panel removal breaks `focusTarget()` | **High** | §2.3 — `panelWidth()` returns 0; four call sites verified individually |
| Frame budget regression | Med | §10 — bridge gate is the payment |

---

## 13. Definition of done

- [ ] Sixteen probes written and baselined **before** the first edit
- [ ] `#rail-nav` replaces `#topbar`; seven nav items; one active state; full ARIA
- [ ] Every topbar element rehomed; `mcp.tick` re-anchored to the popover
- [ ] `#tpanel` on-demand; `panelWidth()` returns 0 when closed; `fitOverviewZoom()`,
      `overviewPos()`, `focusTarget()` and both badge clamps verified at both states
- [ ] Orb at r 7.0; three geometries; tilted axis; 120 s period; exponential hover
      ease; `reducedMotion()` honoured
- [ ] Etched floor preserved and cross-faded in on focus
- [ ] `read()` glint, dashed line, `.readlab` and √degree note pick all working
- [ ] 26 chords, rim-routed, binned, ≥2.0u apart, `y = 0.25`, `depthWrite: false`
- [ ] Six chord states, all reachable, travel via `lineDistance` not `dashOffset`
- [ ] Packet pool 128, zero scene-graph growth over 1,000 dispatches, drops counted
- [ ] Skybridges + rings gated below `z 0.85`
- [ ] `orb.tick` / `grid.tick` / `packets.tick` in `loop()`; `syncOverviewBtn()` and
      the real `tasks.tick` / `mcp.tick` signatures intact
- [ ] `setTheme` / `setLineState` / `dispatch` / `relinkTheme` all called
- [ ] Dark mode: five orb surface overrides; state colours unthemed
- [ ] Keyboard + touch parity on the orb; `role="img"` + `aria-label`; no `aria-live`
      on a timer
- [ ] `campus-probe` 19/19 and `campus-curves` 8/8 **unchanged**
- [ ] All sixteen probes green; five screenshots captured; `README.md` updated