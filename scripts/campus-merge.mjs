// Merges the generated ring geometry with the EXISTING pod styling so nothing is lost.
// Emits the exact BENCH_PODS block for src/data.js.
import fs from 'fs';

const src = fs.readFileSync('src/data.js', 'utf8');
const orig = [...src.matchAll(/\{ id: '(bench-[^']+)', division: '([^']+)', label: '([^']*)', color: '(#[0-9A-Fa-f]{6})', floor: '(#[0-9A-Fa-f]{6})', chip: '(#[0-9A-Fa-f]{6})', count: (\d+)(?:, desks: (\d+))?/g)]
  .map(m => ({ id: m[1], division: m[2], label: m[3], color: m[4], floor: m[5], chip: m[6], count: +m[7] }));
if (orig.length !== 20) { console.error('expected 20 pods, parsed', orig.length); process.exit(1); }

const geo = {};
for (const f of ['scripts/out/ring2.txt', 'scripts/out/ring3.txt']) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/id: '(bench-[^']+)', division: '([^']+)', label: '([^']*)', pos: \[([-\d.]+), ([-\d.]+)\], w: ([\d.]+), d: ([\d.]+), seats: (\d+), cols: (\d+), rows: (\d+), swirl: (-?[\d.]+)/g)) {
    geo[m[1]] = { division: m[2], pos: [+m[4], +m[5]], w: +m[6], d: +m[7], seats: +m[8], cols: +m[9], rows: +m[10], swirl: +m[11] };
  }
}
const lines = orig.map(o => {
  const g = geo[o.id];
  if (!g) { console.error('missing geometry for', o.id); process.exit(1); }
  return `  { id: '${o.id}', division: '${o.division}', label: '${o.label}', color: '${o.color}', floor: '${o.floor}', chip: '${o.chip}', count: ${o.count}, seats: ${g.seats}, cols: ${g.cols}, rows: ${g.rows}, swirl: ${g.swirl}, pos: [${g.pos[0].toFixed(1)}, ${g.pos[1].toFixed(1)}], w: ${g.w}, d: ${g.d} },`;
});
fs.writeFileSync('scripts/out/pods.txt', lines.join('\n'));
console.log('wrote scripts/out/pods.txt —', lines.length, 'pods, all with original colors/counts and new geometry');

// ring membership + angle, for the hub/spoke builder and the probe
const meta = Object.entries(geo).map(([id, g]) => {
  const r = Math.round(Math.hypot(g.pos[0], g.pos[1]));
  const deg = +(((Math.atan2(g.pos[1], g.pos[0]) * 180 / Math.PI) + 360) % 360).toFixed(2);
  return { id, r, deg, ring: r > 130 ? 3 : 2 };
}).sort((a, b) => a.ring - b.ring || a.deg - b.deg);
fs.writeFileSync('scripts/out/ring-meta.json', JSON.stringify(meta, null, 1));
console.log('wrote scripts/out/ring-meta.json');
console.log('\nring 2:'); meta.filter(m => m.ring === 2).forEach(m => console.log(`  ${m.id.padEnd(26)} r=${m.r}  ${m.deg}°`));
console.log('ring 3:'); meta.filter(m => m.ring === 3).forEach(m => console.log(`  ${m.id.padEnd(26)} r=${m.r}  ${m.deg}°`));