/* =====================================================
   مساعد وظيفتي الذكي - 3 أوضاع تلقائية:
   remote : الذكاء الحقيقي عبر دالة Supabase «ai» (في الرابط وتطبيق APK)
   claude : داخل Claude (قدرة sample)
   local  : محرك محلي احتياطي بدون إنترنت
   ===================================================== */
const AI = {
  mode: 'local', sample: null,
  async init() {
    if (REAL) this.mode = 'remote';
    try {
      if (this.mode === 'local' && window.claude && typeof window.claude.use === 'function') {
        const s = await window.claude.use('sample'); if (s) { this.sample = s; this.mode = 'claude'; }
      }
    } catch (e) {}
    if (typeof onAIReady === 'function') onAIReady();
  },
  label() { return this.mode === 'local' ? L('الوضع المحلي', 'Offline mode') : L('ذكاء اصطناعي متصل', 'AI connected'); },
  langLine() { return LANG === 'en' ? 'Reply in clear, simple English.' : 'اكتب بالعربية البسيطة الواضحة.'; },

  /* ---------- السياق ---------- */
  money(j) { return fmtMoney(j.min, j.cur) + '–' + fmtMoney(j.max, j.cur) + (j.gig ? L(' يومياً', '/day') : L(' شهرياً', '/month')); },
  jobsCtx(limit = 80) {
    return activeJobs().slice(0, limit).map(j => { const c = company(j.company), st = companyStats(c);
      return `#${j.id} | ${j.title} | ${c.name}${c.status === 'verified' ? ' (موثّقة)' : ''} ★${st.rating.toFixed(1)} رد ${st.resp ?? '-'}% | ${nm(LOCS, j.loc)} | ${nm(TYPES, j.type)} | ${this.money(j)} | خبرة ${j.exp} | ${nm(CATS, j.cat)} | ${j.skills.join('، ')}`; }).join('\n');
  },
  profileCtx() {
    const p = D.me || {}; if (!p.role) return 'المستخدم غير مسجل الدخول.';
    if (p.role !== 'seeker') { const c = Store.myCompany(); return `المستخدم: ${p.name} (${p.role === 'admin' ? 'مشرف' : 'صاحب عمل'})${c ? ' — شركة ' + c.name + ' (' + c.status + ')' : ''}`; }
    const apps = D.apps.filter(a => a.seeker === p.id).map(a => (job(a.job) || {}).title + ': ' + nm(STATUSES, a.status)).join('؛ ');
    return `الاسم: ${p.name}\nالمسمى: ${p.title}\nالمدينة: ${nm(LOCS, p.loc)}\nالخبرة: ${p.exp} سنوات\nالتعليم: ${p.edu}\nالمهارات: ${(p.skills || []).join('، ')}\nنبذة: ${p.about}\nالخبرات: ${(p.experiences || []).map(x => x.title + ' في ' + x.company + ' (' + x.period + ')').join('؛ ')}\nطلباته: ${apps || 'لا يوجد'}`;
  },
  base(withGuide) {
    return `أنت «سند»، المساعد الذكي داخل منصة «وظيفتي» للتوظيف (تبدأ في اليمن). ${this.langLine()} كن دقيقاً ومختصراً واستخدم نقاطاً قصيرة عند الحاجة.
لا تخترع وظائف أو شركات غير موجودة في القائمة. عندما تذكر وظيفة من القائمة اكتب بعدها رمزها هكذا: [[job:رمزها]] (مثل [[job:${(activeJobs()[0] || { id: 'j1' }).id}]]).
لا يجوز أن يدفع الباحث أي رسوم مقابل التوظيف.${withGuide && this.mode !== 'remote' ? '\n\nدليل التطبيق (أجب منه عن أسئلة الاستخدام):\n' + APP_GUIDE_TEXT(LANG) : ''}`;
  },

  /* ---------- الاستدعاء ---------- */
  async call(prompt, { onText, history = [] } = {}) {
    const msgs = [...history.slice(-8), { role: 'user', content: prompt }];
    if (this.mode === 'claude') {
      const opts = { cache: false }; if (onText) opts.onText = x => onText(x.text);
      try { return (await this.sample(msgs, opts)).text; }
      catch (err) { if (err && err.code === 'not_granted') { this.mode = 'local'; onAIReady && onAIReady(); } throw err; }
    }
    if (this.mode === 'remote') {
      const tok = await Store.aiToken();
      const r = await fetch(CFG.supabaseUrl + '/functions/v1/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok, apikey: CFG.supabaseAnonKey }, body: JSON.stringify({ messages: msgs, lang: LANG }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 429) { const t = L('وصلت للحد اليومي للمساعد الذكي. جرّب غداً.', 'You reached today’s AI limit. Try again tomorrow.'); onText && onText(t); return t; }
      if (!r.ok) throw new Error(j.error || 'ai ' + r.status);
      if (onText) await this.type(j.text || '', onText); return j.text || '';
    }
    throw new Error('local');
  },
  async type(text, onText) { if (!onText) return text; const w = text.split(/(\s+)/); let out = ''; for (let i = 0; i < w.length; i++) { out += w[i]; if (i % 4 === 0) { onText(out); await new Promise(r => setTimeout(r, 10)); } } onText(text); return text; },
  parseJSON(t) { try { return JSON.parse(t); } catch (e) { const m = String(t).match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch (_) {} } return null; } },
  async run(task, data = {}, onText) {
    const T = TASKS[task];
    if (this.mode !== 'local') {
      try {
        const t = await this.call(T.prompt(data), { onText: T.json ? null : onText, history: data.history || [] });
        if (T.json) { const v = this.parseJSON(t); if (v) return v; throw new Error('bad json'); }
        return t;
      } catch (e) { console.warn('AI fallback', e); }
    }
    const r = T.local(data); return T.json ? r : this.type(r, onText);
  }
};

const N = s => String(s || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
const TASKS = {
  chat: {
    prompt: d => `${AI.base(true)}
دور المستخدم: ${({ seeker: 'باحث عن عمل', employer: 'صاحب عمل', admin: 'مشرف المنصة' })[(D.me || {}).role] || 'زائر غير مسجل'}
${AI.profileCtx()}

الوظائف المنشورة حالياً:
${AI.jobsCtx()}

سؤال المستخدم: ${d.q}`,
    local: d => localChat(d.q)
  },
  about: {
    prompt: () => `${AI.base()}\nأعد كتابة النبذة المهنية لهذا الباحث بأسلوب احترافي جذاب في 3 إلى 4 أسطر فقط، بصيغة المتكلم، بدون عناوين ولا رموز. اكتب النبذة فقط.\n\n${AI.profileCtx()}`,
    local: () => { const p = D.me; return L(`${p.title} بخبرة ${p.exp} سنوات، أتميز بـ${(p.skills || []).slice(0, 3).join(' و')}. حاصل على ${p.edu || 'مؤهل في مجالي'}${(p.experiences || [])[0] ? '، وعملت مؤخراً ' + p.experiences[0].title + ' في ' + p.experiences[0].company : ''}. أحرص على الدقة والالتزام، وأبحث عن فرصة في ${nm(LOCS, p.loc)} أضيف فيها قيمة حقيقية وأطوّر مسيرتي.`,
      `${p.title} with ${p.exp} years of experience, strong in ${(p.skills || []).slice(0, 3).join(', ')}. I hold ${p.edu || 'a relevant qualification'}${(p.experiences || [])[0] ? ' and most recently worked as ' + p.experiences[0].title + ' at ' + p.experiences[0].company : ''}. I am precise and reliable, looking for a role in ${nm(LOCS, p.loc)} where I can add real value.`); }
  },
  cover: {
    prompt: d => `${AI.base()}\nاكتب رسالة تقديم قصيرة (5 إلى 7 أسطر) من الباحث إلى صاحب العمل لهذه الوظيفة. ابدأ بالتحية، اربط خبرته ومهاراته بمتطلبات الوظيفة تحديداً، واختم بشكر واسمه. بدون عناوين.\n\nالوظيفة: ${d.j.title} في ${company(d.j.company).name}\nالمتطلبات: ${d.j.reqs.join('، ')}\nالمهارات: ${d.j.skills.join('، ')}\n\n${AI.profileCtx()}`,
    local: d => { const p = D.me, j = d.j, hit = j.skills.filter(s => (p.skills || []).map(N).includes(N(s)));
      return L(`السلام عليكم ورحمة الله،\n\nأتقدم بطلبي لوظيفة «${j.title}» لدى ${company(j.company).name}. أعمل ${p.title} بخبرة ${p.exp} سنوات${hit.length ? '، وأمتلك المهارات التي تطلبونها مثل ' + hit.join(' و') : ''}. ${(p.experiences || [])[0] ? 'في عملي الحالي ' + p.experiences[0].details : ''}\n\nأنا في ${nm(LOCS, p.loc)} وجاهز للمقابلة في الوقت الذي يناسبكم.\n\nشاكراً لكم وقتكم،\n${p.name}`,
        `Dear Hiring Team,\n\nI am applying for the “${j.title}” role at ${company(j.company).name}. I work as ${p.title} with ${p.exp} years of experience${hit.length ? ' and bring the skills you need, including ' + hit.join(', ') : ''}.\n\nI am based in ${nm(LOCS, p.loc)} and available for an interview at your convenience.\n\nKind regards,\n${p.name}`); }
  },
  fit: {
    prompt: d => `${AI.base()}\nقيّم مدى مناسبة الباحث لهذه الوظيفة بصراحة. اكتب: سطر خلاصة، ثم «نقاط القوة» (2-3 نقاط)، ثم «ما ينقصك» (1-3 نقاط)، ثم «نصيحة قبل التقديم» (سطر).\n\nالوظيفة: ${d.j.title} | ${nm(LOCS, d.j.loc)} | خبرة ${d.j.exp}\nالمتطلبات: ${d.j.reqs.join('، ')}\nالمهارات: ${d.j.skills.join('، ')}\nنسبة المطابقة المحسوبة: ${matchScore(d.j, D.me)}%\n\n${AI.profileCtx()}`,
    local: d => { const p = D.me, j = d.j, m = matchScore(j, p), ps = (p.skills || []).map(N), hit = j.skills.filter(s => ps.includes(N(s))), miss = j.skills.filter(s => !ps.includes(N(s)));
      return [L('**الخلاصة:** مطابقتك ', '**Summary:** your match is ') + m + '%، ' + (m >= 75 ? L('أنت مرشح قوي.', 'you are a strong candidate.') : m >= 50 ? L('فرصتك جيدة مع بعض التحسينات.', 'good chance with some improvements.') : L('الوظيفة أعلى من ملفك الحالي قليلاً.', 'this role is a stretch for now.')),
        '', L('**نقاط القوة**', '**Strengths**'), ...(hit.length ? hit.map(s => '- ' + s) : [L('- خبرة عامة يمكن البناء عليها', '- General experience to build on')]), ...((+p.exp >= j.exp) ? [L('- خبرتك تكفي المطلوب', '- Your experience meets the requirement')] : []),
        '', L('**ما ينقصك**', '**Gaps**'), ...(miss.length ? miss.map(s => '- ' + s) : [L('- لا شيء جوهري', '- Nothing major')]),
        '', L('**نصيحة:** ', '**Tip:** ') + (miss.length ? L('إن كنت تملك ' + miss[0] + ' فأضفها لملفك واكتب رسالة تقديم تربط خبرتك بالمتطلبات.', 'If you have ' + miss[0] + ', add it to your profile and write a cover note linking your experience to the requirements.') : L('قدّم الآن مع رسالة قصيرة.', 'Apply now with a short note.'))].join('\n'); }
  },
  interview: {
    prompt: d => `${AI.base()}\nجهّز الباحث لمقابلة وظيفة «${d.j.title}». اكتب 6 أسئلة متوقعة مرقمة، وتحت كل سؤال سطر يبدأ بـ «💡» يوضح كيف يجيب مستفيداً من خبرته. ثم نصيحتين عامتين للمقابلات.\n\nالمهارات المطلوبة: ${d.j.skills.join('، ')}\n\n${AI.profileCtx()}`,
    local: d => { const j = d.j; const q = [[L('عرّفنا بنفسك باختصار.', 'Tell us about yourself.'), L('ابدأ بمسماك وسنوات خبرتك ثم أبرز إنجاز.', 'Start with your title and years of experience, then one achievement.')], [L('لماذا تريد العمل معنا؟', 'Why do you want to work with us?'), L('اذكر شيئاً محدداً عن الشركة.', 'Mention something specific about the company.')], ...j.skills.slice(0, 3).map(s => [L('حدثنا عن موقف استخدمت فيه ' + s + '.', 'Describe a time you used ' + s + '.'), L('الموقف، ما فعلته، النتيجة.', 'Situation, action, result.')]), [L('ما الراتب الذي تتوقعه؟', 'What salary do you expect?'), L('النطاق المعلن ', 'Advertised range ') + AI.money(j)]];
      return q.map((x, i) => `${i + 1}. ${x[0]}\n💡 ${x[1]}`).join('\n\n') + L('\n\n**نصيحتان:**\n- احضر قبل الموعد بـ10 دقائق ومعك نسخة من سيرتك.\n- جهّز سؤالين تسألهما في النهاية.', '\n\n**Two tips:**\n- Arrive 10 minutes early with a copy of your CV.\n- Prepare two questions to ask at the end.'); }
  },
  jobad: { json: true,
    prompt: d => `${AI.base()}\nصاحب عمل في اليمن يريد نشر وظيفة بعنوان «${d.title}»${d.loc ? ' في ' + nm(LOCS, d.loc) : ''}.
أعد فقط كائن JSON بدون أي نص آخر:
{"desc":"وصف جذاب من 2-3 جمل","reqs":["متطلب"],"skills":["مهارة"],"cat":"واحد من: ${CATS.map(c => c.id).join('|')}","type":"واحد من: ${TYPES.map(c => c.id).join('|')}","exp":0,"min":0,"max":0,"cur":"YER|USD|SAR"}
الرواتب شهرية وواقعية لسوق اليمن (الريال اليمني للوظائف المحلية، والدولار شائع للمنظمات والتقنية عن بعد). اكتب النصوص بـ${LANG === 'en' ? 'الإنجليزية' : 'العربية'}.`,
    local: d => { const t = N(d.title); const tp = JOB_TEMPLATES.find(x => x.key.split('|').some(k => t.includes(N(k)))) || { desc: L(`نبحث عن ${d.title} ملتزم ومتحمس للانضمام إلى فريقنا، يتولى المهام اليومية للوظيفة بكفاءة ويعمل بروح الفريق.`, `We are looking for a committed ${d.title} to join our team and handle the role’s daily duties efficiently.`), reqs: [L('خبرة مناسبة في المجال', 'Relevant experience'), L('مهارات تواصل جيدة', 'Good communication skills')], skills: ['تواصل'], cat: 'admin', type: 'full_time', exp: 1, min: 80000, max: 150000, cur: 'YER' };
      return { desc: tp.desc, reqs: tp.reqs, skills: tp.skills, cat: tp.cat, type: tp.type, exp: tp.exp, min: tp.min, max: tp.max, cur: tp.cur }; }
  },
  shortlist: {
    prompt: d => `${AI.base()}\nأنت تساعد صاحب عمل. هؤلاء المتقدمون لوظيفة «${d.j.title}» (المهارات: ${d.j.skills.join('، ')}، الخبرة: ${d.j.exp}):\n${d.apps.map(a => `- ${a.snap.name} | ${nm(LOCS, a.snap.loc)} | خبرة ${a.snap.exp} | ${(a.snap.skills || []).join('، ')} | مطابقة ${matchScore(d.j, a.snap)}% | الحالة: ${nm(STATUSES, a.status)}`).join('\n')}\nرتّب أفضل 3 مع سبب سطر لكل واحد، ثم سؤال ذكي لكل منهم في المقابلة.`,
    local: d => { const r = [...d.apps].sort((x, y) => matchScore(d.j, y.snap) - matchScore(d.j, x.snap)).slice(0, 3); if (!r.length) return L('لا يوجد متقدمون بعد.', 'No applicants yet.');
      return L('**أفضل المرشحين لـ ', '**Top candidates for ') + d.j.title + ':**\n\n' + r.map((a, i) => { const hit = d.j.skills.filter(s => (a.snap.skills || []).map(N).includes(N(s))); return `${i + 1}. **${a.snap.name}** (${matchScore(d.j, a.snap)}%)\n- ${L('خبرة', 'Experience')} ${a.snap.exp}${hit.length ? ' · ' + hit.join('، ') : ''}\n- ${L('سؤال مقترح: «حدثنا عن آخر مرة استخدمت فيها', 'Suggested question: “Tell us about the last time you used')} ${hit[0] || d.j.skills[0]}»`; }).join('\n\n'); }
  },
  fraud: { json: true,
    prompt: d => `أنت مدقق إعلانات وظائف في منصة يمنية. افحص الإعلان بحثاً عن علامات الاحتيال (طلب رسوم أو تحويل مال، رواتب غير منطقية، تواصل خارج المنصة فقط، وعود مبالغ فيها، معلومات ناقصة).
أعد فقط JSON: {"risk":0-100,"level":"منخفض|متوسط|مرتفع","reasons":["سبب"],"advice":"توصية للمشرف في سطر"}
الإعلان: ${d.j.title} | الجهة: ${company(d.j.company).name} (${company(d.j.company).status === 'verified' ? 'موثّقة' : 'غير موثّقة'}) | الراتب ${AI.money(d.j)} | خبرة ${d.j.exp}\nالوصف: ${d.j.desc}\nالمتطلبات: ${d.j.reqs.join('، ')}`,
    local: d => localFraud(d.j)
  },
  parsecv: { json: true,
    prompt: d => `استخرج بيانات هذه السيرة الذاتية بدقة دون اختراع معلومات غير موجودة. أعد فقط JSON:
{"name":"","title":"المسمى الوظيفي","email":"","phone":"","loc":"واحد من: ${LOCS.map(l => l.id).join('|')} أو فارغ","exp":0,"edu":"أعلى مؤهل والجهة","skills":["حتى 12 مهارة قصيرة"],"langs":["اللغة (المستوى)"],"about":"نبذة مهنية 2-3 أسطر بصيغة المتكلم","experiences":[{"title":"","company":"","period":"","details":"سطر"}]}
اكتب القيم بـ${LANG === 'en' ? 'الإنجليزية' : 'العربية'} إن أمكن مع إبقاء أسماء الجهات كما هي.

نص السيرة:
${d.text}`,
    local: d => CVParse.local(d.text)
  }
};

function localFraud(j) {
  const t = N(j.title + ' ' + j.desc + ' ' + j.reqs.join(' ')); let risk = 0; const reasons = [];
  [[/رسوم|رسم|تحويل|ادفع|دفع مبلغ|تامين مالي|fee|deposit|pay /, 45, L('يطلب مبلغاً أو رسوماً من الباحث', 'Asks seekers for money or fees')], [/واتساب فقط|تواصل خاص|خارج المنصه|whatsapp only/, 15, L('يطلب التواصل خارج المنصة فقط', 'Wants contact outside the platform only')], [/سهله|من البيت|بدون خبره|لا يشترط|easy/, 10, L('وعود عمل سهل بلا شروط', 'Promises easy work with no requirements')], [/راتب عالي|مضمون|ارباح|guaranteed/, 10, L('مبالغة في وعود الدخل', 'Exaggerated income promises')]]
    .forEach(([re, w, why]) => { if (re.test(t)) { risk += w; reasons.push(why); } });
  const usd = j.cur === 'USD' ? j.max : j.cur === 'SAR' ? j.max / 3.75 : j.max / 1500;
  if (!j.gig && j.exp === 0 && usd > 400) { risk += 20; reasons.push(L('راتب مرتفع جداً لوظيفة بلا خبرة', 'Very high pay for a no-experience job')); }
  if (company(j.company).status !== 'verified') { risk += 10; reasons.push(L('الجهة غير موثّقة', 'Company not verified')); }
  if (j.desc.length < 40) { risk += 5; reasons.push(L('الوصف قصير وغير واضح', 'Short, unclear description')); }
  risk = Math.min(100, risk); const level = risk >= 50 ? L('مرتفع', 'High') : risk >= 20 ? L('متوسط', 'Medium') : L('منخفض', 'Low');
  return { risk, level, reasons: reasons.length ? reasons : [L('لا توجد علامات احتيال واضحة', 'No clear fraud signals')], advice: risk >= 50 ? L('ارفض الإعلان وتواصل مع الجهة للتحقق.', 'Reject and contact the company to verify.') : risk >= 20 ? L('راجع الجهة قبل النشر.', 'Check the company before publishing.') : L('آمن للنشر.', 'Safe to publish.') };
}

function localChat(q) {
  const n = N(q), p = D.me || {}, all = activeJobs(), has = re => re.test(n);
  // أسئلة الاستخدام من دليل التطبيق
  const howTo = has(/كيف|وين|اين|ماذا|ايش|شنو|هل|how|where|what|can i/);
  const stem = k => N(k).replace(/^ال/, '').replace(/[هي]$/, '');
  const g = APP_GUIDE.map(x => ({ x, s: x.k.split('|').filter(k => { const kn = N(k), ks = stem(k); return n.includes(kn) || (ks.length >= 3 && n.includes(ks)); }).length })).sort((a, b) => b.s - a.s)[0];
  if (q && g && g.s && (howTo || !has(/وظيف|شغل|job/))) return LANG === 'en' ? g.x.en : g.x.ar;
  const loc = LOCS.find(w => n.includes(N(w.ar)) || n.includes(w.en.toLowerCase()));
  const cat = CATS.find(c => c.ar.split(' ').some(w => w.length > 3 && n.includes(N(w))));
  const words = n.split(/\s+/).filter(w => w.length > 2);
  const kw = all.filter(j => words.some(w => N([j.title, ...j.skills].join(' ')).includes(w.replace(/^ال/, ''))));
  if (has(/رسوم|نصب|احتيال|يطلبون مبلغ|scam|fee/)) return LANG === 'en' ? APP_GUIDE[10].en : APP_GUIDE[10].ar;
  if (has(/راتب|رواتب|معاش|كم يعطون|salary/)) {
    const g2 = {}; all.filter(j => !j.gig && (!cat || j.cat === cat.id)).forEach(j => { const k = nm(CATS, j.cat) + ' (' + nm(CURS, j.cur) + ')'; (g2[k] = g2[k] || []).push(j); });
    return L('**متوسط الرواتب المعلنة (شهرياً):**\n', '**Average advertised salaries (monthly):**\n') + Object.entries(g2).map(([c, a]) => `- ${c}: ${fmtNum(a.reduce((s, j) => s + j.min, 0) / a.length)} – ${fmtNum(a.reduce((s, j) => s + j.max, 0) / a.length)}`).join('\n');
  }
  if (has(/طلبات|طلبي|قدمت|my applications/)) { const a = D.apps.filter(x => x.seeker === p.id); return a.length ? L('**طلباتك:**\n', '**Your applications:**\n') + a.map(x => `- ${(job(x.job) || {}).title}: ${nm(STATUSES, x.status)} [[job:${x.job}]]`).join('\n') : L('لم تقدّم على أي وظيفة بعد. قل لي ما تبحث عنه.', 'You have not applied yet. Tell me what you are looking for.'); }
  if (loc || cat || kw.length || has(/وظيف|شغل|عمل|فرص|ابحث|ابي|ابغي|اريد|مناسب|تناسبني|اقترح|job|work|suggest/)) {
    let r = all.filter(j => (!loc || j.loc === loc.id) && (!cat || j.cat === cat.id));
    if (kw.length && !has(/تناسبني|مناسب|اقترح|suit/)) { const f = r.filter(j => kw.includes(j)); if (f.length) r = f; }
    if (!r.length) r = all;
    r = r.sort((x, y) => matchScore(y, p) - matchScore(x, p)).slice(0, 4);
    return L(`وجدت لك ${r.length} ${loc ? 'في ' + loc.ar : ''} مرتبة حسب مطابقتها لملفك:\n`, `Here are ${r.length} jobs${loc ? ' in ' + loc.en : ''}, ranked by match:\n`) + r.map(j => `- **${j.title}** — ${company(j.company).name}، ${AI.money(j)}، ${L('مطابقة', 'match')} ${matchScore(j, p)}% [[job:${j.id}]]`).join('\n');
  }
  if (p.role === 'employer') return L('أستطيع مساعدتك في:\n- كتابة إعلان كامل من المسمى فقط (نشر وظيفة)\n- ترشيح أفضل المتقدمين (المتقدمون ← رشّح لي الأفضل)\n- جدولة المقابلات والمحادثة مع المتقدمين\n- اقتراح رواتب مناسبة: اسألني «كم رواتب المحاسبين؟»', 'I can help you:\n- Write a full job ad from just the title\n- Shortlist the best applicants\n- Schedule interviews and chat with applicants\n- Suggest fair salaries — ask “what do accountants earn?”');
  return L('أهلاً! أنا سند، مساعدك الذكي في وظيفتي 👋 جرّب:\n- أبغى وظيفة في عدن\n- ما الوظائف التي تناسبني؟\n- كم رواتب المحاسبة؟\n- كيف أرفع سيرتي؟\n- كيف أوثّق شركتي؟', 'Hi! I’m Sanad, your Wazifati AI 👋 Try:\n- Jobs in Aden\n- Which jobs suit me?\n- What do accountants earn?\n- How do I upload my CV?\n- How do I verify my company?');
}

/* ---------- نص المساعد إلى HTML آمن ---------- */
function md(t) {
  let h = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[\[job:([\w-]+)\]\]/g, (m, id) => { const j = job(id); return j ? `<a class="jl" data-a="open" data-v="${esc(id)}">↗ ${esc(j.title)}</a>` : ''; });
  const lines = h.split('\n'); let out = '', ul = false;
  for (const l of lines) { const m = l.match(/^\s*[-•]\s+(.*)/); if (m) { if (!ul) { out += '<ul>'; ul = true; } out += `<li>${m[1]}</li>`; } else { if (ul) { out += '</ul>'; ul = false; } out += l.trim() ? `<div>${l}</div>` : '<div style="height:6px"></div>'; } }
  if (ul) out += '</ul>'; return out;
}
