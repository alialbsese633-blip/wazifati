// ينسخ ملفات الواجهة إلى www لتطبيق أندرويد
import fs from 'fs';
fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www');
for (const p of ['index.html', 'manifest.json', 'css', 'js', 'assets']) {
  fs.cpSync(p, 'www/' + p, { recursive: true });
}
console.log('www ready');
