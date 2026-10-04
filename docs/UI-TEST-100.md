# UI/UX Test Report — 100 DOM + Browser checks

Built page: `dist/command-centre-v2.html` (file://, headless Chromium).
Result: **100/100 pass**, 0 fail, 0 console errors.

| # | Area | Check | Result |
|---|------|-------|--------|
| 1 | Boot | page loads with zero console/page errors | ✅ PASS |
| 2 | Boot | document has a title | ✅ PASS |
| 3 | Boot | #scene canvas is sized | ✅ PASS |
| 4 | Boot | #hud overlay exists | ✅ PASS |
| 5 | Boot | topbar brand renders | ✅ PASS |
| 6 | Boot | clock shows HH:MM:SS | ✅ PASS |
| 7 | Boot | topbar brand present | ✅ PASS |
| 8 | Boot | licence line present | ✅ PASS |
| 9 | Boot | no horizontal overflow | ✅ PASS |
| 10 | Boot | reduced-motion query is readable | ✅ PASS |
| 11 | Topbar | #topconn connector strip present | ✅ PASS |
| 12 | Topbar | #topmodels strip present | ✅ PASS |
| 13 | Topbar | CALENDAR button opens #calOv | ✅ PASS |
| 14 | Topbar | Escape closes calendar | ✅ PASS |
| 15 | Topbar | P key reopens calendar | ✅ PASS |
| 16 | Topbar | calendar renders month day-cells | ✅ PASS |
| 17 | Topbar | #overviewBtn present | ✅ PASS |
| 18 | Topbar | dark mode toggles body.dark | ✅ PASS |
| 19 | Core depts | focus dept marketing (key 1) opens rail | ✅ PASS |
| 20 | Core depts | focus dept emails (key 2) opens rail | ✅ PASS |
| 21 | Core depts | focus dept sales (key 3) opens rail | ✅ PASS |
| 22 | Core depts | focus dept ops (key 4) opens rail | ✅ PASS |
| 23 | Core depts | focus dept fin (key 5) opens rail | ✅ PASS |
| 24 | Core depts | focus dept delivery (key 6) opens rail | ✅ PASS |
| 25 | Core depts | rail shows the dept lead + tabs | ✅ PASS |
| 26 | Core depts | lead chat chips render | ✅ PASS |
| 27 | Core depts | Escape exits department focus | ✅ PASS |
| 28 | Badges | badge wired (attrs/aria): engineering (bench-engineering) | ✅ PASS |
| 29 | Badges | badge wired (attrs/aria): marketing (bench-marketing) | ✅ PASS |
| 30 | Badges | badge wired (attrs/aria): specialized (bench-specialized-a) | ✅ PASS |
| 31 | Badges | badge wired (attrs/aria): game-development (bench-game-development) | ✅ PASS |
| 32 | Badges | badge wired (attrs/aria): specialized (bench-specialized-b) | ✅ PASS |
| 33 | Badges | badge wired (attrs/aria): specialized (bench-specialized-c) | ✅ PASS |
| 34 | Badges | badge wired (attrs/aria): gis (bench-gis) | ✅ PASS |
| 35 | Badges | badge wired (attrs/aria): security (bench-security) | ✅ PASS |
| 36 | Badges | badge wired (attrs/aria): design (bench-design) | ✅ PASS |
| 37 | Badges | badge wired (attrs/aria): sales (bench-sales) | ✅ PASS |
| 38 | Badges | badge wired (attrs/aria): testing (bench-testing) | ✅ PASS |
| 39 | Badges | badge wired (attrs/aria): paid-media (bench-paid-media) | ✅ PASS |
| 40 | Badges | badge wired (attrs/aria): project-management (bench-project-management) | ✅ PASS |
| 41 | Badges | badge wired (attrs/aria): academic (bench-academic) | ✅ PASS |
| 42 | Badges | badge wired (attrs/aria): product (bench-product) | ✅ PASS |
| 43 | Badges | badge wired (attrs/aria): spatial-computing (bench-spatial-computing) | ✅ PASS |
| 44 | Badges | badge wired (attrs/aria): support (bench-support) | ✅ PASS |
| 45 | Badges | badge wired (attrs/aria): finance (bench-finance) | ✅ PASS |
| 46 | Badges | badge wired (attrs/aria): healthcare (bench-healthcare) | ✅ PASS |
| 47 | Badges | badge wired (attrs/aria): research (bench-research) | ✅ PASS |
| 48 | Badges | exactly 20 bench badges exist | ✅ PASS |
| 49 | Badges | every badge is wired (data-division, data-bench-id, title) | ✅ PASS |
| 50 | Divisions | open roster: engineering | ✅ PASS |
| 51 | Divisions | open roster: marketing | ✅ PASS |
| 52 | Divisions | open roster: specialized | ✅ PASS |
| 53 | Divisions | open roster: game-development | ✅ PASS |
| 54 | Divisions | open roster: gis | ✅ PASS |
| 55 | Divisions | open roster: security | ✅ PASS |
| 56 | Divisions | open roster: design | ✅ PASS |
| 57 | Divisions | open roster: sales | ✅ PASS |
| 58 | Divisions | open roster: testing | ✅ PASS |
| 59 | Divisions | open roster: paid-media | ✅ PASS |
| 60 | Divisions | open roster: project-management | ✅ PASS |
| 61 | Divisions | open roster: academic | ✅ PASS |
| 62 | Divisions | open roster: product | ✅ PASS |
| 63 | Divisions | open roster: spatial-computing | ✅ PASS |
| 64 | Divisions | open roster: support | ✅ PASS |
| 65 | Divisions | open roster: finance | ✅ PASS |
| 66 | Divisions | open roster: healthcare | ✅ PASS |
| 67 | Divisions | open roster: research | ✅ PASS |
| 68 | Divisions | engineering roster shows #podCount | ✅ PASS |
| 69 | Divisions | engineering roster shows #podDesks seated | ✅ PASS |
| 70 | Divisions | keyboard map (.pr-keys) shown in rail | ✅ PASS |
| 71 | Rows | row shows citizen name | ✅ PASS |
| 72 | Rows | row shows a role tag | ✅ PASS |
| 73 | Rows | row shows a description | ✅ PASS |
| 74 | Rows | row has CHAT button | ✅ PASS |
| 75 | Rows | row has DEPLOY button | ✅ PASS |
| 76 | Rows | rows carry data-division | ✅ PASS |
| 77 | Rows | rows carry data-pod | ✅ PASS |
| 78 | Rows | list is capped at 20 rows | ✅ PASS |
| 79 | Rows | "show all N (M more)" expander present | ✅ PASS |
| 80 | Rows | expander reveals the full roster | ✅ PASS |
| 81 | Rows | back button returns toward overview | ✅ PASS |
| 82 | Search | #podSearch input present | ✅ PASS |
| 83 | Search | typing filters the roster | ✅ PASS |
| 84 | Search | a no-match term shows an empty state | ✅ PASS |
| 85 | Search | no-match shows a hint line | ✅ PASS |
| 86 | Search | clearing search restores the roster | ✅ PASS |
| 87 | Search | filter matches description text | ✅ PASS |
| 88 | Chat | CHAT button opens citizen chat | ✅ PASS |
| 89 | Chat | citizen name rendered in rail header | ✅ PASS |
| 90 | Chat | chat input + send present | ✅ PASS |
| 91 | Chat | sending a message yields a reply bubble | ✅ PASS |
| 92 | Deploy | DEPLOY reveals the goal input | ✅ PASS |
| 93 | Deploy | too-short goal is rejected | ✅ PASS |
| 94 | Deploy | valid goal shows a friendly status | ✅ PASS |
| 95 | Deploy | controls re-enable after sending | ✅ PASS |
| 96 | Hover | hovering a badge reveals its cards (pure hover) | ✅ PASS |
| 97 | Hover | hovering another division hides the stale cards | ✅ PASS |
| 98 | Hover | Escape hides all division cards | ✅ PASS |
| 99 | Hover | no cards are visible at rest on fresh load | ✅ PASS |
| 100 | Hover | badges expose aria role/label/expanded | ✅ PASS |

All 20 bench badges (desks) and all 18 divisions were exercised: open roster, reveal rows, search, chat, deploy, hover reveal/hide, Escape.
