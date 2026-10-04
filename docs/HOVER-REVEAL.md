# Division hover / reveal

The office has **20 divisions**: the original 6 department pods (emails, sales,
marketing, operations, finance, delivery) and the 14 bench divisions added later
(engineering, design, testing, GIS, security, game development, paid media,
project management, academic, product, spatial computing, support, finance,
healthcare, research, and the three specialised benches).

Every division works the same way. This document is the contract.

## What is hidden, what is shown

- A **division badge** (`.badge.bench`) is the hover **target**. It is always
  visible and always hit-testable. It is labelled with `data-division`.
- The division's **skill cards** (`.division-card`, one per seated skill) are
  **hidden by default** — `visibility: hidden; opacity: 0; pointer-events: none`.
- A card becomes visible only when its division is revealed. The reveal sets the
  class `.visible`, which flips `visibility`, `opacity`, `pointer-events` and
  `z-index` in one place (`src/shell.html`).

The invariant, checked by `scripts/typo-probe.mjs` on every run:

> no `.division-card` is visible at start-up.

## The golden typography

All division text reads the same variables in `:root` (`src/shell.html`), taken
from the original six divisions. A new division cannot drift because the sizes
are variables, not literals:

| variable | value |
| --- | --- |
| `--division-font-family` | `var(--serif)` |
| `--division-font-size` | `13px` |
| `--division-font-weight` | `500` |
| `--division-color` | `var(--ink)` |
| `--division-line-height` | `1.3` |
| `--division-letter-spacing` | `.02em` |
| `--division-name-size` | `13px` |
| `--division-tag-size` | `8.5px` |
| `--division-desc-size` | `11.5px` |

`scripts/typo-probe.mjs` opens an old division and a new one and asserts the
computed values are byte-identical.

## The engine

`src/main.js`, block `division card hover / reveal engine`:

- `revealDivision(div, source)` — the single entry point. Clears the pending
  hide timer (so a fast hover sweep never races), remembers the source for focus
  return, and re-applies the reveal even if the division is already active (so a
  just-repainted roster still lights up).
- `scheduleHide()` — one shared timer (`DIVISION_HOVER_GRACE`, 300 ms). Leaving a
  target starts it; hovering a card of the active division keeps it alive.
- `hideAllDivisionCards(restoreFocus)` — used by Escape, click-outside, blur and
  focus exit. `restoreFocus` sends focus back to the badge, with a
  `suppressReveal` guard so restoring focus does not re-open the cards.
- `wireDivisionTarget(el, getDiv)` — attaches mouse, focus, touch and keyboard
  handlers to any element that identifies a division.
- `divisionCards()` — a cached node list, invalidated on every repaint by
  `invalidateDivisionCards()`.

A bench badge click opens that bench's **skill roster** through `buildPodRail`;
it never calls `buildDeptRail`, because bench divisions are not departments.

## Adding a new division

1. Add the pod to `BENCH_PODS` in `src/data.js` with a `division`, `pos`, `w`,
   `d`, `count`, `chip`/`color`.
2. Add citizens for it in `brain/agency-personas/citizens.json`. `build.mjs` bakes
   them into `src/bench-data.js` on the next build.
3. Add a `division → department` route to `POD_DEPT` in `src/citizen-card.js`.
4. Add work lines for the division's screens if it should animate (see the
   `WORKLINES` map).

Nothing else is needed: the badge already carries `data-division`, hover works,
the roster opens, search works, DEPLOY routes through `deptFor`.

## Keyboard map

- **Tab** — move between division badges.
- **Enter** / **Space** on a badge — reveal the division and open its roster.
- **Tab** — move into the revealed cards.
- **Enter** on a card's CHAT — open that citizen's chat.
- **Escape** — hide the cards and return focus to the badge.
- **Click outside** the cards or the badge — hide the cards.

## Verifying

With the dev server running on `http://localhost:4520/`:

```
node scripts/typo-probe.mjs      # old vs new typography + no cards at rest
node scripts/hover-probe.mjs     # reveal, switch, escape, focus, touch, aria
node scripts/a11y-probe.mjs      # aria, tab order, keyboard map, focus ring, z-order
node scripts/roster-probe.mjs    # search cap/expander, deploy validation and errors
node scripts/pod-probe.mjs       # end-to-end badge → roster → chat → deploy
node scripts/soak-probe.mjs      # all 20 divisions, all paths, ERROR(0)
```

Every probe prints `PASS`/`FAIL` per item and ends with an error count that must
be `ERRORS(0)`.
