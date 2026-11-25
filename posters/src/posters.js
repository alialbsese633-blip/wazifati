/* وظيفتي · بوسترات إنستجرام (1080×1350)
   التشغيل: node posters/src/render.js  */

// أيقونات خطية على شبكة 200×200 — كل الخطوط 6px بفضل non-scaling-stroke
// m = لون الخط الأساسي، a = لون التمييز
const star = (cx, cy, R, r) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + (cx + rad * Math.cos(ang)).toFixed(1) + ' ' + (cy + rad * Math.sin(ang)).toFixed(1);
  }
  return d + 'Z';
};
const spark = (cx, cy, s) =>
  `M${cx} ${cy - s}Q${cx + s * .18} ${cy - s * .18} ${cx + s} ${cy}Q${cx + s * .18} ${cy + s * .18} ${cx} ${cy + s}Q${cx - s * .18} ${cy + s * .18} ${cx - s} ${cy}Q${cx - s * .18} ${cy - s * .18} ${cx} ${cy - s}Z`;

const ICONS = {
  // 01 إطلاق: حقيبة + لمعة ذكاء
  launch: `
    <rect class="m" x="28" y="72" width="132" height="98" rx="22"/>
    <path class="m" d="M70 72V58q0-12 12-12h24q12 0 12 12v14"/>
    <path class="m" d="M28 112h132"/>
    <path class="a" d="${spark(160, 46, 24)}"/>`,
  // 02 كل الوظائف: بطاقات مكدّسة
  stack: `
    <path class="m" d="M66 34h68"/>
    <path class="m" d="M50 52h100"/>
    <rect class="m" x="32" y="72" width="136" height="100" rx="20"/>
    <path class="m" d="M140 106H86"/>
    <path class="m" d="M140 138H104"/>
    <path class="a" d="M52 118l12 12 20-22"/>`,
  // 03 سند: فقاعة محادثة بداخلها نجمة
  sanad: `
    <path class="m" d="M52 40h96q22 0 22 22v52q0 22-22 22H104l-30 26v-26H52q-22 0-22-22V62q0-22 22-22z"/>
    <path class="a" d="${spark(100, 88, 28)}"/>`,
  // 04 رفع السيرة: مستند + سهم صاعد
  upload: `
    <path class="m" d="M62 26h52l38 38v98q0 14-14 14H62q-14 0-14-14V40q0-14 14-14z"/>
    <path class="m" d="M114 26v26q0 12 12 12h26"/>
    <path class="a" d="M100 150V96M78 118l22-22 22 22"/>`,
  // 05 الإشعارات: جرس + موجات
  bell: `
    <path class="m" d="M100 40q-38 0-40 42v30l-16 24h112l-16-24V82q-2-42-40-42z"/>
    <path class="m" d="M100 28v12"/>
    <path class="m" d="M86 154q14 16 28 0"/>
    <path class="a" d="M150 46q14 14 14 34M36 80q0-20 14-34"/>`,
  // 06 التوثيق: درع وعلامة صح
  shield: `
    <path class="m" d="M100 26l60 22v46q0 52-60 80-60-28-60-80V48z"/>
    <path class="a" d="M72 100l20 20 38-40"/>`,
  // 07 المحادثة: فقاعتان متقابلتان
  chat: `
    <path class="m" d="M82 34h72q18 0 18 18v40q0 18-18 18h-6v22l-24-22H82q-18 0-18-18V52q0-18 18-18z"/>
    <path class="a" d="M46 92h58q16 0 16 16v36q0 16-16 16H70l-24 20v-20q-16 0-16-16v-36q0-16 16-16z"/>
    <path class="a" d="M58 126h0M75 126h0M92 126h0"/>`,
  // 08 المقابلات: تقويم وثلاثة مواعيد
  calendar: `
    <rect class="m" x="30" y="46" width="140" height="126" rx="22"/>
    <path class="m" d="M70 30v30M130 30v30M30 88h140"/>
    <rect class="m" x="44" y="112" width="30" height="30" rx="9"/>
    <rect class="m" x="85" y="112" width="30" height="30" rx="9"/>
    <rect class="a" x="126" y="112" width="30" height="30" rx="9"/>
    <path class="a" d="M133 127l5 5 10-11"/>`,
  // 09 تقييم الشركات: مبنى ونجمة
  rating: `
    <path class="m" d="M40 172V48q0-14 14-14h62q14 0 14 14v38"/>
    <path class="m" d="M24 172h80"/>
    <path class="m" d="M64 66h0M88 66h0M106 66h0M64 92h0M88 92h0M64 118h0M88 118h0"/>
    <path class="m" d="M70 172v-26h22v26"/>
    <path class="a" d="${star(142, 136, 36, 16)}"/>`,
  // 11 أصحاب العمل: شخص وعدسة بحث
  employer: `
    <circle class="m" cx="86" cy="66" r="28"/>
    <path class="m" d="M34 170q0-56 52-56 16 0 28 6"/>
    <circle class="a" cx="142" cy="138" r="26"/>
    <path class="a" d="M161 157l17 17"/>`,
  // 12 التحميل: هاتف وسهم نازل
  download: `
    <rect class="m" x="56" y="22" width="88" height="156" rx="24"/>
    <path class="m" d="M90 42h20"/>
    <path class="a" d="M100 70v60M78 108l22 22 22-22"/>
    <path class="m" d="M82 154h36"/>`,
};

// قوالب السيرة الأربعة (من js/cv-templates.js) — مصغّرات بنفس ألوانها
const CV_MINIS = [
  { name: 'الخنجر', html: `<div class="cv k"><i class="hl"></i><i class="ln w7"></i><i class="ln w5"></i><i class="rule"></i><i class="ln"></i><i class="ln w8"></i><i class="ln w6"></i></div>` },
  { name: 'اللبان', html: `<div class="cv l"><div class="side"><i class="av"></i><i class="ln"></i><i class="ln w6"></i></div><div class="body"><i class="hl"></i><i class="bar"></i><i class="ln"></i><i class="ln w8"></i><i class="ln w6"></i></div></div>` },
  { name: 'سبأ', html: `<div class="cv s"><i class="hl c"></i><i class="ln w5 c"></i><i class="thin"></i><i class="ln"></i><i class="ln w8"></i><i class="ln"></i><i class="ln w6"></i></div>` },
  { name: 'الخريف', html: `<div class="cv kh"><div class="head"><i class="hl"></i><i class="ln w5"></i></div><div class="pad"><i class="ln"></i><i class="ln w8"></i><i class="ln w6"></i></div></div>` },
];

// المحتوى: [hl] يحدد العبارة المميّزة الوحيدة، | يفصل السطرين
const POSTS = [
  { icon: 'launch', title: 'وظيفتك القادمة،|[بذكاء]', sub: 'وظائف موثّقة في اليمن، ومساعد ذكي يبحث لك', cta: 'قريباً في اليمن' },
  { icon: 'stack', title: 'كل الوظائف [المؤكدة]|في مكان واحد', sub: 'شركات موثّقة بالسجل التجاري، بلا إعلانات مضللة' },
  { icon: 'sanad', title: 'قابل [سند]،|مساعدك الوظيفي', sub: 'يرد على أسئلتك، ويقترح عليك الوظائف المناسبة' },
  { icon: 'upload', title: 'ارفع سيرتك PDF…|[وانتهى]', sub: 'يقرؤها المساعد ويعبّئ ملفك تلقائياً في ثوانٍ' },
  { icon: 'bell', title: 'وظيفة تناسبك؟|يصلك إشعار [فوراً]', sub: 'اضغط على الإشعار وقدّم بضغطة واحدة' },
  { icon: 'shield', title: 'شركات حقيقية…|بشارة [التوثيق ✓]', sub: 'نراجع السجل التجاري قبل نشر أي وظيفة' },
  { icon: 'chat', title: 'تحدّث مع صاحب|العمل [مباشرة]', sub: 'محادثة داخل التطبيق دون تبادل أرقام' },
  { icon: 'calendar', title: 'جدولة المقابلة|[بلمسة]', sub: 'يقترح لك 3 مواعيد وتختار الأنسب' },
  { icon: 'rating', title: 'اعرف الشركة|[قبل أن تقدّم]', sub: 'تقييمات حقيقية ونسبة رد على المتقدمين' },
  { icon: 'cv', title: 'قوالب سيرة|[بهوية يمنية]', sub: 'أربعة قوالب حصرية: الخنجر، اللبان، سبأ، الخريف' },
  { icon: 'employer', title: 'تبحث عن|[موظف مناسب]؟', sub: 'انشر وظيفتك واستقبل المتقدمين المطابقين' },
  { icon: 'download', title: 'حمّل وظيفتي|[وابدأ اليوم]', sub: 'متاح للأندرويد قريباً', cta: 'حمّل الآن', ctaBig: true },
];

const CHECK = `<svg class="ck" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>`;

function titleHTML(t) {
  return t.split('|').map(line =>
    `<span class="ln1">${line.replace(/\[(.+?)\]/g, (_, w) => `<span class="hi">${w.replace('✓', CHECK)}</span>`)}</span>`
  ).join('');
}

// مواضع الزخارف الخلفية — تتغير قليلاً من بوستر لآخر ليتدفق شبك الصفحة
const DECOR = [
  [-120, 1150, 430, 210, 360, 280], [1180, 1240, 420, 150, 470, 250], [-160, 1060, 400, 240, 300, 300],
  [1120, 1180, 440, 120, 420, 270], [-80, 1220, 420, 200, 380, 260], [1200, 1100, 410, 160, 330, 290],
  [-140, 1180, 440, 230, 420, 270], [1160, 1220, 420, 130, 360, 280], [-100, 1120, 410, 220, 340, 300],
  [1180, 1160, 430, 140, 440, 260], [-150, 1200, 420, 210, 400, 280], [1140, 1180, 450, 150, 350, 270],
];

function page(i) {
  const p = POSTS[i], n = i + 1, dark = n % 2 === 1;
  const [bx, by, br, rx, ry, rr] = DECOR[i];
  const stage = p.icon === 'cv'
    ? `<div class="cvrow">${CV_MINIS.map(c => `<figure>${c.html}<figcaption>${c.name}</figcaption></figure>`).join('')}</div>`
    : `<div class="stage"><svg class="icon" viewBox="0 0 200 200">${ICONS[p.icon]}</svg></div>`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../fonts/tajawal.css"><link rel="stylesheet" href="../poster.css">
<title>post-${String(n).padStart(2, '0')}</title></head>
<body class="${dark ? 'dark' : 'light'}${p.icon === 'cv' ? ' is-cv' : ''}${p.cta ? ' has-cta' : ''}">
<main class="poster">
  <svg class="bg" viewBox="0 0 1080 1350" aria-hidden="true">
    <defs><radialGradient id="glow"><stop offset="0" class="g0"/><stop offset="1" class="g1"/></radialGradient></defs>
    <circle class="blob" cx="${bx}" cy="${by}" r="${br}"/>
    <circle class="ring" cx="${rx}" cy="${ry}" r="${rr}"/>
    <circle class="ring2" cx="${rx}" cy="${ry}" r="${rr + 70}"/>
    <circle cx="${dark ? 820 : 260}" cy="470" r="520" fill="url(#glow)"/>
  </svg>
  <header>
    <img class="logo" src="../../../assets/brand/${dark ? 'logo-horizontal-white.svg' : 'logo-horizontal.svg'}" alt="وظيفتي">
    <span class="num">${String(n).padStart(2, '0')} / 12</span>
  </header>
  ${stage}
  <section class="copy">
    <h1>${titleHTML(p.title)}</h1>
    <p class="sub">${p.sub}</p>
    ${p.cta ? `<div class="cta${p.ctaBig ? ' big' : ''}">${p.cta}</div>` : ''}
  </section>
  <footer><span class="dl"><i class="dot"></i>حمّل وظيفتي</span><span class="tag">Wazifati</span></footer>
</main></body></html>`;
}

module.exports = { POSTS, page };
