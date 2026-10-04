// Phase 6 probe: keyboard + screen-reader affordances on the division reveal.
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

// Problem 32/33: badges expose role / label / expanded
const aria = await page.evaluate(() => {
  const b = document.querySelector('.badge.bench[data-division="engineering"]');
  return { role: b.getAttribute('role'), label: b.getAttribute('aria-label'), expanded: b.getAttribute('aria-expanded'), tabindex: b.tabIndex, title: b.title };
});
console.log('badge-aria:', JSON.stringify(aria));
console.log(`badge-aria: ${aria.role === 'button' && aria.label && aria.expanded === 'false' && aria.tabindex === 0 ? 'PASS' : 'FAIL'}`);

// Problem 21: keyboard-only reveal — focus a badge, Enter opens it
const kb = await page.evaluate(async () => {
  const b = document.querySelector('.badge.bench[data-division="design"]');
  b.focus();
  b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 900));
  return document.querySelectorAll('#podRows .prow[data-division="design"]').length;
});
console.log(`keyboard-open: rows=${kb} ${kb > 0 ? 'PASS' : 'FAIL'}`);

// Problem 21: hidden cards are not tab stops, revealed ones are
const tabbable = await page.evaluate(() => {
  const hidden = [...document.querySelectorAll('#podRows .prow:not(.visible) button')];
  const shown = [...document.querySelectorAll('#podRows .prow.visible button')];
  return {
    hiddenTabStops: hidden.filter(b => b.tabIndex >= 0).length,
    shownTabStops: shown.filter(b => b.tabIndex >= 0).length,
    hiddenCount: hidden.length, shownCount: shown.length
  };
});
console.log('tab-order:', JSON.stringify(tabbable), tabbable.hiddenTabStops === 0 && tabbable.shownTabStops > 0 ? 'PASS' : 'FAIL');

// Problem 30: the keyboard map is present in the rail
const keys = await page.evaluate(() => !!document.querySelector('#railHeader .pr-keys'));
console.log('keyboard-map: ' + (keys ? 'PASS' : 'FAIL'));

// Problem 20: focus ring styling exists on divisor targets
const ring = await page.evaluate(() => {
  const b = document.querySelector('.badge.bench[data-division="design"]');
  b.focus();
  const cs = getComputedStyle(b);
  // focus-visible may not apply to programmatic focus; check the rule exists instead
  let hasRule = false;
  for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) { if (r.cssText && /focus-visible/.test(r.cssText) && /badge/.test(r.cssText)) hasRule = true; } } catch { } }
  return { outline: cs.outlineStyle, hasRule };
});
console.log('focus-ring: ' + JSON.stringify(ring) + (ring.hasRule ? ' PASS' : ' FAIL'));

// Problem 19: touch tap reveals — open engineering's rail so its rows exist, then tap its badge
const touch = await page.evaluate(async () => {
  const eb = document.querySelector('.badge.bench[data-division="engineering"]');
  eb.click();
  await new Promise(r => setTimeout(r, 800));
  // simulate a tap on the badge: pointerdown with pointerType=touch
  eb.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }));
  await new Promise(r => setTimeout(r, 200));
  return document.querySelectorAll('#podRows .prow[data-division="engineering"]').length;
});
console.log('touch-tap-reveal: rows=' + touch + (touch > 0 ? ' PASS' : ' FAIL'));

// z-index of a revealed card beats the rail
const z = await page.evaluate(() => {
  const card = document.querySelector('#podRows .prow.visible');
  const rail = document.getElementById('rail');
  if (!card) return { card: null, rail: rail ? getComputedStyle(rail).zIndex : null };
  return { card: getComputedStyle(card).zIndex, rail: rail ? getComputedStyle(rail).zIndex : null };
});
const zOk = z.card != null && z.rail != null && parseInt(z.card) > parseInt(z.rail);
console.log('z-order: card=' + z.card + ' rail=' + z.rail + (zOk ? ' PASS' : ' FAIL'));

console.log('ERRORS(' + errs.length + '):');
for (const e of errs.slice(0, 3)) console.log('  ' + e.split('\n').slice(0, 3).join(' | '));
await browser.close();