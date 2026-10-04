// Dogfood: a real user journey against the LIVE server (http://localhost:4520).
// overview → hover pod → roster → citizen chat + tasks → deploy → dept focus →
// lead chat → board → calendar → brain → overview. Screenshots to scripts/out/dogfood/.
let cp; try { cp = await import('playwright'); } catch { cp = await import('playwright-core'); }
let b;
try { b = await cp.chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { b = await cp.chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
const page = await b.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGE ' + String(e.message || e).slice(0, 160)));
const fs = await import('fs');
fs.mkdirSync('scripts/out/dogfood', { recursive: true });
const R = [];
async function step(name, fn) {
  let ok = false, note = '';
  try {
    const r = await fn();
    if (r === true) ok = true;
    else if (typeof r === 'string' && r) { ok = true; note = r; }
    else if (r && typeof r === 'object' && r.ok) { ok = true; note = r.note || ''; }
    else { note = (r && r.note) || ''; }
  }
  catch (e) { note = 'threw: ' + String(e.message || e).slice(0, 100); }
  R.push({ name, ok, note });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`);
}
const ev = (fn, a) => page.evaluate(fn, a);
const wait = (ms) => page.waitForTimeout(ms);
const shot = (n) => page.screenshot({ path: `scripts/out/dogfood/${n}.png` });

await page.goto('http://localhost:4520/');
await wait(7000);

await step('1. quiet overview: no cards/pills/badges', () => ev(() => {
  const vis = (s) => [...document.querySelectorAll(s)].filter(el => {
    const c = getComputedStyle(el); return c.display !== 'none' && +c.opacity > 0.05;
  }).length;
  const n = vis('.badge') + vis('.pill');
  return n === 0 || { ok: false, note: n + ' overlays visible' };
}));
await shot('01-overview');

await step('2. hover a disk → popup explains it', async () => {
  for (let gy = 200; gy <= 750; gy += 55) {
    for (let gx = 150; gx <= 1150; gx += 60) {
      await page.mouse.move(gx, gy, { steps: 2 });
      await wait(150);
      if (await ev(() => !!document.querySelector('#hoverPop.on'))) {
        const t = await ev(() => document.querySelector('#hoverPop').textContent.replace(/\s+/g, ' ').slice(0, 120));
        await ev((pt) => { window.__hit = pt; }, { x: gx, y: gy });
        await shot('02-hover');
        return { ok: true, note: t };
      }
    }
  }
  return { ok: false, note: 'no popup fired' };
});

await step('3. click a bench badge → roster rail opens VISIBLE', async () => {
  await ev(() => document.querySelector('.badge.bench[data-division="engineering"]').click());
  const timeline = [];
  for (let i = 0; i < 4; i++) {
    await wait(900);
    timeline.push(await ev(() => {
      const rail = document.getElementById('rail');
      const rc = rail.getBoundingClientRect();
      return `${rail.className.replace(/ /g, '.')}@${Math.round(rc.left)}:rows${document.querySelectorAll('#podRows .prow').length}`;
    }));
  }
  const last = timeline[timeline.length - 1];
  const m = last.match(/@(-?\d+):rows(\d+)/);
  const ok = +m[1] >= -2 && +m[2] > 0;
  return ok || { ok: false, note: timeline.join(' → ') };
});

await step('3b. click a 3D person → their chat opens', async () => {
  // fresh hover at the current camera (step 3 flew us to engineering);
  // only accept a PERSON popup ("click to chat"), not a pod ("click for the roster")
  let pt = null;
  for (let gy = 200; gy <= 780 && !pt; gy += 60) {
    for (let gx = 140; gx <= 1180 && !pt; gx += 64) {
      await page.mouse.move(gx, gy, { steps: 1 });
      await wait(120);
      const kind = await ev(() => {
        const el = document.querySelector('#hoverPop.on');
        if (!el) return '';
        return /click to chat/.test(el.textContent) ? 'person' : 'other';
      });
      if (kind === 'person') pt = { x: gx, y: gy };
    }
  }
  if (!pt) return { ok: false, note: 'no hover target' };
  await page.mouse.click(pt.x, pt.y);
  await wait(2500);
  return ev(() => {
    const name = ((document.querySelector('#railAgent .mh-name') || {}).textContent || '').trim();
    const plate = (document.querySelector('#mMsgs .m-tasks-h') || {}).textContent || '';
    return (name && /TASKS ON ITS PLATE/.test(plate)) || { ok: false, note: `name=${name} plate=${plate}` };
  });
});
await shot('03-roster');

await step('4. citizen CHAT opens with task plate', async () => {
  await ev(() => document.querySelector('#podRows .prow .pr-chat').click());
  await wait(2000);
  return ev(() => {
    const name = (document.querySelector('#railAgent .mh-name') || {}).textContent || '';
    const plate = (document.querySelector('#mMsgs .m-tasks-h') || {}).textContent || '';
    return (name.trim() && plate) || { ok: false, note: `name=${name} plate=${plate}` };
  });
});
await shot('04-chat');

await step('5. send a chat message → reply bubble', async () => {
  const before = await ev(() => document.querySelectorAll('#mMsgs > *').length);
  await ev(() => { const i = document.getElementById('mIn'); i.focus(); i.value = 'what can you do for me'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await ev(() => {
    const g = document.getElementById('mGo');
    if (g) g.click();
    else document.getElementById('mIn').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  await wait(2500);
  const after = await ev(() => document.querySelectorAll('#mMsgs > *').length);
  return after > before || { ok: false, note: `msgs ${before}→${after}` };
});
await shot('05-reply');

await step('6. DEPLOY a goal → friendly status (no Claude here)', async () => {
  await ev(() => { document.getElementById('railBack').click(); });
  await wait(1200);
  await ev(() => document.querySelector('#podRows .prow .pr-deploy').click());
  await wait(300);
  await ev(() => { const i = document.querySelector('#podRows .prow .pr-go input'); i.value = 'draft the launch checklist'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await ev(() => document.querySelector('#podRows .prow .pr-go button').click());
  await wait(4000);
  return ev(() => {
    const t = document.querySelector('#podRows .prow .pr-status').textContent || '';
    return t.trim().length > 5 || { ok: false, note: 'empty status' };
  });
});
await shot('06-deploy');

await step('7. Escape homes camera, roster rail stays (by design)', async () => {
  await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await wait(1500);
  return ev(() => {
    const rows = document.querySelectorAll('#podRows .prow').length;
    const badges = [...document.querySelectorAll('.badge.bench')].filter(el => getComputedStyle(el).display !== 'none').length;
    return (rows > 0 && badges === 1) || { ok: false, note: `rows=${rows} openBadges=${badges}` };
  });
});

await step('8. dept focus (key 1) → lead chat rail', async () => {
  await ev(() => { if (document.activeElement) document.activeElement.blur(); });
  await page.mouse.click(750, 450);
  await wait(400);
  await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true })));
  await wait(2500);
  return ev(() => {
    const c = document.getElementById('rail').className;
    const name = (document.querySelector('#railAgent .mh-name') || {}).textContent || '';
    return (/agentOpen/.test(c) && name.trim()) || { ok: false, note: c + ' / ' + name };
  });
});
await shot('08-focus');

await step('9. board (B) opens with tasks', async () => {
  await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true })));
  await wait(1200);
  return ev(() => (window.CC && window.CC.tasks && window.CC.tasks.isOpen()) || { ok: false, note: 'board shut' });
});
await shot('09-board');

await step('10. calendar (P) opens month grid', async () => {
  await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await wait(800);
  await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true })));
  await wait(1000);
  return ev(() => document.getElementById('calOv').classList.contains('on'));
});
await shot('10-calendar');

await step('11. brain (G) opens graph, Esc closes all', async () => {
  await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await wait(600);
  await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true })));
  await wait(1200);
  const opened = await ev(() => window.CC && window.CC.brain && window.CC.brain.isOpen());
  await ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await wait(800);
  return opened || { ok: false, note: 'graph never opened' };
});
await shot('11-final');

const pass = R.filter(r => r.ok).length;
console.log(`\nDOGFOOD: ${pass}/${R.length} · ERRORS(${errs.length})`);
errs.slice(0, 6).forEach(e => console.log('  ' + e));
await b.close();
process.exitCode = pass === R.length && !errs.length ? 0 : 1;