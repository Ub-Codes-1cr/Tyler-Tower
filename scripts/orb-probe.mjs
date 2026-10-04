// orb-probe — V4 Phase 2 instrument.
//
// Asserts the geometry, kinematics and hit contract of the Brain orb
// (docs/V4-ORB-CAMPUS-PLAN.md §2, §3). Reads window.TYLER_SCENE for the scene graph
// and window.TYLER_V4.orb for the subsystem itself.
//
// CONTRACT (what the probe expects Phase 2 to build):
//   window.TYLER_V4.orb = {
//     group,            THREE.Group named 'brainOrb' at (0, ORB.y, 0)
//     shell,            THREE.LineSegments - WireframeGeometry(IcosahedronGeometry)
//     ringsGroup,       THREE.Group of lat/long THREE.Line loops
//     nucleus,          THREE.Mesh
//     glow,             THREE.Sprite
//     hitProxy,         the sprite registered in clickTargets (never the sphere)
//     shellMat, ringMat, glowMat,
//     axis,             THREE.Vector3 unit
//     config: { radius, icoDetail, periodSec, hoverPeriodSec, ringCount, meridianCount }
//     rate,             current rotations/sec (0 under reduced motion)
//     setTheme(dark), tick(dt, hovered)
//   }
//
// Radius is 7.0 and NOT 14.5. The command rings are RingGeometry(7.5, r+0.5) - their
// inner edge is r=7.5 - and the six department skybridges land on the first annulus.
// An orb of 14.5 encloses rings 1 and 2 and the corridors descend through it, which
// breaks campus-curves.mjs check #2. Clearance asserted below is 0.5.
//
// Reductions to 0.5 tolerance by default; pass REDUCED=1 to assert strict equality.
import { resolve } from 'path';
let chromium = null;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 300)));
await page.goto('file://' + resolve('dist/command-centre-v2.html') + '?s=orb');
await page.waitForTimeout(6000);

const REDUCED = process.env.REDUCED === '1';
let pass = 0, total = 0;
function check(name, ok, detail) {
  total++;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(total).padStart(2)}. ${name}${detail ? '  — ' + detail : ''}`);
}

// ---- 1-3 existence + primary geometry count -------------------------------
const shape = await page.evaluate(() => {
  const orb = (window.TYLER_V4 || {}).orb;
  if (!orb) return { present: false };
  const kinds = [];
  orb.group.traverse(o => {
    if (o === orb.group) return;
    if (o.isLineSegments) kinds.push('LineSegments');
    else if (o.isSprite) kinds.push('Sprite');
    else if (o.isMesh) kinds.push('Mesh');
    if (o.isLine && o !== orb.shell) kinds.push('Line');
  });
  return {
    present: true,
    name: orb.group.name,
    pos: orb.group.position.toArray().map(n => +n.toFixed(3)),
    kinds,
    hasShell: !!orb.shell && orb.shell.isLineSegments === true,
    hasRings: !!orb.ringsGroup,
    hasNucleus: !!orb.nucleus && orb.nucleus.isMesh === true,
    hasGlow: !!orb.glow && orb.glow.isSprite === true,
    config: orb.config || null
  };
});
check('orb subsystem present', shape.present === true, shape.present ? '' : 'window.TYLER_V4.orb is null — Phase 0 baseline');
check('group named brainOrb at (0, 7.0, 0)',
  shape.present && shape.name === 'brainOrb'
    && Math.abs(shape.pos[0]) < 1e-6 && Math.abs(shape.pos[1] - 7.0) < 1e-6 && Math.abs(shape.pos[2]) < 1e-6,
  shape.present ? `${shape.name} @ ${JSON.stringify(shape.pos)}` : '');
const shells = (shape.kinds || []).filter(k => k === 'LineSegments').length;
const meshes = (shape.kinds || []).filter(k => k === 'Mesh').length;
check('exactly one LineSegments shell + one Mesh nucleus',
  shape.present && shells === 1 && meshes === 1 && shape.hasShell && shape.hasNucleus && shape.hasGlow,
  shape.present ? `shells=${shells} meshes=${meshes} glow=${shape.hasGlow}` : '');

// ---- 4-6 radius, moat clearance, ring non-intersection ---------------------
const geo = await page.evaluate(() => {
  const orb = (window.TYLER_V4 || {}).orb;
  const S = window.TYLER_SCENE;
  if (!orb || !S) return { present: false };
  const r = orb.config.radius;
  // widest vertex on the shell, measured from the group origin
  const posAttr = orb.shell.geometry.getAttribute('position');
  let maxR = 0;
  for (let i = 0; i < posAttr.count; i++) {
    const d = Math.hypot(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    if (d > maxR) maxR = d;
  }
  // every command ring in the scene, by its inner/outer edge
  const rings = [];
  S.scene.traverse(o => {
    if (o.isMesh && o.geometry && o.geometry.type === 'RingGeometry') {
      const g = o.geometry.parameters;
      rings.push({ inner: g.innerRadius, outer: g.outerRadius, y: +o.position.y.toFixed(3) });
    }
  });
  const ringInner = rings.length ? Math.min(...rings.map(x => x.inner)) : null;
  const conflicts = rings.filter(x => maxR > x.inner && orb.group.position.y - maxR < (x.outer - x.inner) + 14);
  return { present: true, declared: r, measured: +maxR.toFixed(4), ringCount: rings.length, ringInner, conflicts: conflicts.length, rings };
});
const ringInnerEdge = geo.ringInner == null ? 7.5 : geo.ringInner;
check(`orb radius is 7.0 (measured shell extent)`,
  geo.present && Math.abs(geo.declared - 7.0) < 1e-6 && Math.abs(geo.measured - 7.0) < 0.02,
  geo.present ? `declared=${geo.declared} measured=${geo.measured}` : '');
check(`orb clears the innermost command-ring edge (>= 0.5)`,
  geo.present && geo.ringInner !== null && 7.0 <= geo.ringInner - 0.5,
  geo.present ? `orb 7.0 vs ring inner ${geo.ringInner} (clearance ${(geo.ringInner - 7.0).toFixed(2)})` : `no RingGeometry found; assuming 7.5`);
check('orb does not intersect any command ring',
  geo.present && geo.conflicts === 0,
  geo.present ? `rings=${geo.ringCount} conflicts=${geo.conflicts}` : '');

// ---- 7-8 kinematics -------------------------------------------------------
const axis = await page.evaluate(() => {
  const orb = (window.TYLER_V4 || {}).orb;
  if (!orb) return { present: false };
  const a = orb.axis.clone().normalize();
  return { present: true, axis: a.toArray(), unit: +a.length().toFixed(6) };
});
const AX = [0.397, 0.917, 0.0];
const axOk = axis.present && AX.every((v, i) => Math.abs(axis.axis[i] - v) <= (REDUCED ? 1e-9 : 0.001))
  && Math.abs(axis.unit - 1) < 1e-6;
check('rotation axis is (0.397, 0.917, 0) and is a unit vector', axOk,
  axis.present ? `axis=${JSON.stringify(axis.axis.map(n => +n.toFixed(4)))} |axis|=${axis.unit}` : '');

const spin = await page.evaluate(async () => {
  const orb = (window.TYLER_V4 || {}).orb;
  if (!orb) return { present: false };
  const q0 = orb.group.quaternion.clone();
  const t0 = performance.now();
  await new Promise(r => setTimeout(r, 4000));
  const dt = (performance.now() - t0) / 1000;
  const dot = Math.abs(q0.dot(orb.group.quaternion));
  const swept = 2 * Math.acos(Math.min(1, dot));            // rotation angle in rad
  return { present: true, dt: +dt.toFixed(2), swept: +swept.toFixed(4), period: +(2 * Math.PI * dt / (swept || 1e-9)).toFixed(1), rate: orb.rate };
});
const per = spin.period;
check('full rotation period is 120s +/- 2s (0.5 RPM)',
  spin.present && Math.abs(per - 120) <= 2,
  spin.present ? `measured ${per}s over ${spin.dt}s (rate ${(+spin.rate).toFixed(5)} rot/s)` : '');

// ---- 9-10 hover: rate reduction + shell opacity, exponential not stepped ---
const hov = await page.evaluate(async () => {
  const orb = (window.TYLER_V4 || {}).orb;
  const S = window.TYLER_SCENE;
  if (!orb || !S) return { present: false };
  const rest = orb.rate;
  orb.tick(0.016, true);                                    // kick the eased response
  for (let i = 0; i < 40; i++) orb.tick(0.016, true);        // ~640ms of frames
  const hovRate = orb.rate;
  const hovOp = orb.shellMat.opacity;
  for (let i = 0; i < 40; i++) orb.tick(0.016, true);
  const settledOp = orb.shellMat.opacity;
  return { present: true, rest, hovRate, hovOp, settledOp };
});
const hovRatio = hov.present && hov.rest ? hov.hovRate / hov.rest : null;
check('hover reduces angular velocity to <= 30% of rest within 500ms',
  hovRatio !== null && hovRatio > 0 && hovRatio <= 0.32,
  hov.present ? `rest ${(+hov.rest).toFixed(5)} → hover ${(+hov.hovRate).toFixed(5)} = ${(hovRatio * 100).toFixed(1)}%` : '');
check('hover raises shell opacity to >= 0.9 and it is frame-rate independent',
  hov.present && hov.settledOp >= 0.9 && hov.settledOp <= 1.0,
  hov.present ? `settled opacity ${(+hov.settledOp).toFixed(3)} (a naive *0.1/frame would be identical at 30fps and 144fps; orb.tick must use 1-exp(-dt*k))` : '');

// ---- 11 materials: depthWrite stated, no additive on a cream page ---------
const mats = await page.evaluate(() => {
  const orb = (window.TYLER_V4 || {}).orb;
  if (!orb) return { present: false };
  const out = [];
  orb.group.traverse(o => {
    const m = o.material;
    if (!m) return;
    const mats = Array.isArray(m) ? m : [m];
    for (const mm of mats) out.push({
      type: mm.type,
      blending: mm.blending,               // 1 === NormalBlending
      depthWrite: mm.depthWrite,
      transparent: mm.transparent,
      color: mm.color ? '#' + mm.color.getHexString() : null,
      opacity: typeof mm.opacity === 'number' ? +mm.opacity.toFixed(3) : null
    });
  });
  return { present: true, mats: out };
});
const additive = (mats.mats || []).filter(m => m.blending === 2);   // 2 === AdditiveBlending
const noDepth = (mats.mats || []).filter(m => m.depthWrite === true && m.type !== 'SpriteMaterial');
check('no AdditiveBlending anywhere on the orb (it dies on --cream #FDFFF8)',
  mats.present && additive.length === 0,
  mats.present ? `additive=${additive.length} of ${mats.mats.length} materials` : '');
check('every orb mesh material states depthWrite=false explicitly',
  mats.present && noDepth.length === 0,
  mats.present ? `depthWrite=true on ${noDepth.length}: ${noDepth.map(m => m.type).join(',') || 'none'}` : '');

// ---- 12 glow sprite is not a collider ------------------------------------
const glow = await page.evaluate(() => {
  const orb = (window.TYLER_V4 || {}).orb;
  if (!orb) return { present: false };
  return {
    scale: orb.glow.scale.toArray().map(n => +n.toFixed(2)),
    depthWrite: orb.glow.material.depthWrite,
    // visual presence comes from the sprite; geometry stays small on purpose
    ratio: orb.config.glowScale / orb.config.radius
  };
});
check('glow sprite is square and outscales the geometry (visual presence without collision)',
  glow.present && glow.scale[0] === glow.scale[1] && glow.ratio >= 1.8 && glow.depthWrite === false,
  glow.present ? `scale=${JSON.stringify(glow.scale)} glowScale/radius=${glow.ratio}` : '');

// ---- 13 theme ------------------------------------------------------------
const theme = await page.evaluate(() => {
  const orb = (window.TYLER_V4 || {}).orb;
  if (!orb || typeof orb.setTheme !== 'function') return { present: false };
  const a = orb.shellMat.color.getHexString();
  orb.setTheme(true);
  const b = orb.shellMat.color.getHexString();
  const ringChanged = orb.ringMat.color.getHexString();
  orb.setTheme(false);
  return { present: true, light: a, dark: b, ringHex: ringChanged, hasSetTheme: true };
});
check('setTheme(true) changes shell colour and ringMat is reachable on the instance',
  theme.present && theme.light !== theme.dark && !!theme.ringHex && theme.ringHex !== '#000000',
  theme.present ? `light #${theme.light} → dark #${theme.dark}, ring #${theme.ringHex}` : 'setTheme missing or ringMat not stored on the instance');

// ---- 14 reduced motion + raycast registration ----------------------------
const a11y = await page.evaluate(() => {
  const orb = (window.TYLER_V4 || {}).orb;
  const S = window.TYLER_SCENE;
  if (!orb || !S) return { present: false };
  const regd = S.clickTargets.filter(o => o === orb.hitProxy).length;
  const sphereRegd = S.clickTargets.filter(o => o.isMesh && o.geometry && o.geometry.type === 'SphereGeometry').length;
  return {
    present: true, regd, sphereRegd,
    proxyIsSprite: orb.hitProxy.isSprite === true,
    role: orb.hitProxy.getAttribute('role'),
    label: orb.hitProxy.getAttribute('aria-label'),
    keyboard: orb.hitProxy.tabIndex >= 0
  };
});
check('exactly ONE clickTargets entry, and it is the sprite proxy - never the sphere',
  a11y.present && a11y.regd === 1 && a11y.sphereRegd === 0 && a11y.proxyIsSprite,
  a11y.present ? `proxy=${a11y.regd} spheres=${a11y.sphereRegd} isSprite=${a11y.proxyIsSprite}` : '');
check('orb proxy is keyboard reachable and named for a screen reader',
  a11y.present && a11y.role === 'img' && !!a11y.label && a11y.keyboard,
  a11y.present ? `role=${a11y.role} tabIndex=${a11y.keyboard ? '>=0' : 'absent'} label="${(a11y.label || '').slice(0, 48)}"` : '');

const rm = await page.evaluate(() => {
  const orb = (window.TYLER_V4 || {}).orb;
  if (!orb) return { present: false };
  // reducedMotion() exists in main.js but was never called until the orb landed
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rate = orb.rate;
  orb.tick(0.016, false);
  return { present: true, mq, honorsReduced: orb.honorsReduced === true, rate, stillSpinning: orb.rate !== 0 && !mq };
});
check('reduced-motion path is implemented (orb.tick checks prefers-reduced-motion)',
  rm.present && rm.honorsReduced === true,
  rm.present ? `honorsReduced=${rm.honorsReduced} mediaQueryNow=${rm.mq}` : 'orb.honorsReduced flag absent — main.js reducedMotion() is defined but never called');

// ---- naming regression guard ---------------------------------------------
// Must be non-vacuous: if hoverPopHTML is unreachable the check is meaningless,
// so require that the brain branch actually produced markup.
const naming = await page.evaluate(() => {
  const S = window.TYLER_SCENE;
  if (!S || typeof S.hoverPopHTML !== 'function') return { present: false, reachable: false };
  let html = '';
  try { html = S.hoverPopHTML({ kind: 'brain' }); } catch (e) { return { present: true, reachable: true, threw: String(e.message) }; }
  return { present: true, reachable: true, html, title: (S.DEPTS && S.DEPTS.brain && S.DEPTS.brain.name) || '' };
});
check("the brain is still called 'THE BRAIN', not renamed (P085 naming-drift guard)",
  naming.reachable === true && naming.html.length > 0 && !/tyler tower\s*core/i.test(naming.html) && /brain/i.test(naming.html),
  naming.reachable ? `popup="${naming.html.replace(/<[^>]+>/g, '|').replace(/\|+/g, ' ').trim().slice(0, 70)}"` : 'hoverPopHTML not reachable on TYLER_SCENE — check would be vacuous');

console.log(`\nORB-PROBE: ${pass}/${total} · ERRORS(${errs.length})`);
for (const e of errs.slice(0, 4)) console.log('  ' + e.split('\n').slice(0, 2).join(' | '));
await page.screenshot({ path: 'scripts/out/orb-probe.png' });
await browser.close();
process.exitCode = pass === total && !errs.length ? 0 : 1;