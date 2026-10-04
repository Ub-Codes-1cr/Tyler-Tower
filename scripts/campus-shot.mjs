// Clean overview shot of the v2 campus — no roster, no fly-in, hover cleared.
let cp; try { cp = await import('playwright'); } catch { cp = await import('playwright-core'); }
let b;
try { b = await cp.chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { b = await cp.chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await b.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.message || e).slice(0, 160)));
await page.goto('file://' + (await import('path')).default.resolve('dist/command-centre-v2.html'));
await page.waitForTimeout(7000);
// make sure nothing is hovered and nothing is in the rail
await page.mouse.move(20, 880);
await page.keyboard.press('Escape');
await page.waitForTimeout(2500);
await page.mouse.move(20, 880);
await page.waitForTimeout(1200);

const state = await page.evaluate(() => {
  const vis = (s) => [...document.querySelectorAll(s)].filter(el => {
    const c = getComputedStyle(el);
    return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05;
  }).length;
  return {
    zoom: +window.CC.view.zoom.toFixed(3),
    badges: vis('.badge'),
    pills: vis('.pill'),
    pop: !!document.querySelector('#hoverPop.on'),
    railClass: document.getElementById('rail').className || '(closed)',
    agents: Object.keys(window.TYLER_BR || {}).length + Object.keys(window.CC?.R || {}).length,
  };
});
console.log('STATE:', JSON.stringify(state));
console.log('ERRORS(' + errs.length + '):', errs.slice(0, 3).join(' | '));
await page.screenshot({ path: 'scripts/out/campus-clean.png' });
await b.close();