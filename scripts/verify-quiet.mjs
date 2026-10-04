// Verify quiet office + hover popup visually: clean overview shot, then sweep the
// mouse until the 3D hover popup fires, then shoot it. Saves to scripts/out/.
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.message || e).slice(0, 200)));
await page.goto('file://' + (await import('path')).default.resolve('dist/command-centre-v2.html') + '?s=quiet');
await page.waitForTimeout(6000);
const fs = await import('fs');
fs.mkdirSync('scripts/out', { recursive: true });
// 1. rest state audit: which overlay families are visible?
const rest = await page.evaluate(() => {
  const vis = (sel) => [...document.querySelectorAll(sel)].filter(el => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05;
  }).length;
  return {
    deptBadges: vis('.badge:not(.bench):not(.brainTag)'),
    brainTag: vis('.badge.brainTag'),
    benchBadges: vis('.badge.bench'),
    pills: vis('.pill'),
    hoverPop: !!document.querySelector('#hoverPop.on'),
  };
});
console.log('REST:', JSON.stringify(rest));
await page.screenshot({ path: 'scripts/out/quiet-overview.png' });
// 2. sweep for a hover target
let hit = null;
for (let gy = 200; gy <= 750 && !hit; gy += 55) {
  for (let gx = 150; gx <= 1150 && !hit; gx += 60) {
    await page.mouse.move(gx, gy, { steps: 2 });
    await page.waitForTimeout(180);
    const on = await page.evaluate(() => !!document.querySelector('#hoverPop.on'));
    if (on) hit = { gx, gy };
  }
}
console.log('HOVER HIT:', JSON.stringify(hit));
if (hit) {
  const html = await page.evaluate(() => document.querySelector('#hoverPop').innerHTML.slice(0, 220));
  console.log('POPUP:', html.replace(/\s+/g, ' '));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scripts/out/quiet-hover.png' });
  // 3. click the hovered person/pod and see what the rail does
  await page.mouse.click(hit.gx, hit.gy);
  await page.waitForTimeout(1500);
  const rail = await page.evaluate(() => ({
    railClass: document.getElementById('rail').className,
    name: (document.querySelector('#railAgent .mh-name') || {}).textContent || '',
    tasks: document.querySelectorAll('#mMsgs .m-task').length,
    tasksHead: (document.querySelector('#mMsgs .m-tasks-h') || {}).textContent || '',
  }));
  console.log('CLICK:', JSON.stringify(rail));
  await page.screenshot({ path: 'scripts/out/quiet-click.png' });
}
console.log('ERRORS(' + errs.length + '):', errs.slice(0, 4).join(' | '));
await browser.close();
process.exitCode = errs.length ? 1 : 0;