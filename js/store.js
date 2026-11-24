/* =====================================================
   طبقة البيانات: نفس الواجهة لوضعين
   - LocalStore: وضع تجريبي على الجهاز (بدون إعداد)
   - RealStore : Supabase حقيقي (دخول Google/جوال، قاعدة بيانات، ملفات، لحظي)
   ===================================================== */
const CFG = window.WAZIFATI_CONFIG || {};
const REAL = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
const rid = p => p + Math.random().toString(36).slice(2, 9);

/* ---------- قواعد مشتركة (نفس منطق قاعدة البيانات) ---------- */
const normS = s => String(s || '').trim().toLowerCase();
function matchScore(j, p) {
  if (!j || !p) return 0;
  const js = (j.skills || []).map(normS), ps = (p.skills || []).map(normS);
  const sk = js.length ? js.filter(x => ps.includes(x)).length / js.length : 0;
  const w = (j.loc === 'remote' || p.loc === j.loc) ? 15 : 0;
  const ex = (+p.exp || 0) >= (+j.exp || 0) ? 15 : Math.round(15 * (+p.exp || 0) / Math.max(+j.exp || 0, 1));
  return Math.round(sk * 70 + w + ex);
}
function seekerWantsJob(p, j, alerts) {
  if (!p || p.role !== 'seeker' || p.open === false) return false;
  const m = matchScore(j, p);
  return m >= 60 || (p.cat === j.cat && m >= 40) || (alerts || []).some(a => (!a.cat || a.cat === j.cat) && (!a.loc || a.loc === j.loc));
}
const NOTIF_TXT = {
  job_match: (c, j) => ({ ar: [c + ' نزّلت وظيفة مناسبة لك', j + ' — هل تحب مشاهدة التفاصيل؟'], en: [c + ' posted a job that fits you', j + ' — want to see the details?'] }),
  job_live: (c, j) => ({ ar: ['تم نشر وظيفتك ✓', j], en: ['Your job is live ✓', j] }),
  job_rejected: (c, j) => ({ ar: ['لم تُعتمد وظيفتك', j], en: ['Your job was not approved', j] }),
  job_pending: (c, j) => ({ ar: ['وظيفة بانتظار المراجعة', c + ': ' + j], en: ['Job awaiting review', c + ': ' + j] }),
  new_applicant: (n, j) => ({ ar: ['متقدم جديد', n + ' قدّم على ' + j], en: ['New applicant', n + ' applied to ' + j] }),
  status: (s, j) => ({ ar: ['تحديث على طلبك', 'طلبك في «' + j + '» أصبح: ' + nm(STATUSES, s)], en: ['Application update', 'Your application for “' + j + '” is now: ' + (STATUSES.find(x => x.id === s) || {}).en] }),
  message: (n, b) => ({ ar: ['رسالة جديدة من ' + n, b], en: ['New message from ' + n, b] }),
  interview: (c, j) => ({ ar: ['دعوة لمقابلة 📅', c + ' تقترح مواعيد لمقابلة «' + j + '»'], en: ['Interview invitation 📅', c + ' proposed times for “' + j + '”'] }),
  interview_ok: (n, j) => ({ ar: ['تم تأكيد موعد المقابلة', n + ' أكّد الموعد لـ ' + j], en: ['Interview confirmed', n + ' confirmed the time for ' + j] }),
  interview_re: (n, j) => ({ ar: ['طلب موعد آخر', n + ' يطلب موعداً آخر لـ ' + j], en: ['New time requested', n + ' asked for another time for ' + j] }),
  company: (s, c) => ({ ar: [s === 'verified' ? 'تم توثيق شركتك ✓' : 'لم يتم توثيق الشركة', c], en: [s === 'verified' ? 'Your company is verified ✓' : 'Company verification declined', c] })
};

/* =====================================================
   الوضع التجريبي
   ===================================================== */
const LocalStore = {
  mode: 'demo', KEY: 'wazifati-v2-demo', onNotif: null, onChange: null,
  async init() {
    let d = null; try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) {}
    D = d && d.v === 2 ? Object.assign(seed(), d) : seed();
    this.setDemoRole(D.demoRole || 'seeker');
  },
  persist() { try { localStorage.setItem(this.KEY, JSON.stringify(D)); } catch (e) {} },
  reset() { D = seed(); D.welcomed = true; this.setDemoRole('seeker'); this.persist(); },
  setDemoRole(r) { D.demoRole = r; D.me = D.users.find(u => u.role === r); this.persist(); },
  user() { return D.me; },
  isLoggedIn() { return true; },
  myCompany() { return D.companies.find(c => c.owner === (D.me && D.me.id)); },
  notify(userId, kind, a, b, ref = {}) {
    const txt = NOTIF_TXT[kind](a, b), x = LANG === 'en' ? txt.en : txt.ar;
    const n = { id: rid('n'), user: userId, type: kind, title: x[0], body: x[1], job: ref.job || null, app: ref.app || null, read: false, created: Date.now() };
    D.notifs.unshift(n); D.notifs = D.notifs.slice(0, 200);
    if (userId === D.me.id && this.onNotif) this.onNotif(n);
  },
  ownerOfJob(jid) { const j = D.jobs.find(x => x.id === jid); const c = j && D.companies.find(x => x.id === j.company); return c ? c.owner : null; },
  /* الملف */
  async saveProfile(p) { Object.assign(D.me, p); this.persist(); },
  async setRole(r) { this.setDemoRole(r); },
  async uploadCv(file) { return ''; },
  async fileUrl(bucket, path) { return ''; },
  async setLangPref(l) {},
  /* الشركة */
  async saveCompany(c, file) {
    let mine = this.myCompany();
    if (!mine) { mine = { id: rid('c'), owner: D.me.id, status: 'pending', rating: 0, ratingCount: 0, appsTotal: 0, appsResponded: 0 }; D.companies.push(mine); }
    if (mine.cr && mine.cr !== c.cr) mine.status = 'pending';
    Object.assign(mine, c, { crDoc: file ? file.name : (mine.crDoc || '') });
    this.persist(); return mine;
  },
  async verifyCompany(id, status, reason) {
    const c = D.companies.find(x => x.id === id); c.status = status; c.rejectReason = reason || '';
    this.notify(c.owner, 'company', status, c.name); this.persist();
  },
  /* الوظائف */
  async postJob(j) {
    const c = this.myCompany();
    const job = Object.assign({ id: rid('j'), company: c.id, status: 'pending', views: 0, feat: false, created: Date.now() }, j);
    D.jobs.push(job);
    D.users.filter(u => u.role === 'admin').forEach(u => this.notify(u.id, 'job_pending', c.name, job.title));
    this.persist(); return job;
  },
  async ownerSetJob(id, status) { const j = D.jobs.find(x => x.id === id); j.status = status; this.persist(); },
  async adminSetJob(id, patch) {
    const j = D.jobs.find(x => x.id === id), was = j.status; Object.assign(j, patch);
    const c = D.companies.find(x => x.id === j.company);
    if (patch.status === 'active' && was === 'pending') {
      j.created = Date.now();
      this.notify(c.owner, 'job_live', c.name, j.title, { job: j.id });
      D.users.filter(u => seekerWantsJob(u, j, u.id === 'u-seeker' ? D.alerts : [])).forEach(u => this.notify(u.id, 'job_match', c.name, j.title, { job: j.id }));
    }
    if (patch.status === 'rejected') this.notify(c.owner, 'job_rejected', c.name, j.title, { job: j.id });
    this.persist();
  },
  async viewJob(id) { const j = D.jobs.find(x => x.id === id); if (j) { j.views++; this.persist(); } },
  /* التقديم */
  async apply(jid, note) {
    const p = D.me, j = D.jobs.find(x => x.id === jid);
    const snap = { id: p.id, name: p.name, title: p.title, loc: p.loc, exp: +p.exp || 0, skills: [...(p.skills || [])], about: p.about, edu: p.edu, langs: [...(p.langs || [])], experiences: JSON.parse(JSON.stringify(p.experiences || [])), phone: p.phone, email: p.email, cvTpl: p.cvTpl, cvPath: p.cvPath || '' };
    const a = { id: rid('a'), job: jid, seeker: p.id, snap, status: 'new', note: note || '', match: matchScore(j, p), created: Date.now(), responded: false };
    D.apps.push(a);
    this.notify(this.ownerOfJob(jid), 'new_applicant', p.name, j.title, { job: jid, app: a.id });
    this.persist(); return a;
  },
  async setAppStatus(id, s) {
    const a = D.apps.find(x => x.id === id); if (a.status === s) return;
    a.status = s; if (s !== 'new') a.responded = true;
    this.notify(a.seeker, 'status', s, D.jobs.find(j => j.id === a.job).title, { job: a.job, app: a.id });
    this.persist();
  },
  /* المحادثة والمقابلات */
  async loadThread(appId) {},
  async sendMsg(appId, body) {
    const a = D.apps.find(x => x.id === appId), owner = this.ownerOfJob(a.job);
    D.msgs.push({ id: rid('m'), app: appId, sender: D.me.id, body, created: Date.now() });
    if (D.me.id === owner) { a.responded = true; this.notify(a.seeker, 'message', (D.companies.find(c => c.owner === owner) || {}).name || '', body.slice(0, 80), { app: appId }); }
    else this.notify(owner, 'message', a.snap.name, body.slice(0, 80), { app: appId });
    this.persist();
  },
  async proposeInterview(appId, iv) {
    const a = D.apps.find(x => x.id === appId), j = D.jobs.find(x => x.id === a.job), c = D.companies.find(x => x.id === j.company);
    D.interviews.filter(x => x.app === appId && x.status !== 'cancelled').forEach(x => x.status = 'cancelled');
    D.interviews.push(Object.assign({ id: rid('i'), app: appId, chosen: null, status: 'proposed', created: Date.now() }, iv));
    a.status = 'interview'; a.responded = true;
    this.notify(a.seeker, 'interview', c.name, j.title, { app: appId, job: j.id });
    this.persist();
  },
  async answerInterview(id, chosen, status) {
    const iv = D.interviews.find(x => x.id === id), a = D.apps.find(x => x.id === iv.app), j = D.jobs.find(x => x.id === a.job);
    iv.chosen = chosen || null; iv.status = status;
    this.notify(this.ownerOfJob(a.job), status === 'confirmed' ? 'interview_ok' : 'interview_re', a.snap.name, j.title, { app: a.id });
    this.persist();
  },
  /* التقييم */
  async review(companyId, rating, comment) {
    const c = D.companies.find(x => x.id === companyId), old = D.reviews.find(r => r.company === companyId && r.seeker === D.me.id);
    if (old) { c.rating = (c.rating * c.ratingCount - old.rating + rating) / c.ratingCount; Object.assign(old, { rating, comment, created: Date.now() }); }
    else { c.rating = (c.rating * c.ratingCount + rating) / (c.ratingCount + 1); c.ratingCount++; D.reviews.unshift({ id: rid('r'), company: companyId, seeker: D.me.id, name: D.me.name, rating, comment, created: Date.now() }); }
    this.persist();
  },
  /* أخرى */
  async toggleSave(jid) { const i = D.saved.indexOf(jid); i >= 0 ? D.saved.splice(i, 1) : D.saved.push(jid); this.persist(); return i < 0; },
  async addAlert(cat, loc) { D.alerts.push({ id: rid('al'), cat, loc }); this.persist(); },
  async delAlert(id) { D.alerts = D.alerts.filter(a => a.id !== id); this.persist(); },
  async readNotifs() { D.notifs.forEach(n => { if (n.user === D.me.id) n.read = true; }); this.persist(); },
  async report(jid, reason) { D.reports.push({ id: rid('rp'), job: jid, reason, status: 'open', created: Date.now() }); this.persist(); },
  async resolveReport(id, status) { D.reports.find(r => r.id === id).status = status; this.persist(); },
  async savePushToken() {},
  async signOut() {}, async deleteAccount() { this.reset(); }
};

/* =====================================================
   الوضع الحقيقي (Supabase)
   ===================================================== */
const M = { // تحويل صفوف القاعدة إلى شكل التطبيق
  job: r => ({ id: r.id, company: r.company_id, title: r.title, cat: r.category, loc: r.location, type: r.job_type, min: +r.salary_min || 0, max: +r.salary_max || 0, cur: r.currency, exp: r.exp_years || 0, skills: r.skills || [], desc: r.description, reqs: r.requirements || [], status: r.status, gig: r.is_gig, feat: r.featured, views: r.views || 0, created: Date.parse(r.published_at || r.created_at) }),
  company: r => ({ id: r.id, owner: r.owner_id, name: r.name, cr: r.cr_number, crDoc: r.cr_doc_path, loc: r.location, about: r.about || '', phone: r.phone || '', status: r.status, rejectReason: r.reject_reason || '', rating: +r.rating_avg || 0, ratingCount: r.rating_count || 0, appsTotal: r.apps_total || 0, appsResponded: r.apps_responded || 0 }),
  profile: r => ({ id: r.id, role: r.role, name: r.full_name || '', email: r.email || '', phone: r.phone || '', loc: r.location || '', lang: r.lang || 'ar', title: r.headline || '', about: r.about || '', exp: r.exp_years || 0, edu: r.education || '', skills: r.skills || [], langs: r.languages || [], experiences: r.experiences || [], cvTpl: r.cv_template || 'khanjar', cvPath: r.cv_path || '', cat: r.pref_category || '', open: r.open_to_work !== false }),
  app: r => ({ id: r.id, job: r.job_id, seeker: r.seeker_id, snap: r.snapshot || {}, status: r.status, note: r.note || '', match: r.match || 0, created: Date.parse(r.created_at), responded: !!r.first_response_at }),
  msg: r => ({ id: r.id, app: r.application_id, sender: r.sender_id, body: r.body, created: Date.parse(r.created_at) }),
  iv: r => ({ id: r.id, app: r.application_id, slots: (r.slots || []).map(s => Date.parse(s)), chosen: r.chosen_slot ? Date.parse(r.chosen_slot) : null, mode: r.mode, place: r.place || '', note: r.note || '', status: r.status, created: Date.parse(r.created_at) }),
  review: r => ({ id: r.id, company: r.company_id, seeker: r.seeker_id, name: r.reviewer_name || '', rating: r.rating, comment: r.comment || '', created: Date.parse(r.created_at) }),
  notif: r => ({ id: r.id, user: r.user_id, type: r.type, title: r.title, body: r.body || '', job: r.job_id, app: r.application_id, read: !!r.read_at, created: Date.parse(r.created_at) }),
  report: r => ({ id: r.id, job: r.job_id, reason: r.reason, status: r.status, created: Date.parse(r.created_at) }),
  alert: r => ({ id: r.id, cat: r.category || '', loc: r.location || '' })
};
function emptyD() { return { v: 2, users: [], me: null, companies: [], jobs: [], apps: [], msgs: [], interviews: [], reviews: [], saved: [], alerts: [], reports: [], notifs: [], chat: [], welcomed: true }; }

const RealStore = {
  mode: 'live', sb: null, session: null, onNotif: null, onChange: null, onAuth: null, channel: null,
  async init() {
    this.sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    const { data } = await this.sb.auth.getSession(); this.session = data.session;
    this.sb.auth.onAuthStateChange((ev, s) => {
      const before = this.session && this.session.user && this.session.user.id, after = s && s.user && s.user.id;
      this.session = s; if (before !== after && this.onAuth) this.onAuth(ev);
    });
    D = emptyD(); try { D.chat = JSON.parse(localStorage.getItem('wz-chat') || '[]'); } catch (e) {}
    await this.load();
  },
  persist() { try { localStorage.setItem('wz-chat', JSON.stringify(D.chat.slice(-30))); } catch (e) {} },
  user() { return D.me; },
  isLoggedIn() { return !!(this.session && this.session.user); },
  uid() { return this.session && this.session.user && this.session.user.id; },
  myCompany() { return D.companies.find(c => c.owner === this.uid()); },
  async q(p) { const { data, error } = await p; if (error) { console.warn(error); throw error; } return data; },
  async load() {
    const sb = this.sb, id = this.uid(), keep = D.chat;
    const [jobs, comps, revs] = await Promise.all([
      this.q(sb.from('jobs').select('*').order('created_at', { ascending: false }).limit(600)),
      this.q(sb.from('companies').select('*').limit(2000)),
      this.q(sb.from('reviews').select('*').order('created_at', { ascending: false }).limit(1000))
    ]);
    D = emptyD(); D.chat = keep;
    D.jobs = jobs.map(M.job); D.companies = comps.map(M.company); D.reviews = revs.map(M.review);
    if (!id) { this.subscribe(); return; }
    const me = await this.q(sb.from('profiles').select('*').eq('id', id).maybeSingle());
    D.me = me ? M.profile(me) : { id, role: null, name: '', skills: [], langs: [], experiences: [] };
    D.users = [D.me];
    if (D.me.lang && D.me.lang !== LANG) setLang(D.me.lang);
    const [apps, msgs, ivs, saved, alerts, notifs] = await Promise.all([
      this.q(sb.from('applications').select('*').order('created_at', { ascending: false }).limit(1000)),
      this.q(sb.from('messages').select('*').order('created_at', { ascending: true }).limit(2000)),
      this.q(sb.from('interviews').select('*').order('created_at', { ascending: false }).limit(500)),
      this.q(sb.from('saved_jobs').select('job_id').eq('user_id', id)),
      this.q(sb.from('job_alerts').select('*').eq('user_id', id)),
      this.q(sb.from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(80))
    ]);
    D.apps = apps.map(M.app); D.msgs = msgs.map(M.msg); D.interviews = ivs.map(M.iv);
    D.saved = saved.map(s => s.job_id); D.alerts = alerts.map(M.alert); D.notifs = notifs.map(M.notif);
    // وظائف قُدّم عليها لكنها لم تعد منشورة
    const missing = [...new Set(D.apps.map(a => a.job))].filter(j => !D.jobs.some(x => x.id === j));
    if (missing.length) { const more = await this.q(sb.from('jobs').select('*').in('id', missing)); D.jobs.push(...more.map(M.job)); }
    if (D.me.role === 'admin') D.reports = (await this.q(sb.from('reports').select('*').order('created_at', { ascending: false }).limit(300))).map(M.report);
    this.subscribe();
  },
  subscribe() {
    if (this.channel) { this.sb.removeChannel(this.channel); this.channel = null; }
    const id = this.uid(); if (!id) return;
    let t = null; const soon = () => { clearTimeout(t); t = setTimeout(async () => { await this.load(); this.onChange && this.onChange(); }, 600); };
    this.channel = this.sb.channel('wz-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + id }, p => { const n = M.notif(p.new); D.notifs.unshift(n); this.onNotif && this.onNotif(n); soon(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => { const m = M.msg(p.new); if (!D.msgs.some(x => x.id === m.id)) { D.msgs.push(m); this.onChange && this.onChange('msg'); } })
      .subscribe();
  },
  /* الدخول */
  redirect() { return location.origin + location.pathname; },
  async google() {
    if (Native.isApp) {
      const { data, error } = await this.sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: CFG.nativeScheme + '://auth', skipBrowserRedirect: true } });
      if (error) throw error; await Native.openUrl(data.url);
    } else {
      const { error } = await this.sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: this.redirect() } }); if (error) throw error;
    }
  },
  async handleDeepLink(url) {
    const u = new URL(url.replace(CFG.nativeScheme + '://', 'https://x/')), code = u.searchParams.get('code');
    if (code) { await this.sb.auth.exchangeCodeForSession(code); Native.closeBrowser(); }
  },
  async phoneSend(phone) { const { error } = await this.sb.auth.signInWithOtp({ phone }); if (error) throw error; },
  async phoneVerify(phone, token) { const { error } = await this.sb.auth.verifyOtp({ phone, token, type: 'sms' }); if (error) throw error; },
  async signOut() { await this.sb.auth.signOut(); },
  async deleteAccount() { await this.q(this.sb.rpc('delete_my_account')); await this.sb.auth.signOut(); },
  /* الملف */
  async saveProfile(p) {
    await this.q(this.sb.from('profiles').update({ full_name: p.name, phone: p.phone, location: p.loc || null, headline: p.title, about: p.about, exp_years: +p.exp || 0, education: p.edu, skills: p.skills, languages: p.langs, experiences: p.experiences, cv_template: p.cvTpl, cv_path: p.cvPath || null, pref_category: p.cat || null, open_to_work: p.open !== false }).eq('id', this.uid()));
    Object.assign(D.me, p);
  },
  async setRole(r) { await this.q(this.sb.from('profiles').update({ role: r, lang: LANG }).eq('id', this.uid())); D.me.role = r; },
  async setLangPref(l) { if (this.uid()) await this.sb.from('profiles').update({ lang: l }).eq('id', this.uid()); },
  async uploadFile(bucket, file) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = this.uid() + '/' + Date.now() + '.' + ext;
    const { error } = await this.sb.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || undefined }); if (error) throw error;
    return path;
  },
  async uploadCv(file) { return this.uploadFile('cvs', file); },
  async fileUrl(bucket, path) { if (!path) return ''; const { data } = await this.sb.storage.from(bucket).createSignedUrl(path, 900); return data ? data.signedUrl : ''; },
  /* الشركة */
  async saveCompany(c, file) {
    const row = { name: c.name, cr_number: c.cr, location: c.loc, about: c.about, phone: c.phone };
    if (file) row.cr_doc_path = await this.uploadFile('cr-docs', file);
    const mine = this.myCompany();
    if (mine) await this.q(this.sb.from('companies').update(row).eq('id', mine.id));
    else await this.q(this.sb.from('companies').insert(Object.assign(row, { owner_id: this.uid() })));
    await this.load();
  },
  async verifyCompany(id, status, reason) { await this.q(this.sb.from('companies').update({ status, reject_reason: reason || null }).eq('id', id)); await this.load(); },
  /* الوظائف */
  jobRow(j) { return { title: j.title, category: j.cat, location: j.loc, job_type: j.type, salary_min: j.min, salary_max: j.max, currency: j.cur, exp_years: j.exp, skills: j.skills, description: j.desc, requirements: j.reqs, is_gig: !!j.gig }; },
  async postJob(j) { await this.q(this.sb.from('jobs').insert(Object.assign(this.jobRow(j), { company_id: this.myCompany().id }))); await this.load(); },
  async ownerSetJob(id, status) { await this.q(this.sb.from('jobs').update({ status }).eq('id', id)); await this.load(); },
  async adminSetJob(id, patch) {
    const row = {}; if ('status' in patch) row.status = patch.status; if ('feat' in patch) row.featured = patch.feat;
    await this.q(this.sb.from('jobs').update(row).eq('id', id)); await this.load();
  },
  async viewJob(id) { this.sb.rpc('inc_job_views', { p_job: id }).then(() => {}, () => {}); },
  /* التقديم */
  async apply(jid, note) { await this.q(this.sb.from('applications').insert({ job_id: jid, seeker_id: this.uid(), note: note || null })); await this.load(); },
  async setAppStatus(id, s) { await this.q(this.sb.from('applications').update({ status: s }).eq('id', id)); await this.load(); },
  /* المحادثة والمقابلات */
  async loadThread(appId) {
    const rows = await this.q(this.sb.from('messages').select('*').eq('application_id', appId).order('created_at'));
    D.msgs = D.msgs.filter(m => m.app !== appId).concat(rows.map(M.msg));
    this.sb.from('messages').update({ read_at: new Date().toISOString() }).eq('application_id', appId).neq('sender_id', this.uid()).is('read_at', null).then(() => {}, () => {});
  },
  async sendMsg(appId, body) {
    const r = await this.q(this.sb.from('messages').insert({ application_id: appId, sender_id: this.uid(), body }).select().single());
    if (!D.msgs.some(m => m.id === r.id)) D.msgs.push(M.msg(r));
  },
  async proposeInterview(appId, iv) {
    await this.q(this.sb.from('interviews').insert({ application_id: appId, slots: iv.slots.map(s => new Date(s).toISOString()), mode: iv.mode, place: iv.place, note: iv.note }));
    await this.load();
  },
  async answerInterview(id, chosen, status) { await this.q(this.sb.from('interviews').update({ chosen_slot: chosen ? new Date(chosen).toISOString() : null, status }).eq('id', id)); await this.load(); },
  /* التقييم */
  async review(companyId, rating, comment) { await this.q(this.sb.from('reviews').upsert({ company_id: companyId, seeker_id: this.uid(), rating, comment }, { onConflict: 'company_id,seeker_id' })); await this.load(); },
  /* أخرى */
  async toggleSave(jid) {
    const on = D.saved.includes(jid);
    if (on) await this.q(this.sb.from('saved_jobs').delete().eq('user_id', this.uid()).eq('job_id', jid));
    else await this.q(this.sb.from('saved_jobs').insert({ user_id: this.uid(), job_id: jid }));
    on ? D.saved.splice(D.saved.indexOf(jid), 1) : D.saved.push(jid); return !on;
  },
  async addAlert(cat, loc) { await this.q(this.sb.from('job_alerts').insert({ user_id: this.uid(), category: cat || null, location: loc || null })); await this.load(); },
  async delAlert(id) { await this.q(this.sb.from('job_alerts').delete().eq('id', id)); D.alerts = D.alerts.filter(a => a.id !== id); },
  async readNotifs() { await this.sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', this.uid()).is('read_at', null); D.notifs.forEach(n => n.read = true); },
  async report(jid, reason) { await this.q(this.sb.from('reports').insert({ job_id: jid, reporter_id: this.uid(), reason })); },
  async resolveReport(id, status) { await this.q(this.sb.from('reports').update({ status }).eq('id', id)); await this.load(); },
  async savePushToken(token, platform) { if (this.uid()) await this.sb.from('push_tokens').upsert({ token, user_id: this.uid(), platform }); },
  async aiToken() { return this.session ? this.session.access_token : CFG.supabaseAnonKey; }
};

const Store = REAL ? RealStore : LocalStore;

/* ---------- إحصاءات الشركة ---------- */
function companyStats(c) {
  if (!c) return { rating: 0, count: 0, resp: null };
  let total = c.appsTotal || 0, resp = c.appsResponded || 0;
  if (!REAL) { const apps = D.apps.filter(a => { const j = D.jobs.find(x => x.id === a.job); return j && j.company === c.id; }); total += apps.length; resp += apps.filter(a => a.responded).length; }
  return { rating: c.rating || 0, count: c.ratingCount || 0, resp: total ? Math.round(resp / total * 100) : null };
}
