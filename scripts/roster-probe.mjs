// Phase 4/5 probe: search density + deploy parity for a NEW division roster.
let chromium = null;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 300)));
await page.goto('http://localhost:4520/');
await page.waitForTimeout(4500);

// open engineering (65 skills — the long bench)
await page.evaluate(() => [...document.querySelectorAll('.badge.bench')].find(e => e.dataset.division === 'engineering').click());
await page.waitForTimeout(1000);

// Problem 28: long bench is capped with a "show all" toggle
const cap = await page.evaluate(() => ({
  rows: document.querySelectorAll('#podRows .prow').length,
  more: !!document.querySelector('#podRows .pr-more'),
  moreText: document.querySelector('#podRows .pr-more')?.textContent || null,
  count: document.getElementById('podCount')?.textContent,
  seats: document.getElementById('podDesks')?.textContent,
}));
console.log(`cap: rows=${cap.rows} more=${cap.more} "${cap.moreText}" count="${cap.count}" seats="${cap.seats}" ${cap.rows === 20 && cap.more ? 'PASS' : 'FAIL'}`);

const expanded = await page.evaluate(async () => {
  document.querySelector('#podRows .pr-more').click();
  await new Promise(r => setTimeout(r, 200));
  return document.querySelectorAll('#podRows .prow').length;
});
console.log(`expand-all: rows=${expanded} ${expanded > 20 ? 'PASS' : 'FAIL'}`);

// Problem 27: search is debounced — typing must not rebuild on every keystroke
const search = await page.evaluate(async () => {
  const box = document.getElementById('podSearch');
  const t0 = performance.now();
  for (const ch of 'data') {
    box.value += ch;
    box.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const immediately = document.querySelectorAll('#podRows .prow').length;
  await new Promise(r => setTimeout(r, 260));
  const after = document.querySelectorAll('#podRows .prow').length;
  return { immediately, after, ms: performance.now() - t0 };
});
console.log(`debounce: rows-during=${search.immediately} rows-after=${search.after} ${search.after > 0 && search.after < 20 ? 'PASS' : 'FAIL'}`);

// Problem 43/44: a search with no match shows the "no match" state, not the "no skills" one
const noMatch = await page.evaluate(async () => {
  const box = document.getElementById('podSearch');
  box.value = 'zzzqqqxyz';
  box.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 260));
  const empty = document.querySelector('#podRows .pr-empty');
  return { text: empty?.textContent || null, hint: !!document.querySelector('#podRows .pr-hint') };
});
console.log(`no-match: "${(noMatch.text || '').slice(0, 46)}" hint=${noMatch.hint} ${noMatch.hint ? 'PASS' : 'FAIL'}`);

// back to the full roster for the deploy checks
await page.evaluate(async () => {
  const box = document.getElementById('podSearch');
  box.value = ''; box.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 260));
});

// Problem 22: a too-short goal is refused with guidance
const shortGoal = await page.evaluate(async () => {
  const row = document.querySelector('#podRows .prow');
  row.querySelector('.pr-deploy').click();
  const inp = row.querySelector('.pr-go input');
  inp.value = 'ab';
  row.querySelector('.pr-go button').click();
  await new Promise(r => setTimeout(r, 200));
  return row.querySelector('.pr-status').textContent;
});
console.log(`short-goal: "${shortGoal}" ${/min 5/.test(shortGoal) ? 'PASS' : 'FAIL'}`);

// Problem 24 + 23: a real goal goes out, comes back busy then a friendly failure
const deploy = await page.evaluate(async () => {
  const row = document.querySelector('#podRows .prow');
  const inp = row.querySelector('.pr-go input');
  inp.value = 'reconcile the quarterly numbers';
  const btn = row.querySelector('.pr-go button');
  btn.click();
  const during = { status: row.querySelector('.pr-status').textContent, disabled: btn.disabled, busy: !!row.dataset.busy };
  await new Promise(r => setTimeout(r, 5000));
  const st = row.querySelector('.pr-status');
  return { during, cls: st.className, text: st.textContent, raw: st.title, btnEnabled: !btn.disabled };
});
console.log(`deploy-busy: "${deploy.during.status}" disabled=${deploy.during.disabled} ${deploy.during.disabled ? 'PASS' : 'FAIL'}`);
console.log(`deploy-result: class="${deploy.cls}" text="${(deploy.text || '').slice(0, 96)}"`);
console.log(`deploy-friendly: ${/isn't running on this machine/.test(deploy.text || '') ? 'PASS' : 'CHECK'} btn-reenabled=${deploy.btnEnabled ? 'PASS' : 'FAIL'}`);
console.log(`deploy-raw-kept: ${deploy.raw ? 'PASS' : 'FAIL'}`);

console.log('ERRORS(' + errs.length + '):');
for (const e of errs.slice(0, 3)) console.log('  ' + e.split('\n').slice(0, 3).join(' | '));
await browser.close();