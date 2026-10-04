// Design calculator for the v2 radial campus.
// The arithmetic that PROVES the ring radii used in src/data.js.
// Nothing here ships; it exists so the layout is derived, not guessed.
import fs from 'fs';

const CLEAR = 9;    // required empty units between any two platform footprints
const MOAT = 24;    // nothing stands inside this radius from the centre
const BRAIN = 16;   // brain slab w/d

// ring 1: the six departments, sizes unchanged (they are the reference).
// DEPT_PHASE rotates the whole department ring so no department shares a hub angle with
// a bench. Ring 2 sits at 36i+18, ring 3 at 36i+6; 60i+phase must avoid both, and the
// verifier below proves the minimum angular gap.
const DEPT_PHASE = 3;
const DEPTS = [
  ['emails', 20, 26], ['delivery', 20, 30], ['sales', 20, 30],
  ['marketing', 20, 30], ['fin', 20, 26], ['ops', 20, 30],
];

// benches with their SEATED citizen counts — these drive platform size
const BENCH = [
  ['bench-engineering', 'Engineering', 64], ['bench-marketing', 'Marketing', 36],
  ['bench-game-development', 'Game Dev', 20], ['bench-specialized-a', 'Specialized · BizOps', 20],
  ['bench-specialized-b', 'Specialized · Verticals', 18], ['bench-specialized-c', 'Specialized · Builders', 18],
  ['bench-gis', 'GIS', 12], ['bench-security', 'Security', 11], ['bench-design', 'Design', 9],
  ['bench-sales', 'Sales', 8], ['bench-testing', 'Testing', 8], ['bench-paid-media', 'Paid Media', 6],
  ['bench-project-management', 'Project Mgmt', 6], ['bench-academic', 'Academic', 5],
  ['bench-product', 'Product', 5], ['bench-spatial-computing', 'Spatial', 5],
  ['bench-support', 'Support', 5], ['bench-finance', 'Finance', 4], ['bench-healthcare', 'Healthcare', 2],
  ['bench-research', 'Research', 0],
];

// A platform is a desk grid plus a margin. The grid scales in BOTH axes so a big division
// gets a roughly SQUARE platform instead of a long one — 64 seats becomes 8x8, not 3x22.
// Seats are capped only where the data says so; every seated citizen gets a desk, which is
// what puts all 317 agents on the floor. MAXSEATS is a guard against a malformed roster.
const CW = 6.2, CD = 5.4, MARGIN = 2.2, MAXSEATS = 64;
const circ = (w, d) => Math.hypot(w, d) / 2;

const sizes = BENCH.map(([id, label, seated]) => {
  const n = Math.max(1, Math.min(seated, MAXSEATS));
  const cols = Math.max(3, Math.min(8, Math.round(Math.sqrt(n * 1.1))));  // ~square
  const rows = Math.max(1, Math.ceil(n / cols));
  const w = +(cols * CW + MARGIN * 2).toFixed(1);
  const d = +(rows * CD + MARGIN * 2).toFixed(1);
  return { id, label, seats: n, cols, rows, w, d, circ: circ(w, d) };
});

// split by footprint: the ten biggest go OUTER (more room between neighbours)
sizes.sort((a, b) => (b.circ) - (a.circ));
const outer = sizes.slice(0, 10);
const mid = sizes.slice(10);

// minimum ring radius: neighbours on the ring must clear each other
function ringRadius(members, count, prevRingR, prevCirc) {
  const step = (Math.PI * 2) / count;
  let need = 0;
  for (let i = 0; i < count; i++) {
    const A = members[i % count].circ, B = members[(i + 1) % count].circ;
    need = Math.max(need, (A + B + CLEAR) / (2 * Math.sin(step / 2)));
  }
  const worst = Math.max(...members.map(m => m.circ));
  // worst case against the ring inside: both platforms at the same angle
  if (prevCirc != null) need = Math.max(need, prevRingR + prevCirc + worst + CLEAR);
  return Math.ceil(need);
}

const deptCirc = Math.max(...DEPTS.map(([, w, d]) => circ(w, d)));
const R1 = Math.ceil(Math.max(
  ringRadius(DEPTS.map(([, w, d]) => ({ circ: circ(w, d) })), 6, 0, null),
  MOAT + BRAIN / 2 + deptCirc + CLEAR,
));
const midCirc = Math.max(...mid.map(m => m.circ));
const R2 = ringRadius(mid, 10, R1, deptCirc);
const outerCirc = Math.max(...outer.map(m => m.circ));
const R3 = ringRadius(outer, 10, R2, midCirc);

const campusR = Math.max(R1, R2, R3) + outerCirc + CLEAR;
const gap12 = R2 - R1 - midCirc - deptCirc;
const gap23 = R3 - R2 - outerCirc - midCirc;

console.log(`CLEAR=${CLEAR}  MOAT=${MOAT}  BRAIN=${BRAIN}`);
console.log(`dept circumradius        : ${deptCirc.toFixed(1)}`);
console.log(`RING 1 departments (n=6) : r=${R1}   60° apart`);
console.log(`RING 2 mid    (n=10)     : r=${R2}   36° apart   worst circ ${midCirc.toFixed(1)}`);
console.log(`RING 3 outer  (n=10)     : r=${R3}   36° apart   worst circ ${outerCirc.toFixed(1)}`);
console.log(`campus radius            : ${campusR.toFixed(0)}`);
console.log(`nearest dept edge        : ${(R1 - deptCirc).toFixed(1)}  (moat > ${MOAT}: ${(R1 - deptCirc) > MOAT})`);
console.log(`ring1 -> ring2 clearance : ${gap12.toFixed(1)}  ${gap12 >= CLEAR ? 'ok' : 'FAIL'}`);
console.log(`ring2 -> ring3 clearance : ${gap23.toFixed(1)}  ${gap23 >= CLEAR ? 'ok' : 'FAIL'}`);

console.log('\n  pod                       seats rows     w      d   circ  ring');
for (const [ring, list] of [[2, mid], [3, outer]]) {
  for (const m of list) {
    console.log('  ' + m.id.padEnd(24) + String(m.seats).padStart(5) + String(m.rows).padStart(5) +
      String(m.w).padStart(8) + String(m.d).padStart(8) + m.circ.toFixed(1).padStart(8) + `    ${ring}`);
  }
}

// segment vs expanded-AABB hit test (Liang-Barsky). Pure geometry, no dependencies.
function segHitsRect(x1, z1, x2, z2, r, margin) {
  const ex0 = r.x - r.w / 2 - margin, ex1 = r.x + r.w / 2 + margin;
  const ez0 = r.z - r.d / 2 - margin, ez1 = r.z + r.d / 2 + margin;
  const dx = x2 - x1, dz = z2 - z1;
  let tmin = 0, tmax = 1;
  const clip = (p, q) => {
    if (Math.abs(p) < 1e-9) return q >= 0;
    const t = q / p;
    if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
    else { if (t < tmin) return false; if (t < tmax) tmax = t; }
    return true;
  };
  return clip(-dx, x1 - ex0) && clip(dx, ex1 - x1) &&
         clip(-dz, z1 - ez0) && clip(dz, ez1 - z1) && tmin <= tmax;
}
// The division a pod belongs to. The three specialized benches share ONE division
// ('specialized') — that is how they are grouped everywhere else in the app, and
// deriving it from the pod id would wrongly split them into three.
const DIVISION = {
  'bench-specialized-a': 'specialized',
  'bench-specialized-b': 'specialized',
  'bench-specialized-c': 'specialized',
};
const divOf = id => DIVISION[id] || id.replace('bench-', '');

// --- corridor swirls: arched skybridges, arrival spread only --------------------------
// Ground-level curves cannot thread 26 corridors through two crowded rings, so corridors
// FLY: each is a bezier arch whose apex scales with its length, passing well above every
// plinth, tag and label. Planar collision is impossible by construction.
// Tiers land on THREE concentric terminal circles (outer farthest), so same-angle pairs
// from different tiers separate radially as well as vertically. The greedy only spreads
// arrivals; height + tier radius do the separating.
const TIER_RING = { dept: 10, mid: 13, outer: 16 };

const SWIRL_CANDS = [0, 6, -6, 10, -10, 14, -14, 18, -18, 24, -24, 30, -30, 38, -38, 46, -46];
const TIER_APEX = { dept: 8.5, mid: 13, outer: 17.5 };
function tierOf(id, x, z) {
  if (id.startsWith('dept:')) return 'dept';
  return Math.hypot(x, z) > 130 ? 'outer' : 'mid';
}
function arrivalOf(px, pz, swirlDeg) {
  const phi = Math.atan2(pz, px) + swirlDeg * Math.PI / 180;
  return ((phi * 180 / Math.PI) % 360 + 360) % 360;
}
// full 3D arch sample, mirroring skyBridgePoints/makeWalkwayArch in src/builders.js:
// horizontal quadratic sweep (pinwheel) + FLAT-TOP vertical profile. A plain quadratic
// height is only half-apex a quarter of the way along, so it stays low exactly where it
// would clip the neighbouring platform it just departed — hence the eased ramp.
const SKY_RAMP = 0.12;
function skyHeight(t, apex) {
  const u = t < SKY_RAMP ? t / SKY_RAMP : (t > 1 - SKY_RAMP ? (1 - t) / SKY_RAMP : 1);
  return apex * (u * u * (3 - 2 * u));
}
function archPts(px, pz, w, d, swirlDeg, tier, n = 40) {
  const theta = Math.atan2(pz, px);
  const r = Math.hypot(px, pz) || 1;
  const ux = px / r, uz = pz / r;
  const tx = Math.abs(ux) > 1e-6 ? (w / 2) / Math.abs(ux) : Infinity;
  const tz = Math.abs(uz) > 1e-6 ? (d / 2) / Math.abs(uz) : Infinity;
  const edge = Math.min(tx, tz) + 1.2;
  const p0 = [px - ux * edge, 0, pz - uz * edge];
  const phi = theta + swirlDeg * Math.PI / 180;
  const rr = TIER_RING[tier];
  const p2 = [Math.cos(phi) * rr, 0, Math.sin(phi) * rr];
  // control point on the angular bisector, pulled outward (matches bendControl in main.js)
  const bis = Math.atan2(p0[2] + p2[2], p0[0] + p2[0]);
  const rc = Math.max(Math.hypot(p0[0], p0[2]) * 0.52, 14);
  const p1 = [Math.cos(bis) * rc, 0, Math.sin(bis) * rc];
  const apex = TIER_APEX[tier];
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
              skyHeight(t, apex),
              u * u * p0[2] + 2 * u * t * p1[2] + t * t * p2[2]]);
  }
  return { pts, apex: apex, len: Math.hypot(p2[0] - p0[0], p2[2] - p0[2]) };
}
const allPlats = [
  ...DEPTS.map(([id, w, d], i) => {
    const rad = (60 * i + DEPT_PHASE) * Math.PI / 180;
    return { id: 'dept:' + id, x: Math.cos(rad) * R1, z: Math.sin(rad) * R1, w, d };
  }),
  ...mid.map((m, i) => {
    const rad = (36 * i + 18) * Math.PI / 180;
    return { ...m, x: Math.cos(rad) * R2, z: Math.sin(rad) * R2 };
  }),
  ...outer.map((m, i) => {
    const rad = (36 * i + 6) * Math.PI / 180;
    return { ...m, x: Math.cos(rad) * R3, z: Math.sin(rad) * R3 };
  }),
];
const swirls = {};
{
  // two-pass coordinate descent: pass 1 spreads arrivals greedily; pass 2 re-routes the
  // worst offenders against ALL placed arches (not just earlier ones), preferring gentle
  // bends more strongly so wide sweeps can't cause the conflicts they were dodging.
  const order = [...allPlats].sort((a, b) => (a.id < b.id ? -1 : 1));
  const placed = [];
  const archOf = (p, s) => archPts(p.x, p.z, p.w, p.d, s, tierOf(p.id, p.x, p.z), 40);
  const min3dTo = (me, others) => {
    let m = Infinity;
    for (const q of others) {
      for (const a of me.pts) {
        for (const b of q.pts) {
          const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
          if (d < m) m = d;
        }
      }
    }
    return m;
  };
  const spreadOf = (phi, others) => {
    let spread = 360;
    for (const q of others) {
      const d = Math.abs(phi - q.phi);
      spread = Math.min(spread, Math.min(d, 360 - d));
    }
    return spread;
  };
  for (const p of order) {
    let best = null;
    for (const s of SWIRL_CANDS) {
      const phi = arrivalOf(p.x, p.z, s);
      const me = archOf(p, s);
      const score = spreadOf(phi, placed) - Math.abs(s) * 0.6
        - Math.max(0, 2.4 - min3dTo(me, placed)) * 60;
      if (!best || score > best.score) best = { s, score, phi, pts: me.pts };
    }
    swirls[p.id] = best.s;
    placed.push({ id: p.id, phi: best.phi, pts: best.pts });
  }
  // pass 2: JOINT search over the worst pair (17x17 combos). Single-corridor moves
  // cannot escape a mutual conflict; moving both together can.
  const byId = Object.fromEntries(allPlats.map(p => [p.id, p]));
  const pairMin = (pa, pb) => min3dTo(pa, [pb]);
  for (let pass = 0; pass < 15; pass++) {
    // find current worst pair
    let worst = { d: Infinity, a: null, b: null };
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const m = pairMin(placed[i], placed[j]);
        if (m < worst.d) worst = { d: m, a: placed[i], b: placed[j] };
      }
    }
    if (worst.d >= 1.5) break;
    const pa = byId[worst.a.id], pb = byId[worst.b.id];
    const restA = placed.filter(q => q.id !== pa.id && q.id !== pb.id);
    let best = null;
    for (const sa of SWIRL_CANDS) {
      const ma = archOf(pa, sa);
      const va = min3dTo(ma, restA);
      if (va < 1.5) continue;
      for (const sb of SWIRL_CANDS) {
        const mb = archOf(pb, sb);
        const vb = min3dTo(mb, restA);
        if (vb < 1.5) continue;
        const mut = pairMin(ma, mb);
        if (mut < 1.5) continue;
        const score = Math.min(va, vb, mut)
          + spreadOf(arrivalOf(pa.x, pa.z, sa), restA) * 0.1
          + spreadOf(arrivalOf(pb.x, pb.z, sb), restA) * 0.1
          - (Math.abs(sa) + Math.abs(sb)) * 0.35;
        if (!best || score > best.score) best = { sa, sb, score, ma, mb };
      }
    }
    if (!best) break; // no jointly-clean move; keep current and report
    swirls[pa.id] = best.sa; swirls[pb.id] = best.sb;
    worst.a.phi = arrivalOf(pa.x, pa.z, best.sa); worst.a.pts = best.ma.pts;
    worst.b.phi = arrivalOf(pb.x, pb.z, best.sb); worst.b.pts = best.mb.pts;
  }
  console.log(`\nswirls assigned (spread arrivals, prefer gentle):`);
  for (const p of allPlats) console.log(`  ${p.id.padEnd(26)} ${String(swirls[p.id]).padStart(4)}°`);
  // 3D pairwise check on the actual arches: minimum distance between any two curves
  const arches = allPlats.map(p => ({ id: p.id, ...archPts(p.x, p.z, p.w, p.d, swirls[p.id], tierOf(p.id, p.x, p.z)) }));
  let minD = Infinity, minPair = '';
  for (let i = 0; i < arches.length; i++) {
    for (let j = i + 1; j < arches.length; j++) {
      for (const a of arches[i].pts) {
        for (const b of arches[j].pts) {
          const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
          if (d < minD) { minD = d; minPair = `${arches[i].id} / ${arches[j].id}`; }
        }
      }
    }
  }
  console.log(`closest two arches in 3D: ${minD.toFixed(2)}u  ${minPair}  ${minD >= 1.5 ? 'ok' : 'TOO CLOSE'}`);
  const lowApex = arches.filter(a => a.apex < 7.5);
  console.log(`arches below 7.5u apex: ${lowApex.length}${lowApex.length ? '  ' + lowApex.map(a => a.id).join(',') : '  ok'}`);
}

function emit(members, R, phase) {
  return members.map((m, i) => {
    const rad = (36 * i + phase) * Math.PI / 180;
    const sw = swirls[m.id] ?? 0;
    return `  { id: '${m.id}', division: '${divOf(m.id)}', label: '${m.label}', pos: [${(Math.cos(rad) * R).toFixed(1)}, ${(Math.sin(rad) * R).toFixed(1)}], w: ${m.w}, d: ${m.d}, seats: ${m.seats}, cols: ${m.cols}, rows: ${m.rows}, swirl: ${sw} },`;
  }).join('\n');
}
fs.mkdirSync('scripts/out', { recursive: true });
fs.writeFileSync('scripts/out/ring2.txt', emit(mid, R2, 18));
fs.writeFileSync('scripts/out/ring3.txt', emit(outer, R3, 6));
console.log('\nwrote scripts/out/ring2.txt (phase 18°) and ring3.txt (phase 6°)');

// prove every hub angle is distinct
const all = [
  ...DEPTS.map(([id], i) => ({ id: 'dept:' + id, deg: 60 * i + DEPT_PHASE })),
  ...mid.map((m, i) => ({ id: m.id, deg: 36 * i + 18 })),
  ...outer.map((m, i) => ({ id: m.id, deg: 36 * i + 6 })),
].sort((a, b) => a.deg - b.deg);
let minAng = 360, pair = '';
for (let i = 0; i < all.length; i++) {
  const d = (all[(i + 1) % all.length].deg - all[i].deg + 360) % 360;
  if (d < minAng) { minAng = d; pair = `${all[i].id} / ${all[(i + 1) % all.length].id}`; }
}
console.log(`closest two hub angles: ${minAng.toFixed(1)}°  ${pair}  ${minAng > 0.5 ? 'ok' : 'FAIL'}`);
console.log('department ring positions (+ assigned swirl):');
for (const [id, w, d] of DEPTS) {
  const deg = DEPTS.findIndex(x => x[0] === id) * 60 + DEPT_PHASE;
  const rad = deg * Math.PI / 180;
  const sw = swirls['dept:' + id] ?? 0;
  console.log(`  LANE ${id.padEnd(12)} ${(Math.cos(rad) * R1).toFixed(1).padStart(7)}, ${(Math.sin(rad) * R1).toFixed(1).padStart(7)}   ${deg}°  swirl ${sw}°`);
}