// يولّد نسخة دليل التطبيق لدالة الذكاء الاصطناعي من js/guide.js
import fs from 'fs';
const src = fs.readFileSync('js/guide.js', 'utf8');
const body = src.slice(src.indexOf('const APP_GUIDE'), src.indexOf('const APP_GUIDE_TEXT'));
fs.writeFileSync('supabase/functions/_shared/guide.ts',
  '// مولّد تلقائياً من js/guide.js عبر: npm run sync-guide — لا تعدّله يدوياً\n' +
  body.replace('const APP_GUIDE', 'export const APP_GUIDE: { k: string; ar: string; en: string }[]') +
  "export const guideText = (lang: string) => APP_GUIDE.map((g) => '- ' + (lang === 'en' ? g.en : g.ar)).join('\\n');\n");
console.log('guide synced');
