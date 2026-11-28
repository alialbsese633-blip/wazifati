// ينسخ ملفات الواجهة إلى www لتطبيق أندرويد
import fs from 'fs';
if (process.argv[2] !== 'admin') {
  fs.rmSync('www', { recursive: true, force: true });
  fs.mkdirSync('www');
  for (const p of ['index.html', 'manifest.json', 'css', 'js', 'assets']) {
    fs.cpSync(p, 'www/' + p, { recursive: true });
  }
  console.log('www ready');
}

// نسخة تطبيق الإدارة: node scripts/build-web.mjs admin
if (process.argv[2] === 'admin') {
  fs.rmSync('www', { recursive: true, force: true });
  fs.mkdirSync('www/js/vendor', { recursive: true });
  fs.mkdirSync('www/assets/brand', { recursive: true });
  fs.mkdirSync('www/assets/icons', { recursive: true });
  let h = fs.readFileSync('admin/index.html', 'utf8').replaceAll('../', '');
  fs.writeFileSync('www/index.html', h);
  fs.copyFileSync('js/config.js', 'www/js/config.js');
  fs.copyFileSync('js/vendor/supabase.js', 'www/js/vendor/supabase.js');
  fs.copyFileSync('assets/brand/mark-lime.svg', 'www/assets/brand/mark-lime.svg');
  fs.copyFileSync('assets/icons/favicon.png', 'www/assets/icons/favicon.png');
  console.log('www (admin) ready');
}
