// Phase 0 diagnostic: what is actually visible on the page at rest?
import { ROOT } from '../config.mjs';
let chromium = null;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 300)));
await page.goto('http://localhost:4520/');
await page.waitForTimeout(4500);

const vis = await page.evaluate(() => {
  const out = { badges: [], cards: [], railRows: 0, agents: 0 };
  document.querySelectorAll('.badge').forEach(b => {
    const cs = getComputedStyle(b);
    out.badges.push({
      cls: b.className, div: b.dataset.division || null, bench: b.classList.contains('bench'),
      vis: cs.visibility, op: cs.opacity, disp: cs.display,
      text: (b.textContent || '').trim().slice(0, 22)
    });
  });
  out.cards = document.querySelectorAll('.division-card').length;
  out.railRows = document.querySelectorAll('#railRows .arow').length;
  out.agents = document.querySelectorAll('#railAgents .ag').length;
  return out;
});
console.log('division-card total=' + vis.cards);
console.log('rail agent rows=' + vis.railRows + '  rail agent pills=' + vis.agents);
const benchVis = vis.badges.filter(b => b.bench);
const shownBench = benchVis.filter(b => b.vis === 'visible' && parseFloat(b.op) > 0);
console.log(`bench badges: total=${benchVis.length} VISIBLE=${shownBench.length}`);
console.log('sample bench badges:');
for (const b of benchVis.slice(0, 6)) console.log(`  ${b.text.padEnd(22)} div=${(b.div||'NULL').padEnd(18)} vis=${b.vis} op=${b.op}`);
const nonBench = vis.badges.filter(b => !b.bench);
console.log(`non-bench badges: ${nonBench.length}, visible=${nonBench.filter(b=>b.vis==='visible').length}`);
for (const b of nonBench.slice(0, 8)) console.log(`  ${b.cls.padEnd(24)} vis=${b.vis} text="${b.text}"`);
console.log('ERRORS(' + errs.length + ')');
for (const e of errs.slice(0, 3)) console.log('  ' + e.split('\n').slice(0, 2).join(' | '));
await page.screenshot({ path: 'scripts/out/phase0-rest.png' });
await browser.close();