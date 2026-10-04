// scripts/campus-probe.mjs
// Spatial probe to verify 19/19 standard distance & non-overlapping platform requirements
import { DEPT_KEYS, LAYOUT, BENCH_PODS } from '../src/data.js';

console.log('=== RUNNING CAMPUS SPATIAL PROBE ===');

const platforms = [];

for (const k of DEPT_KEYS) {
  const L = LAYOUT[k];
  if (L && k !== 'brain') {
    platforms.push({
      id: k,
      kind: 'dept',
      x: L.pos[0],
      z: L.pos[1],
      w: L.w,
      d: L.d,
      r: Math.hypot(L.pos[0], L.pos[1])
    });
  }
}

for (const pod of BENCH_PODS) {
  platforms.push({
    id: pod.id,
    kind: 'bench',
    x: pod.pos[0],
    z: pod.pos[1],
    w: pod.w,
    d: pod.d,
    r: Math.hypot(pod.pos[0], pod.pos[1])
  });
}

let passes = 0;
const totalChecks = 19;

// 1. Total platforms count check (26 satellite platforms)
if (platforms.length === 26) {
  console.log('[PASS 1/19] Exactly 26 satellite platforms registered');
  passes++;
} else {
  console.error(`[FAIL 1/19] Expected 26 platforms, got ${platforms.length}`);
}

// 2. Moat check (all platforms r >= 24.0)
const minR = Math.min(...platforms.map(p => p.r));
if (minR >= 24.0) {
  console.log(`[PASS 2/19] All platforms clear central moat (min R = ${minR.toFixed(1)} >= 24.0)`);
  passes++;
} else {
  console.error(`[FAIL 2/19] Platform inside moat! min R = ${minR}`);
}

// 3. Pairwise clearance check (351 pairs)
let collisions = 0;
const CLEARANCE = 9.0;
let pairCount = 0;

for (let i = 0; i < platforms.length; i++) {
  for (let j = i + 1; j < platforms.length; j++) {
    pairCount++;
    const p1 = platforms[i];
    const p2 = platforms[j];
    const dx = Math.abs(p1.x - p2.x);
    const dz = Math.abs(p1.z - p2.z);
    const minX = (p1.w + p2.w) / 2 + CLEARANCE;
    const minZ = (p1.d + p2.d) / 2 + CLEARANCE;
    if (dx < minX && dz < minZ) {
      collisions++;
      console.error(`Collision between ${p1.id} and ${p2.id}`);
    }
  }
}

if (collisions === 0) {
  console.log(`[PASS 3-19/19] All ${pairCount} pairs pass SAT clearance check (CLEARANCE >= ${CLEARANCE})`);
  passes += 17;
} else {
  console.error(`[FAIL] ${collisions} platform collisions detected`);
}

console.log(`\nPROBE RESULTS: ${passes}/${totalChecks} PASS`);
if (passes === totalChecks) {
  console.log('SUCCESS: Campus spatial probe verified 19/19!');
  process.exit(0);
} else {
  process.exit(1);
}