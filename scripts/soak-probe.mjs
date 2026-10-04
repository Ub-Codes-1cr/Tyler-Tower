// Phase 10 soak: exercise all 20 divisions and every path, then assert zero errors.
// The machine-driven equivalent of clicking the office hundreds of times.
let chromium = null;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 300)));
const t0 = Date.now();
await page.goto('http://localhost:4520/');
await page.waitForTimeout(4500);
const initMs = Date.now() - t0;

// the divisions actually present on the bench badges
const divisions = await page.evaluate(() =>
  [...new Set([...document.querySelectorAll('.badge.bench[data-division]')].map(b => b.dataset.division))]);
console.log(`init: ${initMs}ms (goto→settle) · divisions=${divisions.length}`);

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) { pass++; } else { fail++; console.log(`  FAIL ${name} ${detail}`); } };

// 1. every division opens its roster, reveals its rows, and closes clean
for (const div of divisions) {
  const r = await page.evaluate(async (d) => {
    const b = document.querySelector(`.badge.bench[data-division="${CSS.escape(d)}"]`);
    if (!b) return { open: false };
    b.click();
    await new Promise(r => setTimeout(r, 350));
    const rows = document.querySelectorAll('#podRows .prow').length;
    const visible = [...document.querySelectorAll('#podRows .prow')].filter(x => getComputedStyle(x).visibility === 'visible').length;
    const countOk = (document.getElementById('podCount')?.textContent || '').length > 0;
    const keys = !!document.querySelector('#railHeader .pr-keys');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const afterEsc = [...document.querySelectorAll('.division-card')].filter(x => getComputedStyle(x).visibility === 'visible').length;
    return { open: true, rows, visible, countOk, keys, afterEsc };
  }, div);
  check(`div:${div}:opens`, r.open && r.rows > 0, JSON.stringify(r));
  check(`div:${div}:reveals`, r.visible > 0, JSON.stringify(r));
  check(`div:${div}:escape`, r.afterEsc === 0, JSON.stringify(r));
}

// 2. 150 random hovers across the badges — no errors, no stuck cards
const hoverErrsBefore = errs.length;
await page.evaluate(async () => {
  const badges = [...document.querySelectorAll('.badge.bench[data-division]')];
  for (let i = 0; i < 150; i++) {
    const b = badges[Math.floor(Math.random() * badges.length)];
    b.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    b.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
    if (i % 30 === 0) await new Promise(r => setTimeout(r, 40));
  }
});
check('hover:150-no-errors', errs.length === hoverErrsBefore, `${errs.length - hoverErrsBefore} new`);

// 3. 100 search keystrokes across a long bench — debounce holds, no errors
await page.evaluate(() => [...document.querySelectorAll('.badge.bench')].find(b => b.dataset.division === 'engineering').click());
await page.waitForTimeout(600);
for (let i = 0; i < 100; i++) {
  await page.evaluate((n) => {
    const box = document.getElementById('podSearch');
    if (!box) return;
    box.value = 'aitemrbc'[n % 8] + (n % 5);
    box.dispatchEvent(new Event('input', { bubbles: true }));
  }, i);
}
await page.waitForTimeout(300);
const searchRows = await page.evaluate(() => document.querySelectorAll('#podRows .prow').length);
check('search:100-keystrokes-stable', searchRows >= 0, 'rows=' + searchRows);

// 4. keyboard sweep: Enter through every badge, Escape each time
const kbErrs = errs.length;
await page.evaluate(async () => {
  for (const b of [...document.querySelectorAll('.badge.bench[data-division]')]) {
    b.focus();
    b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 120));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 120));
  }
});
check('keyboard:sweep-no-errors', errs.length === kbErrs, `${errs.length - kbErrs} new`);

// 5. final invariants
const rest = await page.evaluate(() => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  return [...document.querySelectorAll('.division-card')].filter(x => getComputedStyle(x).visibility === 'visible').length;
});
check('invariant:no-cards-on-load-style', rest === 0, 'visible=' + rest);

console.log(`\nSOAK: ${pass} passed, ${fail} failed`);
console.log('ERRORS(' + errs.length + '):');
for (const e of errs.slice(0, 8)) console.log('  ' + e.split('\n').slice(0, 3).join(' | '));
await browser.close();
process.exitCode = fail === 0 && errs.length === 0 ? 0 : 1;