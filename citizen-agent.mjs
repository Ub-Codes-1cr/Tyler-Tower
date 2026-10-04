// Tyler-Tower citizen agents — ONE resolver that turns any skill-citizen slug into a
// virtual agent the existing chat pipeline accepts. Roster agents are untouched;
// citizens resolve here from generated data (citizens.json + index.json) plus their
// skill pack. No per-agent code: 282 citizens, 1 function.
import fs from 'node:fs';
import path from 'node:path';

// division -> office department + tool set (mirrors scripts/tyler-convert.mjs BIND;
// tools reuse roster tool names so mcp.promptText works unchanged).
const DIV_DEPT = {
  academic: ['ops', ['notion']],
  design: ['marketing', ['canva']],
  engineering: ['delivery', ['notion']],
  finance: ['fin', ['xero']],
  'game-development': ['delivery', ['notion']],
  gis: ['ops', ['notion']],
  healthcare: ['ops', ['notion']],
  marketing: ['marketing', ['canva', 'clarity']],
  'paid-media': ['marketing', ['meta', 'clarity']],
  product: ['delivery', ['notion']],
  'project-management': ['delivery', ['notion']],
  research: ['ops', ['notion']],
  sales: ['sales', ['gmail', 'notion']],
  security: ['ops', ['notion']],
  'spatial-computing': ['marketing', ['canva']],
  specialized: ['ops', ['notion']],
  support: ['emails', ['gmail']],
  testing: ['delivery', ['notion']],
};

const norm = (id) => String(id || '').replace(/^aa-/, '');

function readCapped(p, cap) {
  try {
    const t = fs.readFileSync(p, 'utf8');
    return t.length > cap ? t.slice(0, cap) + '\n…(truncated)' : t;
  } catch { return ''; }
}

// resolveCitizen(id, brainPath) -> { agent, skillText } | null
// agent matches the roster shape the pipeline reads: id/name/role/does/department/tools/brief.
export function resolveCitizen(id, brainPath) {
  const slug = norm(id);
  if (!slug || !brainPath) return null;
  let personas = null;
  try {
    const idx = JSON.parse(fs.readFileSync(path.join(brainPath, 'agency-personas', 'index.json'), 'utf8'));
    personas = (idx.agents || []).find((a) => a.slug === slug);
  } catch { return null; }
  if (!personas) return null;
  const [department, tools] = DIV_DEPT[personas.division] || ['delivery', ['notion']];
  // skill pack first (already distilled to office limits), persona source as fallback.
  let skillText = readCapped(path.join(brainPath, 'Tyler Tower', 'skills', `aa-${slug}`, 'SKILL.md'), 4000);
  const tpl = readCapped(path.join(brainPath, 'Tyler Tower', 'skills', `aa-${slug}`, 'template.md'), 1500);
  if (tpl) skillText += `\n\n--- template.md ---\n${tpl}`;
  if (!skillText) {
    const src = readCapped(path.join(brainPath, 'agency-personas', personas.file || ''), 3000);
    if (src) skillText = `--- persona source ---\n${src}`;
  }
  const firstLine = (personas.description || '').split(/[.!\n]/)[0].trim().slice(0, 160);
  const agent = {
    id: slug,
    isCitizen: true,
    name: personas.name || slug,
    role: `${personas.name || slug} (${personas.division})`,
    does: firstLine || `Specialist in ${personas.division}.`,
    department,
    tools,
    brief: `You are ${personas.name || slug}, a specialist in ${personas.division}. ${firstLine}`,
    model: '',
    effort: '',
  };
  return { agent, skillText };
}
