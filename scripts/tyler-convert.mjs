// Tyler-Tower Phase 1 converter — persona MD -> office skill packs.
// Respects SKILLS.md limits: SKILL.md <=6000 chars, side files <=4000 each / <=8000 total.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CORE = path.resolve(ROOT, '..');
const PERSONAS = path.join(CORE, 'brain', 'agency-personas');
const SKILLS = path.join(CORE, 'brain', 'Tyler Tower', 'skills');

const ALL = process.argv.includes('--all');
const PHASE1 = ALL ? { divisions: ['academic','design','engineering','finance','game-development','gis','healthcare','marketing','paid-media','product','project-management','research','sales','security','spatial-computing','specialized','support','testing'], extraSlugs: [] } : { divisions: ['marketing', 'testing'], extraSlugs: ['engineering-backend-architect', 'engineering-multi-agent-systems-architect', 'engineering-rag-pipeline-engineer'] };
const BIND = {
  academic: ['riley', 'scout', 'newt'],
  design: ['gfx', 'dasst', 'iggy', 'vid'],
  engineering: ['pco', 'scout', 'dlead'],
  finance: ['invo', 'apay', 'recon', 'alead'],
  'game-development': ['pco', 'dasst', 'qa'],
  gis: ['scout', 'dash', 'report'],
  healthcare: ['legal', 'comply', 'qa'],
  marketing: ['iggy', 'vid', 'newt', 'mlead'],
  testing: ['qa', 'pco', 'dlead'],
  'paid-media': ['ada', 'riley', 'mlead'],
  product: ['pco', 'dlead', 'scout'],
  'project-management': ['pco', 'dlead', 'report'],
  research: ['riley', 'scout', 'report'],
  sales: ['lexi', 'pros', 'piper', 'folo'],
  security: ['legal', 'comply', 'scout', 'qa'],
  'spatial-computing': ['gfx', 'vid', 'dasst'],
  specialized: ['olead', 'dlead', 'lexi'],
  support: ['cmail', 'imail', 'report', 'dash'],
};

const index = JSON.parse(fs.readFileSync(path.join(PERSONAS, 'index.json'), 'utf8'));
const pick = index.agents.filter(a => PHASE1.divisions.includes(a.division) || PHASE1.extraSlugs.includes(a.slug));

function section(body, titles) {
  for (const t of titles) {
    const i = body.indexOf(t);
    if (i >= 0) {
      // grab up to next ## heading or 1200 chars
      const rest = body.slice(i);
      const next = rest.slice(t.length).search(/\n## /);
      const chunk = next > 0 ? rest.slice(0, t.length + next) : rest.slice(0, 1200);
      return chunk.trim().slice(0, 1200);
    }
  }
  return '';
}

let made = 0;
for (const a of pick) {
  const src = fs.readFileSync(path.join(PERSONAS, a.file), 'utf8');
  const body = src.replace(/^---[\s\S]*?---\s*\n?/, '');
  const bind = BIND[a.division] || BIND.engineering;
  const dir = path.join(SKILLS, `aa-${a.slug}`);
  fs.mkdirSync(dir, { recursive: true });

  const trigger = `Use this for any task needing ${a.name.toLowerCase()} — ${a.description.slice(0, 140)}.`;
  const workflow = section(body, ['## Workflow Process', '## Workflow', '### Phase 1']);
  const deliverables = section(body, ['## Technical Deliverables', '## Core Mission']);
  const rules = section(body, ['## Critical Rules', '## Rules', '## Communication Style']);

  let skill = `---\nname: aa-${a.slug}\ndescription: ${(a.name + ' — ' + a.description).slice(0, 160)}\nagents: [${bind.join(', ')}]\n---\n# ${a.name}\n${trigger}\n\n## Before you write\n1. Read the event/task payload fully; confirm division context (${a.division}).\n2. Check full persona at \`brain/agency-personas/${a.file}\` when you need verbatim detail.\n\n## The shape\nFollow \`template.md\` beside this file, section for section.\n\n## Rules\n- Stay inside ${a.division} expertise; do not invent facts outside it.\n- End deliverable with one line naming tools used, if any.\n`;
  if (deliverables) skill += `\n### Deliverables (distilled)\n${deliverables.slice(0, 1500)}\n`;
  if (workflow) skill += `\n### Workflow (distilled)\n${workflow.slice(0, 1500)}\n`;
  if (rules) skill += `\n### Style/Rules (distilled)\n${rules.slice(0, 1000)}\n`;
  if (skill.length > 5900) skill = skill.slice(0, 5900) + '\n';
  fs.writeFileSync(path.join(dir, 'SKILL.md'), skill);

  const personaExcerpt = src.slice(0, 3900);
  fs.writeFileSync(path.join(dir, 'persona.md'), personaExcerpt);
  const template = `# ${a.name} — output template\n\n## Trigger\n${trigger}\n\n## Checklist\n1. Confirm goal + audience\n2. Apply ${a.division} workflow phases\n3. Produce deliverable with concrete specifics (no generic filler)\n4. Self-check against persona Critical Rules\n5. Close with CTA / next step where relevant\n\n## Source\nFull persona: \`brain/agency-personas/${a.file}\`\n`;
  fs.writeFileSync(path.join(dir, 'template.md'), template.slice(0, 3900));
  made++;
}
console.log(`converted ${made} skills -> ${SKILLS}`);
