// يصوّر reel.html إطاراً بإطار (30fps) ويمرّر الإطارات مباشرة إلى ffmpeg مع الصوت
// node capture.js <timeline.json> <voice.wav> <out.mp4>   |  node capture.js <timeline.json> --stills t1,t2,... <dir>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const [tlFile, a2, a3, a4] = process.argv.slice(2);
const TL = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
const FPS = 30;
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.join(__dirname, 'reel.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await page.evaluate(tl => window.init(tl), TL);
  const fontsOk = await page.evaluate(() => document.fonts.check("700 90px 'Reem Kufi'", 'وظيفتي') && document.fonts.check("700 50px Plex", 'وظيفتي'));
  if (!fontsOk) throw new Error('fonts not loaded');
  if (a2 === '--stills') {
    fs.mkdirSync(a4, { recursive: true });
    for (const t of a3.split(',').map(Number)) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: `${a4}/t${t.toFixed(2)}.png` }); }
  } else {
    const N = Math.round(TL.total * FPS);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', a2,
      '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', TL.total.toFixed(3), a3], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < N; f++) {
      await page.evaluate(t => window.render(t), f / FPS);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 150 === 0) console.log(`frame ${f}/${N}`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  if (errs.length) { console.error('page errors:', errs); process.exitCode = 1; }
  await browser.close();
})();
