// يبني صفحات HTML للبوسترات ويصدّرها PNG عبر Playwright (deviceScaleFactor 2)
// ثم يصغّرها build.py إلى 1080×1350 ويجمع preview.png
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { POSTS, page } = require('./posters');

const SRC = __dirname, BUILD = path.join(SRC, 'build'), OUT2X = process.argv[2] || path.join(SRC, 'build', '2x');
fs.mkdirSync(BUILD, { recursive: true }); fs.mkdirSync(OUT2X, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  const tab = await ctx.newPage();
  let problems = 0;
  for (let i = 0; i < POSTS.length; i++) {
    const id = String(i + 1).padStart(2, '0');
    const file = path.join(BUILD, `post-${id}.html`);
    fs.writeFileSync(file, page(i));
    await tab.goto('file://' + file);
    await tab.evaluate(() => document.fonts.ready);
    await tab.waitForLoadState('networkidle');
    // فحص: هوامش 90px، سطران للعنوان كحد أقصى، لا تداخل بين الكتل، الخط محمّل
    const report = await tab.evaluate(() => {
      const issues = [], M = 90, W = 1080, H = 1350;
      const box = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
      for (const s of ['header', '.stage', '.badge', '.cvrow', '.copy', 'footer', 'h1', '.sub', '.cta']) {
        const r = box(s); if (!r) continue;
        if (r.left < M - .5 || r.right > W - M + .5 || r.top < M - .5 || r.bottom > H - M + .5) issues.push(`${s} outside margins ${JSON.stringify([r.left, r.top, r.right, r.bottom].map(Math.round))}`);
      }
      const h1 = document.querySelector('h1');
      const lines = [...h1.querySelectorAll('.ln1')].reduce((n, l) => n + Math.round(l.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)), 0);
      if (lines > 2) issues.push(`title wraps to ${lines} lines`);
      const sub = document.querySelector('.sub'); const sl = Math.round(sub.getBoundingClientRect().height / parseFloat(getComputedStyle(sub).lineHeight));
      const b = box('.badge'), a0 = box('.stage') || box('.cvrow'); const art = b && b.bottom > a0.bottom ? b : a0; const _ = 0, copy = box('.copy'), foot = box('footer');
      if (art.bottom + 40 > copy.top) issues.push(`art/copy too close: gap ${Math.round(copy.top - art.bottom)}`);
      if (copy.bottom + 40 > foot.top) issues.push('copy/footer too close');
      if (!document.fonts.check('800 88px Tajawal', 'وظيفتي')) issues.push('Tajawal not loaded');
      return { issues, sublines: sl, gap: Math.round(copy.top - art.bottom) };
    });
    console.log(`post-${id}`, JSON.stringify(report));
    problems += report.issues.length;
    await tab.screenshot({ path: path.join(OUT2X, `post-${id}.png`) });
  }
  await browser.close();
  if (problems) { console.error(`${problems} layout issue(s)`); process.exitCode = 1; }
})();
