// Citizen chat probe: seed citizens data (file:// blocks fetch), open chats, verify shell + replies.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.mjs';

let chromium = null;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('playwright-core')); }
let browser;
try { browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }
catch { browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); }

const citizens = JSON.parse(fs.readFileSync(path.join(ROOT, 'brain', 'agency-personas', 'citizens.json'), 'utf8'));
const page = await browser.newPage({ viewport: { width: 1512, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e.message).slice(0, 400)));
await page.goto('file://' + path.join(ROOT, 'dist', 'command-centre-v2.html') + '?s=check');
await page.waitForTimeout(3500);
await page.evaluate((data) => { window.TYLER_CITIZENS = data; }, citizens);

// 1. citizen chat opens with shared shell
const opened = await page.evaluate(() => {
  window.CC.openChat('marketing-tiktok-strategist');
  return {
    name: document.querySelector('#railAgent .mh-name')?.textContent,
    role: document.querySelector('#railAgent .mh-role')?.textContent,
    tag: document.querySelector('#railAgent .mh-tag')?.textContent?.slice(0, 60),
    greet: document.querySelector('#mChat .m-agent')?.textContent?.slice(0, 80),
    chips: [...document.querySelectorAll('#mChips button')].map(b => b.textContent),
  };
});
console.log('OPENED: ' + JSON.stringify(opened));

// 2. send a message -> demo reply, no backend
await page.evaluate(() => {
  document.getElementById('mIn').value = 'how do hooks work?';
  document.getElementById('mSend').click();
});
await page.waitForTimeout(1200);
const reply = await page.evaluate(() => {
  const all = [...document.querySelectorAll('#mChat .m-agent')].map(el => el.textContent?.slice(0, 100));
  const users = [...document.querySelectorAll('#mChat .m-user')].map(el => el.textContent);
  return { users, replies: all };
});
console.log('REPLY: ' + JSON.stringify(reply));

// 3. activity tab for citizen
await page.evaluate(() => window.CC.openChat('engineering-backend-architect'));
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('#rail .mtabs button[data-tab="activity"]')?.click());
await page.waitForTimeout(300);
console.log('ACTIVITY: ' + await page.evaluate(() => document.getElementById('mNow')?.textContent?.slice(0, 60)));

// 4. roster path untouched
await page.evaluate(() => window.CC.openChat('piper'));
await page.waitForTimeout(300);
console.log('ROSTER: ' + await page.evaluate(() => document.querySelector('#railAgent .mh-name')?.textContent));

// 5. unknown id: silent, no throw
await page.evaluate(() => { window.CC.openChat('ghost-slug-xyz'); });
await page.waitForTimeout(300);
console.log('ERRORS(' + errs.length + '):');
for (const e of errs.slice(0, 5)) console.log('  ' + e.split('\n').slice(0, 4).join(' | '));
await browser.close();
