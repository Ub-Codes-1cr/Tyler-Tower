// Tyler-Tower Phase 1 indexer — backend catalog -> frontend index.
// Walks brain/agency-personas/<division>/**/*.md, parses frontmatter, emits index.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CORE = path.resolve(ROOT, '..');
const PERSONAS = path.join(CORE, 'brain', 'agency-personas');
const OUT_DIR = PERSONAS; // index lives alongside backend copy

const DIVISIONS = ['academic','design','engineering','finance','game-development','gis','healthcare','marketing','paid-media','product','project-management','research','sales','security','spatial-computing','specialized','support','testing'];

function parseFrontmatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { attrs: {}, body: text };
  const attrs = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (k) attrs[k] = v;
  }
  return { attrs, body: text.slice(m[0].length) };
}

function walkMd(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, out);
    else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

let divisionsMeta = { divisions: {} };
try {
  divisionsMeta = JSON.parse(fs.readFileSync(path.join(PERSONAS, 'divisions.json'), 'utf8'));
} catch {}

const agents = [];
const seen = new Map();
for (const div of DIVISIONS) {
  const files = walkMd(path.join(PERSONAS, div));
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const { attrs, body } = parseFrontmatter(text);
    const slug = path.basename(f, '.md');
    const rel = path.relative(PERSONAS, f).replace(/\\/g, '/');
    const rec = {
      slug,
      division: div,
      file: rel,
      name: attrs.name || slug,
      description: attrs.description || '',
      color: attrs.color || (divisionsMeta.divisions?.[div]?.color || '#6366F1'),
      emoji: attrs.emoji || '',
      vibe: attrs.vibe || '',
      words: body.split(/\s+/).filter(Boolean).length,
      chars: text.length,
    };
    if (seen.has(slug)) {
      rec.collision = true;
      console.warn(`collision: ${slug} already from ${seen.get(slug)} now ${rel}`);
    } else seen.set(slug, rel);
    agents.push(rec);
  }
}

agents.sort((a, b) => a.division.localeCompare(b.division) || a.slug.localeCompare(b.slug));

const byDivision = {};
for (const d of DIVISIONS) byDivision[d] = agents.filter(a => a.division === d);

const benches = DIVISIONS.map(d => ({
  id: `bench-${d}`,
  division: d,
  label: divisionsMeta.divisions?.[d]?.label || d,
  icon: divisionsMeta.divisions?.[d]?.icon || 'Box',
  color: divisionsMeta.divisions?.[d]?.color || '#6366F1',
  count: byDivision[d].length,
}));

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify({ generated: new Date().toISOString(), total: agents.length, agents }, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'index-by-division.json'), JSON.stringify({ generated: new Date().toISOString(), divisions: Object.fromEntries(Object.entries(byDivision).map(([k, v]) => [k, v.length])), counts: Object.fromEntries(benches.map(b => [b.division, b.count])) }, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'BENCHES.json'), JSON.stringify({ generated: new Date().toISOString(), benches }, null, 2));

console.log(`indexed ${agents.length} agents across ${DIVISIONS.length} divisions`);
for (const b of benches) console.log(`  ${b.division}: ${b.count}`);
