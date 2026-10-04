// Tyler Tower v2 — roster + design tokens (ported from v1 command-centre.html)
import { applyData } from './profile.js';

// Nominal.so tokens (locked design language, 30 Jul 2026)
export const TOKENS = {
  cream: '#FDFFF8',
  ink: '#151414',
  grey: '#5A5A5A',
  hairline: 'rgba(21,20,20,0.12)',
};

export const DEPT_KEYS = ['emails', 'sales', 'marketing', 'ops', 'fin', 'delivery'];
export const DEPTS = {
  emails:    { name: 'EMAILS',           short: 'EMAILS',  chip: '#5ADEB7', ink: '#1E9070', floor: '#E9F6EF' },
  delivery:  { name: 'DELIVERY',         short: 'DELIVERY', chip: '#8FD3F4', ink: '#2E86AB', floor: '#E6F4FB' },
  sales:     { name: 'SALES',            short: 'SALES',   chip: '#EADC8F', ink: '#A08A1E', floor: '#F6F1DA' },
  marketing: { name: 'MARKETING',        short: 'MARKETING', chip: '#E69393', ink: '#C46060', floor: '#FAE9E7' },
  fin:       { name: 'FINANCE',          short: 'FINANCE', chip: '#98A5EF', ink: '#5B66CE', floor: '#EAEDFA' },
  ops:       { name: 'OPERATIONS',       short: 'OPERATIONS', chip: '#BFA2E3', ink: '#7449A9', floor: '#F2ECFA' },
  brain:     { name: 'THE BRAIN',        short: 'THE BRAIN', chip: '#D1DECD', ink: '#4C7A57', floor: '#E9EFE4' },
};

export const AGENTS = [
  // EMAILS (5)
  { id: 'elead', name: 'EMAILS LEAD',         dept: 'emails',    lead: true,  grid: [0.5, 0], hair: '#2b2b2b', skin: '#E8B98E' },
  { id: 'cmail', name: 'CLIENT EMAILS',       dept: 'emails',    grid: [0, 1], hair: '#3b2b1d', skin: '#F0C9A0' },
  { id: 'imail', name: 'INTERNAL EMAILS',     dept: 'emails',    grid: [1, 1], hair: '#111111', skin: '#C68B59' },
  { id: 'vmail', name: 'VENDOR EMAILS',       dept: 'emails',    grid: [0, 2], hair: '#7a3b12', skin: '#F5D5B0' },
  { id: 'kmail', name: 'CONTRACTOR EMAILS',   dept: 'emails',    grid: [1, 2], hair: '#4a2a10', skin: '#D89F70' },
  // SALES (6)
  { id: 'lexi',  name: 'SALES LEAD',          dept: 'sales',     lead: true,  grid: [0.5, 0], hair: '#5a2d0c', skin: '#F0C9A0' },
  { id: 'enzo',  name: 'LEAD ENRICHER',       dept: 'sales',     grid: [0, 1], hair: '#1c1c2e', skin: '#E0A878' },
  { id: 'ilm',   name: 'INBOUND LEADS MANAGER', dept: 'sales',   grid: [1, 1], hair: '#26140a', skin: '#F5D5B0' },
  { id: 'pros',  name: 'PROSPECTOR',          dept: 'sales',     grid: [0, 2], hair: '#2a1a0e', skin: '#E8B98E' },
  { id: 'piper', name: 'PROPOSALS',           dept: 'sales',     grid: [1, 2], hair: '#2d1a0a', skin: '#F0C9A0' },
  { id: 'folo',  name: 'FOLLOW UPS',          dept: 'sales',     grid: [0.5, 3], hair: '#171717', skin: '#F5D5B0' },
  // MARKETING (7)
  { id: 'mlead', name: 'MARKETING LEAD',      dept: 'marketing', lead: true,  grid: [0.5, 0], hair: '#2a1a0e', skin: '#E0A878' },
  { id: 'riley', name: 'RESEARCH',            dept: 'marketing', grid: [0, 1], hair: '#8a4a1f', skin: '#F5D5B0' },
  { id: 'newt',  name: 'NEWSLETTER',          dept: 'marketing', grid: [1, 1], hair: '#26140a', skin: '#D89F70' },
  { id: 'gfx',   name: 'GRAPHICS DESIGNER',   dept: 'marketing', grid: [0, 2], hair: '#141414', skin: '#F0C9A0' },
  { id: 'ada',   name: 'META ADS',            dept: 'marketing', grid: [1, 2], hair: '#3d2814', skin: '#C68B59' },
  { id: 'iggy',  name: 'INSTAGRAM ORGANIC',   dept: 'marketing', grid: [0, 3], hair: '#552200', skin: '#E8B98E' },
  { id: 'vid',   name: 'VIDEO EDITOR',        dept: 'marketing', grid: [1, 3], hair: '#1b1b24', skin: '#D9A97E' },
  // OPERATIONS (6)
  { id: 'olead', name: 'OPERATIONS LEAD',     dept: 'ops',       lead: true,  grid: [0.5, 0], hair: '#111111', skin: '#F0C9A0' },
  { id: 'scout', name: 'INTEL',               dept: 'ops',       grid: [0, 1], hair: '#101820', skin: '#B07850' },
  { id: 'legal', name: 'LEGAL REVIEW',        dept: 'ops',       grid: [1, 1], hair: '#20242e', skin: '#F0C9A0' },
  { id: 'comply', name: 'COMPLIANCE CHECKER', dept: 'ops',       grid: [0, 2], hair: '#5a3a1a', skin: '#C68B59' },
  { id: 'report', name: 'INTERNAL REPORTING', dept: 'ops',       grid: [1, 2], hair: '#2e2118', skin: '#E8B98E' },
  { id: 'dash',  name: 'INTERNAL DASHBOARDS', dept: 'ops',       grid: [0.5, 3], hair: '#0d0d0d', skin: '#9C6B43' },
  // FINANCE (4)
  { id: 'alead', name: 'ACCOUNTING LEAD',     dept: 'fin',       lead: true,  grid: [0.5, 0], hair: '#1f1f1f', skin: '#E0A878' },
  { id: 'invo',  name: 'INVOICING',           dept: 'fin',       grid: [0, 1], hair: '#4a2a10', skin: '#F5D5B0' },
  { id: 'apay',  name: 'ACCOUNTS PAYABLE',    dept: 'fin',       grid: [1, 1], hair: '#0a0a0a', skin: '#8A5A32' },
  { id: 'recon', name: 'RECONCILIATION',      dept: 'fin',       grid: [0.5, 2], hair: '#33221a', skin: '#E8B98E' },
  // DELIVERY (7)
  { id: 'dlead', name: 'DELIVERY LEAD',       dept: 'delivery',  lead: true,  grid: [0.5, 0], hair: '#1f1f1f', skin: '#F0C9A0' },
  { id: 'pco',   name: 'PROJECT CO-ORDINATOR', dept: 'delivery', grid: [0, 1], hair: '#3d2814', skin: '#E8B98E' },
  { id: 'qa',    name: 'QUALITY ASSURANCE CHECKER', dept: 'delivery', grid: [1, 1], hair: '#101820', skin: '#C68B59' },
  { id: 'crep',  name: 'CLIENT REPORTS',      dept: 'delivery',  grid: [0, 2], hair: '#6b3410', skin: '#F5D5B0' },
  { id: 'cass',  name: 'CLIENT ASSETS',       dept: 'delivery',  grid: [1, 2], hair: '#141414', skin: '#D9A97E' },
  { id: 'dasst', name: 'DESIGNER ASSISTANT',  dept: 'delivery',  grid: [0, 3], hair: '#552200', skin: '#F0C9A0' },
  { id: 'ona',   name: 'ONBOARDER',           dept: 'delivery',  grid: [1, 3], hair: '#0d0d0d', skin: '#9C6B43' },
];

const DEG2RAD = Math.PI / 180;

// Departments on Tier 1 (R1 = 60.0, 60° apart, Phase = 3°)
const deptPositions = {};
DEPT_KEYS.forEach((k, i) => {
  const theta = (60 * i + 3) * DEG2RAD;
  deptPositions[k] = [
    Math.round(Math.cos(theta) * 60.0 * 10) / 10,
    Math.round(Math.sin(theta) * 60.0 * 10) / 10
  ];
});

export const LAYOUT = {
  brain:     { pos: [0, 0],     w: 16, d: 16 },
  emails:    { pos: deptPositions['emails'],    w: 20, d: 26 },
  delivery:  { pos: deptPositions['delivery'],  w: 20, d: 30 },
  sales:     { pos: deptPositions['sales'],     w: 20, d: 30 },
  marketing: { pos: deptPositions['marketing'], w: 20, d: 30 },
  fin:       { pos: deptPositions['fin'],       w: 20, d: 26 },
  ops:       { pos: deptPositions['ops'],       w: 20, d: 30 },
};

export const BILLBOARDS = {
  emails:    [{ id: 'emails',    label: 'EMAILS SENT',      val: 128 }],
  delivery:  [{ id: 'reports',   label: 'REPORTS SENT',     val: 9 }],
  sales:     [{ id: 'leads',     label: 'LEADS ENRICHED',   val: 47 },
              { id: 'callhrs',   label: 'CALL HRS ROUTED',  val: 9.5, fmt: v => v.toFixed(1) + 'h', step: 0.4 }],
  marketing: [{ id: 'adspend',   label: 'AD SPEND TODAY',   val: 684, fmt: v => '$' + Math.round(v).toLocaleString('en-NZ'), step: 12 }],
  ops:       [{ id: 'proposals', label: 'PROPOSALS SENT',   val: 6 }],
  fin:       [{ id: 'invoices',  label: 'INVOICES ISSUED', val: 23 }],
  brain:     [{ id: 'notes',     label: 'NOTES INDEXED',    val: 1204, fmt: v => Math.round(v).toLocaleString('en-NZ') }],
};

export const APPROVAL_ASKS = {};
export const APPROVAL_BY_AGENT = {};
export const WORKLINES = {};

applyData({ DEPTS, AGENTS, BILLBOARDS, APPROVAL_ASKS, APPROVAL_BY_AGENT, WORKLINES });

// Procedural Tier 2 & Tier 3 Bench Placement
// Tier 2: Mid Benches (R2 = 115.0, Phase = 33°)
// Tier 3: Outer Benches (R3 = 175.0, Phase = 21°)
const rawBenches = [
  // Tier 2: Mid Benches (R2 = 115.0, Phase = 33°)
  { id: 'bench-engineering', division: 'engineering', label: 'Engineering', color: '#3B82F6', floor: '#E3ECFD', chip: '#3B82F6', count: 65, seats: 64, cols: 8, rows: 8, tier: 2, index: 0 },
  { id: 'bench-marketing', division: 'marketing', label: 'Marketing', color: '#F97316', floor: '#FDEBD9', chip: '#F97316', count: 37, seats: 36, cols: 6, rows: 6, tier: 2, index: 1 },
  { id: 'bench-specialized-a', division: 'specialized', label: 'Specialized · BizOps', color: '#6366F1', floor: '#E6E6FA', chip: '#6366F1', count: 21, seats: 20, cols: 5, rows: 4, tier: 2, index: 2 },
  { id: 'bench-game-development', division: 'game-development', label: 'Game Dev', color: '#A855F7', floor: '#F0E2FD', chip: '#A855F7', count: 21, seats: 20, cols: 5, rows: 4, tier: 2, index: 3 },
  { id: 'bench-specialized-b', division: 'specialized', label: 'Specialized · Verticals', color: '#6366F1', floor: '#E6E6FA', chip: '#6366F1', count: 19, seats: 18, cols: 5, rows: 4, tier: 2, index: 4 },
  { id: 'bench-specialized-c', division: 'specialized', label: 'Specialized · Builders', color: '#6366F1', floor: '#E6E6FA', chip: '#6366F1', count: 19, seats: 18, cols: 5, rows: 4, tier: 2, index: 5 },
  { id: 'bench-gis', division: 'gis', label: 'GIS', color: '#14B8A6', floor: '#D9F4F0', chip: '#14B8A6', count: 13, seats: 12, cols: 4, rows: 3, tier: 2, index: 6 },
  { id: 'bench-security', division: 'security', label: 'Security', color: '#EF4444', floor: '#FBDCDC', chip: '#EF4444', count: 12, seats: 11, cols: 4, rows: 3, tier: 2, index: 7 },
  { id: 'bench-design', division: 'design', label: 'Design', color: '#EC4899', floor: '#FBDCEA', chip: '#EC4899', count: 10, seats: 9, cols: 3, rows: 3, tier: 2, index: 8 },
  { id: 'bench-sales', division: 'sales', label: 'Sales', color: '#10B981', floor: '#D7F2E6', chip: '#10B981', count: 9, seats: 8, cols: 3, rows: 3, tier: 2, index: 9 },

  // Tier 3: Outer Benches (R3 = 175.0, Phase = 21°)
  { id: 'bench-testing', division: 'testing', label: 'Testing', color: '#F59E0B', floor: '#FCEFCF', chip: '#F59E0B', count: 9, seats: 8, cols: 3, rows: 3, tier: 3, index: 0 },
  { id: 'bench-paid-media', division: 'paid-media', label: 'Paid Media', color: '#EAB308', floor: '#FBF3C9', chip: '#EAB308', count: 7, seats: 6, cols: 3, rows: 2, tier: 3, index: 1 },
  { id: 'bench-project-management', division: 'project-management', label: 'Project Mgmt', color: '#0EA5E9', floor: '#D7EFFB', chip: '#0EA5E9', count: 7, seats: 6, cols: 3, rows: 2, tier: 3, index: 2 },
  { id: 'bench-academic', division: 'academic', label: 'Academic', color: '#8B5CF6', floor: '#E9E1FD', chip: '#8B5CF6', count: 6, seats: 5, cols: 3, rows: 2, tier: 3, index: 3 },
  { id: 'bench-product', division: 'product', label: 'Product', color: '#D946EF', floor: '#F9DDFC', chip: '#D946EF', count: 6, seats: 5, cols: 3, rows: 2, tier: 3, index: 4 },
  { id: 'bench-spatial-computing', division: 'spatial-computing', label: 'Spatial', color: '#06B6D4', floor: '#D2F1F7', chip: '#06B6D4', count: 6, seats: 5, cols: 3, rows: 2, tier: 3, index: 5 },
  { id: 'bench-support', division: 'support', label: 'Support', color: '#84CC16', floor: '#EAF6D2', chip: '#84CC16', count: 6, seats: 5, cols: 3, rows: 2, tier: 3, index: 6 },
  { id: 'bench-finance', division: 'finance', label: 'Finance', color: '#22C55E', floor: '#D9F1E2', chip: '#22C55E', count: 5, seats: 4, cols: 2, rows: 2, tier: 3, index: 7 },
  { id: 'bench-healthcare', division: 'healthcare', label: 'Healthcare', color: '#0D9488', floor: '#D2EEEA', chip: '#0D9488', count: 3, seats: 2, cols: 2, rows: 1, tier: 3, index: 8 },
  { id: 'bench-research', division: 'research', label: 'Research', color: '#7C3AED', floor: '#E6DCFB', chip: '#7C3AED', count: 1, seats: 0, cols: 1, rows: 1, tier: 3, index: 9 },
];

const CW = 6.2, CD = 5.4, MARGIN = 2.2;

export const BENCH_PODS = rawBenches.map(b => {
  const radius = b.tier === 2 ? 115.0 : 175.0;
  const phase = b.tier === 2 ? 33 : 21;
  const theta = (36 * b.index + phase) * DEG2RAD;
  const w = Math.round((b.cols * CW + MARGIN) * 10) / 10;
  const d = Math.round((b.rows * CD + MARGIN) * 10) / 10;
  const px = Math.round(Math.cos(theta) * radius * 10) / 10;
  const pz = Math.round(Math.sin(theta) * radius * 10) / 10;

  return {
    ...b,
    desks: b.cols * b.rows,
    pos: [px, pz],
    w,
    d
  };
});

export const BENCHES = BENCH_PODS.map(({ id, division, label, color, count, pos }) => ({ id, division, label, color, count, pos }));

export const BENCH_WORKLINES = {
  'bench-engineering': ['▸ rag eval: hybrid search + rerank', '▸ backend: idempotent payment flow', '▸ on-call: incident review at 5'],
  'bench-marketing': ['▸ hook v3 — 3-sec pattern interrupt', '▸ carousel queued: 5 slides + CTA', '▸ trend scan: sounds + hashtags'],
  'bench-specialized-a': ['▸ ops review: vendor renewals x3', '▸ QBR pack: NRR + expansion', '▸ hiring loop: 2 screens Friday'],
  'bench-game-development': ['▸ level blockout: encounter flow', '▸ shader pass: URP performance', '▸ playtest notes triaged x9'],
  'bench-specialized-b': ['▸ intake call notes → conflict check', '▸ closing checklist: 4 docs left', '▸ RCM: 2 denials reworked'],
  'bench-specialized-c': ['▸ MCP server: tool schema review', '▸ workflow map: 6 paths traced', '▸ codebase drift audit queued'],
  'bench-gis': ['▸ tile cache warming: z12-z16', '▸ CRS audit: 3 layers reprojected', '▸ drone survey queued Thursday'],
  'bench-security': ['▸ threat hunt: ATT&CK mapping', '▸ pentest finding #12 retest', '▸ secrets rotation: 4 vaults'],
  'bench-design': ['▸ component audit: button states', '▸ brand kit export: story set', '▸ usability test: 5 sessions cut'],
  'bench-sales': ['▸ sequence reply rate 8.2%', '▸ discovery prep: MEDDPICC sheet', '▸ forecast call in 30 min'],
  'bench-testing': ['▸ evidence: screenshot proof filed', '▸ flake hunt: 2 quarantined', '▸ a11y pass: contrast + focus'],
  'bench-paid-media': ['▸ query audit: wasted spend cut', '▸ creative refresh: 3 RSAs live', '▸ tracking check: CAPI green'],
  'bench-project-management': ['▸ sprint board groomed: 14 pts', '▸ risk log: 2 owners nudged', '▸ milestone moved: Tue → Thu'],
  'bench-academic': ['▸ lit review: 6 sources coded', '▸ methods check: sampling frame', '▸ citation trace complete'],
  'bench-product': ['▸ PRD review: activation metric', '▸ feedback cluster: onboarding', '▸ roadmap vote closes Fri'],
  'bench-spatial-computing': ['▸ WebXR scene: 60fps locked', '▸ visionOS build 41 staged', '▸ spatial anchor test x3'],
  'bench-support': ['▸ queue: 6 tickets, oldest 22m', '▸ macro updated: refund flow', '▸ CSAT 4.8 this week'],
  'bench-finance': ['▸ close checklist: 9 of 12', '▸ variance note: travel +8%', '▸ invoice run approved'],
  'bench-healthcare': ['▸ evidence bar: claim review', '▸ compliance note filed', '▸ pilot readout Thursday'],
  'bench-research': ['▸ synthesis map: 4 clusters', '▸ source quality pass done', '▸ brief drafted for review'],
};
Object.assign(WORKLINES, BENCH_WORKLINES);
