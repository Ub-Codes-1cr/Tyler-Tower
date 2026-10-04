// Tyler-Tower citizen card — ONE adapter that turns any skill-citizen record into the
// fields the reusable chat shell needs. No per-agent code: roster agents keep their
// existing path, citizens resolve here from generated data (citizens.json).
// Pure functions: importable in Node for checks, no DOM, no THREE.
export function buildCitizenCard(citizen) {
  if (!citizen || !citizen.slug) return null;
  return {
    id: citizen.slug,
    kind: 'citizen',
    name: (citizen.name || citizen.slug).toUpperCase(),
    role: `${citizen.name || citizen.slug} · ${citizen.divisionLabel || citizen.division || ''}`.trim(),
    dept: citizen.division || '',
    deptName: (citizen.divisionLabel || citizen.division || '').toUpperCase(),
    tagline: (citizen.description || '').slice(0, 140),
    greeting: citizen.greeting || `I'm the ${citizen.name || citizen.slug}. Give me a task, or ask me something here.`,
    chips: Array.isArray(citizen.chips) && citizen.chips.length ? citizen.chips.slice(0, 4) : ['What can you do for me?'],
    demo: Array.isArray(citizen.demo) ? citizen.demo : [],
    pod: citizen.pod || '',
    lead: !!citizen.standing,
  };
}

// division -> office department for task routing (mirrors citizen-agent.mjs DIV_DEPT).
export const POD_DEPT = {
  academic: 'ops', design: 'marketing', engineering: 'delivery', finance: 'fin',
  'game-development': 'delivery', gis: 'ops', healthcare: 'ops', marketing: 'marketing',
  'paid-media': 'marketing', product: 'delivery', 'project-management': 'delivery',
  research: 'ops', sales: 'sales', security: 'ops', 'spatial-computing': 'marketing',
  specialized: 'ops', support: 'emails', testing: 'delivery',
};
export const deptFor = (division) => POD_DEPT[division] || 'delivery';

// Demo reply: keyword match over generated rules (offline/file:// path).
// Live path (Phase B) ignores this and calls /api/chat like roster agents.
export function demoReply(card, text) {
  const low = String(text || '').toLowerCase();
  if (!card) return 'On it.';
  for (const rule of (card.demo || [])) {
    const keys = Array.isArray(rule.k) ? rule.k : [rule.k];
    if (keys.some(k => k && low.includes(String(k).toLowerCase()))) return rule.r;
  }
  return `${card.name.charAt(0) + card.name.slice(1).toLowerCase()} here — noted. Give me the goal and constraints and I'll run the ${card.deptName.toLowerCase() || 'team'} workflow on it.`;
}
