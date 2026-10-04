// packet-probe — V4 Phase 4 instrument.
//
// Asserts the pooled packet engine: zero runtime allocation, correct recycle
// lifecycle, no silent drops (docs/V4-ORB-CAMPUS-PLAN.md §5).
//
// CONTRACT (what the probe expects Phase 4 to build):
//   window.TYLER_V4.packets = {
//     pool,             pre-allocated meshes, length === maxPackets
//     activePackets,    live packets
//     dropped,          COUNT of discarded packets (not a silent return)
//     peak,             high-water mark of activePackets.length
//     arrivals,         count of onArrive callbacks fired
//     maxPackets,
//     dispatch(origin, destination, colorHex, speed, onArrive),
//     tick(dt)
//   }
//
// The assertion this probe exists to make is NOT "pool size never drops below 0" -
// a count cannot be negative, so that check passes while packets are being thrown
// away. The real checks are (a) the scene graph does not grow, and (b) drops are
// zero at the designed dispatch rate.
import { resolve } from 'path';
let chromium = null;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 300)));
await page.goto('file://' + resolve('dist/command-centre-v2.html') + '?s=packets');
await page.waitForTimeout(6000);

let pass = 0, total = 0;
function check(name, ok, detail) {
  total++;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(total).padStart(2)}. ${name}${detail ? '  — ' + detail : ''}`);
}
const absent = 'window.TYLER_V4.packets is null — Phase 0 baseline';

// ---- 1-3 construction -----------------------------------------------------
const ctor = await page.evaluate(() => {
  const P = (window.TYLER_V4 || {}).packets;
  const S = window.TYLER_SCENE;
  if (!P) return { present: false };
  return {
    present: true,
    pool: P.pool.length,
    max: P.maxPackets,
    active: P.activePackets.length,
    allHidden: P.pool.every(m => m.visible === false),
    allNoDepth: P.pool.every(m => m.material.depthWrite === false),
    uniqueMats: new Set(P.pool.map(m => m.material.uuid)).size,
    uniqueGeo: new Set(P.pool.map(m => m.geometry.uuid)).size,
    geomType: P.pool[0] && P.pool[0].geometry.type,
    inScene: P.pool.filter(m => m.parent === S.scene).length
  };
});
check('packet subsystem present', ctor.present === true, ctor.present ? '' : absent);
check('pool is exactly 128 pre-allocated meshes',
  ctor.present && ctor.max === 128 && ctor.pool === 128,
  ctor.present ? `pool=${ctor.pool} maxPackets=${ctor.max}` : '');
check('every pooled mesh starts hidden with depthWrite=false and shares one geometry',
  ctor.present && ctor.allHidden && ctor.allNoDepth && ctor.uniqueGeo === 1,
  ctor.present ? `hidden=${ctor.allHidden} noDepthWrite=${ctor.allNoDepth} uniqueGeometry=${ctor.uniqueGeo} (${ctor.geomType})` : '');

// ---- 4 zero scene-graph growth over 1,000 dispatches ----------------------
const soak = await page.evaluate(async () => {
  const P = (window.TYLER_V4 || {}).packets;
  const S = window.TYLER_SCENE;
  if (!P) return { present: false };
  const V = new (P.pool[0].position.constructor)();
  let count = 0;
  S.scene.traverse(() => count++);
  const before = count;
  const beforeKids = S.scene.children.length;

  let fired = 0;
  const pods = Object.keys(S.benchRT || {});
  for (let i = 0; i < 1000; i++) {
    const podId = pods[i % Math.max(1, pods.length)];
    const node = (S.benchRT[podId] && S.benchRT[podId].nodePos) || V.set(0, 0, 0);
    P.dispatch(
      V.clone().set(0, 7.0, 0),
      node.clone ? node.clone() : V.clone(),
      0x2b6beb, 4000,
      () => { fired++; }
    );
    // drain so the pool never legitimately exhausts at the designed rate
    if (i % 3 === 0) for (let k = 0; k < 12; k++) P.tick(0.05);
  }
  for (let k = 0; k < 400; k++) P.tick(0.05);
  let after = 0;
  S.scene.traverse(() => after++);
  return {
    present: true, before, after, delta: after - before,
    beforeKids, afterKids: S.scene.children.length,
    dropped: P.dropped, arrivals: P.arrivals, peak: P.peak,
    firedHere: fired, activeLeft: P.activePackets.length
  };
});
check('scene graph does NOT grow across 1,000 dispatches (zero runtime allocation)',
  soak.present && soak.delta === 0 && soak.afterKids === soak.beforeKids,
  soak.present ? `nodes ${soak.before} → ${soak.after} (delta ${soak.delta}) · children ${soak.beforeKids} → ${soak.afterKids}` : '');
check('dropped === 0 at the designed dispatch rate (drops are counted, not silent)',
  soak.present && soak.dropped === 0,
  soak.present ? `dropped=${soak.dropped} peak=${soak.peak}` : '');
check('every packet reaches progress>=1 and fires onArrive exactly once',
  soak.present && soak.arrivals === 1000 && soak.activeLeft === 0,
  soak.present ? `arrivals=${soak.arrivals}/1000 · still active=${soak.activeLeft}` : '');
check('peak concurrency stays within the pool',
  soak.present && soak.peak > 0 && soak.peak <= 128,
  soak.present ? `peak=${soak.peak} of 128` : '');

// ---- 5 pool returns to full, nothing left visible -----------------------
const settled = await page.evaluate(async () => {
  const P = (window.TYLER_V4 || {}).packets;
  if (!P) return { present: false };
  for (let k = 0; k < 600; k++) P.tick(0.05);
  return {
    present: true,
    pool: P.pool.length, active: P.activePackets.length,
    visible: P.pool.filter(m => m.visible === true).length,
    nonZeroOpacity: P.pool.filter(m => m.material.opacity > 0).length
  };
});
check('pool returns to 128 and every recycled mesh is hidden with opacity 0',
  settled.present && settled.pool === 128 && settled.visible === 0 && settled.nonZeroOpacity === 0,
  settled.present ? `pool=${settled.pool} visible=${settled.visible} opacity>0=${settled.nonZeroOpacity}` : '');

// ---- 6 velocity hop arc (the +sin(pi*p)*1.2 lift) ----------------------
const hop = await page.evaluate(() => {
  const P = (window.TYLER_V4 || {}).packets;
  const S = window.TYLER_SCENE;
  if (!P) return { present: false };
  const V = new (P.pool[0].position.constructor)(120, 0, 0);
  P.dispatch(V.clone().set(0, 7.0, 0), V.clone().set(120, 0, 0), 0x2b6beb, 24);
  let maxLift = 0, samples = 0, minY = Infinity;
  const chordY = 0.25;
  for (let i = 0; i < 400 && P.activePackets.length; i++) {
    P.tick(0.016);
    const m = P.activePackets[0] && P.activePackets[0].mesh;
    if (!m) break;
    const dy = m.position.y - chordY;
    if (dy > maxLift) maxLift = dy;
    if (m.position.y < minY) minY = m.position.y;
    samples++;
  }
  for (let k = 0; k < 200; k++) P.tick(0.05);
  return { present: true, maxLift: +maxLift.toFixed(3), minY: +minY.toFixed(3), samples };
});
check('packets lift off the chord and never sink below it',
  hop.present && hop.maxLift > 0.9 && hop.maxLift <= 1.6 && hop.minY >= hop.present ? hop.maxLift >= 0.9 && hop.maxLift <= 1.6 && hop.minY >= 0.2 : false,
  hop.present ? `peak lift +${hop.maxLift} (spec 1.2 at mid), lowest y ${hop.minY}` : '');

// ---- 7 instruction / return colour roles --------------------------------
const roles = await page.evaluate(async () => {
  const P = (window.TYLER_V4 || {}).packets;
  if (!P) return { present: false };
  const V = new (P.pool[0].position.constructor)(80, 0, 0);
  const seen = [];
  for (const c of [0x2b6beb, 0x1e9070, 0xc8a438]) {
    P.dispatch(V.clone().set(0, 7, 0), V.clone(), c, 60);
    const m = P.pool[P.pool.length - 1] || null;
    const act = P.activePackets[P.activePackets.length - 1];
    seen.push({ hex: '#' + (act ? act.mesh.material.color.getHexString() : '000000'), want: '#' + c.toString(16).padStart(6, '0') });
    for (let k = 0; k < 60; k++) P.tick(0.05);
  }
  return { present: true, seen };
});
check('dispatch sets the packet colour from the argument',
  roles.present && roles.seen.every(s => s.hex === s.want),
  roles.present ? roles.seen.map(s => `${s.want}${s.hex === s.want ? '=' : '!='}${s.hex}`).join(' ') : '');

// ---- 8 disposal rate inverse to zoom ------------------------------------
const rate = await page.evaluate(() => {
  const g = (window.TYLER_V4 || {}).grid;
  if (!g || typeof g.dispatchRate !== 'function') return { present: false, fn: false };
  const at = (z) => +g.dispatchRate(z).toFixed(2);
  return { present: true, fn: true, overview: at(0.30), mid: at(1.3), near: at(2.6) };
});
check('dispatch rate scales with camera zoom (LOD claim is implemented, not asserted)',
  rate.present && rate.overview < rate.mid && rate.mid < rate.near,
  rate.present ? `overview z=0.30 → ${rate.overview}, mid → ${rate.mid}, near → ${rate.near} concurrent` : 'grid.dispatchRate(zoom) not implemented');

// ---- 9 reduced motion ----------------------------------------------------
const rm = await page.evaluate(() => {
  const P = (window.TYLER_V4 || {}).packets;
  if (!P) return { present: false };
  return { present: true, honorsReduced: P.honorsReduced === true };
});
check('packet travel has a reduced-motion path (a static direction marker, not travel)',
  rm.present && rm.honorsReduced === true,
  rm.present ? `honorsReduced=${rm.honorsReduced}` : '');

check('ERRORS(0) — 1,000 dispatches throw nothing', errs.length === 0,
  errs.slice(0, 2).map(e => e.split('\n')[0]).join(' | '));

console.log(`\nPACKET-PROBE: ${pass}/${total} · ERRORS(${errs.length})`);
for (const e of errs.slice(0, 4)) console.log('  ' + e.split('\n').slice(0, 2).join(' | '));
await page.screenshot({ path: 'scripts/out/packet-probe.png' });
await browser.close();
process.exitCode = pass === total && !errs.length ? 0 : 1;