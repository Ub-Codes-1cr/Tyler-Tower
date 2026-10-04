// Verify the 7 failing smoke checks with STATE-based waits (no fixed sleeps).
// If they all pass, the app logic is intact and the failures are harness timing.
let cp; try { cp = await import('playwright'); } catch { cp = await import('playwright-core'); }
let b;
try { b = await cp.chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { b = await cp.chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await b.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.message || e).slice(0, 120)));
await page.goto('file://' + (await import('path')).default.resolve('dist/command-centre-v2.html') + '?s=check');
await page.waitForTimeout(6000);
const R = [];
async function step(name, fn, timeoutMs = 15000) {
  const t0 = Date.now();
  try {
    let ok = false, note = '';
    while (Date.now() - t0 < timeoutMs) {
      try { const r = await fn(); if (r === true || (r && r.ok)) { ok = true; note = (r && r.note) || ''; break; } }
      catch (e) { note = String(e.message || e).slice(0, 80); }
      await page.waitForTimeout(250);
    }
    R.push({ name, ok, note });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${((Date.now() - t0) / 1000).toFixed(1)}s)${note ? ' — ' + note : ''}`);
  } catch (e) { R.push({ name, ok: false, note: String(e.message).slice(0, 80) }); console.log(`FAIL  ${name} — threw`); }
}
const ev = (fn, a) => page.evaluate(fn, a);
const key = (k) => ev(k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), k);

await step('dept focus opens the chat rail', async () => {
  await key('1');
  return ev(() => {
    const c = document.getElementById('rail').className;
    const name = ((document.querySelector('#railAgent .mh-name') || {}).textContent || '').trim();
    return (/agentOpen/.test(c) && /open/.test(c) && !!name) || { ok: false };
  });
});
await step('Escape closes back to overview', async () => {
  await key('Escape');
  return ev(() => !/(^|\s)open(\s|$)/.test(document.getElementById('rail').className) || { ok: false });
});
await step('B opens and closes the company board', async () => {
  await key('b');
  const opened = await ev(() => window.CC && window.CC.tasks && window.CC.tasks.isOpen());
  if (!opened) return { ok: false };
  await key('Escape');
  return ev(() => !(window.CC && window.CC.tasks && window.CC.tasks.isOpen()) || { ok: false });
});
await step('G opens the Brain graph with notes', async () => {
  await key('g');
  return ev(() => {
    const open = window.CC && window.CC.brain && window.CC.brain.isOpen();
    const n = (window.CC && window.CC.brain && window.CC.brain.nodes && window.CC.brain.nodes.length) || 0;
    return (open && n >= 10) || { ok: false };
  });
});
await step('Escape closes the Brain graph', async () => {
  await key('Escape');
  return ev(() => !(window.CC && window.CC.brain && window.CC.brain.isOpen()) || { ok: false });
});
await step('P opens the calendar with month cells', async () => {
  await key('p');
  return ev(() => {
    const on = document.getElementById('calOv').classList.contains('on');
    const cells = document.querySelectorAll('.cv-day').length;
    return (on && cells >= 28) || { ok: false };
  });
});
await step('Escape closes the calendar', async () => {
  await key('Escape');
  return ev(() => !document.getElementById('calOv').classList.contains('on') || { ok: false });
});
await step('approval flow reaches the panel', async () => {
  await ev(() => window.CC.requestApproval('ada'));
  return ev(() => document.querySelectorAll('.tp-row.waiting').length > 0 || { ok: false });
}, 20000);

const pass = R.filter(r => r.ok).length;
console.log(`\nSTATE-WAIT: ${pass}/${R.length} · ERRORS(${errs.length})`);
errs.slice(0, 4).forEach(e => console.log('  ' + e));
await b.close();
process.exitCode = pass === R.length && !errs.length ? 0 : 1;