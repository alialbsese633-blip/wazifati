/* وظيفتي · بوسترات بستايل المشهد ثلاثي الأبعاد
   الشخصيات من صور المستخدم (posters/src/chars) بعد إزالة الخلفية، وكل ما عداها مرسوم بالكود */
const BRAND = '../../../assets/brand/';
const FEET = 1112; // خط وقوف الشخصيات على المنصة

const CHECK = `<svg class="ck" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>`;
const chk = `<span class="chk"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>`;
const sparkPath = s => `M${s} 0Q${s * 1.18} ${s * .82} ${s * 2} ${s}Q${s * 1.18} ${s * 1.18} ${s} ${s * 2}Q${s * .82} ${s * 1.18} 0 ${s}Q${s * .82} ${s * .82} ${s} 0Z`;
const spark = (x, y, s) => `<svg class="spark" style="left:${x}px;top:${y}px;width:${s * 2}px;height:${s * 2}px" viewBox="0 0 ${s * 2} ${s * 2}"><path d="${sparkPath(s)}"/></svg>`;
const orb = (x, y, d, icon) => `<div class="orb" style="left:${x}px;top:${y}px;width:${d}px;height:${d}px"><svg viewBox="0 0 100 100">${icon}</svg></div>`;

// أيقونات بيضاء داخل الكرات (شبكة 100×100)
const I = {
  bell: `<path d="M50 18q-20 0-21 22v15l-8 12h58l-8-12V40q-1-22-21-22z"/><path d="M43 78q7 8 14 0"/><circle class="lm" cx="72" cy="24" r="6"/>`,
  star: `<path d="M50 16l10 21 23 3-17 16 4 23-20-11-20 11 4-23-17-16 23-3z"/>`,
  arrowDown: `<path d="M50 20v48M30 50l20 20 20-20"/><path class="lm" d="M28 84h44"/>`,
  shield: `<path d="M50 14l30 11v23q0 26-30 40-30-14-30-40V25z"/><path class="lm" d="M36 50l10 10 19-20"/>`,
  sparkle: `<path d="M50 18q4 28 32 32-28 4-32 32-4-28-32-32 28-4 32-32z"/>`,
  search: `<circle cx="44" cy="44" r="22"/><path class="lm" d="M60 60l18 18"/>`,
  brief: `<rect x="16" y="34" width="68" height="46" rx="12"/><path d="M38 34v-6q0-6 6-6h12q6 0 6 6v6M16 54h68"/>`,
};

const CVS = {
  khanjar: `<div class="cv k"><i class="hl"></i><i class="ln w7"></i><i class="ln w5"></i><i class="rule"></i><i class="ln"></i><i class="ln w8"></i><i class="ln w6"></i></div>`,
  luban: `<div class="cv l"><div class="side"><i class="av"></i><i class="ln"></i><i class="ln w6"></i></div><div class="body"><i class="hl"></i><i class="bar2"></i><i class="ln"></i><i class="ln w8"></i><i class="ln w6"></i></div></div>`,
  saba: `<div class="cv s"><i class="hl c"></i><i class="ln w5 c"></i><i class="thin"></i><i class="ln"></i><i class="ln w8"></i><i class="ln"></i><i class="ln w6"></i></div>`,
  khareef: `<div class="cv kh"><div class="head"><i class="hl"></i><i class="ln w5"></i></div><div class="pad"><i class="ln"></i><i class="ln w8"></i><i class="ln w6"></i></div></div>`,
};

// ——— البطاقات العائمة لكل ميزة ———
const OBJ = {
  launch: `
    <div class="obj" style="left:612px;top:600px;width:330px;transform:rotate(-4deg)">
      <div class="card"><div class="row"><img class="mark" src="${BRAND}mark.svg"><div><div class="t">محاسب مالي</div><div class="s">شركة الأفق · صنعاء</div></div></div>
        <div class="row" style="margin-top:18px;justify-content:space-between"><span class="pill">قدّم الآن</span><span class="s" style="font-weight:800;color:#5B3DF5">مطابقة 92%</span></div></div></div>
    <div class="obj" style="left:690px;top:860px;width:290px;transform:rotate(3deg)">
      <div class="card glass"><div class="row">${chk}<div class="t" style="font-size:24px">وظيفة موثّقة</div></div></div></div>
    ${orb(560, 540, 104, I.brief)}${spark(930, 560, 18)}${spark(580, 960, 12)}`,

  verified: `
    <div class="obj" style="left:600px;top:560px;width:360px">
      ${['محاسب مالي · صنعاء', 'مهندس شبكات · عدن', 'مصمم جرافيك · تعز'].map((j, k) => `
      <div class="card" style="margin-bottom:16px;padding:20px 22px;transform:translateX(${k * -22}px)"><div class="row" style="justify-content:space-between"><div class="t" style="font-size:24px">${j}</div>${chk}</div>
      <div class="bar" style="width:${70 - k * 12}%;margin-top:12px"></div></div>`).join('')}
    </div>${spark(940, 540, 16)}${spark(560, 1000, 12)}`,

  sanad: `
    <div class="obj" style="left:590px;top:580px;width:390px">
      <div class="card glass" style="border-radius:30px 30px 30px 8px;margin-inline-start:70px"><div class="s" style="font-size:22px;color:#fff">أبحث عن وظيفة محاسب في صنعاء</div></div>
      <div class="card" style="margin-top:18px;border-radius:30px 30px 8px 30px"><div class="row"><span style="color:#5B3DF5;font-size:30px">✦</span><div class="t" style="font-size:24px">سند</div></div>
        <div class="s" style="margin-top:6px">لقيت لك <b style="color:#1B1035">4 وظائف</b> تناسب ملفك، أعرضها لك؟</div>
        <div class="row" style="margin-top:14px;gap:10px"><span class="pill">اعرضها</span></div></div>
    </div>${orb(880, 1010, 90, I.sparkle)}${spark(560, 560, 16)}`,

  upload: `
    <div class="obj" style="left:620px;top:560px;width:330px;transform:rotate(-3deg)">
      <div class="card"><div class="row"><div style="width:64px;height:78px;border-radius:12px;background:#5B3DF5;color:#fff;font-weight:800;font-size:20px;display:grid;place-items:center;direction:ltr">PDF</div>
        <div><div class="t" style="direction:ltr;text-align:right">CV.pdf</div><div class="s">تمت القراءة في 4 ثوانٍ</div></div></div>
        <div style="height:12px;border-radius:6px;background:#E3DEF2;margin-top:18px;overflow:hidden"><div style="height:100%;width:100%;background:linear-gradient(90deg,#5B3DF5,#C8F135)"></div></div></div></div>
    <div class="obj" style="left:660px;top:820px;width:300px">
      <div class="card glass" style="padding:20px 22px">${['الاسم', 'الخبرات', 'المهارات'].map(x => `<div class="row" style="margin:6px 0">${chk}<span class="t" style="font-size:24px">${x}</span></div>`).join('')}</div></div>
    ${spark(940, 540, 16)}${spark(600, 1000, 12)}`,

  bell: `
    <div class="obj" style="left:572px;top:640px;width:410px;transform:rotate(-2deg)">
      <div class="card lime-glow" style="padding:22px 24px"><div class="row"><img class="mark" src="${BRAND}mark.svg"><div style="flex:1"><div class="row" style="justify-content:space-between"><b style="font-size:22px">وظيفتي</b><span class="s" style="font-size:19px">الآن</span></div>
        <div class="t" style="font-size:23px;margin-top:4px">شركة الأفق نزّلت وظيفة مناسبة لك</div></div></div></div></div>
    <div class="obj" style="left:700px;top:830px;width:260px"><div class="card glass" style="padding:18px 22px;text-align:center"><span class="pill" style="width:100%;justify-content:center">قدّم بضغطة</span></div></div>
    ${orb(820, 500, 120, I.bell)}${spark(600, 560, 16)}${spark(960, 980, 12)}`,

  shield: `
    ${orb(700, 520, 210, I.shield)}
    <div class="obj" style="left:604px;top:780px;width:370px">
      <div class="card"><div class="row" style="justify-content:space-between"><div><div class="t">مؤسسة سبأ للتجارة</div><div class="s">السجل التجاري: تمت المراجعة</div></div>${chk}</div>
      <div class="row" style="margin-top:14px"><span class="pill">✓ موثّقة</span></div></div></div>
    ${spark(950, 540, 18)}${spark(610, 600, 12)}`,

  chat: `
    <div class="obj" style="left:330px;top:520px;width:420px">
      <div class="card" style="border-radius:30px 30px 30px 8px;width:330px"><div class="s" style="font-size:22px;color:#1B1035">مرحباً، متى تقدر تبدأ معنا؟</div></div>
      <div class="card lime-glow" style="margin-top:16px;border-radius:30px 30px 8px 30px;width:360px;margin-inline-start:60px;background:linear-gradient(160deg,#5B3DF5,#4429D6);color:#fff"><div style="font-size:22px;font-weight:500">من الأسبوع القادم إن شاء الله 🌟</div></div>
    </div>${spark(470, 470, 14)}${spark(800, 760, 12)}`,

  calendar: `
    <div class="obj" style="left:604px;top:560px;width:370px;transform:rotate(-2deg)">
      <div class="card"><div class="row" style="justify-content:space-between"><div class="t">مقابلة عمل</div><span class="s">3 مواعيد</span></div>
        ${[['الأحد', '10:00 ص', 0], ['الاثنين', '1:00 م', 1], ['الثلاثاء', '11:30 ص', 0]].map(([d, t, on]) => `
        <div class="row" style="justify-content:space-between;margin-top:14px;padding:14px 18px;border-radius:18px;${on ? 'background:#C8F135' : 'background:#EEE9FB'}">
          <b style="font-size:23px">${d}</b><span style="font-size:22px;font-weight:700;direction:ltr">${t}</span></div>`).join('')}
      </div></div>${spark(950, 520, 16)}${spark(590, 1000, 12)}`,

  rating: `
    <div class="obj" style="left:600px;top:580px;width:380px">
      <div class="card"><div class="row"><div style="width:64px;height:64px;border-radius:18px;background:#1B1035;color:#C8F135;font-weight:800;font-size:28px;display:grid;place-items:center">أ</div>
        <div><div class="t">شركة الأفق</div><div style="color:#E9A53A;font-size:26px;letter-spacing:2px">★★★★★ <b style="color:#1B1035;font-size:22px">4.8</b></div></div></div>
        <div class="row" style="justify-content:space-between;margin-top:18px"><span class="s">نسبة الرد</span><b style="font-size:24px;color:#5B3DF5">92%</b></div>
        <div style="height:12px;border-radius:6px;background:#E3DEF2;margin-top:8px;overflow:hidden"><div style="height:100%;width:92%;background:#5B3DF5"></div></div></div></div>
    <div class="obj" style="left:650px;top:900px;width:320px"><div class="card glass" style="padding:18px 22px"><div class="s" style="color:#fff">«تواصلوا معي خلال يومين» ⭐</div></div></div>
    ${orb(880, 480, 100, I.star)}`,

  cv: `
    <div class="obj" style="left:520px;top:560px;width:480px;height:520px">
      ${[['khareef', 'الخريف', 0, 0, -8], ['saba', 'سبأ', 220, 30, 6], ['luban', 'اللبان', 40, 280, -4], ['khanjar', 'الخنجر', 250, 300, 7]].map(([k, n, x, y, r]) => `
      <div style="position:absolute;left:${x}px;top:${y}px;transform:rotate(${r}deg)">${CVS[k]}<div class="cvlab" style="margin-top:8px">${n}</div></div>`).join('')}
    </div>`,

  employer: `
    <div class="obj" style="left:596px;top:560px;width:380px">
      ${[['أحمد · محاسب', 94], ['سارة · مسوّقة', 89], ['خالد · مهندس', 85]].map(([n, p], k) => `
      <div class="card" style="margin-bottom:14px;padding:18px 22px;${k ? '' : 'box-shadow:0 0 0 3px rgba(200,241,53,.9),0 30px 60px rgba(8,3,24,.45)'}"><div class="row" style="justify-content:space-between">
        <div class="row"><div style="width:52px;height:52px;border-radius:50%;background:${['#5B3DF5', '#2A1A52', '#8F78FF'][k]}"></div><b style="font-size:24px">${n}</b></div><b style="font-size:24px;color:#5B3DF5">${p}%</b></div></div>`).join('')}
    </div>${orb(880, 470, 100, I.search)}${spark(580, 1000, 14)}`,

  download: `
    <div class="obj" style="left:750px;top:640px;width:230px;height:420px;border-radius:46px;background:linear-gradient(160deg,#2A1A52,#120A26);border:6px solid #3A2A7A;box-shadow:0 40px 80px rgba(8,3,24,.6),0 0 60px rgba(91,61,245,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;transform:rotate(6deg)">
      <img src="${BRAND}mark.svg" style="width:120px;height:120px;border-radius:32px">
      <b style="font-size:34px">وظيفتي</b><span class="pill" style="font-size:20px">Android</span></div>
    ${orb(660, 920, 110, I.arrowDown)}${spark(700, 640, 16)}`,
};


// الشخصيات: src، مركز x، الارتفاع، انعكاس
const POSTS = [
  { obj: 'launch', title: 'وظيفتك القادمة،|[بذكاء]', sub: 'وظائف موثّقة في اليمن، ومساعد ذكي يبحث لك', cta: 'قريباً في اليمن', cast: [['m_yemeni', 330, 640]] },
  { obj: 'verified', title: 'كل الوظائف [المؤكدة]|في مكان واحد', sub: 'شركات موثّقة بالسجل التجاري، بلا إعلانات مضللة', cast: [['f_brown', 320, 640]] },
  { obj: 'sanad', title: 'قابل [سند]،|مساعدك الوظيفي', sub: 'يرد على أسئلتك، ويقترح عليك الوظائف المناسبة', cast: [['m_polo', 320, 640]] },
  { obj: 'upload', title: 'ارفع سيرتك PDF…|[وانتهى]', sub: 'يقرؤها المساعد ويعبّئ ملفك تلقائياً في ثوانٍ', cast: [['f_blue', 330, 640, true]] },
  { obj: 'bell', title: 'وظيفة تناسبك؟|يصلك إشعار [فوراً]', sub: 'اضغط على الإشعار وقدّم بضغطة واحدة', cast: [['m_pink', 310, 640]] },
  { obj: 'shield', title: 'شركات حقيقية…|بشارة [التوثيق ✓]', sub: 'نراجع السجل التجاري قبل نشر أي وظيفة', cast: [['m_beige', 320, 650]] },
  { obj: 'chat', title: 'تحدّث مع صاحب|العمل [مباشرة]', sub: 'محادثة داخل التطبيق دون تبادل أرقام', cast: [['f_brown', 220, 600], ['m_beige', 840, 620, true]] },
  { obj: 'calendar', title: 'جدولة المقابلة|[بلمسة]', sub: 'يقترح لك 3 مواعيد وتختار الأنسب', cast: [['m_pink', 320, 640, true]] },
  { obj: 'rating', title: 'اعرف الشركة|[قبل أن تقدّم]', sub: 'تقييمات حقيقية ونسبة رد على المتقدمين', cast: [['f_blue', 320, 640]] },
  { obj: 'cv', title: 'قوالب سيرة|[بهوية يمنية]', sub: 'أربعة قوالب حصرية: الخنجر، اللبان، سبأ، الخريف', cast: [['f_brown', 290, 630, true]] },
  { obj: 'employer', title: 'تبحث عن|[موظف مناسب]؟', sub: 'انشر وظيفتك واستقبل المتقدمين المطابقين', cast: [['m_yemeni', 320, 640]] },
  { obj: 'download', title: 'حمّل وظيفتي|[وابدأ اليوم]', sub: 'متاح للأندرويد قريباً', cta: 'حمّل الآن', ctaBig: true, cast: [['f_blue', 190, 560], ['m_yemeni', 400, 600], ['m_polo', 590, 560, true]], podium: [400, 700] },
];

const SIZES = { f_brown: [661, 1801], f_blue: [410, 1172], m_yemeni: [623, 1735], m_polo: [417, 1390], m_pink: [456, 1393], m_beige: [549, 1738] };

function titleHTML(t) {
  return t.split('|').map(line => `<span class="ln1">${line.replace(/\[(.+?)\]/g, (_, w) => `<span class="hi">${w.replace('✓', CHECK)}</span>`)}</span>`).join('');
}

function podium(cx, w) {
  const h = Math.round(w * .2);
  return `<div class="podium" style="left:${cx - w / 2}px;top:${FEET - h / 2 - 4}px;width:${w}px;height:${h}px"><div class="side"></div><div class="top"></div></div>`;
}

function rings(cx, cy, rx, ry, front) {
  const e = (r1, r2, stroke, w, op, blur) => front
    ? `<path d="M${cx - r1} ${cy}A${r1} ${r2} 0 0 0 ${cx + r1} ${cy}" stroke="${stroke}" stroke-width="${w}" opacity="${op}" fill="none" ${blur ? 'filter="url(#bl)"' : ''}/>`
    : `<ellipse cx="${cx}" cy="${cy}" rx="${r1}" ry="${r2}" stroke="${stroke}" stroke-width="${w}" opacity="${op}" ${blur ? 'filter="url(#bl)"' : ''}/>`;
  return `<svg class="rings ${front ? 'front' : ''}" style="left:0;top:0;width:1080px;height:1350px" viewBox="0 0 1080 1350">
    <defs><filter id="bl" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
    <g transform="rotate(-10 ${cx} ${cy})">
      ${e(rx, ry, '#8F78FF', 14, .55, true)}${e(rx, ry, '#FFFFFF', 3, .85)}
      ${e(rx + 26, ry + 12, '#C8F135', 2.5, .75)}${e(rx - 30, ry - 10, '#FFFFFF', 1.5, .35)}
    </g></svg>`;
}

function charImg([name, cx, h, flip]) {
  const [w0, h0] = SIZES[name], w = Math.round(w0 * h / h0);
  return `<img class="char" src="../chars/${name}.png" style="left:${cx - w / 2}px;top:${FEET - h + 8}px;height:${h}px;width:${w}px;${flip ? 'transform:scaleX(-1)' : ''}" data-box="${cx - w / 2},${FEET - h + 8},${w},${h}">`;
}

const PANELS = [[60, 470, 170, 520], [250, 520, 120, 470], [880, 520, 150, 360]];

function page(i) {
  const p = POSTS[i], n = i + 1, odd = n % 2 === 1;
  const main = p.cast.length === 1 ? p.cast[0] : null;
  const pod = p.podium || (main ? [main[1], Math.max(300, Math.round(SIZES[main[0]][0] * main[2] / SIZES[main[0]][1] * 1.5))] : null);
  const ringC = main ? [main[1], FEET - main[2] * .42, Math.round(SIZES[main[0]][0] * main[2] / SIZES[main[0]][1] * .85) + 40, 70] : null;
  const pods = p.cast.length === 2 ? p.cast.map(c => podium(c[1], 300)).join('') : (pod ? podium(pod[0], pod[1]) : '');
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../fonts/tajawal.css"><link rel="stylesheet" href="../scene.css"><title>post-${String(n).padStart(2, '0')}</title></head>
<body><main class="poster ${odd ? 'odd' : 'even'}">
  <div class="wall"></div>
  ${PANELS.map(([x, y, w, h]) => `<div class="panel" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`).join('')}
  <div class="floor"></div>
  ${pods}
  ${ringC ? rings(...ringC, false) : ''}
  ${p.cast.map(charImg).join('')}
  ${ringC ? rings(...ringC, true) : ''}
  ${OBJ[p.obj]}
  <header><span class="num">${String(n).padStart(2, '0')} / 12</span></header>
  <section class="copy"><h1>${titleHTML(p.title)}</h1><p class="sub">${p.sub}</p>
    ${p.cta ? `<div class="cta${p.ctaBig ? ' big' : ''}">${p.cta}</div>` : ''}</section>
  <footer><img class="logo" src="${BRAND}logo-horizontal-white.svg" alt="وظيفتي">
    <div class="dl"><div><b>حمّل وظيفتي</b><small>قريباً على أندرويد</small></div>
      <svg class="chev" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="#C8F135"/><path d="M22 12v18M14 23l8 8 8-8" fill="none" stroke="#1B1035" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></div></footer>
</main></body></html>`;
}

module.exports = { POSTS, page };
