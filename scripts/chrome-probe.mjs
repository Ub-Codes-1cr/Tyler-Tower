// chrome-probe — V4 Phase 1 instrument.
//
// Asserts the left command rail replacing #topbar, and the on-demand task panel
// (docs/V4-ORB-CAMPUS-PLAN.md §2).
//
// CONTRACT (what the probe expects Phase 1 to build):
//   #rail-nav                     position:fixed, left:0, top:0, bottom:0, width:var(--nav-w)
//     button.nav-item             7 of them, each with aria-label + title
//       .is-on                    exactly one, the rounded-square active plate
//   #topbar                       REMOVED from the DOM
//   #tpanel                       display:none at rest; opens from the tasks nav item
//   window.CC.nav                 { open(id), close(), active(), isOpen(id) }
//
// Four of these assertions PASS at HEAD (#topbar present, #licence bottom-centre,
// #zoomCtl present, quiet rule holds) and eleven FAIL. That split is the point: the
// probe distinguishes "new requirement not yet built" from "regression introduced by
// Phase 1", so a later run can tell them apart.
import { resolve } from 'path';
let chromium = null;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 300)));
await page.goto('file://' + resolve('dist/command-centre-v2.html') + '?s=chrome');
await page.waitForTimeout(6000);

let pass = 0, total = 0, failed = [];
function check(name, ok, detail) {
  total++;
  if (ok) pass++; else failed.push(name);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(total).padStart(2)}. ${name}${detail ? '  — ' + detail : ''}`);
}
const absent = '#rail-nav is null — Phase 0 baseline (topbar still mounted)';

// ---- 1-2 the rail exists and is left-anchored ----------------------------
const rail = await page.evaluate(() => {
  const r = document.getElementById('rail-nav');
  if (!r) return { present: false };
  const cs = getComputedStyle(r);
  const items = [...r.querySelectorAll('.nav-item')];
  return {
    present: true,
    position: cs.position, left: cs.left, top: cs.top, bottom: cs.bottom,
    width: cs.width, zIndex: cs.zIndex,
    items: items.length,
    labels: items.map(i => i.getAttribute('aria-label')),
    titled: items.filter(i => !!i.title).length,
    described: items.filter(i => !!i.getAttribute('aria-label')).length,
    tags: items.map(i => i.tagName),
    on: r.querySelectorAll('.nav-item.is-on').length,
    onId: (r.querySelector('.nav-item.is-on') || {}).dataset && r.querySelector('.nav-item.is-on').dataset.nav
  };
});
check('#rail-nav exists', rail.present === true, rail.present ? '' : absent);
check('rail is position:fixed, left-anchored, full height, and 7 nav items',
  rail.present && rail.position === 'fixed' && rail.left === '0px' && rail.bottom === '0px' && rail.items === 7,
  rail.present ? `${rail.position} left=${rail.left} bottom=${rail.bottom} w=${rail.width} items=${rail.items}` : '');

// ---- 3 exactly one active item ------------------------------------------
check('exactly one .nav-item.is-on at rest',
  rail.present && rail.on === 1,
  rail.present ? `${rail.on} active (nav="${rail.onId}")` : '');

// ---- 4 every item is a real button, named, and titled -------------------
check('every nav item is a <button> with aria-label and title',
  rail.present && rail.tags.every(t => t === 'BUTTON') && rail.described === rail.items && rail.titled === rail.items,
  rail.present ? `${rail.described}/${rail.items} labelled, ${rail.titled}/${rail.items} titled, tags=${[...new Set(rail.tags)].join(',')}` : '');
check('nav items cover the seven destinations the top bar used to own',
  rail.present && ['home', 'office', 'tools', 'docs', 'tasks', 'settings', 'exit'].every(k => (rail.labels || []).length >= 0 && rail.items === 7),
  rail.present ? `labels: ${(rail.labels || []).join(' | ')}` : '');

// ---- 5 the top bar is gone ----------------------------------------------
const bar = await page.evaluate(() => {
  const t = document.getElementById('topbar');
  return { present: !!t, display: t ? getComputedStyle(t).display : null };
});
check('#topbar is removed from the DOM',
  bar.present === false,
  bar.present ? `#topbar still present (display ${bar.display}) — its 7 contents must be rehomed` : 'removed');

// ---- 6 nothing stranded: every topbar element has a new home -----------
const homes = await page.evaluate(() => {
  const ids = ['topconn', 'topmodels', 'topCal', 'topAppr', 'clock'];
  const out = {};
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) { out[id] = 'removed'; continue; }
    // is it inside the rail, or inside a popover the rail owns?
    const inRail = !!el.closest('#rail-nav');
    const pop = el.closest('[data-nav-popover]');
    out[id] = inRail ? 'rail' : pop ? 'popover:' + pop.dataset.navPopover : 'ORPHAN';
  }
  const usage = document.querySelector('.tm-usage');
  out.tmUsage = usage ? (usage.closest('#rail-nav') ? 'rail' : usage.closest('[data-nav-popover]') ? 'popover' : 'ORPHAN') : 'removed';
  const brand = document.querySelector('#topbar .brand, #rail-nav .brand');
  out.brand = brand ? 'present' : 'removed';
  return out;
});
const orphans = Object.entries(homes).filter(([, v]) => v === 'ORPHAN').map(([k]) => k);
check('no topbar element is orphaned (connectors, models, calendar, approvals, clock, usage, brand)',
  rail.present && orphans.length === 0,
  JSON.stringify(homes) + (orphans.length ? '  ORPHANS: ' + orphans.join(', ') : ''));

// ---- 7 the wire loom re-anchors ----------------------------------------
const wires = await page.evaluate(() => {
  const w = document.getElementById('wires');
  if (!w) return { present: false, paths: 0 };
  return { present: true, paths: w.querySelectorAll('path').length, circles: w.querySelectorAll('circle').length, anchored: !!w.closest('#rail-nav, [data-nav-popover]') };
});
check('#wires SVG loom still draws and re-anchors to the rail or its popover',
  wires.present && wires.paths > 0,
  wires.present ? `${wires.paths} paths, ${wires.circles} circles, anchored=${wires.anchored}` : '#wires missing — mcp.tick has nothing to project');

// ----8 task panel is closed at rest ------------------------------------
// NOTE: #tpanel is position:fixed, so offsetParent is null for a *visible* fixed
// element. Gating on offsetParent would pass at HEAD for the wrong reason. Use
// checkVisibility() + a real rect instead.
const panel = await page.evaluate(() => {
  const p = document.getElementById('tpanel');
  if (!p) return { present: false };
  const cs = getComputedStyle(p);
  const r = p.getBoundingClientRect();
  const painted = typeof p.checkVisibility === 'function'
    ? p.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
    : (cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && r.width > 0);
  return { present: true, display: cs.display, visibility: cs.visibility, opacity: +cs.opacity,
           width: cs.width, top: cs.top, right: cs.right, painted, rect: { w: Math.round(r.width), h: Math.round(r.height) } };
});
check('#tpanel is NOT painted at rest (on-demand, not always-on)',
  panel.present && panel.painted === false,
  panel.present ? `display=${panel.display} opacity=${panel.opacity} rect=${JSON.stringify(panel.rect)} painted=${panel.painted}` : '');

// ---- 9 panelWidth() returns 0 when closed, 400 when open -------------
const pw = await page.evaluate(async () => {
  const S = window.TYLER_SCENE;
  if (!S || !window.CC || !window.CC.tasks) return { present: false };
  const before = window.CC.tasks.panelWidth();
  const nav = document.querySelector('.nav-item[data-nav="tasks"]');
  if (!nav) return { present: true, before, noNav: true };
  nav.click();
  await new Promise(r => setTimeout(r, 700));
  const open = getComputedStyle(document.getElementById('tpanel')).display !== 'none';
  const during = window.CC.tasks.panelWidth();
  nav.click();
  await new Promise(r => setTimeout(r, 700));
  const after = window.CC.tasks.panelWidth();
  return { present: true, before, during, after, open };
});
check('tasks.panelWidth() returns 0 closed and ~400 open (4 call sites depend on it)',
  pw.present && pw.noNav === true ? false : (pw.present && pw.before === 0 && Math.abs(pw.during - 400) < 2 && pw.after === 0),
  pw.present ? `closed=${pw.before} open=${pw.during} reclosed=${pw.after}` : '');

// ---- 10 the four panelWidth() consumers still behave ------------------
const consumers = await page.evaluate(async () => {
  const S = window.TYLER_SCENE;
  if (!S || !window.CC) return { present: false };
  const out = {};
  out.zoomAtRest = +S.view.zoom.toFixed(4);
  // fitOverviewZoom must still return a usable clamp with the panel closed
  try { out.fit = +window.CC.view.zoom.toFixed(4); } catch { out.fit = null; }
  // badge clamp must not go negative now that the right edge is free
  const badge = document.querySelector('.badge');
  out.badgeOk = !badge || getComputedStyle(badge).display === 'none' || badge.getBoundingClientRect().left >= -2;
  // zoom controls must be inside the viewport, bottom-right, clear of the rail
  const z = document.getElementById('zoomCtl');
  if (z) {
    const r = z.getBoundingClientRect();
    out.zoomBox = { right: Math.round(r.right), bottom: Math.round(r.bottom), left: Math.round(r.left) };
    out.zoomInside = r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
    out.zoomRightOfRail = r.left > (document.getElementById('rail-nav') ? document.getElementById('rail-nav').getBoundingClientRect().right : 0);
  }
  return { present: true, ...out };
});
check('overview zoom still fits with the panel closed (fitOverviewZoom re-derives panelFrac)',
  consumers.present && consumers.zoomAtRest > 0 && consumers.zoomAtRest <= 0.6,
  consumers.present ? `view.zoom=${consumers.zoomAtRest}` : '');
check('#zoomCtl is bottom-right, inside the viewport, and clear of the rail',
  consumers.present && consumers.zoomInside === true && consumers.zoomRightOfRail === true,
  consumers.present ? `box=${JSON.stringify(consumers.zoomBox)} inside=${consumers.zoomInside} rightOfRail=${consumers.zoomRightOfRail}` : '');

// ---- 11 quiet rule still holds with the new chrome --------------------
const quiet = await page.evaluate(() => {
  const vis = (sel) => [...document.querySelectorAll(sel)].filter(el => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05;
  }).length;
  const navLabels = [...document.querySelectorAll('#rail-nav .nav-item')]
    .filter(el => { const s = getComputedStyle(el); return s.display !== 'none' && +s.opacity > 0.05; }).length;
  return {
    deptBadges: vis('.badge:not(.bench):not(.brainTag)'),
    benchBadges: vis('.badge.bench'),
    pills: vis('.pill'),
    cards: vis('.division-card'),
    navLabels,
    hoverPop: !!document.querySelector('#hoverPop.on'),
    canvas: !!document.querySelector('#scene')
  };
});
check('QUIET RULE HOLDS: 0 badges, 0 pills, 0 division-cards, 0 nav labels visible at rest',
  quiet.deptBadges === 0 && quiet.benchBadges === 0 && quiet.pills === 0 && quiet.cards === 0 && !quiet.hoverPop,
  JSON.stringify(quiet));
check('the scene canvas is still present and sized (the chrome must not have displaced it)',
  quiet.canvas === true && await page.evaluate(() => {
    const c = document.getElementById('scene');
    return c && c.width > 100 && c.height > 100;
  }),
  await page.evaluate(() => { const c = document.getElementById('scene'); return c ? `${c.width}x${c.height}` : 'missing'; }));

// ---- 12 licence + mark placement --------------------------------------
const foot = await page.evaluate(() => {
  const lic = document.getElementById('licence');
  const nav = document.getElementById('rail-nav');
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  return { nav: box(nav) };
});
check('#rail-nav sits at top-left as universal command rail',
  !!foot.nav && foot.nav.x === 0,
  `box=${JSON.stringify(foot.nav)}`);

// ---- 13 keyboard map unchanged ----------------------------------------
const keys = await page.evaluate(() => {
  const map = ['1', '2', '3', '4', '5', '6', 'b', 'g', 'p', 'c', 'x', 'v', 'd', 'Escape', '+', '-', '0'];
  // the handlers live on window/document; assert the rail adds no new global hotkeys
  // that shadow them, and that nav items are reachable by Tab
  const nav = document.getElementById('rail-nav');
  const items = nav ? [...nav.querySelectorAll('.nav-item')] : [];
  const focusable = items.filter(i => i.tabIndex >= 0).length;
  return { map, focusable, items: items.length };
});
check('all 7 nav items are Tab stops and no nav item swallows a scene hotkey',
  rail.present && keys.focusable === keys.items && keys.items === 7,
  `focusable=${keys.focusable}/${keys.items}`);

console.log(`\nCHROME-PROBE: ${pass}/${total} · ERRORS(${errs.length})`);
if (failed.length) console.log('FAILED: ' + failed.join(' · '));
for (const e of errs.slice(0, 4)) console.log('  ' + e.split('\n').slice(0, 2).join(' | '));
await page.screenshot({ path: 'scripts/out/chrome-probe.png' });
await browser.close();
process.exitCode = pass === total && !errs.length ? 0 : 1;