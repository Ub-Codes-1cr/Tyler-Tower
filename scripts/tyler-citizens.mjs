// Tyler-Tower citizens generator — 282 agents -> visual citizens with deterministic look.
// Reads brain/agency-personas/index.json + divisions.json, emits citizens.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CORE = path.resolve(ROOT, '..');
const PERSONAS = path.join(CORE, 'brain', 'agency-personas');

const HAIRS = ['#2b2b2b', '#3b2b1d', '#111111', '#7a3b12', '#4a2a10', '#5a2d0c'];
const SKINS = ['#E8B98E', '#F0C9A0', '#C68B59', '#F5D5B0', '#D89F70'];

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function shortTag(name) {
  return name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).slice(0, 2).join(' ').slice(0, 14) || 'AGENT';
}
// Phase A chat shell: greeting + chips + demo keyword replies, generated once —
// the reusable component renders these, so no per-agent code or runtime LLM is needed.
const STOP = new Set('about,after,agent,expert,focused,focus,specialist,focused,with,from,that,this,into,your,through,strategist,strategies,strategy,coach,manager,engineer,creator,builder,analyst,optimizer'.split(','));
function keywordsFor(a) {
  const words = ((a.name || '') + ' ' + (a.description || '') + ' ' + (a.vibe || '')).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 5 && !STOP.has(w));
  const seen = [];
  for (const w of words) if (!seen.includes(w) && seen.length < 3) seen.push(w);
  while (seen.length < 3) seen.push(['process', 'workflow', 'results'][seen.length] || 'work');
  return seen;
}
function greetingFor(a, divisionLabel) {
  const first = (a.description || '').split(/[.!\n]/)[0].trim().slice(0, 120) || `specialist in ${divisionLabel.toLowerCase()}`;
  return `I'm the ${a.name} — ${first}. Give me a task in the bar on the right, or ask me something here.`;
}
function chipsFor() {
  return ['What can you do for me?', 'What tools can you use?', 'What are you working on?'];
}
function demoFor(a, divisionLabel, keywords) {
  const n = a.name;
  return [
    { k: ['what can you do', 'what do you do', 'help'], r: `${n} here — ${((a.description || '').split(/[.!\n]/)[0] || ('I work in ' + divisionLabel)).trim().slice(0, 200)} Hand me a real task and I'll get to work.` },
    { k: ['tool', 'use'], r: `I work through the ${divisionLabel} desk — briefs, skills and the shared brain. Tell me the goal and I'll pick the right workflow.` },
    { k: ['working on', 'doing now', 'status'], r: `Right now I'm on standby at the ${divisionLabel} pod, session attached. Give me something and you'll see it move below.` },
    { k: keywords, r: `Good question — that's core ${divisionLabel} territory for me. ${((a.description || '').split(/[.!\n]/)[0] || '').trim().slice(0, 160)} Give me the specifics and I'll run the full workflow.` },
  ];
}

const index = JSON.parse(fs.readFileSync(path.join(PERSONAS, 'index.json'), 'utf8'));
let divisionsMeta = { divisions: {} };
try { divisionsMeta = JSON.parse(fs.readFileSync(path.join(PERSONAS, 'divisions.json'), 'utf8')); } catch {}
const divLabel = d => divisionsMeta.divisions?.[d]?.label || d;
// 20 pods: 17 single divisions + specialized split in 3 + tyler kernel + reel factory overlay.
// Specialized split by slug hash thirds for even 20/20/19.
const SPECIAL_PODS = ['bench-specialized-a', 'bench-specialized-b', 'bench-specialized-c'];
const citizens = [];
for (const a of index.agents) {
  const h = hash(a.slug);
  let pod = `bench-${a.division}`;
  if (a.division === 'specialized') pod = SPECIAL_PODS[h % 3];
  const label = divLabel(a.division);
  const kw = keywordsFor(a);
  citizens.push({
    slug: a.slug,
    name: a.name,
    tag: shortTag(a.name),
    division: a.division,
    divisionLabel: label,
    description: (a.description || '').slice(0, 280),
    pod,
    hair: HAIRS[h % HAIRS.length],
    skin: SKINS[(h >> 3) % SKINS.length],
    standing: false,
    greeting: greetingFor(a, label),
    chips: chipsFor(),
    demo: demoFor(a, label, kw),
  });
}
// 1 standing ambassador per pod = first citizen alphabetically per pod
const byPod = {};
for (const c of citizens) { (byPod[c.pod] = byPod[c.pod] || []).push(c); }
for (const [pod, list] of Object.entries(byPod)) {
  list.sort((x, y) => x.slug.localeCompare(y.slug));
  if (list[0]) list[0].standing = true;
}
// deskIndex = order within pod (seated only)
for (const list of Object.values(byPod)) {
  let i = 0;
  for (const c of list) { c.deskIndex = c.standing ? -1 : i++; }
  list.sort((x, y) => x.slug.localeCompare(y.slug));
}
fs.writeFileSync(path.join(PERSONAS, 'citizens.json'), JSON.stringify({ generated: new Date().toISOString(), total: citizens.length, citizens }, null, 2));
console.log(`citizens ${citizens.length} across ${Object.keys(byPod).length} pods`);
for (const [p, l] of Object.entries(byPod).sort()) console.log(`  ${p}: ${l.length}`);
