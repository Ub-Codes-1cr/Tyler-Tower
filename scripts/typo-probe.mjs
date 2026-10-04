// Phase 0/1 probe: golden typography parity between an OLD division and a NEW division.
// Asserts computed font-family/size/weight/color/line-height/letter-spacing are identical.
import { ROOT } from '../config.mjs';

let chromium = null;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }

const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 400)));
await page.goto('http://localhost:4520/');
await page.waitForTimeout(4500);

// INVARIANT (Phase 0 / Problem 39): no .division-card may be visible at load.
const loadState = await page.evaluate(() => {
  const all = [...document.querySelectorAll('.division-card')];
  const bad = all.filter(el => {
    const cs = getComputedStyle(el);
    return cs.visibility === 'visible' && parseFloat(cs.opacity) > 0;
  });
  return { total: all.length, visible: bad.length };
});
console.log(`cards-on-load: total=${loadState.total} visible=${loadState.visible}`);
if (loadState.visible > 0) console.log('FAIL Problem 39: cards visible at startup');

// Helper: open a bench by label, read typography off its first prow.
async function openAndSample(label) {
  await page.evaluate(() => { document.getElementById('railBack')?.click(); });
  await page.waitForTimeout(400);
  const found = await page.evaluate((lab) => {
    const b = [...document.querySelectorAll('.badge.bench')].find(el => el.textContent.includes(lab));
    if (!b) return null;
    b.click();
    return b.dataset.division || 'no-div';
  }, label);
  await page.waitForTimeout(1000);
  return found;
}

async function sampleType() {
  return page.evaluate(() => {
    const row = document.querySelector('#podRows .prow');
    if (!row) return null;
    const name = row.querySelector('.pr-head b');
    const tag = row.querySelector('.pr-tag');
    const desc = row.querySelector('.pr-desc');
    const g = (el, ...props) => {
      if (!el) return {};
      const cs = getComputedStyle(el);
      const o = {};
      for (const p of props) o[p] = cs[p];
      return o;
    };
    return {
      name: g(name, 'fontFamily', 'fontSize', 'fontWeight', 'color', 'lineHeight', 'letterSpacing'),
      tag: g(tag, 'fontFamily', 'fontSize', 'fontWeight', 'color', 'letterSpacing'),
      desc: g(desc, 'fontFamily', 'fontSize', 'color', 'lineHeight'),
      card: g(row, 'fontFamily', 'fontSize', 'color', 'lineHeight', 'letterSpacing'),
    };
  });
}

// OLD division: Marketing (original dept pod, also a bench).
const oldDiv = await openAndSample('MARKETING');
console.log('old-division-opened=' + oldDiv);
const oldType = await sampleType();

// NEW division: Engineering (added V3.1, 65 skills).
const newDiv = await openAndSample('ENGINEERING');
console.log('new-division-opened=' + newDiv);
const newType = await sampleType();

function cmp(label, a, b) {
  if (!a || !b) { console.log(`TYPO ${label}: missing sample (old=${!!a} new=${!!b})`); return false; }
  let ok = true;
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  for (const k of keys) {
    const av = a[k] ?? '', bv = b[k] ?? '';
    if (String(av) !== String(bv)) { console.log(`TYPO-DIFF ${label}.${k}: old="${av}" new="${bv}"`); ok = false; }
  }
  console.log(`TYPO ${label}: ${ok ? 'PASS' : 'FAIL'}`);
  return ok;
}

let allOk = true;
allOk = cmp('name', oldType?.name, newType?.name) && allOk;
allOk = cmp('tag', oldType?.tag, newType?.tag) && allOk;
allOk = cmp('desc', oldType?.desc, newType?.desc) && allOk;
allOk = cmp('card', oldType?.card, newType?.card) && allOk;

// Problem 15: font stack must carry fallbacks.
if (newType?.name?.fontFamily) {
  const fb = newType.name.fontFamily.split(',').map(s => s.trim()).filter(Boolean);
  console.log(`font-stack: ${fb.length} entries ${fb.length >= 2 ? 'PASS' : 'FAIL (Problem 15)'}`);
  if (fb.length < 2) allOk = false;
}

console.log('TYPOLOGY-PARITY: ' + (allOk ? 'PASS' : 'FAIL'));
console.log('ERRORS(' + errs.length + '):');
for (const e of errs.slice(0, 3)) console.log('  ' + e.split('\n').slice(0, 3).join(' | '));
await browser.close();
