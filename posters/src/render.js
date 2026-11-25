// يبني صفحات HTML للبوسترات ويصدّرها PNG عبر Playwright (deviceScaleFactor 2)
// ثم يصغّرها build.py إلى 1080×1350 ويجمع preview.png
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { POSTS, page } = require(process.env.POSTER_MODULE || './scenes');

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
      const R = e => e.getBoundingClientRect();
      const hit = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      const copyEls = ['h1', '.sub', '.cta'].map(s => document.querySelector(s)).filter(Boolean);
      // كل سطر نص يجب أن يبقى داخل الهوامش
      for (const e of [...copyEls, document.querySelector('footer'), document.querySelector('header')]) {
        const r = R(e); if (r.left < M - .5 || r.right > W - M + .5 || r.top < M - .5 || r.bottom > H - M + .5) issues.push(`${e.tagName}.${e.className} outside margins`);
      }
      // العنوان سطران كحد أقصى
      const h1 = document.querySelector('h1'), lh = parseFloat(getComputedStyle(h1).lineHeight);
      const lines = [...h1.querySelectorAll('.ln1')].reduce((n, l) => n + Math.round(R(l).height / lh), 0);
      if (lines > 2) issues.push(`title ${lines} lines`);
      // النص لا يلامس الشخصيات ولا البطاقات (نقيس عرض كل سطر فعلياً)
      const textRects = [...h1.querySelectorAll('.ln1'), document.querySelector('.sub'), document.querySelector('.cta')].filter(Boolean).flatMap(e => {
        const rg = document.createRange(); rg.selectNodeContents(e); return [...rg.getClientRects()];
      });
      const others = [...document.querySelectorAll('.char, .obj, .orb, .spark')].map(e => [e.className.baseVal ?? e.className, R(e)]);
      for (const t of textRects) for (const [nm, o] of others) {
        const pad = { left: o.left - 16, right: o.right + 16, top: o.top - 16, bottom: o.bottom + 16 };
        if (hit(t, pad)) { issues.push(`text near ${nm}`); break; }
      }
      const foot = R(document.querySelector('footer'));
      for (const [nm, o] of others) if (!nm.includes('char') && o.bottom > foot.top - 10) issues.push(`${nm} overlaps footer`);
      if (!document.fonts.check('800 88px Tajawal', 'وظيفتي')) issues.push('Tajawal not loaded');
      return { issues: [...new Set(issues)] };
    });
    console.log(`post-${id}`, JSON.stringify(report));
    problems += report.issues.length;
    await tab.screenshot({ path: path.join(OUT2X, `post-${id}.png`) });
  }
  await browser.close();
  if (problems) { console.error(`${problems} layout issue(s)`); process.exitCode = 1; }
})();
