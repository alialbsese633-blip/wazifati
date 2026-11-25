// يصدّر الستوريات والهايلايت وصورة الحساب بـ Playwright (2x) ثم يصغّرها build.py
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { STORIES, COVERS, storyPage, coverPage, avatarPage } = require('./kit');
const OUT = process.argv[2], BUILD = path.join(__dirname, 'build');
fs.mkdirSync(BUILD, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  let problems = 0;
  const shot = async (name, html, w, h, check) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const tab = await ctx.newPage(); const file = path.join(BUILD, name + '.html'); fs.writeFileSync(file, html);
    await tab.goto('file://' + file); await tab.evaluate(() => document.fonts.ready); await tab.waitForLoadState('networkidle');
    if (check) {
      const issues = await tab.evaluate(() => {
        const out = [], R = e => e.getBoundingClientRect(), M = 100;
        const stack = document.querySelector('.stack'), top = document.querySelector('.top');
        if (stack) {
          // لا يتجاوز المحتوى الهامش السفلي الآمن (390px) ولا ينقطع النص
          for (const e of stack.querySelectorAll('h1,.sub,.card,.zone,.cvrow,.chips,.phone,.followzone,.pill')) {
            const r = R(e); if (r.bottom > 1920 - 380) out.push(`${e.className || e.tagName} bottom ${Math.round(r.bottom)} > 1540`);
            if (r.left < M - 1 || r.right > 1080 - M + 1) out.push(`${e.className || e.tagName} outside side margins`);
          }
          for (const e of stack.querySelectorAll('.t,.s,.sub,h1 .ln')) if (e.scrollWidth > e.clientWidth + 1) out.push('text overflow');
          const h1 = stack.querySelector('h1'); const lines = [...h1.querySelectorAll('.ln')].reduce((n, l) => n + Math.round(R(l).height / parseFloat(getComputedStyle(h1).lineHeight)), 0);
          if (lines > 2) out.push(`title ${lines} lines`);
          if (R(stack.firstElementChild).top < R(top).bottom + 20) out.push('title overlaps header');
        }
        if (!document.fonts.check('800 80px Tajawal', 'وظيفتي')) out.push('font missing');
        return out;
      });
      console.log(name, JSON.stringify(issues)); problems += issues.length;
    }
    await tab.screenshot({ path: path.join(OUT, name + '.png') }); await ctx.close();
  };
  for (let i = 0; i < STORIES.length; i++) await shot(`story-${String(i + 1).padStart(2, '0')}`, storyPage(i), 1080, 1920, true);
  for (let i = 0; i < COVERS.length; i++) await shot(COVERS[i][0], coverPage(i), 1080, 1920, false);
  await shot('profile', avatarPage(), 1080, 1080, false);
  await browser.close(); if (problems) process.exitCode = 1;
})();
