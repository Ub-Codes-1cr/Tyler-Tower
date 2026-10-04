// Zoom probe: captures console/page errors and tests every input path.
import path from 'node:path';
import { loadConfig, ROOT } from '../config.mjs';

let chromium = null;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('playwright-core')); }

let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const t0probe = Date.now();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(`[+${Date.now() - t0probe}ms] console: ` + m.text().slice(0, 300)); });
page.on('pageerror', e => errors.push(`[+${Date.now() - t0probe}ms] pageerror: ` + String(e.stack || e.message).slice(0, 600)));

await page.goto('file://' + path.join(ROOT, 'dist', 'command-centre-v2.html') + '?s=check');
await page.waitForTimeout(4000);

const z0 = await page.evaluate(() => window.CC?.view?.zoom);
console.log('zoom-at-load=' + z0);

const out = await page.evaluate(() => {
  const r = {};
  try {
    r.hasCC = !!window.CC;
    const b = document.getElementById('zIn');
    r.zIn = !!b;
    const rect = b.getBoundingClientRect();
    r.rect = [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)].join(',');
    const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
    const top = document.elementFromPoint(cx, cy);
    r.topAtButton = top ? (top.id || top.className.toString().slice(0, 60)) : 'none';
    r.zBefore = window.CC.view.zoom;
    // dispatch pointerdown exactly like a real press (holdRepeat listens on pointerdown)
    b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1 }));
    r.dispatched = true;
  } catch (e) { r.clickErr = String(e.message).slice(0, 200); }
  return r;
});
console.log(JSON.stringify(out));
await page.waitForTimeout(800);
console.log('zoom-after-zIn-click=' + await page.evaluate(() => window.CC?.view?.zoom));

// wheel
await page.mouse.move(700, 400);
await page.mouse.wheel(0, -400);
await page.waitForTimeout(600);
console.log('zoom-after-wheel=' + await page.evaluate(() => window.CC?.view?.zoom));

// keyboard: side-effect test with 'd' (dark mode toggles body.dark — no zoom involved)
const darkBefore = await page.evaluate(() => document.body.classList.contains('dark'));
await page.evaluate(() => { document.body.focus(); document.activeElement?.blur(); });
await page.keyboard.press('d');
await page.waitForTimeout(400);
const darkAfter = await page.evaluate(() => document.body.classList.contains('dark'));
console.log(`dark-toggle: before=${darkBefore} after=${darkAfter} active=` + await page.evaluate(() => (document.activeElement?.tagName || '?')));
// trusted '+' via CDP now that focus is definitely on body
const zBeforePlus = await page.evaluate(() => {
  window.__keys = [];
  window.addEventListener('keydown', e => window.__keys.push(e.key + '|' + e.code + '|' + (e.target?.tagName || '?')), true);
  return window.CC.view.zoom;
});
await page.keyboard.press('+');
await page.waitForTimeout(700);
console.log('keys-seen=' + await page.evaluate(() => JSON.stringify(window.__keys)));
console.log('zoom-after-trusted-plus=' + await page.evaluate(() => window.CC?.view?.zoom) + ' (was ' + zBeforePlus + ')');

// drag pan
const t0 = await page.evaluate(() => window.CC.view.target.toArray().map(v => +v.toFixed(2)).join(','));
await page.mouse.move(700, 400);
await page.mouse.down();
await page.mouse.move(800, 450, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(400);
const t1 = await page.evaluate(() => window.CC.view.target.toArray().map(v => +v.toFixed(2)).join(','));
console.log('target-before-drag=' + t0);
console.log('target-after-drag=' + t1);

console.log('ERRORS(' + errors.length + '):');
for (const e of errors.slice(0, 10)) console.log('  ' + e);
await browser.close();
