# Screenshot Audit — 100 UI Problems (from 12 owner screenshots, Oct 2026)

Owner's standing rule: **at rest the office shows only the living beings.**
No card, no disk label, no division name — until the mouse is on top of a
disk (popup: what the disk/division is) or on an agent (popup: what the
agent is; click: its tasks + chat). Walkways must not tangle at the center.

Status key: FIXED = repaired in this pass · FOLLOW-UP = listed, not yet done.
Root-cause fixes cover whole groups at once (one fix clears many items).

## A. Rest-state clutter — cards everywhere (P001–P020)

- P001 [FIXED] All 6 department stat cards render at overview rest, covering the pods.
- P002 [FIXED] All 20 bench division cards render at rest ("5 SHOWN / DIVISION GIS"…).
- P003 [FIXED] "THE BRAIN 344 NOTES" tag renders at rest.
- P004 [FIXED] All 35 roster-agent name pills render at rest, overlapping cards.
- P005 [FIXED] ~150 white seat-tag sprites render at rest, stacking into ribbons.
- P006 [FIXED] All 20 dark plinth sprites ("Design · 10 · 6+4") render on top of everything.
- P007 [FIXED] Beings are hidden behind labels — agents invisible under their own cards.
- P008 [FIXED] Rest and focus look the same (cards merely dimmed), no clean state exists.
- P009 [FIXED] Bench badges volunteer stats (ON DESKS / DIVISION) nobody asked to see.
- P010 [FIXED] Dept badges flash live metric updates constantly at rest.
- P011 [FIXED] 27 pulsing `.live` dots blink at once at rest.
- P012 [FIXED] Pills/cards/sprites have no rest layering — whoever is last in DOM wins.
- P013 [FIXED] Seat-tag sprites draw through cards (`depthTest:false`).
- P014 [FIXED] Plinth label sprites draw through everything (`depthTest:false`).
- P015 [FIXED] Brain graph + brain tag + walkway ends compete at the center.
- P016 [FIXED] Zoom +/− buttons sit under ghost cards (z-index 10).
- P017 [FOLLOW-UP] Licence-line text collides with bottom ghost rows (blend mode artifact).
- P018 [FOLLOW-UP] Phone-size viewport renders the same 26 cards (no small-screen rest rule).
- P019 [FOLLOW-UP] Print / reduced-motion still emit the full clutter.
- P020 [FIXED] No quiet/clean mode existed — now the default.

## B. Hover does nothing useful (P021–P034)

- P021 [FIXED] Badge hover reveals a rail roster instead of a popup about the disk.
- P022 [FIXED] Hovering a 3D pod/desk/plinth does nothing — no handler existed.
- P023 [FIXED] Hovering a 3D agent does nothing — no tooltip existed.
- P024 [FIXED] Hovering plinth label sprites does nothing (never raycast).
- P025 [FIXED] Hovering seat tags does nothing (never raycast).
- P026 [FIXED] Hovering the Brain graph does nothing (only the tag click worked).
- P027 [FIXED] No pointer cursor over hoverable 3D things (affordance missing).
- P028 [FOLLOW-UP] Touch: tap-to-peek for pods (tap currently dives straight in).
- P029 [FOLLOW-UP] Keyboard-only discovery list for divisions (badges are tab stops but invisible).
- P030 [FIXED] Only 3 of 6 dept badges had hover wiring; other 3 were dead.
- P031 [FIXED] No hint that Escape dismisses cards.
- P032 [FIXED] The 300 ms hover grace is undiscoverable (popup now states the model).
- P033 [FIXED] No hover preview of what a click will do (popup now says "click to…").
- P034 [FIXED] Walkway hover shows nothing (kept: walkways are not targets).

## C. Bench-agent click → blank / no tasks (P035–P050)

- P035 [FIXED] Clicking a new-division body often opens nothing (citizen absent → silent return).
- P036 [FIXED] Clicking a floating seat tag never works (sprites excluded from targets).
- P037 [FIXED] Clicking a plinth label never works (not in any target list).
- P038 [FIXED] Clicking a bench desk/station opens nothing (stations untargeted).
- P039 [FIXED] Citizen ACTIVITY/tasks unreachable (tabs hidden, chat-only rail).
- P040 [FIXED] Citizen ACTIVITY had no real tasks (stats + feed only, no tasks.js query).
- P041 [FIXED] DEPLOY files under a roster dept agent — invisible on the citizen.
- P042 [FIXED] Blank chat when the card/greeting is missing (no fallback line).
- P043 [FIXED] Stale chat content when switching between citizens (render path hardened).
- P044 [FOLLOW-UP] Demo fallback replies are generic keyword matches, often irrelevant.
- P045 [FIXED] No "not staffed yet" message — the silent no-op is now a popup.
- P046 [FIXED] deskIndex→slug could resolve the wrong citizen (slug now pinned on the mesh).
- P047 [FOLLOW-UP] Standing citizens have no desk — reachable only via roster search.
- P048 [FIXED] Two click systems (roster vs bench) behaved differently — unified entry.
- P049 [FIXED] No per-agent task counts on hover (popup now shows the count).
- P050 [FIXED] `userData.citizen` was never set — resolution recomputed every click.

## D. Walkway starburst (P051–P062)

- P051 [FIXED] All 26 spokes converge near one point — starburst over the Brain.
- P052 [FIXED] Dept spokes terminate INSIDE the brain slab (±6.5 < half 8).
- P053 [FIXED] Bench spokes crowd the r=8.5 ring.
- P054 [FIXED] Zero angular de-confliction — parallel walkways fully overlap.
- P055 [FIXED] Straight segments cross each other near the center.
- P056 [FIXED] 3.2-unit width × 26 spokes buries the floor.
- P057 [FIXED] Opaque cream hides plants/floor beneath the knot.
- P058 [FOLLOW-UP] Walkways + MCP wires + connector tiles triple-draw one connection.
- P059 [FOLLOW-UP] Meeting agents walk the same overlapped lines.
- P060 [FOLLOW-UP] No user toggle to hide walkways.
- P061 [FOLLOW-UP] Dark-mode walkway tint stays heavy.
- P062 [FIXED] gate/brainGate points buried inside geometry (recomputed on the rim).

## E. Overlap, truncation, z-fighting (P063–P076)

- P063 [FIXED] Cards overlap each other at overview (MARKETING over SALES…).
- P064 [FIXED] Screen-clamp shoves cards onto neighboring pods.
- P065 [FIXED] Cards clipped at viewport edges ("EERING", "HOWN MP").
- P066 [FIXED] "· 4+1" summary pill clipped at the left edge.
- P067 [FIXED] RESEARCH "2 SHOWN" + "5 SHOWN PROJECT-MANA" ghost stack.
- P068 [FIXED] Zoom +/− buried under the ghost FINANCE card (z-index fix).
- P069 [FIXED] "SALES 6" ghost floats over the focused sales pod.
- P070 [FIXED] "MARKETING 37 SKILLS" ghost over marketing focus.
- P071 [FIXED] Ghost metric rows double-print behind DELIVERY.
- P072 [FIXED] Seat pills overlap each other on dense pods.
- P073 [FIXED] Seat pills overlap 3D monitors.
- P074 [FIXED] Cards crowd the task-panel edge.
- P075 [FIXED] Bottom ghost row collides with the licence line.
- P076 [FIXED] Orphan "21 SKILLS" number with no visible label.

## F. Ghost / transition states (P077–P084)

- P077 [FIXED] Mid-transition frames show full-detail ghosts — dimmed ghosts hidden too.
- P078 [FIXED] Dimmed ghosts kept `pointerEvents:auto` — clickable ghosts.
- P079 [FIXED] Ghost cards kept live-updating numbers while dimmed.
- P080 [FOLLOW-UP] Fly-to-rail billboard clone lingers 740 ms.
- P081 [FIXED] Double summary pills ("Design" + "· 4+1") during transitions.
- P082 [FOLLOW-UP] OVERVIEW button overlaps the blurred rail mid-fly-in.
- P083 [FOLLOW-UP] No transition-state indicator (loading vs done).
- P084 [FOLLOW-UP] Escape mid-transition could strand rail/card state.

## G. Labels, text, data (P085–P093)

- P085 [FOLLOW-UP] Task menu says OPERATIONS/FINANCE, keys are ops/fin — naming drift.
- P086 [FIXED] "6+4" / "5+1" arithmetic unexplained (popup now spells it out).
- P087 [FIXED] SHOWN vs SKILLS vs AGENTS units mixed (popup uses one line).
- P088 [FIXED] "ON DESKS 6 SHOWN / DIVISION SALES" redundant lines (folded).
- P089 [FIXED] Mixed case "Design · 10" vs UPPER "DESIGN · 3" for one pod.
- P090 [FOLLOW-UP] "CALLS S·A·J 14:31:16" cryptic live timer, unexplained.
- P091 [FOLLOW-UP] "∞ KNOWLEDGE" brain card copy is odd.
- P092 [FOLLOW-UP] Badge counts vs rail counts disagree (65 vs shown).
- P093 [FIXED] Stale "MARKETING 37 SKILLS" ghost after focus.

## H. Panels & controls (P094–P100)

- P094 [FOLLOW-UP] Task panel always open — shrinks the 3D view to 2/3.
- P095 [FOLLOW-UP] Command-bar dept menu duplicates the rail's job.
- P096 [FOLLOW-UP] Every feed item says "just now" — useless timestamps.
- P097 [FOLLOW-UP] Task % bars unexplained.
- P098 [FOLLOW-UP] Calendar button vs P key vs panel — three doors to tasks.
- P099 [FIXED] Zoom controls buried under scene cards.
- P100 [FIXED] Zero onboarding hint for the hover→popup→click model (popup teaches it).
