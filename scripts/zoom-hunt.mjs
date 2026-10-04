// Loop-killer hunt: load the page repeatedly, exercise inputs, print any pageerror stack.
import path from 'node:path';
import { ROOT } from '../config.mjs';

let chromium = null;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('playwright-core')); }

let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }

for (let run = 1; run <= 6; run++) {
  const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 900)));
  await page.goto('file://' + path.join(ROOT, 'dist', 'command-centre-v2.html') + '?s=check');
  await page.waitForTimeout(3500);
  // exercise: button, wheel, keys, drag, bench click, dept click, dblclick, digits
  await page.evaluate(() => document.getElementById('zIn')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1 })));
  await page.waitForTimeout(500);
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, -300);
  await page.keyboard.press('d');
  await page.keyboard.press('+');
  await page.keyboard.press('0');
  await page.mouse.move(700, 400); await page.mouse.down();
  await page.mouse.move(800, 450, { steps: 8 }); await page.mouse.up();
  await page.mouse.dblclick(760, 450);
  await page.keyboard.press('1');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  const alive = await page.evaluate(() => ({ zoom: +window.CC?.view?.zoom?.toFixed(3), raf: typeof window.CC !== 'undefined' }));
  console.log(`run ${run}: alive=${JSON.stringify(alive)} errors=${errs.length}`);
  for (const e of errs) console.log('  ERR:\n  ' + e.split('\n').slice(0, 6).join('\n  '));
  await page.close();
}
await browser.close();
