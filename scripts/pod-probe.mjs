// Pod roster probe: badge click -> rail list -> search -> chat -> back -> deploy.
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
console.log('citizens-loaded=' + await page.evaluate(() => (window.TYLER_CITIZENS?.citizens || []).length));

// 1. click a real bench badge
const clicked = await page.evaluate(() => {
  const badges = [...document.querySelectorAll('.badge.bench')];
  const b = badges.find(el => el.textContent.includes('Testing')) || badges[0];
  if (!b) return 'no-bench-badge';
  b.click();
  return 'clicked:' + b.textContent.slice(0, 30);
});
console.log('badge: ' + clicked);
await page.waitForTimeout(1200);
console.log('rows=' + await page.evaluate(() => document.querySelectorAll('#podRows .prow').length));
console.log('count-label=' + await page.evaluate(() => document.getElementById('podCount')?.textContent));

// 2. search filters
await page.fill('#podSearch', 'reality');
await page.waitForTimeout(300);
console.log('rows-after-search=' + await page.evaluate(() => document.querySelectorAll('#podRows .prow').length));
await page.fill('#podSearch', '');
await page.waitForTimeout(300);

// 3. CHAT opens shared shell
await page.evaluate(() => document.querySelector('#podRows .prow .pr-chat')?.click());
await page.waitForTimeout(600);
console.log('chat-opened=' + await page.evaluate(() => document.querySelector('#railAgent .mh-name')?.textContent));

// 4. back returns to roster
await page.evaluate(() => document.getElementById('railBack')?.click());
await page.waitForTimeout(600);
console.log('back-rows=' + await page.evaluate(() => document.querySelectorAll('#podRows .prow').length));

// 5. DEPLOY posts a routed task (server live)
await page.evaluate(() => {
  const row = document.querySelector('#podRows .prow');
  row.querySelector('.pr-deploy').click();
  row.querySelector('.pr-go input').value = 'probe deployment check';
  row.querySelector('.pr-go button').click();
});
await page.waitForTimeout(4000);
console.log('deploy-status=' + await page.evaluate(() => document.querySelector('#podRows .prow .pr-status')?.textContent));
console.log('ERRORS(' + errs.length + '):');
for (const e of errs.slice(0, 5)) console.log('  ' + e.split('\n').slice(0, 4).join(' | '));
await browser.close();
