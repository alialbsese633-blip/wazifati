/* يبني صفحات HTML للستوريات والهايلايت وصورة الحساب */
const A = '../../../assets/brand/', C = '../../../posters/src/chars/';
const head = (css = '../kit.css') => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="../../../posters/src/fonts/tajawal.css"><link rel="stylesheet" href="${css}">`;
const tick = `<span class="chk"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>`;
const hl = t => t.split('|').map(l => `<span class="ln">${l.replace(/\[(.+?)\]/g, '<span class="hi">$1</span>')}</span>`).join('');

// أيقونات خطية (شبكة 200) — سماكة موحّدة
const IC = {
  steps: `<path class="m" d="M28 166h46v-46h46v-46h46v-40"/><path class="m" d="M28 166v0"/><circle class="a" cx="166" cy="34" r="14"/>`,
  sanad: `<path class="m" d="M52 40h96q22 0 22 22v52q0 22-22 22H104l-30 26v-26H52q-22 0-22-22V62q0-22 22-22z"/><path class="a" d="M100 62q4 22 26 26-22 4-26 26-4-22-26-26 22-4 26-26z"/>`,
  shield: `<path class="m" d="M100 26l60 22v46q0 52-60 80-60-28-60-80V48z"/><path class="a" d="M72 100l20 20 38-40"/>`,
  doc: `<path class="m" d="M62 26h52l38 38v98q0 14-14 14H62q-14 0-14-14V40q0-14 14-14z"/><path class="m" d="M114 26v26q0 12 12 12h26"/><path class="a" d="M74 110h52M74 134h34"/>`,
  building: `<path class="m" d="M40 172V48q0-14 14-14h62q14 0 14 14v124"/><path class="m" d="M24 172h152"/><path class="m" d="M64 66h0M88 66h0M112 66h0M64 94h0M88 94h0M112 94h0M64 122h0M88 122h0"/><path class="a" d="M142 104h22M153 93v22"/>`,
  download: `<rect class="m" x="56" y="22" width="88" height="156" rx="24"/><path class="m" d="M90 42h20"/><path class="a" d="M100 70v60M78 108l22 22 22-22"/><path class="m" d="M82 154h36"/>`,
};

const CVS = {
  khanjar: `<div class="cv k"><i class="hl"></i><i class="ln w7"></i><i class="ln w5"></i><i class="rule"></i><i class="ln"></i><i class="ln w8"></i><i class="ln w6"></i></div>`,
  luban: `<div class="cv l"><div class="side"><i class="av"></i><i class="ln"></i><i class="ln w6"></i></div><div class="body"><i class="hl"></i><i class="bar2"></i><i class="ln"></i><i class="ln w8"></i><i class="ln w6"></i></div></div>`,
  saba: `<div class="cv s"><i class="hl c"></i><i class="ln w5 c"></i><i class="thin"></i><i class="ln"></i><i class="ln w8"></i><i class="ln"></i><i class="ln w6"></i></div>`,
  khareef: `<div class="cv kh"><div class="head"><i class="hl"></i><i class="ln w5"></i></div><div class="pad"><i class="ln"></i><i class="ln w8"></i><i class="ln w6"></i></div></div>`,
};

const GOOGLE = `<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

const ghost = k => `<svg class="ghost" viewBox="0 0 200 200">${IC[k]}</svg>`;
const step = (n, t, s) => `<div class="card"><div class="n">${n}</div><div><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</div></div>`;
const split = (img, cards) => `<div class="glowpod"></div><img class="char" src="${C}${img}.png"><div class="split">${cards}</div>`;

// ——— الستوريات الاثنا عشر (الفهرس = رقم الستوري - 1) ———
const STORIES = [
  { day: 2, tag: 'استطلاع', title: 'ما أصعب شيء|في [البحث عن وظيفة]؟', sub: 'صوّت، ورأيك يهمّنا', body: `<div class="zone">${ghost('steps')}</div>`, sticker: 'استطلاع (Poll) بخيارين، مثلاً: «إعلانات غير حقيقية» / «لا أحد يرد عليّ»' },
  { day: 4, tag: 'من التطبيق', title: 'وظائف [موثّقة]|في جيبك', sub: 'تابعنا ليصلك موعد الإطلاق',
    body: `<div class="phone"><div class="nt"></div><div class="scr"><img src="${A}mark.svg"><h3>وظيفتي</h3><p>وظائف موثّقة في اليمن</p><div class="gbtn">${GOOGLE}الدخول بحساب جوجل</div></div></div><div class="followzone"></div>`,
    sticker: 'ملصق المتابعة تحت الجوال. واستبدل الشاشة بلقطة حقيقية من التطبيق عند توفرها' },
  { day: 6, tag: 'اسأل سند', title: 'اسأل [سند]|مساعدك الوظيفي', sub: 'اكتب سؤالك عن العمل والسيرة والمقابلات', body: `<div class="zone">${ghost('sanad')}</div>`, sticker: 'مربع الأسئلة (Questions). لا تعرض ردوداً مصنوعة على أنها من سند الحقيقي' },
  { day: 8, tag: 'نصيحة سيرة', title: 'اجعل سيرتك|[صفحة واحدة]', sub: '', body: split('f_blue', `<div class="card"><div><div class="t">صفحة واحدة تكفي</div><div class="s">ضع أهم خبرة في الأعلى، واحذف ما لا يخدم الوظيفة.</div></div></div>`), sticker: '' },
  { day: 10, tag: 'استطلاع', title: 'أي مدينة|[تبحث] فيها عن عمل؟', sub: 'اكتب اسم مدينتك',
    body: `<div class="chips">${['صنعاء', 'عدن', 'تعز', 'إب', 'المكلا', 'الحديدة'].map(c => `<span class="chip">${c}</span>`).join('')}</div><div class="zone" style="max-height:340px">${ghost('building')}</div>`, sticker: 'مربع الأسئلة (Questions)' },
  { day: 12, tag: 'كيف نراجع', title: 'كيف نراجع|[السجل التجاري]؟', sub: '',
    body: `<div class="cards">${step(1, 'تسجّل الشركة', 'برقم سجلها التجاري وصورة المستند')}${step(2, 'نراجع الرقم والمستند', 'قبل نشر أي وظيفة')}${step(3, 'تظهر علامة ✓', 'بجانب شعار الشركة الموثّقة')}</div>`, sticker: '' },
  { day: 16, tag: 'مقابلة العمل', title: '[3 نصائح]|لمقابلة العمل', sub: '',
    body: split('m_beige', `${step(1, 'اعرف الشركة قبل المقابلة')}${step(2, 'جهّز مثالاً عن إنجاز لك')}${step(3, 'اسأل سؤالاً في الختام')}`), sticker: '' },
  { day: 18, tag: 'استطلاع', title: 'ما أهم ما|[تنظر إليه] في الشركة؟', sub: 'صوّت', body: `<div class="zone">${ghost('shield')}</div>`, sticker: 'استطلاع (Poll) بخيارين، مثلاً: «الراتب» / «الاستقرار»' },
  { day: 20, tag: 'استطلاع', title: 'أي [قالب سيرة]|تفضّل؟', sub: '',
    body: `<div class="cvrow">${[['khanjar', 'الخنجر'], ['luban', 'اللبان'], ['saba', 'سبأ'], ['khareef', 'الخريف']].map(([k, n]) => `<figure>${CVS[k]}<figcaption>${n}</figcaption></figure>`).join('')}</div><div class="zone" style="max-height:360px">${ghost('doc')}</div>`, sticker: 'استطلاع (Poll) بخيارين، أو سؤال مفتوح: «اكتب اسم قالبك المفضّل»' },
  { day: 22, tag: 'للشركات', title: 'شركتك تبحث|عن [موظفين]؟', sub: '',
    body: split('m_yemeni', `${step(1, 'راسلنا برسالة خاصة')}${step(2, 'اسم الشركة ومدينتها')}${step(3, 'نرسل لك خطوات التسجيل')}`), sticker: '' },
  { day: 24, tag: 'التحميل', title: '[حمّل] وظيفتي|خطوة بخطوة', sub: '',
    body: `<div class="cards four">${step(1, 'افتح الرابط في البايو')}${step(2, 'نزّل ملف التطبيق (أندرويد)')}${step(3, 'اسمح بالتثبيت إن طلب هاتفك')}${step(4, 'افتح التطبيق وسجّل بحساب جوجل')}</div><div class="sub" style="font-size:30px">نسخة تجريبية · أندرويد فقط</div>`, sticker: 'لا تنشرها قبل أن يتوفر رابط التحميل فعلاً' },
  { day: 29, tag: 'أسئلتكم', title: 'أسئلة [وصلتنا]', sub: '',
    body: `<div class="cards">${step('؟', 'هل هو مجاني؟', 'نعم، التسجيل والتقديم مجانيان للباحثين')}${step('؟', 'هل الشركات حقيقية؟', 'نراجع السجل التجاري قبل نشر أي وظيفة')}${step('؟', 'أين أحمّله؟', 'الرابط في البايو، والنسخة الحالية للأندرويد فقط')}</div>`, sticker: '' },
];

const DECO = [[900, 1500, 420, 150, 420, 300], [140, 1600, 400, 900, 300, 260], [900, 1500, 430, 180, 400, 280], [160, 1600, 410, 920, 360, 280]];
function storyPage(i) {
  const s = STORIES[i], night = i % 2 === 0, d = DECO[i % 4];
  return `${head()}<title>story-${String(i + 1).padStart(2, '0')}</title></head><body>
<div class="canvas ${night ? 'night' : 'light'}">
  <svg class="deco" viewBox="0 0 1080 1920"><circle class="blob" cx="${d[0]}" cy="${d[1]}" r="${d[2]}"/><circle class="ring" cx="${d[3]}" cy="${d[4]}" r="${d[5] + 120}"/><circle class="ring" cx="${d[3]}" cy="${d[4]}" r="${d[5] + 200}"/></svg>
  <div class="top"><img src="${A}${night ? 'logo-horizontal-white.svg' : 'logo-horizontal.svg'}"><span class="tag">${s.tag}</span></div>
  <div class="stack"><h1>${hl(s.title)}</h1>${s.sub ? `<p class="sub">${s.sub}</p>` : ''}${s.body}</div>
</div></body></html>`;
}

const COVERS = [
  ['highlight-01-how-it-works', 'steps'], ['highlight-02-sanad', 'sanad'], ['highlight-03-verified-companies', 'shield'],
  ['highlight-04-your-cv', 'doc'], ['highlight-05-for-employers', 'building'], ['highlight-06-download', 'download'],
];
function coverPage(i) {
  const night = i % 2 === 0;
  return `${head()}<title>${COVERS[i][0]}</title></head><body>
<div class="canvas cover ${night ? 'night' : 'light'}"><div class="halo"></div><div class="disc"></div><svg class="ic" viewBox="0 0 200 200">${IC[COVERS[i][1]]}</svg></div></body></html>`;
}
const avatarPage = () => `${head()}<title>profile</title></head><body><div class="avatar"><div class="ring" style="width:1000px;height:1000px;margin:-500px 0 0 -500px"></div><div class="ring" style="width:800px;height:800px;margin:-400px 0 0 -400px;border-style:dashed"></div><img src="${A}mark.svg"></div></body></html>`;

module.exports = { STORIES, COVERS, storyPage, coverPage, avatarPage };
