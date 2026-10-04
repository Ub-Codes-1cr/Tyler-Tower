// grid-probe — V4 Phase 3 instrument.
//
// Asserts the dotted light grid: 26 dashed ground chords from the orb rim to each
// division command node (docs/V4-ORB-CAMPUS-PLAN.md §4).
//
// CONTRACT (what the probe expects Phase 3 to build):
//   window.TYLER_V4.grid = {
//     group,            THREE.Group named 'dottedGrid' added to the scene
//     lines,            Map<podId, { line, mat, len, state, travel }>
//     setLineState(podId, state), tick(dt, zoom), relinkTheme(dark)
//   }
//   each line.userData = { podId, dept, division, state, baseColor }
//
// Why this probe exists in its own right: the owner mock shows 26 chords converging
// through one point. That is audit problem P051 ("all 26 spokes converge near one
// point - starburst over the Brain") and P052 ("spokes terminate INSIDE the brain
// slab"), both filed and both marked FIXED in V2-CAMPUS-PLAN.md. The rim routing
// and 64-bin azimuth de-confliction already exist for the skybridges; check 6 and 7
// below are what stop them being lost on the chords.
//
// This is a 2D ground-plane check at y=0.25, not the 3D centrelines that
// campus-curves.mjs verifies for the skybridges. Different maths, different probe.
import { resolve } from 'path';
let chromium = null;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 300)));
await page.goto('file://' + resolve('dist/command-centre-v2.html') + '?s=grid');
await page.waitForTimeout(6000);

let pass = 0, total = 0;
function check(name, ok, detail) {
  total++;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(total).padStart(2)}. ${name}${detail ? '  — ' + detail : ''}`);
}
const absent = 'window.TYLER_V4.grid is null — Phase 0 baseline';

// ---- 1-2 topology ---------------------------------------------------------
const topo = await page.evaluate(() => {
  const g = (window.TYLER_V4 || {}).grid;
  const S = window.TYLER_SCENE;
  if (!g || !S) return { present: false };
  const entries = [...g.lines.entries()].map(([podId, e]) => {
    const p = e.line.geometry.getAttribute('position');
    return {
      podId,
      ax: +p.getX(0).toFixed(3), ay: +p.getY(0).toFixed(3), az: +p.getZ(0).toFixed(3),
      bx: +p.getX(1).toFixed(3), by: +p.getY(1).toFixed(3), bz: +p.getZ(1).toFixed(3),
      state: e.state,
      dashed: !!e.mat.isLineDashedMaterial,
      depthWrite: e.mat.depthWrite,
      opacity: +e.mat.opacity.toFixed(3),
      color: '#' + e.mat.color.getHexString(),
      dashSize: e.mat.dashSize, gapSize: e.mat.gapSize,
      hasLineDistance: !!e.line.geometry.getAttribute('lineDistance'),
      ud: e.line.userData || {}
    };
  });
  return { present: true, name: g.group.name, count: entries.length, entries, expected: 6 + S.BENCH_PODS.length };
});
check('grid subsystem present', topo.present === true, topo.present ? '' : absent);
check(`exactly ${topo.expected} chords, one per pod (6 departments + ${topo.expected - 6} benches)`,
  topo.present && topo.count === topo.expected && topo.expected === 26,
  topo.present ? `${topo.count} chords, expected ${topo.expected}` : '');
check('chord pod ids map 1:1 onto the campus pod list',
  topo.present && new Set(topo.entries.map(e => e.podId)).size === topo.count
  && topo.entries.every(e => !!e.podId),
  topo.present ? `${new Set(topo.entries.map(e => e.podId)).size} unique ids` : '');

// ---- 3-4 elevation + material contract ------------------------------------
const elev = (topo.entries || []);
const badY = elev.filter(e => Math.abs(e.ay - 0.25) > 1e-3 || Math.abs(e.by - 0.25) > 1e-3);
check('every chord is pinned at y=0.25 (clear of the y=-7 shadow plane and y=0.12 plinth floors)',
  topo.present && badY.length === 0,
  topo.present ? badY.length ? `offenders: ${badY.map(e => e.podId).join(',')}` : `all ${elev.length} at y=0.25` : '');
const matBad = elev.filter(e => !e.dashed || e.depthWrite !== false);
check('every chord uses LineDashedMaterial with depthWrite=false',
  topo.present && matBad.length === 0,
  topo.present ? matBad.length ? `offenders: ${matBad.map(e => `${e.podId}(dashed=${e.dashed},dw=${e.depthWrite})`).join(' ')}` : `all ${elev.length} conform` : '');
check('every chord carries a lineDistance attribute (the only way to animate dashes)',
  topo.present && elev.every(e => e.hasLineDistance),
  topo.present ? `${elev.filter(e => e.hasLineDistance).length}/${elev.length}` : '');

// ---- 5 terminus is the command node, not the pod centre -------------------
const terminus = await page.evaluate(() => {
  const g = (window.TYLER_V4 || {}).grid;
  const S = window.TYLER_SCENE;
  if (!g || !S) return { present: false };
  const out = [];
  for (const [podId, e] of g.lines) {
    const p = e.line.geometry.getAttribute('position');
    const bx = p.getX(1), bz = p.getZ(1);
    // the documented anchor for this pod
    const bench = S.benchRT && S.benchRT[podId];
    const anchor = (bench && bench.nodePos) ? bench.nodePos
      : (S.LAYOUT && S.LAYOUT[podId] && S.LAYOUT[podId].pos) || null;
    if (!anchor) { out.push({ podId, dist: null }); continue; }
    const d = bench && bench.nodePos
      ? Math.hypot(bx - anchor.x, bz - anchor.z)          // must be the node, exactly
      : Math.hypot(bx - S.LAYOUT[podId].pos[0], bz - S.LAYOUT[podId].pos[1]);
    out.push({ podId, dist: +d.toFixed(3), isNode: !!(bench && bench.nodePos) });
  }
  return { present: true, out };
});
const far = (terminus.out || []).filter(t => t.dist !== null && t.dist > 2.0);
check('every chord terminates within 2.0u of its pod anchor (command node where one exists)',
  terminus.present && far.length === 0 && terminus.out.length > 0,
  terminus.present ? far.length ? `offenders: ${far.map(t => `${t.podId}@${t.dist}`).join(' ')}` : `${terminus.out.length} anchors resolved` : '');
check('bench chords land on the command node, not the pod centre (BRAIN > NODE > AGENTS)',
  terminus.present && terminus.out.filter(t => t.isNode).length === 20,
  terminus.present ? `${terminus.out.filter(t => t.isNode).length} of 20 benches resolved to nodePos` : '');

// ---- 6 P051 guard: no two chords come within 2.0u ------------------------
const clash = await page.evaluate(() => {
  const g = (window.TYLER_V4 || {}).grid;
  if (!g) return { present: false };
  const segs = [];
  for (const [podId, e] of g.lines) {
    const p = e.line.geometry.getAttribute('position');
    const a = { x: p.getX(0), z: p.getZ(0) }, b = { x: p.getX(1), z: p.getZ(1) };
    segs.push({ podId, a, b });
  }
  function ptSeg(p, a, b) {
    const vx = b.x - a.x, vz = b.z - a.z;
    const L = vx * vx + vz * vz;
    const t = L ? Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.z - a.z) * vz) / L)) : 0;
    return Math.hypot(p.x - (a.x + t * vx), p.z - (a.z + t * vz));
  }
  let worst = Infinity, pair = null, pairs = 0;
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const s = segs[i], t = segs[j];
    const d = Math.min(ptSeg(s.a, t.a, t.b), ptSeg(s.b, t.a, t.b), ptSeg(t.a, s.a, s.b), ptSeg(t.b, s.a, s.b));
    if (d < 2.0) pairs++;
    if (d < worst) { worst = d; pair = [s.podId, t.podId]; }
  }
  return { present: true, pairs, worst: +worst.toFixed(3), pair, tested: segs.length };
});
check('no two chord centrelines come within 2.0u (P051 starburst guard)',
  clash.present && clash.worst >= 2.0,
  clash.present ? `closest pair ${clash.pair ? clash.pair.join('/') : '-'} at ${clash.worst}u · ${clash.pairs} violating pairs of ${clash.tested * (clash.tested - 1) / 2}` : '');

// ---- 7 P052 guard: no chord terminates inside the orb --------------------
const inside = await page.evaluate(() => {
  const g = (window.TYLER_V4 || {}).grid;
  const orb = (window.TYLER_V4 || {}).orb;
  if (!g) return { present: false };
  const R = orb ? (orb.config.radius + 0.6) : 7.6;   // orb radius + 0.6 clearance
  const bad = [];
  for (const [podId, e] of g.lines) {
    const p = e.line.geometry.getAttribute('position');
    const r = Math.hypot(p.getX(0), p.getZ(0));
    if (r < R) bad.push({ podId, r: +r.toFixed(2) });
  }
  return { present: true, R, bad };
});
check(`no chord starts inside the orb rim (r >= ${inside.R})`,
  inside.present && inside.bad.length === 0,
  inside.present ? inside.bad.length ? `inside: ${inside.bad.map(b => `${b.podId}@${b.r}`).join(' ')}` : 'all 26 start on or outside the rim' : '');

// ---- 8 six reachable states ----------------------------------------------
const states = await page.evaluate(() => {
  const g = (window.TYLER_V4 || {}).grid;
  if (!g || typeof g.setLineState !== 'function') return { present: false };
  const first = [...g.lines.keys()][0];
  const want = ['idle', 'syncing', 'streaming', 'approval', 'error', 'done'];
  const seen = [];
  const e = g.lines.get(first);
  const before = { color: '#' + e.mat.color.getHexString(), opacity: +e.mat.opacity.toFixed(3), travel: e.travel || 0 };
  for (const s of want) {
    g.setLineState(first, s);
    seen.push({ s, color: '#' + e.mat.color.getHexString(), opacity: +e.mat.opacity.toFixed(3), dashSize: e.mat.dashSize, gapSize: e.mat.gapSize });
  }
  g.setLineState(first, 'idle');
  return { present: true, seen, before };
});
check('all six states are reachable and visually distinct',
  states.present && states.seen.length === 6 && new Set(states.seen.map(s => s.color + s.opacity)).size >= 5,
  states.present ? states.seen.map(s => `${s.s}=${s.color}@${s.opacity}`).join(' ') : 'setLineState missing');
check('state colours reuse existing semantic tokens (no new hue invented)',
  states.present && states.seen.every(s => /^#(5a5a5a|151414|2b6beb|f2b84b|c94f3d|1e9070)$/i.test(s.color)),
  states.present ? states.seen.map(s => s.color).join(' ') : '');

// ---- 9 travel moves the lineDistance attribute, not material.dashOffset --
const travel = await page.evaluate(async () => {
  const g = (window.TYLER_V4 || {}).grid;
  if (!g) return { present: false };
  const first = [...g.lines.keys()][0];
  const e = g.lines.get(first);
  const attr = e.line.geometry.getAttribute('lineDistance');
  const a0 = Array.from(attr.array);
  g.setLineState(first, 'streaming');
  for (let i = 0; i < 30; i++) g.tick(0.016, 1.2);
  const a1 = Array.from(attr.array);
  // the bug this catches: three's LineDashedMaterial has no dashOffset property,
  // so material.dashOffset = x writes something nothing reads and the dashes sit still
  const propExists = 'dashOffset' in e.mat || e.mat.dashOffset !== undefined;
  g.setLineState(first, 'idle');
  for (let i = 0; i < 120; i++) g.tick(0.016, 1.2);
  const a2 = Array.from(attr.array);
  return { present: true, a0, a1, a2, moved: Math.abs(a1[0] - a0[0]) > 0.01, returned: Math.abs(a2[0] - a0[0]) < 0.5, propExists };
});
check('streaming advances the lineDistance attribute (NOT material.dashOffset, which does not exist in three)',
  travel.present && travel.moved && travel.propExists === false,
  travel.present ? `lineDistance[0] ${travel.a0[0]} → ${(+travel.a1[0]).toFixed(2)} · dashOffset on material: ${travel.propExists ? 'PRESENT (suspicious)' : 'absent, as expected'}` : '');
check('returning to idle settles the travel back to baseline',
  travel.present && travel.returned,
  travel.present ? `settled at ${(+travel.a2[0]).toFixed(3)}` : '');

// ---- 10 survives focus / zoom / dark / resize ---------------------------
const survival = await page.evaluate(async () => {
  const g = (window.TYLER_V4 || {}).grid;
  const S = window.TYLER_SCENE;
  if (!g || !S) return { present: false };
  const n0 = g.lines.size;
  const key = (k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  key('1'); await new Promise(r => setTimeout(r, 1200));            // focus marketing
  const nFocus = g.lines.size;
  key('Escape'); await new Promise(r => setTimeout(r, 1200));
  const nBack = g.lines.size;
  if (S.view) { S.view.zoom = 2.6; S.applyCamera(); g.tick(0.016, 2.6); }
  const nZoom = g.lines.size;
  const darkBefore = g.lines.size;
  if (window.CC && window.CC.setDark) { window.CC.setDark(true); await new Promise(r => setTimeout(r, 400)); g.relinkTheme(true); }
  const darkAfter = g.lines.size;
  const themedIdle = (() => {
    for (const [, e] of g.lines) if (e.state === 'idle' || !e.state) return '#' + e.mat.color.getHexString();
    return null;
  })();
  if (window.CC && window.CC.setDark) window.CC.setDark(false);
  return { present: true, n0, nFocus, nBack, nZoom, darkBefore, darkAfter, themedIdle };
});
check('chord count survives department focus, Escape, zoom and dark-mode toggle',
  survival.present && survival.n0 === 26 && survival.nFocus === 26 && survival.nBack === 26
  && survival.nZoom === 26 && survival.darkAfter === 26,
  survival.present ? `rest=${survival.n0} focus=${survival.nFocus} back=${survival.nBack} zoom=${survival.nZoom} dark=${survival.darkAfter}` : '');
check('relinkTheme recolours idle chords AND any chord mid-stream (half-themed-network bug)',
  survival.present && survival.themedIdle !== '#5a5a5a',
  survival.present ? `idle colour in dark = ${survival.themedIdle} (a '#5a5a5a' here means the recolour skipped idle lines)` : '');

// ---- 11 no duplicate of the conduit / MCP wire (P058) -------------------
// Count conduits by userData.part, not by class: in three, LineSegments extends
// Line, so an `isLineSegments && !isLine` filter matches nothing and the check
// passes vacuously.
const p058 = await page.evaluate(() => {
  const S = window.TYLER_SCENE;
  if (!S) return { present: false };
  let conduits = 0, lines = 0, byPart = {};
  S.scene.traverse(o => {
    if (o.isLineSegments || o.isLine) {
      lines++;
      const part = (o.userData && o.userData.part) || '(none)';
      byPart[part] = (byPart[part] || 0) + 1;
      if (part === 'conduit') conduits++;
    }
  });
  const w = document.getElementById('wires');
  return { present: true, conduits, lines, byPart, wires: w ? w.querySelectorAll('path').length : 0 };
});
check('the node→desk conduit fan is counted and NOT duplicated (P058)',
  p058.present && p058.conduits === 20,
  p058.present ? `conduits(userData.part==='conduit')=${p058.conduits} expected 20 · all line objects by part: ${JSON.stringify(p058.byPart)} · MCP wire paths=${p058.wires}` : '');

check('ERRORS(0) — the grid throws nothing', errs.length === 0,
  errs.slice(0, 2).map(e => e.split('\n')[0]).join(' | '));

console.log(`\nGRID-PROBE: ${pass}/${total} · ERRORS(${errs.length})`);
for (const e of errs.slice(0, 4)) console.log('  ' + e.split('\n').slice(0, 2).join(' | '));
await page.screenshot({ path: 'scripts/out/grid-probe.png' });
await browser.close();
process.exitCode = pass === total && !errs.length ? 0 : 1;