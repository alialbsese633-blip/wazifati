/* =====================================================
   وظيفتي v2.0 - الواجهات ومنطق التطبيق
   ===================================================== */
const S = { view: 'home', prev: [], jobId: null, appId: null, legal: 'privacy', f: { q: '', loc: '', cat: '', type: '', gig: false, sort: 'new' }, empJob: 'all', chatOpen: false, busy: false, after: null, phone: '', otpSent: false };

/* ---------- أدوات ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const job = id => D.jobs.find(j => j.id === id);
const company = id => D.companies.find(c => c.id === id) || { id, name: '—', status: 'pending', rating: 0, ratingCount: 0 };
const activeJobs = () => D.jobs.filter(j => j.status === 'active');
const me = () => D.me || null;
const role = () => (D.me && D.me.role) || 'guest';
const fmtNum = n => Math.round(+n || 0).toLocaleString('en-US');
const CUR_SYM = { YER: ['ر.ي', 'YER'], USD: ['$', 'USD'], SAR: ['ر.س', 'SAR'] };
const fmtMoney = (n, cur) => fmtNum(n) + ' ' + (CUR_SYM[cur] || CUR_SYM.YER)[LANG === 'en' ? 1 : 0];
const sal = j => fmtNum(j.min) + '–' + fmtMoney(j.max, j.cur) + (j.gig ? L(' / يوم', ' / day') : L(' / شهر', ' / month'));
function ago(ts) { const d = Math.floor((Date.now() - ts) / 864e5); return d <= 0 ? L('اليوم', 'Today') : d === 1 ? L('أمس', 'Yesterday') : L(`قبل ${d} أيام`, `${d} days ago`); }
function fmtDate(ts) { try { return new Date(ts).toLocaleString(LANG === 'en' ? 'en-GB' : 'ar-YE', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch (e) { return new Date(ts).toLocaleString(); } }
function fmtTime(ts) { const d = new Date(ts), today = new Date().toDateString() === d.toDateString(); try { return d.toLocaleString(LANG === 'en' ? 'en-GB' : 'ar-YE', today ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }); } catch (e) { return ''; } }
const stars = (r, n) => `<span class="stars" title="${(+r).toFixed(1)}">${'★'.repeat(Math.round(r))}<i>${'★'.repeat(5 - Math.round(r))}</i></span>${n !== undefined ? ` <span class="mut">${(+r).toFixed(1)} (${n})</span>` : ''}`;
function toast(m) { document.querySelectorAll('.toast').forEach(t => t.remove()); const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }
function logo(cid) { const c = company(cid), i = Math.abs([...String(cid)].reduce((a, ch) => a + ch.charCodeAt(0), 0)); return `<div class="lg" style="background:${COLORS[i % COLORS.length]}">${esc((c.name || '?').trim()[0] || '?')}</div>`; }
const opts = (list, sel, ph) => (ph !== undefined ? `<option value="">${ph}</option>` : '') + list.map(x => `<option value="${esc(x.id)}" ${x.id === sel ? 'selected' : ''}>${esc(LANG === 'en' ? x.en : x.ar)}</option>`).join('');
const stc = id => (STATUSES.find(s => s.id === id) || {}).c || '';
const myApp = jid => D.apps.find(a => a.job === jid && me() && a.seeker === me().id);
const isOwnerOfApp = a => { const j = job(a.job); return !!(j && me() && company(j.company).owner === me().id); };
const myJobs = () => { const c = Store.myCompany(); return c ? D.jobs.filter(j => j.company === c.id) : []; };
const myJobApps = () => D.apps.filter(a => myJobs().some(j => j.id === a.job));
const threadApps = () => role() === 'seeker' ? D.apps.filter(a => a.seeker === me().id) : role() === 'employer' ? myJobApps() : [];
const activeIv = appId => D.interviews.filter(i => i.app === appId && i.status !== 'cancelled').sort((a, b) => b.created - a.created)[0];
function complete(p) { if (!p) return 0; const c = [p.name, p.phone || p.email, p.loc, p.title, p.edu, p.about && p.about.length >= 20, (p.skills || []).length >= 3, (p.experiences || []).length > 0, (p.langs || []).length > 0]; return Math.round(c.filter(Boolean).length / c.length * 100); }
const unread = () => D.notifs.filter(n => !n.read && me() && n.user === me().id).length;

/* ---------- التنقل ---------- */
const NAVS = {
  guest: [['home', 'الوظائف', 'Jobs', '🔎'], ['login', 'دخول', 'Sign in', '👤']],
  seeker: [['home', 'الوظائف', 'Jobs', '🔎'], ['saved', 'المحفوظة', 'Saved', '♡'], ['apps', 'طلباتي', 'Applications', '📨'], ['inbox', 'الرسائل', 'Messages', '💬'], ['profile', 'ملفي', 'Profile', '👤'], ['cv', 'قوالب السيرة', 'CV templates', '📄'], ['alerts', 'التنبيهات', 'Alerts', '🔔']],
  employer: [['dash', 'لوحتي', 'Dashboard', '📊'], ['post', 'نشر وظيفة', 'Post job', '➕'], ['ejobs', 'وظائفي', 'My jobs', '💼'], ['applicants', 'المتقدمون', 'Applicants', '👥'], ['inbox', 'الرسائل', 'Messages', '💬'], ['company', 'شركتي', 'Company', '🏢']],
  admin: [['overview', 'نظرة عامة', 'Overview', '📊'], ['review', 'المراجعة', 'Review', '🛡️'], ['companies', 'الشركات', 'Companies', '🏢'], ['reports', 'البلاغات', 'Reports', '⚠️']]
};
const HOME = { guest: 'home', seeker: 'home', employer: 'dash', admin: 'overview' };
const VIEWS = {
  home: vHome, job: vJob, saved: vSaved, apps: vApps, inbox: vInbox, thread: vThread, profile: vProfile, cv: vCV, alerts: vAlerts,
  dash: vEDash, post: vPost, ejobs: vEJobs, applicants: vEApps, company: vCompanyForm,
  overview: vAOver, review: vAReview, companies: vACompanies, reports: vAReports,
  settings: vSettings, legal: vLegal, login: vLogin, onboard: vOnboard, brand: vBrand
};
const NEEDS_LOGIN = ['saved', 'apps', 'inbox', 'thread', 'profile', 'cv', 'alerts', 'dash', 'post', 'ejobs', 'applicants', 'company', 'overview', 'review', 'companies', 'reports'];
const ROLE_VIEWS = { seeker: ['saved', 'apps', 'profile', 'cv', 'alerts'], employer: ['dash', 'post', 'ejobs', 'applicants', 'company'], admin: ['overview', 'review', 'companies', 'reports'] };
function go(view, params = {}, push = true) {
  if (push && S.view !== view) { S.prev.push({ view: S.view, jobId: S.jobId, appId: S.appId }); S.prev = S.prev.slice(-20); }
  Object.assign(S, params); S.view = view; render();
}
function back() { const p = S.prev.pop(); if (!p) return false; Object.assign(S, p); render(); return true; }
function requireLogin(after) {
  if (Store.isLoggedIn()) return true;
  S.after = after || { view: S.view, jobId: S.jobId }; go('login'); return false;
}

function renderShell() {
  const r = role(), items = NAVS[r] || NAVS.guest, un = unread();
  $('#roles').innerHTML = REAL ? '' : [['seeker', 'باحث', 'Seeker'], ['employer', 'صاحب عمل', 'Employer'], ['admin', 'الإدارة', 'Admin']].map(([k, a, e]) => `<button class="${r === k ? 'on' : ''}" data-a="demorole" data-v="${k}">${L(a, e)}</button>`).join('');
  $('#langBtn').textContent = LANG === 'en' ? 'ع' : 'EN';
  $('#bellN').innerHTML = un ? `<b>${un}</b>` : '';
  $('#bell').style.display = Store.isLoggedIn() ? '' : 'none';
  $('#acct').innerHTML = Store.isLoggedIn() ? '⚙︎' : L('دخول', 'Sign in');
  const badge = { review: D.jobs.filter(j => j.status === 'pending').length + D.companies.filter(c => c.status === 'pending').length, reports: D.reports.filter(x => x.status === 'open').length, applicants: myJobApps().filter(a => a.status === 'new').length };
  $('#nav').innerHTML = items.map(([k, a, e]) => `<button class="${S.view === k ? 'on' : ''}" data-a="nav" data-v="${k}">${L(a, e)}${badge[k] ? `<span class="n">${badge[k]}</span>` : ''}</button>`).join('');
  $('#bnav').innerHTML = items.slice(0, 5).map(([k, a, e, i]) => `<button class="${S.view === k ? 'on' : ''}" data-a="nav" data-v="${k}"><i>${i}</i>${L(a, e)}</button>`).join('');
  $('#fabT').textContent = L('سند', 'Sanad');
  $('#demoBar').style.display = REAL ? 'none' : '';
  $('#demoBar').textContent = L('النسخة التجريبية 2.0 · البيانات أمثلة للتجربة ومحفوظة على جهازك فقط', 'Demo 2.0 · sample data stored on this device only');
}
function render() {
  if (!D) return;
  const r = role();
  if (REAL && Store.isLoggedIn() && D.me && !D.me.role && S.view !== 'legal') S.view = 'onboard';
  if (NEEDS_LOGIN.includes(S.view) && !Store.isLoggedIn()) S.view = 'login';
  if (S.view === 'login' && Store.isLoggedIn()) S.view = HOME[r];
  for (const [rr, vs] of Object.entries(ROLE_VIEWS)) if (vs.includes(S.view) && r !== rr) S.view = HOME[r];
  renderShell();
  const f = VIEWS[S.view] || VIEWS[HOME[r]];
  $('#app').innerHTML = `<div class="fade">${f()}</div>`;
  if (S.view === 'home') updateRes();
  if (S.view === 'thread') { const m = $('#tmsgs'); if (m) m.scrollTop = m.scrollHeight; }
  $('#applybar') && document.body.classList.add('hasbar'); if (!$('#applybar')) document.body.classList.remove('hasbar');
  window.scrollTo({ top: 0 });
}

/* =====================================================
   الباحث عن عمل
   ===================================================== */
function vHome() {
  const a = activeJobs(), p = me();
  return `<div class="hero"><h1>${L('وظيفتك القادمة، بذكاء', 'Your next job, the smart way')}</h1><p>${L('وظائف موثّقة في اليمن، ومساعد ذكاء اصطناعي يبحث لك ويجهّز سيرتك ومقابلتك.', 'Verified jobs across Yemen, with an AI assistant that searches for you and prepares your CV and interview.')}</p>
  <div class="aiq"><span style="padding:8px 4px;color:#5B3DF5">✦</span><input id="askq" placeholder="${L('اسأل المساعد: أبغى وظيفة محاسب في عدن بالدولار', 'Ask: accountant jobs in Aden paid in USD')}"><button class="btn ai sm" data-a="askhero">${L('اسأل', 'Ask')}</button></div>
  <div class="filters">
   <input placeholder="${L('ابحث بالمسمى أو المهارة أو الشركة', 'Search title, skill or company')}" value="${esc(S.f.q)}" data-c="q">
   <select data-c="loc">${opts(LOCS, S.f.loc, L('كل المدن', 'All cities'))}</select>
   <select data-c="cat">${opts(CATS, S.f.cat, L('كل التخصصات', 'All categories'))}</select>
   <select data-c="type">${opts(TYPES, S.f.type, L('كل الأنواع', 'All types'))}</select>
  </div>
  <div class="toggles"><label><input type="checkbox" data-c="gig" ${S.f.gig ? 'checked' : ''}> ${L('أعمال مؤقتة بالأجر اليومي', 'Daily-paid gigs')}</label>
   <label>${L('الترتيب:', 'Sort:')} <select data-c="sort" style="padding:3px 8px;border-radius:8px;border:0;color:#1B1035"><option value="new" ${S.f.sort === 'new' ? 'selected' : ''}>${L('الأحدث', 'Newest')}</option><option value="match" ${S.f.sort === 'match' ? 'selected' : ''}>${L('الأنسب لي', 'Best match')}</option></select></label></div></div>
  <div class="stats">
   <div class="card stat"><b>${a.length}</b><span class="mut">${L('وظيفة متاحة', 'open jobs')}</span></div>
   <div class="card stat"><b>${D.companies.filter(c => c.status === 'verified').length}</b><span class="mut">${L('شركة موثّقة', 'verified companies')}</span></div>
   ${role() === 'seeker' ? `<div class="card stat" style="cursor:pointer" data-a="nav" data-v="profile"><b>${complete(p)}%</b><span class="mut">${L('اكتمال ملفك', 'profile complete')}</span></div>` : ''}
  </div><div id="res"></div>`;
}
function filtered() {
  const f = S.f, q = normS(f.q);
  const r = activeJobs().filter(j => (!q || [j.title, nm(CATS, j.cat), company(j.company).name, ...j.skills].some(x => normS(x).includes(q))) && (!f.loc || j.loc === f.loc) && (!f.cat || j.cat === f.cat) && (!f.type || j.type === f.type) && (!f.gig || j.gig));
  r.sort(f.sort === 'match' && me() ? (x, y) => matchScore(y, me()) - matchScore(x, me()) : (x, y) => (y.feat ? 1 : 0) - (x.feat ? 1 : 0) || y.created - x.created);
  return r;
}
function jobCard(j) {
  const c = company(j.company), st = companyStats(c), sv = D.saved.includes(j.id), ap = myApp(j.id), m = role() === 'seeker' ? matchScore(j, me()) : null;
  return `<div class="card job ${j.feat ? 'feat' : ''}" data-a="open" data-v="${esc(j.id)}">
  <div class="row" style="align-items:flex-start">${logo(j.company)}<div class="sp"><h3>${esc(j.title)}</h3><div class="mut">${esc(c.name)} ${c.status === 'verified' ? '<span class="chip">✓ ' + L('موثّقة', 'Verified') + '</span>' : ''} ${st.count ? '<span class="chip gold">★ ' + st.rating.toFixed(1) + '</span>' : ''}</div></div>
  <button class="heart ${sv ? 'on' : ''}" data-a="save" data-v="${esc(j.id)}" aria-label="save">${sv ? '♥' : '♡'}</button></div>
  <div class="meta"><span>📍 ${esc(nm(LOCS, j.loc))}</span><span>🕒 ${esc(nm(TYPES, j.type))}</span><span>💰 ${esc(sal(j))}</span></div>
  <div>${j.feat ? '<span class="chip gold">★ ' + L('مميزة', 'Featured') + '</span> ' : ''}${j.skills.slice(0, 3).map(s => `<span class="chip gray">${esc(s)}</span> `).join('')}${j.gig ? '<span class="chip blue">' + L('مؤقت', 'Gig') + '</span>' : ''}</div>
  <div class="row mut"><span>${ago(j.created)}</span>${st.resp !== null ? `<span>· ${L('نسبة الرد', 'Response')} ${st.resp}%</span>` : ''}<span class="sp"></span>${ap ? `<span class="chip">${L('قدّمت', 'Applied')}: ${nm(STATUSES, ap.status)}</span>` : m !== null ? `<span class="match">${L('مطابقة', 'Match')} ${m}%</span>` : ''}</div></div>`;
}
function updateRes() { const r = filtered(), el = $('#res'); if (!el) return; el.innerHTML = `<div class="mut" style="margin-bottom:8px">${r.length} ${L('نتيجة', 'results')}</div>` + (r.length ? `<div class="grid">${r.map(jobCard).join('')}</div>` : `<div class="empty card">${L('لا توجد نتائج. غيّر الفلاتر أو اسأل المساعد الذكي.', 'No results. Change filters or ask the assistant.')}</div>`); }
function vJob() {
  const j = job(S.jobId); if (!j) return vHome();
  const c = company(j.company), st = companyStats(c), ap = myApp(j.id), sv = D.saved.includes(j.id), seeker = role() === 'seeker', p = me();
  const m = seeker ? matchScore(j, p) : null, miss = seeker ? j.skills.filter(s => !(p.skills || []).map(normS).includes(normS(s))) : [];
  const applyBtn = ap ? `<div class="chip" style="text-align:center;padding:8px">${L('حالة طلبك', 'Your application')}: ${nm(STATUSES, ap.status)}</div><button class="btn ghost" data-a="thread" data-v="${esc(ap.id)}">💬 ${L('المحادثة', 'Chat')}</button>`
    : (role() === 'employer' || role() === 'admin') ? '' : `<button class="btn" data-a="apply" data-v="${esc(j.id)}">${L('قدّم الآن', 'Apply now')}</button>`;
  return `<button class="btn ghost sm" data-a="back">${L('→ رجوع', '← Back')}</button>
  <div class="det" style="margin-top:12px"><div class="card">
   <div class="row" style="align-items:flex-start">${logo(j.company)}<div class="sp"><h1 style="font-size:23px">${esc(j.title)}</h1>
    <div class="mut"><a href="#" data-a="company" data-v="${esc(c.id)}">${esc(c.name)}</a> ${c.status === 'verified' ? '<span class="chip">✓ ' + L('جهة موثّقة', 'Verified') + '</span>' : '<span class="chip red">' + L('غير موثّقة بعد', 'Not verified yet') + '</span>'}</div>
    <div class="row mut" style="margin-top:4px">${st.count ? stars(st.rating, st.count) : L('لا تقييمات بعد', 'No ratings yet')}${st.resp !== null ? ` · ${L('نسبة الرد', 'Response rate')} <b>${st.resp}%</b>` : ''}</div></div></div>
   <div class="meta" style="margin:12px 0"><span>📍 ${esc(nm(LOCS, j.loc))}</span><span>🕒 ${esc(nm(TYPES, j.type))}</span><span>💰 ${esc(sal(j))}</span><span>🎓 ${L('خبرة', 'Experience')} ${j.exp}</span><span>🗂 ${esc(nm(CATS, j.cat))}</span><span>${ago(j.created)}</span></div>
   <h3>${L('وصف الوظيفة', 'Description')}</h3><p>${esc(j.desc)}</p>
   <h3 style="margin-top:12px">${L('المتطلبات', 'Requirements')}</h3><ul>${j.reqs.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
   <h3 style="margin-top:12px">${L('المهارات', 'Skills')}</h3><div>${j.skills.map(s => `<span class="chip">${esc(s)}</span> `).join('')}</div>
   ${seeker ? `<div class="aibox"><div class="row"><span class="chip ai">✦ ${L('سند · مساعدك الذكي', 'Sanad · your AI')}</span><span class="sp"></span>
    <button class="btn ai sm" data-a="aijob" data-v="fit">${L('هل أناسبها؟', 'Do I fit?')}</button><button class="btn ai sm" data-a="aijob" data-v="interview">${L('جهّزني للمقابلة', 'Interview prep')}</button><button class="btn ai sm" data-a="aijob" data-v="cover">${L('رسالة تقديم', 'Cover letter')}</button></div>
    <div class="out" id="aiout" style="margin-top:10px"><span class="mut">${L('اختر ما تريد وسيحلل المساعد الوظيفة مقابل ملفك.', 'Pick an option and the assistant will analyse this job against your profile.')}</span></div></div>` : ''}
   <div class="card warn">⚠️ ${L('لا تدفع أي مبلغ مقابل التوظيف. إذا طلبت جهة رسوماً،', 'Never pay to get a job. If an employer asks for fees,')} <a href="#" data-a="report" data-v="${esc(j.id)}">${L('أبلغ عنها', 'report it')}</a>.</div>
  </div>
  <div><div class="card">
   ${m !== null ? `<div class="mut">${L('مدى مطابقتك للوظيفة', 'Your match')}</div><div class="match" style="font-size:32px">${m}%</div><div class="bar"><i style="width:${m}%"></i></div>
   ${miss.length ? `<p class="mut" style="margin-top:8px">${L('مهارات ناقصة في ملفك:', 'Missing skills:')} ${miss.map(esc).join('، ')}</p>` : `<p class="mut" style="margin-top:8px">${L('ملفك يغطي كل المهارات المطلوبة 👌', 'Your profile covers all required skills 👌')}</p>`}` : ''}
   <div style="margin-top:14px;display:grid;gap:8px">${applyBtn}
   <button class="btn ghost" data-a="save" data-v="${esc(j.id)}">${sv ? L('إزالة من المحفوظة', 'Remove from saved') : L('حفظ الوظيفة', 'Save job')}</button>
   <button class="btn ghost" data-a="share" data-v="${esc(j.id)}">${L('مشاركة الوظيفة', 'Share job')}</button></div>
  </div></div></div>
  ${!ap && role() !== 'employer' && role() !== 'admin' ? `<div id="applybar"><div><b>${esc(j.title)}</b><div class="mut">${esc(sal(j))}</div></div><button class="btn" data-a="apply" data-v="${esc(j.id)}">${L('قدّم بضغطة', 'One-tap apply')}</button></div>` : ''}`;
}
function vSaved() { const l = D.saved.map(job).filter(j => j && j.status === 'active'); return `<h2>${L('الوظائف المحفوظة', 'Saved jobs')}</h2>` + (l.length ? `<div class="grid">${l.map(jobCard).join('')}</div>` : `<div class="empty card">${L('لم تحفظ أي وظيفة بعد. اضغط ♡ على أي وظيفة.', 'No saved jobs yet. Tap ♡ on any job.')}</div>`); }
function ivCard(iv, owner) {
  if (!iv) return '';
  const head = `<div class="row"><span class="chip gold">📅 ${L('مقابلة', 'Interview')} · ${esc(nm(MODES, iv.mode))}</span>${iv.place ? `<span class="mut">📍 ${esc(iv.place)}</span>` : ''}</div>${iv.note ? `<div class="mut" style="margin-top:4px">${esc(iv.note)}</div>` : ''}`;
  if (iv.status === 'confirmed') return `<div class="ivcard ok">${head}<div style="margin-top:6px"><b>✓ ${L('الموعد المؤكد', 'Confirmed')}:</b> ${esc(fmtDate(iv.chosen))}</div></div>`;
  if (iv.status === 'reschedule') return `<div class="ivcard">${head}<div style="margin-top:6px">${owner ? L('طلب المتقدم موعداً آخر.', 'The applicant asked for another time.') + ` <button class="btn sm" data-a="ivmodal" data-v="${esc(iv.app)}">${L('اقترح مواعيد جديدة', 'Propose new times')}</button>` : L('طلبت موعداً آخر، بانتظار مواعيد جديدة من الشركة.', 'You asked for another time. Waiting for new slots.')}</div></div>`;
  return `<div class="ivcard">${head}<div style="margin-top:8px;display:grid;gap:6px">${owner ? `<div class="mut">${L('بانتظار اختيار المتقدم لأحد المواعيد:', 'Waiting for the applicant to pick:')}</div>` + iv.slots.map(s => `<div>• ${esc(fmtDate(s))}</div>`).join('')
    : `<div class="mut">${L('اختر الموعد المناسب لك:', 'Pick a time that works for you:')}</div>` + iv.slots.map(s => `<button class="btn ghost sm" data-a="ivpick" data-v="${esc(iv.id)}" data-t="${s}">✓ ${esc(fmtDate(s))}</button>`).join('') + `<button class="btn red sm" data-a="ivre" data-v="${esc(iv.id)}">${L('لا يناسبني، أطلب موعداً آخر', 'None work, ask for another time')}</button>`}</div></div>`;
}
function vApps() {
  const l = D.apps.filter(a => a.seeker === me().id).sort((a, b) => b.created - a.created);
  return `<h2>${L('طلباتي', 'My applications')}</h2>` + (l.length ? l.map(a => {
    const j = job(a.job) || { title: '—', company: '' }, c = company(j.company), i = ['new', 'reviewed', 'interview', 'accepted'].indexOf(a.status), rv = D.reviews.find(r => r.company === c.id && r.seeker === me().id);
    return `<div class="card" style="margin-bottom:10px"><div class="row" data-a="open" data-v="${esc(a.job)}" style="cursor:pointer">${logo(j.company)}<div class="sp"><h3>${esc(j.title)}</h3><div class="mut">${esc(c.name)} · ${ago(a.created)}</div></div><span class="chip ${stc(a.status)}">${nm(STATUSES, a.status)}</span></div>
    ${a.status === 'rejected' ? `<p class="mut" style="margin-top:8px">${L('لم يتم اختيارك هذه المرة. اسأل المساعد عن وظائف مشابهة.', 'Not selected this time. Ask the assistant for similar jobs.')}</p>` : `<div class="steps">${[0, 1, 2, 3].map(k => `<span class="${k <= i ? 'on' : ''}"></span>`).join('')}</div><div class="row mut" style="justify-content:space-between;margin-top:4px"><span>${L('جديد', 'New')}</span><span>${L('مراجعة', 'Review')}</span><span>${L('مقابلة', 'Interview')}</span><span>${L('قبول', 'Hired')}</span></div>`}
    ${ivCard(activeIv(a.id), false)}
    <div class="row" style="margin-top:10px"><button class="btn ghost sm" data-a="thread" data-v="${esc(a.id)}">💬 ${L('المحادثة', 'Chat')}</button><button class="btn ghost sm" data-a="rate" data-v="${esc(c.id)}">${rv ? '★ ' + L('عدّل تقييمك', 'Edit rating') : '☆ ' + L('قيّم الشركة', 'Rate company')}</button></div></div>`;
  }).join('') : `<div class="empty card">${L('لم تقدّم على أي وظيفة بعد.', 'You have not applied yet.')}</div>`);
}
function vInbox() {
  const l = threadApps().map(a => { const ms = D.msgs.filter(m => m.app === a.id); const last = ms[ms.length - 1]; return { a, last, t: last ? last.created : a.created }; }).sort((x, y) => y.t - x.t);
  return `<h2>${L('الرسائل', 'Messages')}</h2>` + (l.length ? l.map(({ a, last }) => { const j = job(a.job) || {}, iv = activeIv(a.id);
    const who = role() === 'seeker' ? company(j.company).name : a.snap.name;
    return `<div class="card row inbox" data-a="thread" data-v="${esc(a.id)}">${role() === 'seeker' ? logo(j.company) : `<div class="lg" style="background:#5B3DF5">${esc((a.snap.name || '?')[0])}</div>`}<div class="sp"><b>${esc(who)}</b> <span class="mut">· ${esc(j.title || '')}</span><div class="mut">${last ? esc((last.sender === me().id ? L('أنت: ', 'You: ') : '') + last.body.slice(0, 70)) : L('لا رسائل بعد، ابدأ المحادثة', 'No messages yet')}</div></div>
    ${iv && iv.status !== 'cancelled' ? '<span class="chip gold">📅</span>' : ''}<span class="mut">${last ? fmtTime(last.created) : ''}</span></div>`; }).join('') : `<div class="empty card">${L('لا توجد محادثات بعد. تبدأ المحادثة بعد التقديم على وظيفة.', 'No conversations yet. Chats start after an application.')}</div>`);
}
function vThread() {
  const a = D.apps.find(x => x.id === S.appId); if (!a) return vInbox();
  const j = job(a.job) || {}, c = company(j.company), owner = isOwnerOfApp(a), ms = D.msgs.filter(m => m.app === a.id).sort((x, y) => x.created - y.created);
  return `<div class="row"><button class="btn ghost sm" data-a="back">${L('→ رجوع', '← Back')}</button><div class="sp"><b>${esc(owner ? a.snap.name : c.name)}</b><div class="mut">${esc(j.title || '')} · <span class="chip ${stc(a.status)}">${nm(STATUSES, a.status)}</span></div></div>
  ${owner ? `<button class="btn ghost sm" data-a="viewcv" data-v="${esc(a.id)}">📄 ${L('السيرة', 'CV')}</button><button class="btn gold sm" data-a="ivmodal" data-v="${esc(a.id)}">📅 ${L('جدولة مقابلة', 'Schedule')}</button>` : ''}</div>
  ${owner ? `<div class="row" style="margin-top:8px"><span class="mut">${L('حالة الطلب:', 'Status:')}</span><select class="st" data-c="appstatus" data-id="${esc(a.id)}">${STATUSES.map(s => `<option value="${s.id}" ${s.id === a.status ? 'selected' : ''}>${LANG === 'en' ? s.en : s.ar}</option>`).join('')}</select></div>` : ''}
  ${ivCard(activeIv(a.id), owner)}
  <div class="card thread"><div class="tmsgs" id="tmsgs">${a.note ? `<div class="msg sys">${L('رسالة التقديم', 'Cover note')}: ${esc(a.note)}</div>` : ''}${ms.length ? ms.map(m => `<div class="msg ${m.sender === me().id ? 'u' : 'a'}">${esc(m.body)}<small>${fmtTime(m.created)}</small></div>`).join('') : `<div class="mut" style="text-align:center;padding:20px">${L('ابدأ المحادثة. لا تشارك رقمك أو أي مبالغ مالية قبل التأكد من الجهة.', 'Start the conversation. Don’t share money or personal numbers before verifying the employer.')}</div>`}</div>
  <form class="composer" id="tform" data-v="${esc(a.id)}"><input id="tin" placeholder="${L('اكتب رسالة…', 'Write a message…')}" autocomplete="off"><button class="btn sm" type="submit">${L('إرسال', 'Send')}</button></form></div>`;
}
function vProfile() {
  const p = me(), c = complete(p), tips = [];
  if ((p.skills || []).length < 3) tips.push(L('أضف 3 مهارات', 'Add 3 skills')); if (!p.about || p.about.length < 20) tips.push(L('اكتب نبذة', 'Write a summary')); if (!(p.experiences || []).length) tips.push(L('أضف خبرة', 'Add experience'));
  return `<div class="row"><h2 class="sp">${L('ملفي الشخصي', 'My profile')}</h2><button class="btn gold sm" data-a="nav" data-v="cv">📄 ${L('قوالب السيرة', 'CV templates')}</button></div>
  <div class="card upcv"><div class="row"><div class="sp"><b>✦ ${L('ارفع سيرتك الذاتية PDF', 'Upload your CV (PDF)')}</b><div class="mut">${L('يقرأها المساعد الذكي ويعبّئ ملفك تلقائياً، ثم تراجعه قبل الحفظ.', 'The AI reads it and fills your profile for you to review.')}${p.cvPath ? ' · <a href="#" data-a="mycv">' + L('سيرتي المرفوعة', 'My uploaded CV') + '</a>' : ''}</div></div>
   <label class="btn ai">${L('اختر ملف PDF', 'Choose PDF')}<input type="file" id="cvfile" accept="application/pdf,.pdf" hidden></label></div></div>
  <div class="card" style="margin-bottom:14px"><div class="row"><b>${L('اكتمال الملف', 'Profile completeness')} ${c}%</b><span class="sp"></span><span class="mut">${tips.length ? tips.join(' · ') : L('ملفك ممتاز ✓', 'Looking great ✓')}</span></div><div class="bar" style="margin-top:6px"><i style="width:${c}%"></i></div></div>
  <div class="card"><div class="two">
  <div class="field"><label>${L('الاسم الكامل', 'Full name')}</label><input id="p_name" value="${esc(p.name)}"></div>
  <div class="field"><label>${L('المسمى الوظيفي', 'Job title')}</label><input id="p_title" value="${esc(p.title)}"></div>
  <div class="field"><label>${L('رقم الجوال', 'Phone')}</label><input id="p_phone" inputmode="tel" value="${esc(p.phone)}" placeholder="+967 7xx xxx xxx"></div>
  <div class="field"><label>${L('البريد الإلكتروني', 'Email')}</label><input id="p_email" type="email" value="${esc(p.email || '')}"></div>
  <div class="field"><label>${L('المدينة', 'City')}</label><select id="p_loc">${opts(LOCS.filter(w => w.id !== 'remote'), p.loc, L('اختر', 'Select'))}</select></div>
  <div class="field"><label>${L('التخصص المفضل', 'Preferred category')}</label><select id="p_cat">${opts(CATS, p.cat, L('أي تخصص', 'Any'))}</select></div>
  <div class="field"><label>${L('سنوات الخبرة', 'Years of experience')}</label><input id="p_exp" type="number" min="0" value="${esc(p.exp)}"></div>
  <div class="field"><label>${L('المؤهل الدراسي', 'Education')}</label><input id="p_edu" value="${esc(p.edu)}"></div>
  <div class="field"><label>${L('المهارات (افصل بفاصلة)', 'Skills (comma separated)')}</label><input id="p_skills" value="${esc((p.skills || []).join('، '))}"></div>
  <div class="field"><label>${L('اللغات (افصل بفاصلة)', 'Languages (comma separated)')}</label><input id="p_langs" value="${esc((p.langs || []).join('، '))}"></div></div>
  <div class="field"><div class="row" style="margin-bottom:4px"><label class="sp" style="margin:0">${L('نبذة عنك', 'About you')}</label><button class="btn ai sm" data-a="aiabout">✦ ${L('حسّن بالذكاء الاصطناعي', 'Improve with AI')}</button></div><textarea id="p_about" rows="4">${esc(p.about)}</textarea></div>
  <h3 style="margin:8px 0">${L('الخبرات العملية', 'Work experience')}</h3><div id="exps">${(p.experiences || []).map(expRow).join('')}</div>
  <button class="btn ghost sm" data-a="addexp" style="margin-bottom:14px">+ ${L('إضافة خبرة', 'Add experience')}</button>
  <label class="row" style="margin-bottom:12px"><input type="checkbox" id="p_open" ${p.open !== false ? 'checked' : ''}> ${L('أبحث عن عمل الآن (استقبل إشعارات الوظائف المناسبة)', 'Open to work (get matching job notifications)')}</label>
  <button class="btn" data-a="saveprofile">${L('حفظ الملف', 'Save profile')}</button></div>`;
}
function expRow(x, i) { return `<div class="card" style="margin-bottom:8px;box-shadow:none;background:#faf9fd" data-exp="${i}"><div class="two"><div class="field"><label>${L('المسمى', 'Title')}</label><input class="x_title" value="${esc(x.title)}"></div><div class="field"><label>${L('الجهة', 'Company')}</label><input class="x_company" value="${esc(x.company)}"></div><div class="field"><label>${L('الفترة', 'Period')}</label><input class="x_period" value="${esc(x.period)}" placeholder="2023 - ${L('الآن', 'now')}"></div><div class="field"><label>&nbsp;</label><button class="btn red sm" data-a="delexp" data-v="${i}">${L('حذف', 'Remove')}</button></div></div><div class="field"><label>${L('ما أنجزته', 'What you did')}</label><textarea class="x_details" rows="2">${esc(x.details)}</textarea></div></div>`; }
function readProfile() {
  if (!$('#p_name')) return; const p = me(), g = id => $('#' + id) ? $('#' + id).value.trim() : '';
  const split = s => s.split(/[,،]/).map(x => x.trim()).filter(Boolean);
  Object.assign(p, { name: g('p_name'), title: g('p_title'), phone: g('p_phone'), email: g('p_email'), loc: g('p_loc'), cat: g('p_cat'), exp: Math.max(0, +g('p_exp') || 0), edu: g('p_edu'), about: g('p_about'), skills: split(g('p_skills')), langs: split(g('p_langs')), open: $('#p_open').checked,
    experiences: [...document.querySelectorAll('[data-exp]')].map(r => ({ title: r.querySelector('.x_title').value.trim(), company: r.querySelector('.x_company').value.trim(), period: r.querySelector('.x_period').value.trim(), details: r.querySelector('.x_details').value.trim() })).filter(x => x.title || x.company) });
}
function vCV() {
  const p = me();
  return `<div class="row"><h2 class="sp">${L('قوالب السيرة الذاتية الحصرية', 'Exclusive CV templates')}</h2><button class="btn ghost sm" data-a="nav" data-v="profile">${L('تعديل البيانات', 'Edit data')}</button><button class="btn gold sm" data-a="printcv">⬇ ${L('طباعة / حفظ PDF', 'Print / save PDF')}</button></div>
  <p class="mut" style="margin-bottom:12px">${L('4 قوالب صُممت خصيصاً لوظيفتي، تُعبّأ ببياناتك تلقائياً، وهي ما يراه صاحب العمل عند تقديمك.', '4 templates designed for Wazifati, filled with your data automatically. Employers see your CV in this template.')}</p>
  <div class="tpls">${Object.entries(CV_TPLS).map(([k, t]) => `<div class="tpl ${p.cvTpl === k ? 'on' : ''}" data-a="pickcv" data-v="${k}"><div class="thumb"><div>${t.render(p)}</div></div><div class="nm"><span>${t.name}</span>${p.cvTpl === k ? '<span class="chip gold">' + L('مختار', 'Selected') + '</span>' : ''}</div><div class="mut" style="padding:0 10px 10px">${t.desc}</div></div>`).join('')}</div>
  <h3 style="margin:20px 0 10px">${L('المعاينة الكاملة', 'Full preview')}</h3><div class="card tw" style="padding:0;overflow:auto"><div style="width:794px;margin:auto">${(CV_TPLS[p.cvTpl] || CV_TPLS.khanjar).render(p)}</div></div>`;
}
function vAlerts() {
  return `<h2>${L('تنبيهات الوظائف', 'Job alerts')}</h2><div class="card" style="margin-bottom:14px"><p class="mut" style="margin-bottom:10px">${L('إضافة لإشعارات الوظائف المطابقة لملفك، اختر تخصصاً ومدينة وسنرسل لك إشعاراً فور نشر وظيفة تطابقها.', 'Besides profile-based notifications, pick a category and city and we will notify you when a matching job is posted.')}</p>
  <div class="two"><div class="field"><label>${L('التخصص', 'Category')}</label><select id="al_cat">${opts(CATS, '', L('أي تخصص', 'Any'))}</select></div><div class="field"><label>${L('المدينة', 'City')}</label><select id="al_loc">${opts(LOCS, '', L('أي مدينة', 'Any'))}</select></div></div>
  <button class="btn" data-a="addalert">${L('إضافة تنبيه', 'Add alert')}</button></div>` + (D.alerts.length ? D.alerts.map(a => `<div class="card row" style="margin-bottom:8px"><span class="sp">🔔 ${esc(a.cat ? nm(CATS, a.cat) : L('أي تخصص', 'Any category'))} · ${esc(a.loc ? nm(LOCS, a.loc) : L('أي مدينة', 'Any city'))}</span><button class="btn red sm" data-a="delalert" data-v="${esc(a.id)}">${L('حذف', 'Delete')}</button></div>`).join('') : `<div class="empty card">${L('لا توجد تنبيهات إضافية.', 'No extra alerts.')}</div>`);
}

/* =====================================================
   صاحب العمل
   ===================================================== */
function companyBanner() {
  const c = Store.myCompany();
  if (!c) return `<div class="card warn" style="margin-bottom:12px">🏢 ${L('سجّل شركتك برقم السجل التجاري أولاً لتنشر الوظائف.', 'Register your company with its commercial registration first.')} <button class="btn sm" data-a="nav" data-v="company">${L('تسجيل الشركة', 'Register company')}</button></div>`;
  if (c.status === 'pending') return `<div class="card note" style="margin-bottom:12px">⏳ ${L('شركتك قيد التحقق من السجل التجاري. وظائفك تُراجع وتُنشر عادياً، وتظهر شارة «موثّقة» بعد التحقق.', 'Your company is being verified. Jobs are still reviewed and published; the “Verified” badge appears after verification.')}</div>`;
  if (c.status === 'rejected') return `<div class="card warn" style="margin-bottom:12px">✕ ${L('لم يتم توثيق الشركة', 'Verification declined')}${c.rejectReason ? ': ' + esc(c.rejectReason) : ''}. <a href="#" data-a="nav" data-v="company">${L('حدّث البيانات', 'Update details')}</a></div>`;
  return '';
}
function funnel(apps) { return STATUSES.map(s => { const n = apps.filter(a => a.status === s.id).length; return `<div class="row" style="margin:6px 0"><span style="width:110px">${LANG === 'en' ? s.en : s.ar}</span><div class="bar sp"><i style="width:${apps.length ? n / apps.length * 100 : 0}%"></i></div><b>${n}</b></div>`; }).join(''); }
function vEDash() {
  const c = Store.myCompany(), jobs = myJobs(), apps = myJobApps(), st = companyStats(c);
  const ivs = D.interviews.filter(i => apps.some(a => a.id === i.app) && i.status !== 'cancelled').sort((a, b) => (a.chosen || a.slots[0]) - (b.chosen || b.slots[0]));
  return `${companyBanner()}<div class="hero"><h1>${L('أهلاً', 'Welcome')}، ${esc(c ? c.name : me().name)}</h1><p>${L('انشر وظيفتك في دقيقة: اكتب المسمى فقط والمساعد الذكي يكمل الباقي.', 'Post a job in a minute: type the title and the AI fills in the rest.')}</p><button class="btn gold" data-a="nav" data-v="post">✦ ${L('نشر وظيفة بالذكاء الاصطناعي', 'Post a job with AI')}</button></div>
  <div class="stats"><div class="card stat"><b>${jobs.filter(j => j.status === 'active').length}</b><span class="mut">${L('وظائف منشورة', 'live jobs')}</span></div><div class="card stat"><b>${apps.length}</b><span class="mut">${L('متقدمون', 'applicants')}</span></div><div class="card stat"><b>${apps.filter(a => a.status === 'new').length}</b><span class="mut">${L('طلبات جديدة', 'new')}</span></div>
   <div class="card stat"><b>${st.resp ?? '—'}${st.resp !== null ? '%' : ''}</b><span class="mut">${L('نسبة الرد', 'response rate')}</span></div><div class="card stat"><b>${st.count ? st.rating.toFixed(1) : '—'}</b><span class="mut">${L('تقييم الشركة', 'rating')} ${st.count ? '(' + st.count + ')' : ''}</span></div></div>
  <div class="two"><div class="card"><h3 style="margin-bottom:8px">${L('مسار التوظيف', 'Hiring funnel')}</h3>${funnel(apps)}</div>
  <div class="card"><h3 style="margin-bottom:8px">📅 ${L('المقابلات', 'Interviews')}</h3>${ivs.length ? ivs.map(i => { const a = D.apps.find(x => x.id === i.app); return `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line);cursor:pointer" data-a="thread" data-v="${esc(a.id)}"><b class="sp">${esc(a.snap.name)}</b><span class="chip ${i.status === 'confirmed' ? '' : 'gold'}">${i.status === 'confirmed' ? esc(fmtDate(i.chosen)) : i.status === 'reschedule' ? L('يطلب موعداً آخر', 'Wants another time') : L('بانتظار التأكيد', 'Awaiting reply')}</span></div>`; }).join('') : `<p class="mut">${L('لا مقابلات بعد. افتح أي متقدم واضغط «جدولة مقابلة».', 'No interviews yet. Open an applicant and tap “Schedule”.')}</p>`}</div></div>`;
}
function vPost() {
  if (!Store.myCompany()) return companyBanner();
  return `${companyBanner()}<h2>${L('نشر وظيفة جديدة', 'Post a new job')}</h2>
  <div class="card" style="margin-bottom:14px"><h3 style="margin-bottom:8px">${L('ابدأ من قالب جاهز', 'Start from a template')}</h3><div class="row">${JOB_TEMPLATES.map((t, i) => `<button class="btn ghost sm" data-a="usetpl" data-v="${i}">${t.icon} ${esc(t.title)}</button>`).join('')}</div></div>
  <div class="card"><p class="mut" style="margin-bottom:12px">${L('تُراجَع الوظيفة من الإدارة قبل ظهورها، لحماية الباحثين من الإعلانات المضللة.', 'Jobs are reviewed before going live to protect seekers from misleading ads.')}</p>
  <div class="field"><label>${L('المسمى الوظيفي', 'Job title')}</label><div class="row"><input id="n_title" class="sp inp" placeholder="${L('مثال: محاسب، موظف استقبال، فني تكييف', 'e.g. Accountant, Receptionist')}"><button class="btn ai" data-a="aijobad">✦ ${L('اكتب الإعلان بالذكاء', 'Write with AI')}</button></div></div>
  <div class="two"><div class="field"><label>${L('التخصص', 'Category')}</label><select id="n_cat">${opts(CATS)}</select></div><div class="field"><label>${L('المدينة', 'City')}</label><select id="n_loc">${opts(LOCS, (Store.myCompany() || {}).loc)}</select></div>
  <div class="field"><label>${L('نوع الدوام', 'Type')}</label><select id="n_type">${opts(TYPES)}</select></div><div class="field"><label>${L('سنوات الخبرة', 'Experience (years)')}</label><input id="n_exp" type="number" min="0" value="0"></div>
  <div class="field"><label>${L('الراتب من', 'Salary from')}</label><input id="n_min" type="number" min="0"></div><div class="field"><label>${L('الراتب إلى', 'Salary to')}</label><input id="n_max" type="number" min="0"></div>
  <div class="field"><label>${L('العملة', 'Currency')}</label><select id="n_cur">${opts(CURS, 'YER')}</select></div><div class="field"><label>${L('المهارات (بفاصلة)', 'Skills (comma separated)')}</label><input id="n_skills"></div></div>
  <div class="field"><label>${L('وصف الوظيفة', 'Description')}</label><textarea id="n_desc" rows="3"></textarea></div>
  <div class="field"><label>${L('المتطلبات (كل سطر متطلب)', 'Requirements (one per line)')}</label><textarea id="n_reqs" rows="3"></textarea></div>
  <label class="row" style="margin-bottom:12px"><input type="checkbox" id="n_gig"> ${L('عمل مؤقت بأجر يومي', 'Daily-paid gig')}</label>
  <button class="btn" data-a="postjob">${L('إرسال للمراجعة', 'Submit for review')}</button></div>`;
}
function fillJobForm(t) {
  const s = (id, v) => { const el = $('#' + id); if (el && v !== undefined && v !== null) el.value = v; };
  if (t.title && !$('#n_title').value) s('n_title', t.title);
  if (CATS.some(c => c.id === t.cat)) s('n_cat', t.cat); if (TYPES.some(c => c.id === t.type)) s('n_type', t.type); if (CURS.some(c => c.id === t.cur)) s('n_cur', t.cur);
  s('n_exp', t.exp); s('n_min', t.min); s('n_max', t.max); s('n_skills', (t.skills || []).join('، ')); s('n_desc', t.desc); s('n_reqs', (t.reqs || []).join('\n'));
}
const JS = { active: ['منشورة', 'Live', ''], pending: ['قيد المراجعة', 'In review', 'gold'], closed: ['مغلقة', 'Closed', 'gray'], rejected: ['مرفوضة', 'Rejected', 'red'], paused: ['موقوفة', 'Paused', 'red'], expired: ['منتهية', 'Expired', 'gray'] };
function vEJobs() {
  const l = myJobs();
  return `${companyBanner()}<h2>${L('وظائفي', 'My jobs')}</h2>` + (l.length ? l.map(j => { const n = D.apps.filter(a => a.job === j.id).length, s = JS[j.status] || JS.pending;
    return `<div class="card row" style="margin-bottom:8px"><div class="sp"><h3>${esc(j.title)} ${j.feat ? '<span class="chip gold">★</span>' : ''}</h3><div class="mut">${esc(nm(LOCS, j.loc))} · ${esc(sal(j))} · ${j.views} ${L('مشاهدة', 'views')} · ${n} ${L('متقدم', 'applicants')}</div></div>
    <span class="chip ${s[2]}">${L(s[0], s[1])}</span><button class="btn ghost sm" data-a="empfilter" data-v="${esc(j.id)}">${L('المتقدمون', 'Applicants')}</button>
    ${j.status === 'active' ? `<button class="btn red sm" data-a="closejob" data-v="${esc(j.id)}">${L('إغلاق', 'Close')}</button>` : j.status === 'closed' ? `<button class="btn sm" data-a="openjob" data-v="${esc(j.id)}">${L('إعادة فتح', 'Reopen')}</button>` : ''}</div>`; }).join('') : `<div class="empty card">${L('لم تنشر وظائف بعد.', 'No jobs yet.')}</div>`);
}
function vEApps() {
  let l = myJobApps(); if (S.empJob !== 'all') l = l.filter(a => a.job === S.empJob);
  l = [...l].sort((a, b) => matchScore(job(b.job), b.snap) - matchScore(job(a.job), a.snap));
  return `<div class="row"><h2 class="sp">${L('المتقدمون', 'Applicants')}</h2><select class="st" data-c="empjob"><option value="all">${L('كل الوظائف', 'All jobs')}</option>${myJobs().map(j => `<option value="${esc(j.id)}" ${S.empJob === j.id ? 'selected' : ''}>${esc(j.title)}</option>`).join('')}</select>
  <button class="btn ai sm" data-a="aishort">✦ ${L('رشّح لي الأفضل', 'Shortlist with AI')}</button></div>
  <div class="aibox" id="shortbox" style="display:none;margin-bottom:12px"><div class="out" id="aiout"></div></div>
  <div class="card tw"><table><tr><th>${L('المتقدم', 'Applicant')}</th><th>${L('الوظيفة', 'Job')}</th><th>${L('الخبرة', 'Exp.')}</th><th>${L('المطابقة', 'Match')}</th><th>${L('الحالة', 'Status')}</th><th></th></tr>
  ${l.length ? l.map(a => { const j = job(a.job); return `<tr><td><b>${esc(a.snap.name)}</b><div class="mut">${esc(a.snap.title || '')} · ${esc(nm(LOCS, a.snap.loc))}</div></td><td>${esc(j.title)}</td><td>${a.snap.exp}</td><td class="match">${matchScore(j, a.snap)}%</td>
  <td><select class="st" data-c="appstatus" data-id="${esc(a.id)}">${STATUSES.map(s => `<option value="${s.id}" ${s.id === a.status ? 'selected' : ''}>${LANG === 'en' ? s.en : s.ar}</option>`).join('')}</select></td>
  <td style="white-space:nowrap"><button class="btn ghost sm" data-a="viewcv" data-v="${esc(a.id)}" title="CV">📄</button> <button class="btn ghost sm" data-a="thread" data-v="${esc(a.id)}" title="chat">💬</button> <button class="btn ghost sm" data-a="ivmodal" data-v="${esc(a.id)}" title="interview">📅</button></td></tr>`; }).join('') : `<tr><td colspan="6" class="empty">${L('لا يوجد متقدمون.', 'No applicants.')}</td></tr>`}</table></div>`;
}
function vCompanyForm() {
  const c = Store.myCompany() || {}, st = { pending: ['قيد التحقق', 'Pending verification', 'gold'], verified: ['موثّقة ✓', 'Verified ✓', ''], rejected: ['مرفوضة', 'Declined', 'red'] }[c.status];
  return `<div class="row"><h2 class="sp">${L('بيانات الشركة', 'Company details')}</h2>${st ? `<span class="chip ${st[2]}">${L(st[0], st[1])}</span>` : ''}</div>
  <div class="card"><p class="mut" style="margin-bottom:12px">${L('نطلب السجل التجاري لحماية الباحثين من الإعلانات الوهمية. صورة السجل لا يراها إلا فريق الإدارة. تغيير رقم السجل يعيد الشركة إلى التحقق.', 'We ask for the commercial registration to protect seekers from fake ads. Only admins can see the document. Changing the number triggers re-verification.')}</p>
  <div class="two"><div class="field"><label>${L('اسم الشركة', 'Company name')}</label><input id="c_name" value="${esc(c.name || '')}"></div><div class="field"><label>${L('رقم السجل التجاري', 'Commercial registration no.')}</label><input id="c_cr" value="${esc(c.cr || '')}" inputmode="numeric"></div>
  <div class="field"><label>${L('المدينة', 'City')}</label><select id="c_loc">${opts(LOCS.filter(x => x.id !== 'remote'), c.loc, L('اختر', 'Select'))}</select></div><div class="field"><label>${L('هاتف التواصل', 'Contact phone')}</label><input id="c_phone" value="${esc(c.phone || '')}" inputmode="tel"></div></div>
  <div class="field"><label>${L('نبذة عن الشركة', 'About the company')}</label><textarea id="c_about" rows="3">${esc(c.about || '')}</textarea></div>
  <div class="field"><label>${L('صورة السجل التجاري (صورة أو PDF)', 'Registration document (image or PDF)')}</label><input type="file" id="c_doc" accept="image/*,application/pdf">${c.crDoc ? `<div class="mut">${L('مرفوع مسبقاً ✓', 'Already uploaded ✓')}</div>` : ''}</div>
  <button class="btn" data-a="savecompany">${c.id ? L('حفظ التعديلات', 'Save changes') : L('إرسال للتحقق', 'Submit for verification')}</button></div>`;
}

/* =====================================================
   الإدارة
   ===================================================== */
function vAOver() {
  const live = activeJobs(), mx = Math.max(1, ...CATS.map(c => live.filter(j => j.cat === c.id).length));
  return `<h2>${L('نظرة عامة على المنصة', 'Platform overview')}</h2><div class="stats"><div class="card stat"><b>${D.jobs.length}</b><span class="mut">${L('إجمالي الوظائف', 'total jobs')}</span></div><div class="card stat"><b>${D.jobs.filter(j => j.status === 'pending').length}</b><span class="mut">${L('بانتظار المراجعة', 'pending')}</span></div><div class="card stat"><b>${D.companies.length}</b><span class="mut">${L('شركات', 'companies')}</span></div><div class="card stat"><b>${D.companies.filter(c => c.status === 'pending').length}</b><span class="mut">${L('شركات بانتظار التوثيق', 'awaiting verification')}</span></div><div class="card stat"><b>${D.reports.filter(r => r.status === 'open').length}</b><span class="mut">${L('بلاغات مفتوحة', 'open reports')}</span></div></div>
  <div class="card"><h3 style="margin-bottom:8px">${L('الوظائف المنشورة حسب التخصص', 'Live jobs by category')}</h3>${CATS.map(c => { const n = live.filter(j => j.cat === c.id).length; return `<div class="row" style="margin:5px 0"><span style="width:150px">${esc(LANG === 'en' ? c.en : c.ar)}</span><div class="bar sp"><i style="width:${n / mx * 100}%"></i></div><b>${n}</b></div>`; }).join('')}</div>`;
}
function riskChip(j) { const r = localFraud(j); return `<span class="chip ${r.risk >= 50 ? 'red' : r.risk >= 20 ? 'gold' : ''}">${L('خطر', 'Risk')} ${r.risk}%</span>`; }
function vAReview() {
  const p = D.jobs.filter(j => j.status === 'pending'), a = activeJobs();
  return `<h2>${L('وظائف بانتظار المراجعة', 'Jobs awaiting review')}</h2>` + (p.length ? p.map(j => `<div class="card" style="margin-bottom:10px"><div class="row"><div class="sp"><h3>${esc(j.title)}</h3><div class="mut">${esc(company(j.company).name)} ${company(j.company).status === 'verified' ? '✓' : '(' + L('غير موثّقة', 'unverified') + ')'} · ${esc(nm(LOCS, j.loc))} · ${esc(sal(j))}</div></div>${riskChip(j)}
  <button class="btn ai sm" data-a="aifraud" data-v="${esc(j.id)}">✦ ${L('فحص ذكي', 'AI check')}</button><button class="btn sm" data-a="approve" data-v="${esc(j.id)}">${L('نشر', 'Publish')}</button><button class="btn red sm" data-a="reject" data-v="${esc(j.id)}">${L('رفض', 'Reject')}</button></div><p style="margin-top:8px">${esc(j.desc)}</p><div class="aibox" id="fr${esc(j.id)}" style="display:none"></div></div>`).join('') : `<div class="empty card">${L('لا توجد وظائف معلقة 🎉', 'Nothing pending 🎉')}</div>`) +
  `<h2 style="margin-top:20px">${L('الوظائف المنشورة', 'Live jobs')}</h2><div class="card tw"><table><tr><th>${L('الوظيفة', 'Job')}</th><th>${L('الشركة', 'Company')}</th><th>${L('المدينة', 'City')}</th><th></th></tr>${a.map(j => `<tr><td>${esc(j.title)}</td><td>${esc(company(j.company).name)}</td><td>${esc(nm(LOCS, j.loc))}</td><td style="white-space:nowrap"><button class="btn ghost sm" data-a="feat" data-v="${esc(j.id)}">${j.feat ? L('إلغاء التمييز', 'Unfeature') : '★ ' + L('تمييز', 'Feature')}</button> <button class="btn red sm" data-a="pausejob" data-v="${esc(j.id)}">${L('إيقاف', 'Pause')}</button></td></tr>`).join('')}</table></div>`;
}
function vACompanies() {
  const order = { pending: 0, rejected: 1, verified: 2 }, l = [...D.companies].sort((a, b) => order[a.status] - order[b.status]);
  return `<h2>${L('الشركات والتوثيق', 'Companies & verification')}</h2><div class="card tw"><table><tr><th>${L('الشركة', 'Company')}</th><th>${L('السجل التجاري', 'Reg. no.')}</th><th>${L('المستند', 'Document')}</th><th>${L('التقييم / الرد', 'Rating / response')}</th><th>${L('الحالة', 'Status')}</th></tr>${l.map(c => { const st = companyStats(c);
    return `<tr><td><b>${esc(c.name)}</b><div class="mut">${esc(nm(LOCS, c.loc))} · ${esc(c.about || '')}</div></td><td>${esc(c.cr || '—')}</td><td>${c.crDoc ? `<button class="btn ghost sm" data-a="crdoc" data-v="${esc(c.id)}">${L('عرض', 'View')}</button>` : `<span class="mut">${L('لا يوجد', 'None')}</span>`}</td><td>${st.count ? '★ ' + st.rating.toFixed(1) : '—'} / ${st.resp ?? '—'}${st.resp !== null ? '%' : ''}</td>
    <td style="white-space:nowrap">${c.status === 'verified' ? `<span class="chip">✓</span> <button class="btn ghost sm" data-a="vcomp" data-v="${esc(c.id)}" data-s="pending">${L('إلغاء', 'Revoke')}</button>` : `<button class="btn gold sm" data-a="vcomp" data-v="${esc(c.id)}" data-s="verified">${L('توثيق', 'Verify')}</button> ${c.status === 'pending' ? `<button class="btn red sm" data-a="vcomp" data-v="${esc(c.id)}" data-s="rejected">${L('رفض', 'Decline')}</button>` : `<span class="chip red">${L('مرفوضة', 'Declined')}</span>`}`}</td></tr>`; }).join('')}</table></div>`;
}
function vAReports() { return `<h2>${L('البلاغات', 'Reports')}</h2>` + (D.reports.length ? D.reports.map(r => { const j = job(r.job); return `<div class="card row" style="margin-bottom:8px"><div class="sp"><h3>${esc(j ? j.title : '—')}</h3><div class="mut">${j ? esc(company(j.company).name) : ''} · ${L('السبب', 'Reason')}: ${esc(r.reason)}</div></div>${r.status === 'open' ? `<button class="btn red sm" data-a="pausejob" data-v="${esc(r.job)}" data-r="${esc(r.id)}">${L('إيقاف الوظيفة', 'Pause job')}</button><button class="btn ghost sm" data-a="dismiss" data-v="${esc(r.id)}">${L('تجاهل', 'Dismiss')}</button>` : `<span class="chip gray">${L('تمت المعالجة', 'Handled')}</span>`}</div>`; }).join('') : `<div class="empty card">${L('لا توجد بلاغات.', 'No reports.')}</div>`); }

/* =====================================================
   الحساب، الدخول، السياسات، الهوية
   ===================================================== */
function vLogin() {
  return `<div class="auth card"><img src="assets/brand/logo-stacked.svg" alt="" style="height:130px"><h2 style="margin-top:8px">${L('أهلاً بك في وظيفتي', 'Welcome to Wazifati')}</h2><p class="mut">${L('سجّل الدخول لتقدّم على الوظائف أو تنشرها.', 'Sign in to apply for or post jobs.')}</p>
  ${CFG.googleLogin !== false ? `<button class="btn google" data-a="google"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>${L('الدخول بحساب Google', 'Continue with Google')}</button>` : ''}
  ${CFG.phoneLogin ? `<div class="or">${L('أو برقم الجوال', 'or with your phone')}</div>
   ${S.otpSent ? `<div class="field"><label>${L('رمز التحقق المرسل إلى', 'Code sent to')} ${esc(S.phone)}</label><input id="otp" inputmode="numeric" maxlength="6" placeholder="123456"></div><button class="btn" data-a="otpverify">${L('تأكيد', 'Verify')}</button> <button class="btn ghost sm" data-a="otpreset">${L('تغيير الرقم', 'Change number')}</button>`
   : `<div class="field"><input id="phone" inputmode="tel" placeholder="+967 7xx xxx xxx" value="${esc(S.phone)}"></div><button class="btn ghost" data-a="otpsend">${L('أرسل رمز التحقق', 'Send code')}</button>`}` : ''}
  <p class="mut" style="margin-top:14px;font-size:12px">${L('بالمتابعة فإنك توافق على', 'By continuing you agree to the')} <a href="#" data-a="legal" data-v="terms">${L('شروط الاستخدام', 'Terms')}</a> ${L('و', 'and')} <a href="#" data-a="legal" data-v="privacy">${L('سياسة الخصوصية', 'Privacy Policy')}</a>.</p></div>`;
}
function vOnboard() {
  return `<div class="auth card" style="max-width:640px"><h2>${L('كيف تريد استخدام وظيفتي؟', 'How will you use Wazifati?')}</h2><p class="mut">${L('اختر نوع حسابك. يمكنك التواصل معنا لتغييره لاحقاً.', 'Choose your account type.')}</p>
  <div class="two" style="margin-top:14px"><button class="rolecard" data-a="setrole" data-v="seeker"><i>🔎</i><b>${L('أبحث عن عمل', 'I’m looking for a job')}</b><span>${L('أنشئ ملفك وارفع سيرتك وقدّم بضغطة، وتصلك إشعارات الوظائف المناسبة.', 'Build your profile, upload your CV, apply in one tap and get matching job alerts.')}</span></button>
  <button class="rolecard" data-a="setrole" data-v="employer"><i>🏢</i><b>${L('أنا صاحب عمل', 'I’m hiring')}</b><span>${L('سجّل شركتك بالسجل التجاري، وانشر وظائفك، وأدر المتقدمين والمقابلات.', 'Register your company, post jobs, and manage applicants and interviews.')}</span></button></div></div>`;
}
function vSettings() {
  const p = me();
  return `<h2>${L('حسابي', 'Account')}</h2>
  ${p ? `<div class="card row" style="margin-bottom:12px"><div class="lg" style="background:#5B3DF5">${esc((p.name || p.email || '?')[0])}</div><div class="sp"><b>${esc(p.name || '—')}</b><div class="mut">${esc(p.email || p.phone || '')} · ${({ seeker: L('باحث عن عمل', 'Job seeker'), employer: L('صاحب عمل', 'Employer'), admin: L('مشرف', 'Admin') })[p.role] || ''}</div></div></div>` : ''}
  <div class="card list">
   <button data-a="lang">🌐 ${L('اللغة', 'Language')}<span>${LANG === 'en' ? 'English' : 'العربية'}</span></button>
   ${Native.isApp ? `<button data-a="enablepush">🔔 ${L('تفعيل إشعارات الجوال', 'Enable phone notifications')}<span>${CFG.pushEnabled ? '' : L('غير مفعّلة بعد في الإعداد', 'not configured yet')}</span></button>` : ''}
   <button data-a="legal" data-v="privacy">🔒 ${L('سياسة الخصوصية', 'Privacy Policy')}<span>›</span></button>
   <button data-a="legal" data-v="terms">📜 ${L('شروط الاستخدام', 'Terms of Use')}<span>›</span></button>
   <button data-a="nav" data-v="brand">🎨 ${L('الهوية البصرية', 'Brand')}<span>›</span></button>
   ${REAL ? `<button data-a="signout">↩ ${L('تسجيل الخروج', 'Sign out')}<span></span></button>` : `<button data-a="reset">↺ ${L('إعادة البيانات التجريبية', 'Reset demo data')}<span></span></button>`}
   ${Store.isLoggedIn() ? `<button data-a="delacct" class="danger">🗑 ${L('حذف حسابي نهائياً', 'Delete my account')}<span></span></button>` : ''}
  </div><p class="mut" style="text-align:center;margin-top:12px">${L('وظيفتي', 'Wazifati')} v2.0 · ${REAL ? L('متصل', 'Live') : L('وضع تجريبي', 'Demo mode')}</p>`;
}
function vLegal() { return `<div class="row" style="margin-bottom:10px"><button class="btn ghost sm" data-a="back">${L('→ رجوع', '← Back')}</button><span class="sp"></span><button class="btn ${S.legal === 'privacy' ? '' : 'ghost'} sm" data-a="legal" data-v="privacy">${L('الخصوصية', 'Privacy')}</button><button class="btn ${S.legal === 'terms' ? '' : 'ghost'} sm" data-a="legal" data-v="terms">${L('الشروط', 'Terms')}</button></div><div class="card legal">${legalHtml(S.legal)}</div>`; }
function vBrand() {
  const Lg = [['mark.svg', 'الرمز الأساسي', 'Primary mark', ''], ['logo-horizontal.svg', 'الشعار الأفقي', 'Horizontal logo', ''], ['logo-horizontal-white.svg', 'على الداكن', 'On dark', 'dark'], ['logo-stacked.svg', 'الشعار العمودي', 'Stacked logo', ''], ['mark-lime.svg', 'على الليموني', 'On lime', ''], ['mark-white.svg', 'الرمز الأبيض', 'White mark', 'dark'], ['mark-mono.svg', 'أحادي اللون', 'Monochrome', ''], ['app-icon.svg', 'أيقونة التطبيق', 'App icon', '']];
  const C = [['#1B1035', 'ليل', 'Night'], ['#2A1A52', 'بنفسج', 'Violet'], ['#5B3DF5', 'نيلي', 'Indigo'], ['#C8F135', 'ليموني', 'Lime'], ['#7FE3A0', 'نعناع', 'Mint'], ['#FF6B4A', 'مرجان', 'Coral'], ['#F6F4FB', 'ضباب', 'Mist']];
  return `<h2>${L('هوية وظيفتي البصرية', 'Wazifati brand')}</h2><p class="mut" style="margin-bottom:14px">${L('الرمز حرف «و» مبني هندسياً: الحلقة رأس الإنسان ونقطة مرجانية في مركزه، والذيل منحنى صاعد، والنجمة ترمز للذكاء الاصطناعي.', 'The mark is a geometric “و”: a head with a coral dot, a rising curve, and a spark for AI.')}</p>
  <div class="brandgrid">${Lg.map(([f, a, e, d]) => `<div class="card"><div class="pv ${d}"><img src="assets/brand/${f}" alt=""></div><b>${L(a, e)}</b><span class="mut">${f}</span></div>`).join('')}</div>
  <h3 style="margin:20px 0 10px">${L('الألوان', 'Colours')}</h3><div class="sw">${C.map(([c, a, e]) => `<span style="background:${c};${['#C8F135', '#7FE3A0', '#F6F4FB'].includes(c) ? 'color:#1B1035;border:1px solid #e6e1f2' : ''}">${L(a, e)}<br>${c}</span>`).join('')}</div>`;
}

/* =====================================================
   المساعد الذكي
   ===================================================== */
function onAIReady() { const m = $('#aimode'); if (m) m.textContent = AI.label(); }
function chatPanel() {
  if (!S.chatOpen) { $('#chat').innerHTML = ''; return; }
  const sug = role() === 'employer' ? [L('اكتب لي إعلان محاسب', 'Write an accountant job ad'), L('كم رواتب الاستقبال؟', 'Receptionist salaries?'), L('كيف أوثّق شركتي؟', 'How do I verify my company?')] : role() === 'admin' ? [L('ما علامات الإعلان الاحتيالي؟', 'Signs of a scam ad?')] : [L('ما الوظائف التي تناسبني؟', 'Which jobs suit me?'), L('وظائف في عدن', 'Jobs in Aden'), L('كيف أرفع سيرتي؟', 'How do I upload my CV?'), L('كم رواتب المحاسبة؟', 'Accounting salaries?')];
  $('#chat').innerHTML = `<div class="panel" role="dialog"><header><img src="assets/brand/mark.svg" alt=""><div><b>${L('سند', 'Sanad')}</b><div class="aimode" id="aimode">${AI.label()}</div></div><button data-a="clearchat" title="new">↺</button><button data-a="togglechat" style="margin-inline-start:6px">✕</button></header>
  <div class="msgs" id="msgs">${D.chat.length ? D.chat.map(m => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${m.role === 'user' ? esc(m.content) : md(m.content)}</div>`).join('') : `<div class="msg a">${md(localChat(''))}</div>`}</div>
  <div class="sugg">${sug.map(s => `<button data-a="sugg" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>
  <form class="composer" id="composer"><input id="chatin" placeholder="${L('اكتب سؤالك…', 'Ask anything…')}" autocomplete="off"><button class="btn sm" type="submit">${L('إرسال', 'Send')}</button></form></div>`;
  const m = $('#msgs'); m.scrollTop = m.scrollHeight; if (window.innerWidth > 760) $('#chatin').focus();
}
async function sendChat(q) {
  q = (q || '').trim(); if (!q || S.busy) return; S.busy = true;
  if (!S.chatOpen) { S.chatOpen = true; chatPanel(); }
  const history = D.chat.map(m => ({ role: m.role, content: m.content })); D.chat.push({ role: 'user', content: q });
  const box = $('#msgs'); box.insertAdjacentHTML('beforeend', `<div class="msg u">${esc(q)}</div><div class="msg a" id="live"><span class="dots">${L('يفكر', 'Thinking')}</span></div>`); box.scrollTop = box.scrollHeight;
  const live = $('#live');
  try { const ans = await AI.run('chat', { q, history }, t => { live.innerHTML = md(t); box.scrollTop = box.scrollHeight; }); live.innerHTML = md(ans); D.chat.push({ role: 'assistant', content: ans }); }
  finally { live.removeAttribute('id'); D.chat = D.chat.slice(-30); Store.persist(); S.busy = false; box.scrollTop = box.scrollHeight; }
}
async function aiInto(el, task, data) { if (S.busy || !el) return; S.busy = true; el.innerHTML = `<span class="dots mut">${L('المساعد يعمل', 'Working')}</span>`; try { const t = await AI.run(task, data, x => { el.innerHTML = md(x); }); el.innerHTML = md(t); return t; } finally { S.busy = false; } }

/* =====================================================
   النوافذ والإشعارات
   ===================================================== */
function modal(html, wide) { $('#layer').innerHTML = `<div class="modal" data-a="closemodal"><div class="box ${wide ? 'wide' : ''}">${html}</div></div>`; }
function closeModal() { $('#layer').innerHTML = ''; }
function showBanner(n) {
  const b = $('#banner'); b.innerHTML = `<div class="bn" data-a="opennotif" data-v="${esc(n.id)}"><img src="assets/brand/mark.svg" alt=""><div class="sp"><b>${esc(n.title)}</b><div>${esc(n.body)}</div></div><span class="btn sm gold">${n.type === 'job_match' ? L('مشاهدة', 'View') : L('فتح', 'Open')}</span></div><button class="x" data-a="hidebanner">✕</button>`;
  b.classList.add('on'); clearTimeout(showBanner.t); showBanner.t = setTimeout(() => b.classList.remove('on'), 9000);
  renderShell();
}
async function openNotif(n) {
  if (!n) return; $('#banner').classList.remove('on'); closeModal();
  if (!n.read) { n.read = true; Store.readNotifs && Store.readNotifs().catch(() => {}); }
  if (n.job && D.jobs.some(j => j.id === n.job) && !(n.app && n.type !== 'job_match' && n.type !== 'job_live')) { openJob(n.job); return; }
  if (n.app && D.apps.some(a => a.id === n.app)) { openThread(n.app); return; }
  render();
}
function openJob(id) { const j = job(id); if (!j) { toast(L('الوظيفة غير متاحة', 'Job not available')); return; } go('job', { jobId: id }); Store.viewJob(id); }
async function openThread(id) { go('thread', { appId: id }); try { await Store.loadThread(id); if (S.view === 'thread' && S.appId === id) render(); } catch (e) {} }
function ivModal(appId) {
  const a = D.apps.find(x => x.id === appId), base = new Date(Date.now() + 2 * 864e5); base.setHours(10, 0, 0, 0);
  const v = k => { const d = new Date(base.getTime() + k * 864e5); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
  modal(`<h3>📅 ${L('جدولة مقابلة مع', 'Schedule an interview with')} ${esc(a.snap.name)}</h3><p class="mut" style="margin:6px 0 10px">${L('اقترح حتى 3 مواعيد، ويختار المتقدم الأنسب له بضغطة.', 'Propose up to 3 times; the applicant picks one in a tap.')}</p>
  ${[0, 1, 2].map(i => `<div class="field"><label>${L('الموعد', 'Option')} ${i + 1}${i ? ' (' + L('اختياري', 'optional') + ')' : ''}</label><input type="datetime-local" class="ivslot" value="${i === 0 ? v(0) : i === 1 ? v(1) : ''}"></div>`).join('')}
  <div class="two"><div class="field"><label>${L('نوع المقابلة', 'Type')}</label><select id="ivmode">${opts(MODES, 'onsite')}</select></div><div class="field"><label>${L('المكان أو الرابط', 'Place or link')}</label><input id="ivplace" value="${esc((Store.myCompany() || {}).about ? '' : '')}" placeholder="${L('عنوان المكتب أو رابط الاجتماع', 'Office address or meeting link')}"></div></div>
  <div class="field"><label>${L('ملاحظة للمتقدم', 'Note')}</label><input id="ivnote" placeholder="${L('مثال: أحضر نسخة من الشهادات', 'e.g. bring your certificates')}"></div>
  <div class="row"><button class="btn" data-a="ivsend" data-v="${esc(appId)}">${L('إرسال الدعوة', 'Send invitation')}</button><button class="btn ghost" data-a="closemodal">${L('إلغاء', 'Cancel')}</button></div>`);
}
async function cvModal(appId) {
  const a = D.apps.find(x => x.id === appId), s = a.snap || {};
  modal(`<div class="row" style="margin-bottom:10px"><h3 class="sp">${esc(s.name)}</h3>${s.cvPath ? `<button class="btn ghost sm" data-a="origcv" data-v="${esc(appId)}">⬇ ${L('السيرة الأصلية PDF', 'Original PDF')}</button>` : ''}<button class="btn sm" data-a="closemodal">${L('إغلاق', 'Close')}</button></div>
  ${a.note ? `<div class="card note" style="margin-bottom:10px"><b>${L('رسالة التقديم', 'Cover note')}:</b><div style="white-space:pre-wrap">${esc(a.note)}</div></div>` : ''}
  <div class="cvwrap"><div>${(CV_TPLS[s.cvTpl] || CV_TPLS.khanjar).render(s)}</div></div>`, true);
}
function companyModal(id) {
  const c = company(id), st = companyStats(c), jobs = activeJobs().filter(j => j.company === id), revs = D.reviews.filter(r => r.company === id);
  const canRate = role() === 'seeker' && D.apps.some(a => a.seeker === me().id && (job(a.job) || {}).company === id);
  modal(`<div class="row">${logo(id)}<div class="sp"><h3>${esc(c.name)} ${c.status === 'verified' ? '<span class="chip">✓ ' + L('موثّقة', 'Verified') + '</span>' : ''}</h3><div class="mut">📍 ${esc(nm(LOCS, c.loc))}</div></div><button class="btn ghost sm" data-a="closemodal">✕</button></div>
  <p style="margin:10px 0">${esc(c.about || '')}</p>
  <div class="stats"><div class="card stat"><b>${st.count ? st.rating.toFixed(1) : '—'}</b><span class="mut">${st.count ? stars(st.rating) + ' (' + st.count + ')' : L('لا تقييمات', 'No ratings')}</span></div><div class="card stat"><b>${st.resp ?? '—'}${st.resp !== null ? '%' : ''}</b><span class="mut">${L('نسبة الرد على المتقدمين', 'Applicant response rate')}</span></div><div class="card stat"><b>${jobs.length}</b><span class="mut">${L('وظائف متاحة', 'open jobs')}</span></div></div>
  ${jobs.length ? `<h3>${L('الوظائف المتاحة', 'Open jobs')}</h3>${jobs.map(j => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line);cursor:pointer" data-a="open" data-v="${esc(j.id)}"><b class="sp">${esc(j.title)}</b><span class="mut">${esc(sal(j))}</span></div>`).join('')}` : ''}
  <div class="row" style="margin-top:14px"><h3 class="sp">${L('آراء المتقدمين', 'Applicant reviews')}</h3>${canRate ? `<button class="btn gold sm" data-a="rate" data-v="${esc(id)}">☆ ${L('قيّم الشركة', 'Rate')}</button>` : ''}</div>
  ${revs.length ? revs.slice(0, 20).map(r => `<div class="review">${stars(r.rating)} <b>${esc(r.name || L('مستخدم', 'User'))}</b> <span class="mut">· ${ago(r.created)}</span>${r.comment ? `<div>${esc(r.comment)}</div>` : ''}</div>`).join('') : `<p class="mut">${L('لا توجد آراء بعد.', 'No reviews yet.')}</p>`}
  ${canRate ? '' : role() === 'seeker' ? `<p class="mut" style="margin-top:8px">${L('يمكنك تقييم الشركة بعد التقديم على إحدى وظائفها.', 'You can rate a company after applying to one of its jobs.')}</p>` : ''}`, true);
}
function rateModal(cid) {
  const old = D.reviews.find(r => r.company === cid && r.seeker === me().id) || { rating: 0, comment: '' };
  modal(`<h3>${L('قيّم', 'Rate')} ${esc(company(cid).name)}</h3><p class="mut" style="margin:6px 0">${L('تقييمك يساعد الباحثين على معرفة الشركات الجادة. كن صادقاً ومحترماً.', 'Your rating helps others find serious employers. Be honest and respectful.')}</p>
  <div class="rate" id="rate" data-r="${old.rating}">${[1, 2, 3, 4, 5].map(i => `<button data-a="star" data-v="${i}" class="${i <= old.rating ? 'on' : ''}">★</button>`).join('')}</div>
  <div class="field"><textarea id="rvc" rows="3" placeholder="${L('اكتب تجربتك (اختياري): سرعة الرد، المقابلة، الوضوح…', 'Your experience (optional)…')}">${esc(old.comment)}</textarea></div>
  <div class="row"><button class="btn" data-a="sendrate" data-v="${esc(cid)}">${L('إرسال التقييم', 'Submit')}</button><button class="btn ghost" data-a="closemodal">${L('إلغاء', 'Cancel')}</button></div>`);
}
function notifsModal() {
  const l = D.notifs.filter(n => n.user === me().id).slice(0, 40);
  modal(`<div class="row" style="margin-bottom:10px"><h3 class="sp">${L('الإشعارات', 'Notifications')}</h3><button class="btn ghost sm" data-a="closemodal">✕</button></div>${l.length ? l.map(n => `<div class="card notif ${n.read ? '' : 'unread'}" data-a="opennotif" data-v="${esc(n.id)}"><b>${esc(n.title)}</b><div class="mut">${esc(n.body)}</div><small class="mut">${ago(n.created)}</small></div>`).join('') : `<p class="mut">${L('لا توجد إشعارات.', 'No notifications.')}</p>`}`);
  Store.readNotifs().then(renderShell).catch(() => {});
}
function welcome() {
  modal(`<div style="text-align:center"><img src="assets/brand/logo-stacked.svg" alt="" style="height:150px"><h2 style="margin-top:10px">${L('أهلاً بك في وظيفتي', 'Welcome to Wazifati')}</h2><p class="mut" style="margin-bottom:14px">${L('هذه نسخة تجريبية ببيانات أمثلة. اختر كيف تريد التجربة:', 'This is a demo with sample data. Choose how to try it:')}</p>
  <div style="display:grid;gap:8px"><button class="btn" data-a="start" data-v="seeker">🔎 ${L('أبحث عن عمل', 'I’m job hunting')}</button><button class="btn gold" data-a="start" data-v="employer">🏢 ${L('أنا صاحب عمل', 'I’m hiring')}</button><button class="btn ghost" data-a="start" data-v="admin">🛡️ ${L('لوحة الإدارة', 'Admin panel')}</button>
  <button class="btn ghost sm" data-a="lang">🌐 ${LANG === 'en' ? 'العربية' : 'English'}</button></div></div>`);
}

/* =====================================================
   رفع السيرة الذاتية وقراءتها
   ===================================================== */
async function handleCvFile(file) {
  if (!file) return;
  if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) { toast(L('اختر ملف PDF', 'Please choose a PDF')); return; }
  if (file.size > 5 * 1024 * 1024) { toast(L('الحد الأقصى 5 ميجابايت', 'Max size is 5 MB')); return; }
  readProfile();
  modal(`<div style="text-align:center;padding:20px"><div class="spin"></div><h3>${L('المساعد يقرأ سيرتك…', 'Reading your CV…')}</h3><p class="mut">${L('استخراج النص ثم فهم الخبرات والمهارات', 'Extracting text, then understanding your experience and skills')}</p></div>`);
  let text = '';
  try { text = await CVParse.extract(file); } catch (e) { console.warn(e); }
  if (text.replace(/\s/g, '').length < 40) { modal(`<h3>${L('تعذّرت قراءة النص', 'Could not read text')}</h3><p style="margin:10px 0">${L('يبدو أن الملف صورة ممسوحة ضوئياً وليس نصاً. صدّر سيرتك من Word إلى PDF وحاول مجدداً، أو عبّئ ملفك يدوياً.', 'This looks like a scanned image. Export your CV from Word to PDF and try again, or fill your profile manually.')}</p><button class="btn" data-a="closemodal">${L('حسناً', 'OK')}</button>`); return; }
  const r = await AI.run('parsecv', { text }) || {};
  S.parsed = { data: r, file };
  const row = (k, v) => v && (Array.isArray(v) ? v.length : String(v).trim()) ? `<tr><th>${k}</th><td>${Array.isArray(v) ? v.map(x => typeof x === 'object' ? esc([x.title, x.company, x.period].filter(Boolean).join(' · ')) : esc(x)).join('<br>') : esc(v)}</td></tr>` : '';
  modal(`<h3>✦ ${L('هذا ما فهمه المساعد من سيرتك', 'Here’s what the AI found')}</h3><p class="mut" style="margin:4px 0 10px">${L('راجعه، ثم اضغط «تعبئة ملفي». يمكنك التعديل بعدها.', 'Review it, then tap “Fill my profile”. You can edit afterwards.')}</p>
  <div class="tw"><table class="kv">${row(L('الاسم', 'Name'), r.name)}${row(L('المسمى', 'Title'), r.title)}${row(L('البريد', 'Email'), r.email)}${row(L('الجوال', 'Phone'), r.phone)}${row(L('المدينة', 'City'), r.loc ? nm(LOCS, r.loc) : '')}${row(L('الخبرة', 'Experience'), r.exp ? r.exp + ' ' + L('سنوات', 'years') : '')}${row(L('التعليم', 'Education'), r.edu)}${row(L('المهارات', 'Skills'), r.skills)}${row(L('اللغات', 'Languages'), r.langs)}${row(L('النبذة', 'Summary'), r.about)}${row(L('الخبرات', 'Experience'), r.experiences)}</table></div>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="applycv">${L('تعبئة ملفي', 'Fill my profile')}</button><button class="btn ghost" data-a="closemodal">${L('إلغاء', 'Cancel')}</button></div>`, true);
}
async function applyParsed() {
  const { data: r, file } = S.parsed || {}; if (!r) return; const p = me();
  const pick = (a, b) => (b !== undefined && b !== null && String(b).trim() !== '' ? b : a);
  Object.assign(p, { name: pick(p.name, r.name), title: pick(p.title, r.title), email: pick(p.email, r.email), phone: pick(p.phone, r.phone), loc: LOCS.some(l => l.id === r.loc) ? r.loc : p.loc, exp: +r.exp > 0 ? +r.exp : p.exp, edu: pick(p.edu, r.edu), about: pick(p.about, r.about),
    skills: [...new Set([...(p.skills || []), ...(Array.isArray(r.skills) ? r.skills : [])].map(s => String(s).trim()).filter(Boolean))].slice(0, 20),
    langs: Array.isArray(r.langs) && r.langs.length ? r.langs : p.langs,
    experiences: Array.isArray(r.experiences) && r.experiences.filter(x => x && (x.title || x.company)).length ? r.experiences.filter(x => x && (x.title || x.company)).map(x => ({ title: x.title || '', company: x.company || '', period: x.period || '', details: x.details || '' })) : p.experiences });
  closeModal(); toast(L('جارٍ الحفظ…', 'Saving…'));
  try { if (REAL && file) p.cvPath = await Store.uploadCv(file); await Store.saveProfile(p); toast(L('تم تعبئة ملفك من السيرة ✓ راجعه', 'Profile filled from your CV ✓')); } catch (e) { toast(L('تعذّر الحفظ، حاول مجدداً', 'Could not save, try again')); }
  S.parsed = null; render();
}

/* =====================================================
   الأحداث
   ===================================================== */
async function act(t, e) {
  const a = t.dataset.a, v = t.dataset.v;
  switch (a) {
    case 'closemodal': if (t.classList.contains('modal') && e.target !== t) return; closeModal(); return;
    case 'nav': if (S.view === 'profile') readProfile(); go(v); return;
    case 'home': go(HOME[role()]); return;
    case 'back': if (!back()) go(HOME[role()]); return;
    case 'acct': go(Store.isLoggedIn() ? 'settings' : 'login'); return;
    case 'lang': { setLang(LANG === 'en' ? 'ar' : 'en'); Store.setLangPref(LANG).catch(() => {}); const w = $('.modal') && !REAL && !D.welcomed; render(); if (S.chatOpen) chatPanel(); if (w) welcome(); return; }
    case 'demorole': Store.setDemoRole(v); S.prev = []; S.view = HOME[v]; render(); if (S.chatOpen) chatPanel(); { const n = D.notifs.find(x => x.user === D.me.id && !x.read && x.type !== 'welcome'); if (n) showBanner(n); } return;
    case 'start': D.welcomed = true; Store.setDemoRole(v); closeModal(); S.view = HOME[v]; render(); return;
    case 'legal': closeModal(); S.legal = v || 'privacy'; if (S.view === 'legal') render(); else go('legal'); return;
    case 'open': closeModal(); openJob(v); if (window.innerWidth < 760 && S.chatOpen) { S.chatOpen = false; chatPanel(); } return;
    case 'company': companyModal(v); return;
    case 'save': { if (!requireLogin()) return; if (role() !== 'seeker') { toast(L('الحفظ متاح للباحثين عن عمل', 'Saving is for job seekers')); return; } const on = await Store.toggleSave(v); S.view === 'home' ? updateRes() : render(); toast(on ? L('تم الحفظ ♥', 'Saved ♥') : L('أُزيلت من المحفوظة', 'Removed')); return; }
    case 'share': { const url = (Native.isApp || !location.protocol.startsWith('http') ? (CFG.webUrl || '') : location.origin + location.pathname) + '?job=' + encodeURIComponent(v), j = job(v);
      const txt = `${j.title} — ${company(j.company).name}\n📍 ${nm(LOCS, j.loc)} | 💰 ${sal(j)}\n${L('قدّم عبر وظيفتي:', 'Apply on Wazifati:')} ${url}`;
      try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast(L('تم نسخ الوظيفة، الصقها في واتساب', 'Copied, paste it in WhatsApp')); } } catch (_) { toast(L('تعذّرت المشاركة', 'Could not share')); } return; }
    case 'bell': notifsModal(); return;
    case 'opennotif': openNotif(D.notifs.find(n => String(n.id) === v)); return;
    case 'hidebanner': $('#banner').classList.remove('on'); return;
    case 'togglechat': S.chatOpen = !S.chatOpen; chatPanel(); return;
    case 'clearchat': D.chat = []; Store.persist(); chatPanel(); return;
    case 'sugg': sendChat(v); return;
    case 'askhero': { const q = $('#askq').value; if (q.trim()) { S.chatOpen = true; chatPanel(); sendChat(q); } return; }
    case 'aijob': aiInto($('#aiout'), v, { j: job(S.jobId) }); return;
    case 'aiabout': { readProfile(); const ta = $('#p_about'), old = ta.value; ta.value = ''; ta.placeholder = L('المساعد يكتب…', 'Writing…'); const r = await AI.run('about', {}, x => { ta.value = x; }); ta.value = (r || '').trim() || old; toast(L('راجع النبذة ثم اضغط حفظ', 'Review, then save')); return; }
    case 'aijobad': { const title = $('#n_title').value.trim(); if (!title) { toast(L('اكتب المسمى الوظيفي أولاً', 'Type the job title first')); return; } if (S.busy) return; S.busy = true; t.disabled = true; const lbl = t.textContent; t.textContent = '✦ ' + L('يكتب الآن…', 'Writing…');
      try { fillJobForm(await AI.run('jobad', { title, loc: $('#n_loc').value })); toast(L('جهّز المساعد الإعلان، راجعه وعدّل ما تريد', 'Draft ready, review and edit')); } finally { S.busy = false; t.disabled = false; t.textContent = lbl; } return; }
    case 'usetpl': fillJobForm(JOB_TEMPLATES[+v]); $('#n_title').value = JOB_TEMPLATES[+v].title; toast(L('تم تعبئة القالب', 'Template applied')); return;
    case 'aishort': { const jid = S.empJob !== 'all' ? S.empJob : (myJobs().find(j => D.apps.some(x => x.job === j.id)) || {}).id; if (!jid) { toast(L('لا يوجد متقدمون', 'No applicants')); return; } $('#shortbox').style.display = 'block'; aiInto($('#aiout'), 'shortlist', { j: job(jid), apps: D.apps.filter(x => x.job === jid) }); return; }
    case 'aifraud': { const j = job(v), box = $('#fr' + v); box.style.display = 'block'; box.innerHTML = `<span class="dots mut">${L('يفحص الإعلان', 'Checking')}</span>`; const r = await AI.run('fraud', { j });
      box.innerHTML = `<div class="row"><span class="chip ai">✦ ${L('نتيجة الفحص', 'Result')}</span><span class="chip ${+r.risk >= 50 ? 'red' : +r.risk >= 20 ? 'gold' : ''}">${esc(r.level)} (${+r.risk || 0}%)</span></div><ul style="margin:8px 0;padding-inline-start:20px">${(r.reasons || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul><b>${L('التوصية', 'Advice')}:</b> ${esc(r.advice || '')}`; return; }
    case 'report': if (!requireLogin()) return; modal(`<h3>${L('الإبلاغ عن إعلان مخالف', 'Report this job')}</h3><div class="field" style="margin-top:10px"><select id="rp_r">${[L('طلب رسوم قبل التوظيف', 'Asked for fees'), L('إعلان وهمي', 'Fake job'), L('معلومات مضللة', 'Misleading info'), L('محتوى غير لائق', 'Inappropriate content')].map(x => `<option>${x}</option>`).join('')}</select></div><div class="row"><button class="btn red" data-a="sendreport" data-v="${esc(v)}">${L('إرسال البلاغ', 'Send report')}</button><button class="btn ghost" data-a="closemodal">${L('إلغاء', 'Cancel')}</button></div>`); return;
    case 'sendreport': await Store.report(v, $('#rp_r').value); closeModal(); toast(L('وصل بلاغك للإدارة، شكراً لك', 'Report sent, thank you')); renderShell(); return;
    case 'apply': {
      if (!requireLogin({ view: 'job', jobId: v })) return;
      if (role() !== 'seeker') { toast(L('التقديم متاح لحسابات الباحثين عن عمل', 'Applying is for job seeker accounts')); return; }
      const j = job(v), p = me();
      if (complete(p) < 60) { modal(`<h3>${L('أكمل ملفك أولاً', 'Complete your profile first')}</h3><p style="margin:10px 0">${L('اكتمال ملفك', 'Your profile is')} ${complete(p)}%. ${L('نحتاج 60% على الأقل. أسرع طريقة: ارفع سيرتك PDF ويعبّئها المساعد.', 'We need at least 60%. Fastest way: upload your CV and let the AI fill it.')}</p><button class="btn" data-a="gotoprofile">${L('إكمال الملف', 'Complete profile')}</button>`); return; }
      modal(`<h3>${L('التقديم على', 'Apply for')}: ${esc(j.title)}</h3><p class="mut" style="margin:6px 0 10px">${L('سيصل ملفك وسيرتك بقالب', 'Your profile and CV (template')} «${CV_TPLS[p.cvTpl || 'khanjar'].name}» ${L('إلى', ') go to')} ${esc(company(j.company).name)}.</p>
      <div class="field"><div class="row" style="margin-bottom:4px"><label class="sp" style="margin:0">${L('رسالة لصاحب العمل (اختياري)', 'Note to employer (optional)')}</label><button class="btn ai sm" data-a="aicover" data-v="${esc(v)}">✦ ${L('اكتبها لي', 'Write it for me')}</button></div><textarea id="ap_note" rows="6"></textarea></div>
      <div class="row"><button class="btn" data-a="confirmapply" data-v="${esc(v)}">${L('تأكيد التقديم', 'Confirm')}</button><button class="btn ghost" data-a="closemodal">${L('إلغاء', 'Cancel')}</button></div>`); return; }
    case 'aicover': { const ta = $('#ap_note'); ta.value = ''; const r = await AI.run('cover', { j: job(v) }, x => { ta.value = x; }); ta.value = r; return; }
    case 'gotoprofile': closeModal(); go('profile'); return;
    case 'confirmapply': { t.disabled = true; try { await Store.apply(v, $('#ap_note') ? $('#ap_note').value : ''); closeModal(); toast(L('تم إرسال طلبك بنجاح ✓', 'Application sent ✓')); render(); } catch (err) { t.disabled = false; toast(L('تعذّر التقديم: ', 'Could not apply: ') + (err.message || '')); } return; }
    case 'thread': closeModal(); openThread(v); return;
    case 'addexp': readProfile(); me().experiences = [...(me().experiences || []), { title: '', company: '', period: '', details: '' }]; render(); return;
    case 'delexp': readProfile(); me().experiences.splice(+v, 1); render(); return;
    case 'saveprofile': readProfile(); try { await Store.saveProfile(me()); toast(L('تم حفظ ملفك ✓', 'Profile saved ✓')); } catch (err) { toast(L('تعذّر الحفظ', 'Could not save')); } render(); return;
    case 'mycv': { const u = await Store.fileUrl('cvs', me().cvPath); if (u) window.open(u, '_blank'); return; }
    case 'pickcv': me().cvTpl = v; await Store.saveProfile(me()); render(); toast(L('تم اختيار قالب ', 'Template selected: ') + CV_TPLS[v].name); return;
    case 'printcv': $('#printArea').innerHTML = (CV_TPLS[me().cvTpl] || CV_TPLS.khanjar).render(me()); try { window.print(); } catch (_) {} return;
    case 'applycv': applyParsed(); return;
    case 'addalert': await Store.addAlert($('#al_cat').value, $('#al_loc').value); toast(L('تمت إضافة التنبيه 🔔', 'Alert added 🔔')); render(); return;
    case 'delalert': await Store.delAlert(v); render(); return;
    case 'savecompany': { const g = id => $('#' + id).value.trim(), file = $('#c_doc').files[0];
      if (!g('c_name') || !g('c_cr') || !g('c_loc')) { toast(L('أكمل الاسم ورقم السجل والمدينة', 'Fill name, registration no. and city')); return; }
      if (file && file.size > 8 * 1024 * 1024) { toast(L('الحد الأقصى للمستند 8 ميجابايت', 'Max 8 MB')); return; }
      if (!Store.myCompany() && !file) { toast(L('ارفع صورة السجل التجاري', 'Upload the registration document')); return; }
      t.disabled = true; try { await Store.saveCompany({ name: g('c_name'), cr: g('c_cr'), loc: g('c_loc'), phone: g('c_phone'), about: g('c_about') }, file); toast(L('تم الحفظ، وسيتم التحقق من السجل', 'Saved, verification in progress')); go('dash'); } catch (err) { t.disabled = false; toast(L('تعذّر الحفظ: ', 'Could not save: ') + (err.message || '')); } return; }
    case 'postjob': { const g = id => $('#' + id).value.trim(), title = g('n_title'), min = +g('n_min'), max = +g('n_max');
      if (!title || !g('n_desc') || !(max > 0) || min > max) { toast(L('أكمل المسمى والوصف وراتباً صحيحاً', 'Fill title, description and a valid salary')); return; }
      await Store.postJob({ title, cat: g('n_cat'), loc: g('n_loc'), type: g('n_type'), min, max, cur: g('n_cur'), exp: +g('n_exp') || 0, skills: g('n_skills').split(/[,،]/).map(s => s.trim()).filter(Boolean), desc: g('n_desc'), reqs: g('n_reqs').split('\n').map(s => s.trim()).filter(Boolean), gig: $('#n_gig').checked });
      toast(L('أُرسلت الوظيفة للمراجعة', 'Submitted for review')); go('ejobs'); return; }
    case 'closejob': case 'openjob': await Store.ownerSetJob(v, a === 'closejob' ? 'closed' : 'active'); render(); return;
    case 'empfilter': S.empJob = v; go('applicants'); return;
    case 'viewcv': cvModal(v); return;
    case 'origcv': { const ap = D.apps.find(x => x.id === v); const u = await Store.fileUrl('cvs', ap.snap.cvPath); if (u) window.open(u, '_blank'); else toast(L('الملف غير متاح', 'File unavailable')); return; }
    case 'ivmodal': ivModal(v); return;
    case 'ivsend': { const slots = [...document.querySelectorAll('.ivslot')].map(i => i.value ? new Date(i.value).getTime() : 0).filter(x => x > Date.now());
      if (!slots.length) { toast(L('اختر موعداً واحداً على الأقل في المستقبل', 'Pick at least one future time')); return; }
      await Store.proposeInterview(v, { slots, mode: $('#ivmode').value, place: $('#ivplace').value.trim(), note: $('#ivnote').value.trim() }); closeModal(); toast(L('تم إرسال الدعوة للمتقدم 📅', 'Invitation sent 📅')); render(); return; }
    case 'ivpick': await Store.answerInterview(v, +t.dataset.t, 'confirmed'); toast(L('تم تأكيد الموعد ✓', 'Interview confirmed ✓')); render(); return;
    case 'ivre': await Store.answerInterview(v, null, 'reschedule'); toast(L('أُبلغت الشركة بطلب موعد آخر', 'The company was asked for another time')); render(); return;
    case 'rate': rateModal(v); return;
    case 'star': { const box = $('#rate'); box.dataset.r = v; box.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i < +v)); return; }
    case 'sendrate': { const r = +$('#rate').dataset.r; if (!r) { toast(L('اختر عدد النجوم', 'Pick a rating')); return; } await Store.review(v, r, $('#rvc').value.trim()); closeModal(); toast(L('شكراً لتقييمك ★', 'Thanks for rating ★')); render(); return; }
    case 'approve': await Store.adminSetJob(v, { status: 'active' }); toast(L('تم نشر الوظيفة وإشعار المناسبين لها', 'Published and matching seekers notified')); render(); return;
    case 'reject': await Store.adminSetJob(v, { status: 'rejected' }); render(); return;
    case 'feat': await Store.adminSetJob(v, { feat: !job(v).feat }); render(); return;
    case 'pausejob': await Store.adminSetJob(v, { status: 'paused' }); if (t.dataset.r) await Store.resolveReport(t.dataset.r, 'resolved'); toast(L('تم إيقاف الوظيفة', 'Job paused')); render(); return;
    case 'dismiss': await Store.resolveReport(v, 'dismissed'); render(); return;
    case 'vcomp': { let reason = ''; if (t.dataset.s === 'rejected') { reason = L('بيانات السجل غير واضحة أو غير مطابقة', 'Registration details unclear or mismatched'); } await Store.verifyCompany(v, t.dataset.s, reason); render(); return; }
    case 'crdoc': { const c = company(v); if (!REAL) { toast(L('في الوضع التجريبي: ', 'Demo: ') + (c.crDoc || '')); return; } const u = await Store.fileUrl('cr-docs', c.crDoc); if (u) window.open(u, '_blank'); return; }
    case 'google': try { await Store.google(); } catch (err) { toast(L('تعذّر الدخول: ', 'Sign-in failed: ') + (err.message || '')); } return;
    case 'otpsend': { const ph = $('#phone').value.replace(/[\s-]/g, ''); S.phone = ph.startsWith('+') ? ph : '+967' + ph.replace(/^0+/, ''); if (S.phone.length < 10) { toast(L('رقم غير صحيح', 'Invalid number')); return; } try { await Store.phoneSend(S.phone); S.otpSent = true; render(); } catch (err) { toast(L('تعذّر الإرسال: ', 'Could not send: ') + (err.message || '')); } return; }
    case 'otpverify': try { await Store.phoneVerify(S.phone, $('#otp').value.trim()); S.otpSent = false; } catch (err) { toast(L('الرمز غير صحيح', 'Wrong code')); } return;
    case 'otpreset': S.otpSent = false; render(); return;
    case 'setrole': try { await Store.setRole(v); S.view = v === 'employer' ? 'company' : 'profile'; render(); toast(v === 'employer' ? L('سجّل شركتك الآن', 'Now register your company') : L('ارفع سيرتك ليعبّئ المساعد ملفك', 'Upload your CV to fill your profile')); } catch (err) { toast(err.message || 'error'); } return;
    case 'signout': await Store.signOut(); S.prev = []; S.view = 'home'; await Store.load(); render(); return;
    case 'reset': Store.reset(); S.prev = []; S.view = 'home'; render(); toast(L('تمت إعادة البيانات التجريبية', 'Demo data reset')); return;
    case 'delacct': modal(`<h3>${L('حذف الحساب نهائياً', 'Delete account permanently')}</h3><p style="margin:10px 0">${L('سيتم حذف ملفك وسيرتك وطلباتك ورسائلك نهائياً ولا يمكن استرجاعها. اكتب كلمة «حذف» للتأكيد.', 'Your profile, CV, applications and messages will be permanently deleted. Type “DELETE” to confirm.')}</p><input id="delc" class="inp" style="width:100%"><div class="row" style="margin-top:10px"><button class="btn red" data-a="delconfirm">${L('حذف حسابي', 'Delete my account')}</button><button class="btn ghost" data-a="closemodal">${L('إلغاء', 'Cancel')}</button></div>`); return;
    case 'delconfirm': { const w = $('#delc').value.trim(); if (w !== 'حذف' && w.toUpperCase() !== 'DELETE') { toast(L('اكتب «حذف» للتأكيد', 'Type DELETE to confirm')); return; } try { await Store.deleteAccount(); closeModal(); S.prev = []; S.view = 'home'; if (REAL) await Store.load(); render(); toast(L('تم حذف الحساب', 'Account deleted')); } catch (err) { toast(err.message || 'error'); } return; }
    case 'enablepush': { const ok = await setupPush(); toast(ok ? L('تم تفعيل الإشعارات ✓', 'Notifications enabled ✓') : L('الإشعارات غير متاحة حالياً', 'Notifications unavailable')); return; }
  }
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]'); if (!t) return;
  if (t.tagName === 'A' || ['save', 'report', 'share'].includes(t.dataset.a)) { e.preventDefault(); e.stopPropagation(); }
  if (t.dataset.a === 'save' || t.dataset.a === 'company') e.stopPropagation();
  act(t, e).catch(err => { console.error(err); toast(L('حدث خطأ: ', 'Error: ') + (err.message || err)); });
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  if (e.target.id === 'composer') { const i = $('#chatin'), q = i.value; i.value = ''; sendChat(q); }
  if (e.target.id === 'tform') { const i = $('#tin'), b = i.value.trim(), id = e.target.dataset.v; if (!b) return; i.value = ''; try { await Store.sendMsg(id, b); render(); setTimeout(() => $('#tin') && $('#tin').focus(), 50); } catch (err) { toast(L('تعذّر الإرسال', 'Could not send')); } }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'askq') { e.preventDefault(); document.querySelector('[data-a=askhero]').click(); } if (e.key === 'Escape') { closeModal(); if (S.chatOpen) { S.chatOpen = false; chatPanel(); } } });
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'cvfile') { handleCvFile(t.files[0]); t.value = ''; return; }
  const c = t.dataset.c; if (!c || c === 'q') return;
  if (c === 'appstatus') { await Store.setAppStatus(t.dataset.id, t.value); toast(L('تم تحديث الحالة وإشعار المتقدم', 'Status updated, applicant notified')); renderShell(); return; }
  if (c === 'empjob') { S.empJob = t.value; render(); return; }
  S.f[c] = t.type === 'checkbox' ? t.checked : t.value; updateRes();
});
document.addEventListener('input', e => { if (e.target.dataset.c === 'q') { S.f.q = e.target.value; updateRes(); } });

/* =====================================================
   التشغيل
   ===================================================== */
async function setupPush() {
  return Native.initPush({
    onToken: (tok, pl) => Store.savePushToken(tok, pl).catch(() => {}),
    onTap: d => { if (d.job_id) openJob(d.job_id); else if (d.application_id) openThread(d.application_id); },
    onReceive: () => { if (REAL) Store.load().then(render).catch(() => {}); }
  });
}
function afterAuth() {
  if (S.after && Store.isLoggedIn() && D.me && D.me.role) { const a = S.after; S.after = null; S.prev = []; Object.assign(S, a); }
  else if (S.view === 'login') S.view = HOME[role()];
  render(); if (Store.isLoggedIn()) setupPush();
}
(async function boot() {
  setLang(LANG);
  $('#app').innerHTML = `<div class="empty"><div class="spin"></div></div>`;
  Store.onNotif = n => showBanner(n);
  Store.onChange = () => { if (['thread', 'inbox', 'apps', 'applicants', 'dash'].includes(S.view)) render(); else renderShell(); };
  try { await Store.init(); } catch (e) { console.error(e); D = D || seed(); $('#app').innerHTML = `<div class="empty card">${L('تعذّر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.', 'Could not reach the server. Check your connection and retry.')}</div>`; return; }
  if (REAL) Store.onAuth = async () => { await Store.load(); afterAuth(); };
  Native.init({ onDeepLink: url => { if (REAL && url.includes('auth')) Store.handleDeepLink(url); const m = url.match(/[?&]job=([\w-]+)/); if (m) openJob(m[1]); }, onBack: () => { if ($('#layer').innerHTML) { closeModal(); return true; } if (S.chatOpen) { S.chatOpen = false; chatPanel(); return true; } return back(); } });
  S.view = HOME[role()];
  const qj = new URLSearchParams(location.search).get('job');
  render();
  if (qj && job(qj)) openJob(qj);
  if (!REAL && !D.welcomed) welcome();
  if (REAL && Store.isLoggedIn()) setupPush();
  AI.init();
})();
