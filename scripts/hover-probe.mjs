// Phase 0/3 probe: hover/reveal engine over the OPEN pod roster.
// Flow: click a bench badge -> its skill rows (cards) paint + auto-reveal; hover a row to keep
// them lit; hovering a different division's row switches the reveal; leaving hides; Esc hides.
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

const visibleOf = (sel) => page.evaluate((s) =>
  [...document.querySelectorAll(s)].filter(el => getComputedStyle(el).visibility === 'visible').length, sel);
const visibleCards = () => visibleOf('.division-card');

// INVARIANT: nothing visible at rest (Problem 39)
console.log(`cards-at-rest=${await visibleCards()} ${(await visibleCards()) === 0 ? 'PASS' : 'FAIL'}`);

// 1. click the engineering badge -> rail opens with engineering rows, auto-revealed
const opened = await page.evaluate(() => {
  const b = [...document.querySelectorAll('.badge.bench')].find(e => e.dataset.division === 'engineering');
  if (!b) return null; b.click(); return b.dataset.division;
});
console.log('opened-division=' + opened);
await page.waitForTimeout(900);
const engVisible = await visibleOf('#podRows .prow[data-division="engineering"]');
const totalVisible = await visibleCards();
console.log(`open-reveal: engineering-shown=${engVisible} total-visible=${totalVisible} ${engVisible > 0 ? 'PASS' : 'FAIL (Problem 5: rail opened empty)'}`);

// 2. hover a row (pointerover capture) -> stays revealed for the same division (no flicker)
await page.evaluate(() => {
  const r = document.querySelector('#podRows .prow');
  r.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
});
await page.waitForTimeout(80);
const afterRowHover = await visibleOf('#podRows .prow[data-division="engineering"]');
console.log(`row-hover: engineering-shown=${afterRowHover} ${afterRowHover > 0 ? 'PASS' : 'FAIL'}`);

// 3. open a DIFFERENT bench and confirm the reveal follows it (cross-division switch, Problem 7 race)
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.badge.bench')].find(e => e.dataset.division === 'design');
  b.click();
});
await page.waitForTimeout(900);
const designShown = await visibleOf('#podRows .prow[data-division="design"]');
console.log(`switch-to-design: design-shown=${designShown} ${designShown > 0 ? 'PASS' : 'FAIL (cross-division)'}`);

// 4. Escape hides the open roster's cards (Problem 8)
await page.keyboard.press('Escape');
await page.waitForTimeout(120);
const afterEsc = await visibleCards();
console.log(`escape: visible=${afterEsc} ${afterEsc === 0 ? 'PASS' : 'FAIL (Problem 8)'}`);

// 5. focus a badge reveals its division IF its cards exist (keyboard path, Problem 19)
const focusReveal = await page.evaluate(async () => {
  // reopen design so its rows exist, then keyboard-focus the design badge
  const b = [...document.querySelectorAll('.badge.bench')].find(e => e.dataset.division === 'design');
  b.click();
  await new Promise(r => setTimeout(r, 700));
  b.focus();
  b.dispatchEvent(new FocusEvent('focus', { bubbles: false }));
  await new Promise(r => setTimeout(r, 80));
  return [...document.querySelectorAll('#podRows .prow[data-division="design"]')]
    .filter(x => getComputedStyle(x).visibility === 'visible').length;
});
console.log(`focus-reveal(design-rows-open): shown=${focusReveal} ${focusReveal > 0 ? 'PASS' : 'FAIL'}`);

// 6. hover sweep timing budget across all 20 badges (Problem 37)
const t0 = await page.evaluate(() => performance.now());
await page.evaluate(() => {
  document.querySelectorAll('.badge.bench[data-division]').forEach(b => {
    b.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    b.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
  });
});
const sweepMs = await page.evaluate((s) => performance.now() - s, t0);
console.log(`sweep-20-badges: ${sweepMs.toFixed(1)}ms ${sweepMs < 250 ? 'PASS' : 'WARN'}`);

// 7. aria-expanded toggles on badges (Problem 18)
const aria = await page.evaluate(async () => {
  const b = document.querySelector('.badge.bench[data-division="testing"]');
  const before = b.getAttribute('aria-expanded');
  b.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
  await new Promise(r => setTimeout(r, 60));
  const during = b.getAttribute('aria-expanded');
  b.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
  await new Promise(r => setTimeout(r, 400));
  return `${before}->${during}->${b.getAttribute('aria-expanded')}`;
});
console.log('aria-expanded(testing): ' + aria + (aria === 'false->true->false' ? ' PASS' : ' FAIL'));

console.log('ERRORS(' + errs.length + '):');
for (const e of errs.slice(0, 4)) console.log('  ' + e.split('\n').slice(0, 3).join(' | '));
await browser.close();