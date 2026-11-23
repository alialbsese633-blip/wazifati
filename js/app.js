/* =====================================================
   وظيفتي v1.0 - منطق التطبيق والواجهات
   ===================================================== */
const STORE='wazifati-v1.0';
let D=seed();
try{const raw=localStorage.getItem(STORE);if(raw)D=Object.assign(seed(),JSON.parse(raw))}catch(e){}
const S={role:'seeker',view:'home',jobId:null,f:{q:'',wil:'',cat:'',type:'',gig:false,fit:false,sort:'new'},empJob:'all',chatOpen:false,busy:false};
function save(){try{localStorage.setItem(STORE,JSON.stringify(D))}catch(e){}}

/* ---------- أدوات ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emp=id=>D.employers.find(x=>x.id===id)||{name:'—',verified:false};
const job=id=>D.jobs.find(j=>j.id===id);
const ago=d=>d===0?'اليوم':d===1?'أمس':`قبل ${d} أيام`;
const sal=j=>j.gig?`${j.min}–${j.max} ر.ع / اليوم`:`${j.min}–${j.max} ر.ع / شهرياً`;
const norm=s=>String(s).trim().toLowerCase();
const activeJobs=()=>D.jobs.filter(j=>j.status==='active');
function toast(m){document.querySelectorAll('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function match(j,p){
 const js=j.skills.map(norm),ps=(p.skills||[]).map(norm);
 const sk=js.length?js.filter(x=>ps.includes(x)).length/js.length:0;
 const w=(p.wil===j.wil||j.wil==='عن بعد')?15:0;
 const ex=+p.exp>=j.exp?15:Math.round(15*(+p.exp||0)/Math.max(j.exp,1));
 return Math.round(sk*70+w+ex);
}
const fits=j=>!(j.nat==='عماني فقط'&&D.profile.nat!=='omani');
function complete(p){const c=[p.name,p.phone,p.wil,p.title,p.edu,p.about&&p.about.length>=20,p.skills.length>=3,(p.experiences||[]).length>0,(p.langs||[]).length>0];return Math.round(c.filter(Boolean).length/c.length*100)}
function logo(id){const x=emp(id);return `<div class="lg" style="background:${COLORS[id%COLORS.length]}">${esc(x.name.trim()[0]||'?')}</div>`}
const myApp=jid=>D.apps.find(a=>a.mine&&a.job===jid);
function notify(t,b){D.notifs.unshift({id:D.nextId++,t,b,read:false})}
function opts(arr,sel,ph){return (ph?`<option value="">${ph}</option>`:'')+arr.map(x=>`<option ${x===sel?'selected':''}>${esc(x)}</option>`).join('')}

/* ---------- الهيكل ---------- */
const NAVS={
 seeker:[['home','الوظائف','🔎'],['saved','المحفوظة','♡'],['apps','طلباتي','📨'],['profile','ملفي','👤'],['cv','قوالب السيرة','📄'],['alerts','التنبيهات','🔔']],
 employer:[['dash','لوحتي','📊'],['post','نشر وظيفة','➕'],['jobs','وظائفي','💼'],['applicants','المتقدمون','👥']],
 admin:[['overview','نظرة عامة','📊'],['review','المراجعة','🛡️'],['employers','الجهات','🏢'],['reports','البلاغات','⚠️']]
};
const HOME={seeker:'home',employer:'dash',admin:'overview'};
function badges(){
 const mine=D.jobs.filter(j=>j.emp===1).map(j=>j.id);
 return {review:D.jobs.filter(j=>j.status==='pending').length,reports:D.reports.filter(r=>r.status==='open').length,applicants:D.apps.filter(a=>mine.includes(a.job)&&a.status==='جديد').length};
}
function renderShell(){
 $('#roles').innerHTML=[['seeker','باحث عن عمل'],['employer','صاحب عمل'],['admin','الإدارة']].map(([k,l])=>`<button class="${S.role===k?'on':''}" data-a="role" data-v="${k}">${l}</button>`).join('');
 const b=badges(),un=D.notifs.filter(n=>!n.read).length;
 $('#bellN').innerHTML=un?`<b>${un}</b>`:'';
 const items=NAVS[S.role];
 $('#nav').innerHTML=items.map(([k,l])=>`<button class="${S.view===k?'on':''}" data-a="view" data-v="${k}">${l}${b[k]?`<span class="n">${b[k]}</span>`:''}</button>`).join('');
 $('#bnav').innerHTML=items.slice(0,5).map(([k,l,i])=>`<button class="${S.view===k?'on':''}" data-a="view" data-v="${k}"><i>${i}</i>${l}</button>`).join('');
}
function render(){
 renderShell();
 const V={seeker:{home:vHome,job:vJob,saved:vSaved,apps:vApps,profile:vProfile,cv:vCV,alerts:vAlerts,brand:vBrand},
  employer:{dash:vEDash,post:vPost,jobs:vEJobs,applicants:vEApps,brand:vBrand},
  admin:{overview:vAOver,review:vAReview,employers:vAEmp,reports:vARep,brand:vBrand}};
 const f=V[S.role][S.view]||V[S.role][HOME[S.role]];
 const app=$('#app');app.innerHTML=`<div class="fade">${f()}</div>`;
 if(S.role==='seeker'&&S.view==='home')updateRes();
 window.scrollTo({top:0});
}

/* ============ باحث عن عمل ============ */
function vHome(){
 const a=activeJobs(),hits=D.alerts.length?a.filter(j=>D.alerts.some(x=>(!x.cat||x.cat===j.cat)&&(!x.wil||x.wil===j.wil))&&j.ago<=3).length:0;
 return `<div class="hero"><h1>وظيفتك القادمة في عُمان، بذكاء</h1><p>وظائف موثّقة، ومساعد ذكاء اصطناعي يبحث لك ويجهّز سيرتك ومقابلتك.</p>
 <div class="aiq"><span style="padding:8px 4px;color:#5B3DF5">✦</span><input id="askq" placeholder="اسأل المساعد: أبغى وظيفة محاسب في صلالة راتبها فوق 400" ><button class="btn ai sm" data-a="askhero">اسأل</button></div>
 <div class="filters">
  <input placeholder="ابحث بالمسمى أو المهارة أو الشركة" value="${esc(S.f.q)}" data-c="q">
  <select data-c="wil">${opts(WIL,S.f.wil,'كل الولايات')}</select>
  <select data-c="cat">${opts(CATS,S.f.cat,'كل التخصصات')}</select>
  <select data-c="type">${opts(TYPES,S.f.type,'كل الأنواع')}</select>
 </div>
 <div class="toggles">
  <label><input type="checkbox" data-c="gig" ${S.f.gig?'checked':''}> أعمال مؤقتة بالأجر اليومي</label>
  <label><input type="checkbox" data-c="fit" ${S.f.fit?'checked':''}> تناسب جنسيتي فقط</label>
  <label>الترتيب: <select data-c="sort" style="padding:3px 8px;border-radius:8px;border:0;color:#1B1035"><option value="new" ${S.f.sort==='new'?'selected':''}>الأحدث</option><option value="match" ${S.f.sort==='match'?'selected':''}>الأنسب لي</option></select></label>
 </div></div>
 <div class="stats">
  <div class="card stat"><b>${a.length}</b><span class="mut">وظيفة متاحة</span></div>
  <div class="card stat"><b>${D.employers.filter(x=>x.verified).length}</b><span class="mut">جهة موثّقة</span></div>
  <div class="card stat" style="cursor:pointer" data-a="view" data-v="profile"><b>${complete(D.profile)}%</b><span class="mut">اكتمال ملفك</span></div>
  ${D.alerts.length?`<div class="card stat"><b>${hits}</b><span class="mut">جديدة تطابق تنبيهاتك</span></div>`:''}
 </div><div id="res"></div>`;
}
function filtered(){
 const f=S.f,q=norm(f.q);
 const r=activeJobs().filter(j=>(!q||[j.title,j.cat,emp(j.emp).name,...j.skills].some(x=>norm(x).includes(q)))&&(!f.wil||j.wil===f.wil)&&(!f.cat||j.cat===f.cat)&&(!f.type||j.type===f.type)&&(!f.gig||j.gig)&&(!f.fit||fits(j)));
 r.sort(f.sort==='match'?(x,y)=>match(y,D.profile)-match(x,D.profile):(x,y)=>(y.feat?1:0)-(x.feat?1:0)||x.ago-y.ago);
 return r;
}
function jobCard(j){
 const x=emp(j.emp),m=match(j,D.profile),sv=D.saved.includes(j.id),ap=myApp(j.id);
 return `<div class="card job ${j.feat?'feat':''}" data-a="open" data-v="${j.id}">
 <div class="row" style="align-items:flex-start">${logo(j.emp)}<div class="sp"><h3>${esc(j.title)}</h3><div class="mut">${esc(x.name)} ${x.verified?'<span class="chip">✓ موثّقة</span>':''}</div></div>
 <button class="heart ${sv?'on':''}" data-a="save" data-v="${j.id}" aria-label="حفظ">${sv?'♥':'♡'}</button></div>
 <div class="meta"><span>📍 ${esc(j.wil)}</span><span>🕒 ${esc(j.type)}</span><span>💰 ${sal(j)}</span></div>
 <div>${j.feat?'<span class="chip gold">★ مميزة</span> ':''}${j.skills.slice(0,3).map(s=>`<span class="chip gray">${esc(s)}</span> `).join('')}${j.nat==='عماني فقط'?'<span class="chip blue">للعمانيين</span> ':''}${j.gig?'<span class="chip blue">مؤقت</span>':''}</div>
 <div class="row mut"><span>${ago(j.ago)}</span><span class="sp"></span>${ap?`<span class="chip">قدّمت: ${ap.status}</span>`:`<span class="match">مطابقة ${m}%</span>`}</div></div>`;
}
function updateRes(){
 const r=filtered(),el=$('#res');if(!el)return;
 el.innerHTML=`<div class="mut" style="margin-bottom:8px">${r.length} نتيجة</div>`+(r.length?`<div class="grid">${r.map(jobCard).join('')}</div>`:'<div class="empty card">لا توجد نتائج. جرّب تغيير الفلاتر أو اسأل المساعد الذكي.</div>');
}
function vJob(){
 const j=job(S.jobId);if(!j)return vHome();
 const x=emp(j.emp),m=match(j,D.profile),ap=myApp(j.id),sv=D.saved.includes(j.id),p=D.profile;
 const miss=j.skills.filter(s=>!p.skills.map(norm).includes(norm(s)));
 return `<button class="btn ghost sm" data-a="view" data-v="home">→ رجوع للوظائف</button>
 <div class="det" style="margin-top:12px"><div class="card">
  <div class="row" style="align-items:flex-start">${logo(j.emp)}<div class="sp"><h1 style="font-size:23px">${esc(j.title)}</h1><div class="mut">${esc(x.name)} ${x.verified?'<span class="chip">✓ جهة موثّقة</span>':'<span class="chip red">غير موثّقة بعد</span>'} <span class="chip gray">نسبة الرد ${x.resp||0}%</span></div></div></div>
  <div class="meta" style="margin:12px 0"><span>📍 ${esc(j.wil)}</span><span>🕒 ${esc(j.type)}</span><span>💰 ${sal(j)}</span><span>🎓 خبرة ${j.exp} سنة</span><span>👥 ${esc(j.nat)}</span><span>${ago(j.ago)}</span></div>
  <h3>وصف الوظيفة</h3><p>${esc(j.desc)}</p>
  <h3 style="margin-top:12px">المتطلبات</h3><ul>${j.reqs.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>
  <h3 style="margin-top:12px">المهارات</h3><div>${j.skills.map(s=>`<span class="chip">${esc(s)}</span> `).join('')}</div>
  <div class="aibox"><div class="row"><span class="chip ai">✦ مساعد وظيفتي</span><span class="sp"></span>
   <button class="btn ai sm" data-a="aijob" data-v="fit">هل أناسبها؟</button><button class="btn ai sm" data-a="aijob" data-v="interview">جهّزني للمقابلة</button><button class="btn ai sm" data-a="aijob" data-v="cover">رسالة تقديم</button></div>
   <div class="out" id="aiout" style="margin-top:10px"><span class="mut">اختر ما تريد وسيحلل المساعد الوظيفة مقابل ملفك.</span></div></div>
  <div class="card" style="background:var(--redl);border-color:#f1cdc5;margin-top:16px;font-size:13px;box-shadow:none">⚠️ لا تدفع أي مبلغ مقابل التوظيف. إذا طلبت جهة رسوماً قبل العمل، <a href="#" data-a="report" data-v="${j.id}">أبلغ عنها</a>.</div>
 </div>
 <div><div class="card">
  <div class="mut">مدى مطابقتك للوظيفة</div><div class="match" style="font-size:32px">${m}%</div>
  <div class="bar"><i style="width:${m}%"></i></div>
  ${miss.length?`<p class="mut" style="margin-top:8px">مهارات ناقصة في ملفك: ${miss.map(esc).join('، ')}</p>`:'<p class="mut" style="margin-top:8px">ملفك يغطي كل المهارات المطلوبة 👌</p>'}
  <div style="margin-top:14px;display:grid;gap:8px">
  ${ap?`<div class="chip" style="text-align:center;padding:8px">حالة طلبك: ${ap.status}</div>`:`<button class="btn" data-a="apply" data-v="${j.id}">قدّم الآن</button>`}
  <button class="btn ghost" data-a="save" data-v="${j.id}">${sv?'إزالة من المحفوظة':'حفظ الوظيفة'}</button>
  <button class="btn ghost" data-a="share" data-v="${j.id}">نسخ رابط/نص الوظيفة</button></div>
 </div></div></div>`;
}
function vSaved(){const l=D.saved.map(job).filter(j=>j&&j.status==='active');return `<h2>الوظائف المحفوظة</h2>`+(l.length?`<div class="grid">${l.map(jobCard).join('')}</div>`:'<div class="empty card">لم تحفظ أي وظيفة بعد. اضغط ♡ على أي وظيفة.</div>')}
function vApps(){
 const l=D.apps.filter(a=>a.mine);
 return `<h2>طلباتي</h2>`+(l.length?l.map(a=>{const j=job(a.job),i=['جديد','تمت المراجعة','مقابلة','مقبول'].indexOf(a.status);
  return `<div class="card" style="margin-bottom:10px;cursor:pointer" data-a="open" data-v="${j.id}"><div class="row">${logo(j.emp)}<div class="sp"><h3>${esc(j.title)}</h3><div class="mut">${esc(emp(j.emp).name)} · ${ago(a.ago)}</div></div><span class="chip ${STC[a.status]}">${a.status}</span></div>
  ${a.status==='مرفوض'?'<p class="mut" style="margin-top:8px">لم يتم اختيارك هذه المرة. اسأل المساعد عن وظائف مشابهة.</p>':`<div class="steps">${[0,1,2,3].map(k=>`<span class="${k<=i?'on':''}"></span>`).join('')}</div><div class="row mut" style="justify-content:space-between;margin-top:4px"><span>جديد</span><span>مراجعة</span><span>مقابلة</span><span>قبول</span></div>`}</div>`}).join(''):'<div class="empty card">لم تقدّم على أي وظيفة بعد.</div>');
}
function vProfile(){
 const p=D.profile,c=complete(p),tips=[];
 if(p.skills.length<3)tips.push('أضف 3 مهارات على الأقل');if(!p.about||p.about.length<20)tips.push('اكتب نبذة');if(!p.edu)tips.push('أضف مؤهلك');if(!(p.experiences||[]).length)tips.push('أضف خبرة');
 return `<div class="row"><h2 class="sp">ملفي الشخصي</h2><button class="btn gold sm" data-a="view" data-v="cv">📄 قوالب السيرة</button></div>
 <div class="card" style="margin-bottom:14px"><div class="row"><b>اكتمال الملف ${c}%</b><span class="sp"></span><span class="mut">${tips.length?tips.join(' · '):'ملفك ممتاز ✓'}</span></div><div class="bar" style="margin-top:6px"><i style="width:${c}%"></i></div></div>
 <div class="card"><div class="two">
 <div class="field"><label>الاسم الكامل</label><input id="p_name" value="${esc(p.name)}"></div>
 <div class="field"><label>المسمى الوظيفي</label><input id="p_title" value="${esc(p.title)}"></div>
 <div class="field"><label>رقم الجوال</label><input id="p_phone" inputmode="tel" value="${esc(p.phone)}"></div>
 <div class="field"><label>البريد الإلكتروني</label><input id="p_email" type="email" value="${esc(p.email||'')}"></div>
 <div class="field"><label>الولاية</label><select id="p_wil">${opts(WIL.filter(w=>w!=='عن بعد'),p.wil)}</select></div>
 <div class="field"><label>الجنسية</label><select id="p_nat"><option value="omani" ${p.nat==='omani'?'selected':''}>عماني</option><option value="expat" ${p.nat==='expat'?'selected':''}>مقيم / وافد</option></select></div>
 <div class="field"><label>سنوات الخبرة</label><input id="p_exp" type="number" min="0" value="${esc(p.exp)}"></div>
 <div class="field"><label>المؤهل الدراسي</label><input id="p_edu" value="${esc(p.edu)}"></div>
 <div class="field"><label>المهارات (افصل بفاصلة)</label><input id="p_skills" value="${esc(p.skills.join('، '))}"></div>
 <div class="field"><label>اللغات (افصل بفاصلة)</label><input id="p_langs" value="${esc((p.langs||[]).join('، '))}"></div></div>
 <div class="field"><div class="row" style="margin-bottom:4px"><label class="sp" style="margin:0">نبذة عنك</label><button class="btn ai sm" data-a="aiabout">✦ حسّن بالذكاء الاصطناعي</button></div><textarea id="p_about" rows="4">${esc(p.about)}</textarea></div>
 <h3 style="margin:8px 0">الخبرات العملية</h3><div id="exps">${(p.experiences||[]).map((x,i)=>expRow(x,i)).join('')}</div>
 <button class="btn ghost sm" data-a="addexp" style="margin-bottom:14px">+ إضافة خبرة</button><br>
 <button class="btn" data-a="saveprofile">حفظ الملف</button></div>`;
}
function expRow(x,i){return `<div class="card" style="margin-bottom:8px;box-shadow:none;background:#faf9fd" data-exp="${i}"><div class="two"><div class="field"><label>المسمى</label><input class="x_title" value="${esc(x.title)}"></div><div class="field"><label>الجهة</label><input class="x_company" value="${esc(x.company)}"></div><div class="field"><label>الفترة</label><input class="x_period" value="${esc(x.period)}" placeholder="2023 - الآن"></div><div class="field"><label>&nbsp;</label><button class="btn red sm" data-a="delexp" data-v="${i}">حذف</button></div></div><div class="field"><label>ما أنجزته</label><textarea class="x_details" rows="2">${esc(x.details)}</textarea></div></div>`}
function readProfile(){
 const p=D.profile,g=id=>$('#'+id)?$('#'+id).value.trim():'';
 if(!$('#p_name'))return;
 Object.assign(p,{name:g('p_name'),title:g('p_title'),phone:g('p_phone'),email:g('p_email'),wil:g('p_wil'),nat:g('p_nat'),exp:Math.max(0,+g('p_exp')||0),edu:g('p_edu'),about:g('p_about'),
  skills:g('p_skills').split(/[,،]/).map(s=>s.trim()).filter(Boolean),langs:g('p_langs').split(/[,،]/).map(s=>s.trim()).filter(Boolean),
  experiences:[...document.querySelectorAll('[data-exp]')].map(r=>({title:r.querySelector('.x_title').value.trim(),company:r.querySelector('.x_company').value.trim(),period:r.querySelector('.x_period').value.trim(),details:r.querySelector('.x_details').value.trim()})).filter(x=>x.title||x.company)});
}
function vCV(){
 const p=D.profile;
 return `<div class="row"><h2 class="sp">قوالب السيرة الذاتية الحصرية</h2><button class="btn ghost sm" data-a="view" data-v="profile">تعديل البيانات</button><button class="btn gold sm" data-a="printcv">⬇ طباعة / حفظ PDF</button></div>
 <p class="mut" style="margin-bottom:12px">4 قوالب صُممت خصيصاً لوظيفتي. اختر قالباً وستُعبّأ بياناتك تلقائياً، وهو ما يراه صاحب العمل عند تقديمك.</p>
 <div class="tpls">${Object.entries(CV_TPLS).map(([k,t])=>`<div class="tpl ${p.cvTpl===k?'on':''}" data-a="pickcv" data-v="${k}"><div class="thumb"><div>${t.render(p)}</div></div><div class="nm"><span>${t.name}</span>${p.cvTpl===k?'<span class="chip gold">مختار</span>':''}</div><div class="mut" style="padding:0 10px 10px">${t.desc}</div></div>`).join('')}</div>
 <h3 style="margin:20px 0 10px">المعاينة الكاملة</h3><div class="card tw" style="padding:0;overflow:auto"><div style="width:794px;margin:auto">${CV_TPLS[p.cvTpl||'khanjar'].render(p)}</div></div>`;
}
function vAlerts(){
 return `<h2>تنبيهات الوظائف</h2><div class="card" style="margin-bottom:14px"><p class="mut" style="margin-bottom:10px">اختر التخصص والولاية، وسنرسل لك إشعاراً عند نشر وظيفة مطابقة.</p>
 <div class="two"><div class="field"><label>التخصص</label><select id="al_cat">${opts(CATS,'','أي تخصص')}</select></div><div class="field"><label>الولاية</label><select id="al_wil">${opts(WIL,'','أي ولاية')}</select></div></div>
 <button class="btn" data-a="addalert">إضافة تنبيه</button></div>`+(D.alerts.length?D.alerts.map((a,i)=>`<div class="card row" style="margin-bottom:8px"><span class="sp">🔔 ${esc(a.cat||'أي تخصص')} · ${esc(a.wil||'أي ولاية')}</span><button class="btn red sm" data-a="delalert" data-v="${i}">حذف</button></div>`).join(''):'<div class="empty card">لا توجد تنبيهات.</div>');
}

/* ============ صاحب العمل ============ */
const E=1;
const myJobs=()=>D.jobs.filter(j=>j.emp===E);
const myJobApps=()=>D.apps.filter(a=>myJobs().some(j=>j.id===a.job));
const JS={active:['منشورة',''],pending:['قيد المراجعة','gold'],closed:['مغلقة','gray'],rejected:['مرفوضة','red'],paused:['موقوفة','red']};
function funnel(apps){return ST.map(s=>{const n=apps.filter(a=>a.status===s).length;return `<div class="row" style="margin:6px 0"><span style="width:110px">${s}</span><div class="bar sp"><i style="width:${apps.length?n/apps.length*100:0}%"></i></div><b>${n}</b></div>`}).join('')}
function vEDash(){
 const jobs=myJobs(),apps=myJobApps();
 return `<div class="hero"><h1>أهلاً، ${esc(emp(E).name)}</h1><p>انشر وظيفتك في دقيقة: اكتب المسمى فقط والمساعد الذكي يكمل الباقي.</p><button class="btn gold" data-a="view" data-v="post">✦ نشر وظيفة بالذكاء الاصطناعي</button></div>
 <div class="stats"><div class="card stat"><b>${jobs.filter(j=>j.status==='active').length}</b><span class="mut">وظائف منشورة</span></div><div class="card stat"><b>${apps.length}</b><span class="mut">إجمالي المتقدمين</span></div><div class="card stat"><b>${apps.filter(a=>a.status==='جديد').length}</b><span class="mut">طلبات جديدة</span></div><div class="card stat"><b>${jobs.reduce((s,j)=>s+j.views,0)}</b><span class="mut">مشاهدات</span></div></div>
 <div class="card"><h3 style="margin-bottom:8px">مسار التوظيف</h3>${funnel(apps)}</div>`;
}
function vPost(){
 return `<h2>نشر وظيفة جديدة</h2>
 <div class="card" style="margin-bottom:14px"><h3 style="margin-bottom:8px">ابدأ من قالب جاهز</h3><div class="row">${JOB_TEMPLATES.map((t,i)=>`<button class="btn ghost sm" data-a="usetpl" data-v="${i}">${t.icon} ${t.title}</button>`).join('')}</div></div>
 <div class="card"><p class="mut" style="margin-bottom:12px">تُراجَع الوظيفة من الإدارة قبل ظهورها، لحماية الباحثين من الإعلانات المضللة.</p>
 <div class="field"><label>المسمى الوظيفي</label><div class="row"><input id="n_title" class="sp" placeholder="مثال: محاسب، موظف استقبال، فني تكييف" style="padding:10px 12px;border-radius:11px;border:1px solid var(--line)"><button class="btn ai" data-a="aijobad">✦ اكتب الإعلان بالذكاء</button></div></div>
 <div class="two"><div class="field"><label>التخصص</label><select id="n_cat">${opts(CATS)}</select></div><div class="field"><label>الولاية</label><select id="n_wil">${opts(WIL,'صلالة')}</select></div>
 <div class="field"><label>نوع الدوام</label><select id="n_type">${opts(TYPES)}</select></div><div class="field"><label>سنوات الخبرة</label><input id="n_exp" type="number" min="0" value="0"></div>
 <div class="field"><label>الراتب من (ر.ع)</label><input id="n_min" type="number" min="0"></div><div class="field"><label>الراتب إلى (ر.ع)</label><input id="n_max" type="number" min="0"></div>
 <div class="field"><label>الجنسية المطلوبة</label><select id="n_nat"><option>أي جنسية</option><option>عماني فقط</option></select></div><div class="field"><label>المهارات (بفاصلة)</label><input id="n_skills"></div></div>
 <div class="field"><label>وصف الوظيفة</label><textarea id="n_desc" rows="3"></textarea></div>
 <div class="field"><label>المتطلبات (كل سطر متطلب)</label><textarea id="n_reqs" rows="3"></textarea></div>
 <label class="row" style="margin-bottom:12px"><input type="checkbox" id="n_gig"> عمل مؤقت بأجر يومي</label>
 <button class="btn" data-a="postjob">إرسال للمراجعة</button></div>`;
}
function fillJobForm(t){const s=(id,v)=>{const el=$('#'+id);if(el&&v!==undefined&&v!==null)el.value=v};
 if(t.title&&!$('#n_title').value)s('n_title',t.title);if(CATS.includes(t.cat))s('n_cat',t.cat);if(TYPES.includes(t.type))s('n_type',t.type);
 s('n_exp',t.exp);s('n_min',t.min);s('n_max',t.max);s('n_skills',(t.skills||[]).join('، '));s('n_desc',t.desc);s('n_reqs',(t.reqs||[]).join('\n'))}
function vEJobs(){
 return `<h2>وظائفي</h2>`+myJobs().map(j=>{const n=D.apps.filter(a=>a.job===j.id).length,s=JS[j.status];
 return `<div class="card row" style="margin-bottom:8px"><div class="sp"><h3>${esc(j.title)} ${j.feat?'<span class="chip gold">★ مميزة</span>':''}</h3><div class="mut">${esc(j.wil)} · ${esc(j.type)} · ${j.views} مشاهدة · ${n} متقدم</div></div>
 <span class="chip ${s[1]}">${s[0]}</span><button class="btn ghost sm" data-a="empfilter" data-v="${j.id}">المتقدمون</button>
 ${j.status==='active'?`<button class="btn red sm" data-a="closejob" data-v="${j.id}">إغلاق</button>`:j.status==='closed'?`<button class="btn sm" data-a="openjob" data-v="${j.id}">إعادة فتح</button>`:''}</div>`}).join('');
}
function vEApps(){
 let l=myJobApps();if(S.empJob!=='all')l=l.filter(a=>a.job===+S.empJob);
 l=[...l].sort((a,b)=>match(job(b.job),b)-match(job(a.job),a));
 return `<div class="row"><h2 class="sp">المتقدمون</h2><select class="st" data-c="empjob"><option value="all">كل الوظائف</option>${myJobs().map(j=>`<option value="${j.id}" ${+S.empJob===j.id?'selected':''}>${esc(j.title)}</option>`).join('')}</select>
 <button class="btn ai sm" data-a="aishort">✦ رشّح لي الأفضل</button></div>
 <div class="aibox" id="shortbox" style="display:none;margin-bottom:12px"><div class="out" id="aiout"></div></div>
 <div class="card tw"><table><tr><th>المتقدم</th><th>الوظيفة</th><th>الخبرة</th><th>المطابقة</th><th>المهارات</th><th>الحالة</th></tr>
 ${l.length?l.map(a=>{const j=job(a.job);return `<tr><td><b>${esc(a.name)}</b><div class="mut">${esc(a.wil)}${a.mine?' · (أنت في الدور الآخر)':''}</div></td><td>${esc(j.title)}</td><td>${a.exp} سنة</td><td class="match">${match(j,a)}%</td><td>${a.skills.map(s=>`<span class="chip gray">${esc(s)}</span>`).join(' ')}</td>
 <td><select class="st" data-c="appstatus" data-id="${a.id}">${ST.map(s=>`<option ${s===a.status?'selected':''}>${s}</option>`).join('')}</select></td></tr>`}).join(''):'<tr><td colspan="6" class="empty">لا يوجد متقدمون.</td></tr>'}</table></div>`;
}

/* ============ الإدارة ============ */
function vAOver(){
 const mx=Math.max(1,...CATS.map(c=>D.jobs.filter(j=>j.cat===c&&j.status==='active').length));
 return `<h2>نظرة عامة على المنصة</h2><div class="stats"><div class="card stat"><b>${D.jobs.length}</b><span class="mut">إجمالي الوظائف</span></div><div class="card stat"><b>${D.jobs.filter(j=>j.status==='pending').length}</b><span class="mut">بانتظار المراجعة</span></div><div class="card stat"><b>${D.employers.length}</b><span class="mut">جهات مسجلة</span></div><div class="card stat"><b>${D.apps.length}</b><span class="mut">طلبات توظيف</span></div><div class="card stat"><b>${D.reports.filter(r=>r.status==='open').length}</b><span class="mut">بلاغات مفتوحة</span></div></div>
 <div class="card"><h3 style="margin-bottom:8px">الوظائف المنشورة حسب التخصص</h3>${CATS.map(c=>{const n=D.jobs.filter(j=>j.cat===c&&j.status==='active').length;return `<div class="row" style="margin:5px 0"><span style="width:130px">${c}</span><div class="bar sp"><i style="width:${n/mx*100}%"></i></div><b>${n}</b></div>`}).join('')}</div>`;
}
function riskChip(j){const r=localFraud(j);return `<span class="chip ${r.level==='مرتفع'?'red':r.level==='متوسط'?'gold':''}">خطر ${r.level} ${r.risk}%</span>`}
function vAReview(){
 const p=D.jobs.filter(j=>j.status==='pending'),a=activeJobs();
 return `<h2>وظائف بانتظار المراجعة</h2>`+(p.length?p.map(j=>`<div class="card" style="margin-bottom:10px"><div class="row"><div class="sp"><h3>${esc(j.title)}</h3><div class="mut">${esc(emp(j.emp).name)} ${emp(j.emp).verified?'✓':'(غير موثّقة)'} · ${esc(j.wil)} · ${j.min}–${j.max} ر.ع</div></div>${riskChip(j)}
 <button class="btn ai sm" data-a="aifraud" data-v="${j.id}">✦ فحص ذكي</button><button class="btn sm" data-a="approve" data-v="${j.id}">نشر</button><button class="btn red sm" data-a="reject" data-v="${j.id}">رفض</button></div><p style="margin-top:8px">${esc(j.desc)}</p><div class="aibox" id="fr${j.id}" style="display:none"></div></div>`).join(''):'<div class="empty card">لا توجد وظائف معلقة 🎉</div>')+
 `<h2 style="margin-top:20px">الوظائف المنشورة</h2><div class="card tw"><table><tr><th>الوظيفة</th><th>الجهة</th><th>الولاية</th><th></th></tr>${a.map(j=>`<tr><td>${esc(j.title)}</td><td>${esc(emp(j.emp).name)}</td><td>${esc(j.wil)}</td><td><button class="btn ghost sm" data-a="feat" data-v="${j.id}">${j.feat?'إلغاء التمييز':'★ تمييز'}</button> <button class="btn red sm" data-a="pausejob" data-v="${j.id}">إيقاف</button></td></tr>`).join('')}</table></div>`;
}
function vAEmp(){return `<h2>الجهات المسجلة</h2><div class="card tw"><table><tr><th>الجهة</th><th>الولاية</th><th>الوظائف</th><th>نسبة الرد</th><th>التوثيق</th></tr>${D.employers.map(x=>`<tr><td><b>${esc(x.name)}</b><div class="mut">${esc(x.about)}</div></td><td>${esc(x.wil)}</td><td>${D.jobs.filter(j=>j.emp===x.id).length}</td><td>${x.resp||0}%</td><td><button class="btn ${x.verified?'ghost':'gold'} sm" data-a="verify" data-v="${x.id}">${x.verified?'✓ موثّقة (إلغاء)':'توثيق الجهة'}</button></td></tr>`).join('')}</table></div>`}
function vARep(){return `<h2>البلاغات</h2>`+(D.reports.length?D.reports.map(r=>{const j=job(r.job);return `<div class="card row" style="margin-bottom:8px"><div class="sp"><h3>${esc(j?j.title:'—')}</h3><div class="mut">${j?esc(emp(j.emp).name):''} · السبب: ${esc(r.reason)}</div></div>${r.status==='open'?`<button class="btn red sm" data-a="pausejob" data-v="${r.job}" data-r="${r.id}">إيقاف الوظيفة</button><button class="btn ghost sm" data-a="dismiss" data-v="${r.id}">تجاهل</button>`:'<span class="chip gray">تمت المعالجة</span>'}</div>`}).join(''):'<div class="empty card">لا توجد بلاغات.</div>')}

/* ============ الهوية البصرية ============ */
function vBrand(){
 const L=[['mark.svg','الرمز الأساسي',''],['logo-horizontal.svg','الشعار الأفقي',''],['logo-horizontal-white.svg','الشعار على الداكن','dark'],['logo-stacked.svg','الشعار العمودي',''],['mark-lime.svg','الرمز على الليموني',''],['mark-white.svg','الرمز الأبيض','dark'],['mark-mono.svg','الرمز أحادي اللون',''],['app-icon.svg','أيقونة التطبيق','']];
 const C=[['#1B1035','ليل ظفار'],['#2A1A52','بنفسج اللبان'],['#5B3DF5','نيلي'],['#C8F135','ليمون الخريف'],['#7FE3A0','نعناع'],['#FF6B4A','مرجان'],['#F6F4FB','ضباب']];
 return `<h2>هوية وظيفتي البصرية</h2><p class="mut" style="margin-bottom:14px">الرمز حرف «و» مبني هندسياً: الحلقة رأس الإنسان ومعها نقطة مرجانية (الشخص المناسب في مكانه)، والذيل منحنى صاعد بتدرج ليموني نعناعي، ونجمة صغيرة ترمز للذكاء الاصطناعي.</p>
 <div class="brandgrid">${L.map(([f,n,d])=>`<div class="card"><div class="pv ${d}"><img src="assets/brand/${f}" alt="${n}"></div><b>${n}</b><span class="mut">${f}</span></div>`).join('')}</div>
 <h3 style="margin:20px 0 10px">لوحة الألوان الحصرية</h3><div class="sw">${C.map(([c,n])=>`<span style="background:${c};${c==='#C8F135'||c==='#7FE3A0'||c==='#F6F4FB'?'color:#1B1035;border:1px solid #e6e1f2':''}">${n}<br>${c}</span>`).join('')}</div>`;
}

/* ============ المساعد الذكي ============ */
function onAIReady(){const m=$('#aimode');if(m)m.textContent=AI.label()}
function chatPanel(){
 if(!S.chatOpen){$('#chat').innerHTML='';return}
 const sug=S.role==='employer'?['اكتب لي إعلان محاسب','كم رواتب الاستقبال؟','كيف أختار أفضل متقدم؟']:S.role==='admin'?['ما علامات الإعلان الاحتيالي؟','كم الوظائف المعلقة؟']:['ما الوظائف التي تناسبني؟','أبغى وظيفة في مسقط','كيف أحسّن سيرتي؟','كم رواتب المحاسبة؟'];
 $('#chat').innerHTML=`<div class="panel" role="dialog" aria-label="مساعد وظيفتي"><header><img src="assets/brand/mark.svg" alt=""><div><b>مساعد وظيفتي</b><div class="aimode" id="aimode">${AI.label()}</div></div><button data-a="clearchat" title="محادثة جديدة">↺</button><button data-a="togglechat" style="margin-inline-start:6px" title="إغلاق">✕</button></header>
 <div class="msgs" id="msgs">${D.chat.length?D.chat.map(m=>`<div class="msg ${m.role==='user'?'u':'a'}">${m.role==='user'?esc(m.content):md(m.content)}</div>`).join(''):`<div class="msg a">${md(localChat(''))}</div>`}</div>
 <div class="sugg">${sug.map(s=>`<button data-a="sugg" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>
 <form class="composer" id="composer"><input id="chatin" placeholder="اكتب سؤالك…" autocomplete="off"><button class="btn sm" type="submit">إرسال</button></form></div>`;
 const m=$('#msgs');m.scrollTop=m.scrollHeight;$('#chatin').focus();
}
async function sendChat(q){
 q=(q||'').trim();if(!q||S.busy)return;S.busy=true;
 if(!S.chatOpen){S.chatOpen=true;chatPanel()}
 const history=D.chat.map(m=>({role:m.role,content:m.content}));
 D.chat.push({role:'user',content:q});
 const box=$('#msgs');box.insertAdjacentHTML('beforeend',`<div class="msg u">${esc(q)}</div><div class="msg a" id="live"><span class="dots">يفكر</span></div>`);box.scrollTop=box.scrollHeight;
 const live=$('#live');
 const ans=await AI.run('chat',{q,history},t=>{live.innerHTML=md(t);box.scrollTop=box.scrollHeight});
 live.innerHTML=md(ans);live.removeAttribute('id');D.chat.push({role:'assistant',content:ans});D.chat=D.chat.slice(-30);save();S.busy=false;box.scrollTop=box.scrollHeight;
}
async function aiInto(el,task,data){
 if(S.busy)return;S.busy=true;el.innerHTML='<span class="dots mut">المساعد يعمل</span>';
 const t=await AI.run(task,data,x=>{el.innerHTML=md(x)});el.innerHTML=md(t);S.busy=false;return t;
}

/* ============ النوافذ ============ */
function modal(html,wide){$('#layer').innerHTML=`<div class="modal" data-a="closemodal"><div class="box ${wide?'wide':''}">${html}</div></div>`}
function closeModal(){$('#layer').innerHTML=''}
function welcome(){
 modal(`<div style="text-align:center"><img src="assets/brand/logo-stacked.svg" alt="وظيفتي" style="height:150px"><h2 style="margin-top:10px">أهلاً بك في وظيفتي</h2><p class="mut" style="margin-bottom:14px">منصة توظيف ذكية في سلطنة عُمان. اختر كيف تريد أن تبدأ:</p>
 <div style="display:grid;gap:8px"><button class="btn" data-a="start" data-v="seeker">🔎 أبحث عن عمل</button><button class="btn gold" data-a="start" data-v="employer">🏢 أنا صاحب عمل</button><button class="btn ghost" data-a="start" data-v="admin">🛡️ تجربة لوحة الإدارة</button></div></div>`);
}

/* ============ الأحداث ============ */
document.addEventListener('click',async e=>{
 const t=e.target.closest('[data-a]');if(!t)return;
 const a=t.dataset.a,v=t.dataset.v,p=D.profile;
 if(a==='closemodal'){if(t.classList.contains('modal')&&e.target!==t)return;closeModal();return}
 if(['report','save','share'].includes(a)||t.tagName==='A'){e.preventDefault();e.stopPropagation()}
 switch(a){
 case 'start':D.welcomed=true;save();closeModal();S.role=v;S.view=HOME[v];render();return;
 case 'save':{const id=+v,i=D.saved.indexOf(id);i>=0?D.saved.splice(i,1):D.saved.push(id);save();S.view==='home'?updateRes():render();toast(i>=0?'أُزيلت من المحفوظة':'تم الحفظ ♥');return}
 case 'role':S.role=v;S.view=HOME[v];render();if(S.chatOpen)chatPanel();return;
 case 'view':if(S.view==='profile')readProfile();S.view=v;render();return;
 case 'home':S.view=HOME[S.role];render();return;
 case 'open':{const j=job(+v);if(!j)return;if(S.role!=='seeker'){S.role='seeker'}S.jobId=+v;S.view='job';j.views++;save();render();if(window.innerWidth<760&&S.chatOpen){S.chatOpen=false;chatPanel()}return}
 case 'share':{const j=job(+v);const txt=`${j.title} - ${emp(j.emp).name}\n${j.wil} | ${sal(j)}\nقدّم عبر منصة وظيفتي`;try{await navigator.clipboard.writeText(txt);toast('تم نسخ نص الوظيفة، الصقه في واتساب')}catch(_){toast('تعذر النسخ في هذا المتصفح')}return}
 case 'bell':D.notifs.forEach(n=>n.read=true);save();renderShell();modal(`<h3 style="margin-bottom:10px">الإشعارات</h3>${D.notifs.length?D.notifs.slice(0,20).map(n=>`<div class="card" style="margin-bottom:8px;box-shadow:none"><b>${esc(n.t)}</b><div class="mut">${esc(n.b)}</div></div>`).join(''):'<p class="mut">لا توجد إشعارات.</p>'}<button class="btn" data-a="closemodal">إغلاق</button>`);return;
 case 'togglechat':S.chatOpen=!S.chatOpen;chatPanel();return;
 case 'clearchat':D.chat=[];save();chatPanel();return;
 case 'sugg':sendChat(v);return;
 case 'askhero':{const q=$('#askq').value;if(q.trim()){S.chatOpen=true;chatPanel();sendChat(q)}return}
 case 'aijob':{const j=job(S.jobId);aiInto($('#aiout'),v,{j});return}
 case 'aiabout':{readProfile();const ta=$('#p_about');const old=ta.value;ta.value='';ta.placeholder='المساعد يكتب…';const t=await AI.run('about',{},x=>{ta.value=x});ta.value=t.trim()||old;toast('راجع النبذة ثم اضغط حفظ');return}
 case 'aijobad':{const title=$('#n_title').value.trim();if(!title){toast('اكتب المسمى الوظيفي أولاً');return}if(S.busy)return;S.busy=true;t.disabled=true;t.textContent='✦ يكتب الآن…';
   const r=await AI.run('jobad',{title,wil:$('#n_wil').value});S.busy=false;fillJobForm(r);t.disabled=false;t.textContent='✦ اكتب الإعلان بالذكاء';toast('جهّز المساعد الإعلان، راجعه وعدّل ما تريد');return}
 case 'usetpl':fillJobForm(JOB_TEMPLATES[+v]);$('#n_title').value=JOB_TEMPLATES[+v].title;toast('تم تعبئة القالب');return;
 case 'aishort':{const jid=S.empJob!=='all'?+S.empJob:(myJobs().find(j=>D.apps.some(x=>x.job===j.id))||{}).id;if(!jid){toast('لا يوجد متقدمون');return}const j=job(jid);$('#shortbox').style.display='block';aiInto($('#aiout'),'shortlist',{j,apps:D.apps.filter(x=>x.job===jid)});return}
 case 'aifraud':{const j=job(+v),box=$('#fr'+v);box.style.display='block';box.innerHTML='<span class="dots mut">يفحص الإعلان</span>';const r=await AI.run('fraud',{j});
   box.innerHTML=`<div class="row"><span class="chip ai">✦ نتيجة الفحص</span><span class="chip ${r.level==='مرتفع'?'red':r.level==='متوسط'?'gold':''}">خطر ${esc(r.level)} (${+r.risk||0}%)</span></div><ul style="margin:8px 0;padding-inline-start:20px">${(r.reasons||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><b>التوصية:</b> ${esc(r.advice||'')}`;return}
 case 'report':modal(`<h3>الإبلاغ عن إعلان مخالف</h3><div class="field" style="margin-top:10px"><label>سبب البلاغ</label><select id="rp_r"><option>طلب رسوم قبل التوظيف</option><option>إعلان وهمي</option><option>معلومات مضللة</option><option>محتوى غير لائق</option></select></div><div class="row"><button class="btn red" data-a="sendreport" data-v="${v}">إرسال البلاغ</button><button class="btn ghost" data-a="closemodal">إلغاء</button></div>`);return;
 case 'sendreport':D.reports.push({id:D.nextId++,job:+v,reason:$('#rp_r').value,status:'open'});save();closeModal();toast('وصل بلاغك للإدارة، شكراً لك');renderShell();return;
 case 'apply':{const j=job(+v);
  if(!fits(j)){modal(`<h3>الوظيفة للعمانيين فقط</h3><p style="margin:10px 0">هذه الوظيفة مخصصة للمواطنين حسب إعلان الجهة. فعّل خيار «تناسب جنسيتي فقط» لتصفح ما يناسبك.</p><button class="btn" data-a="closemodal">حسناً</button>`);return}
  if(complete(p)<60){modal(`<h3>أكمل ملفك أولاً</h3><p style="margin:10px 0">اكتمال ملفك ${complete(p)}%. نحتاج 60% على الأقل ليظهر طلبك بشكل جيد.</p><button class="btn" data-a="gotoprofile">إكمال الملف</button>`);return}
  modal(`<h3>التقديم على: ${esc(j.title)}</h3><p class="mut" style="margin:6px 0 10px">سيصل ملفك وسيرتك بقالب «${CV_TPLS[p.cvTpl||'khanjar'].name}» إلى ${esc(emp(j.emp).name)}.</p><div class="field"><div class="row" style="margin-bottom:4px"><label class="sp" style="margin:0">رسالة لصاحب العمل (اختياري)</label><button class="btn ai sm" data-a="aicover" data-v="${v}">✦ اكتبها لي</button></div><textarea id="ap_note" rows="6"></textarea></div><div class="row"><button class="btn" data-a="confirmapply" data-v="${v}">تأكيد التقديم</button><button class="btn ghost" data-a="closemodal">إلغاء</button></div>`);return}
 case 'aicover':{const ta=$('#ap_note');ta.value='';const r=await AI.run('cover',{j:job(+v)},x=>{ta.value=x});ta.value=r;return}
 case 'gotoprofile':closeModal();S.view='profile';render();return;
 case 'confirmapply':{const note=$('#ap_note')?$('#ap_note').value:'';D.apps.push({id:D.nextId++,job:+v,name:p.name,wil:p.wil,exp:+p.exp||0,skills:[...p.skills],status:'جديد',ago:0,mine:true,note});notify('تم إرسال طلبك','قدّمت على '+job(+v).title+'. سنخبرك عند أي تحديث.');save();closeModal();toast('تم إرسال طلبك بنجاح ✓');render();return}
 case 'addexp':readProfile();p.experiences.push({title:'',company:'',period:'',details:''});render();return;
 case 'delexp':readProfile();p.experiences.splice(+v,1);render();return;
 case 'saveprofile':readProfile();save();toast('تم حفظ ملفك ✓');render();return;
 case 'pickcv':p.cvTpl=v;save();render();toast('تم اختيار قالب '+CV_TPLS[v].name);return;
 case 'printcv':{$('#printArea').innerHTML=CV_TPLS[p.cvTpl||'khanjar'].render(p);try{window.print()}catch(_){}setTimeout(()=>toast('إن لم تظهر نافذة الطباعة، افتح التطبيق من رابط GitHub Pages للطباعة'),400);return}
 case 'addalert':D.alerts.push({cat:$('#al_cat').value,wil:$('#al_wil').value});save();toast('تمت إضافة التنبيه 🔔');render();return;
 case 'delalert':D.alerts.splice(+v,1);save();render();return;
 case 'postjob':{const g=id=>$('#'+id).value.trim(),title=g('n_title'),min=+g('n_min'),max=+g('n_max');
  if(!title||!g('n_desc')||!(max>0)||min>max){toast('أكمل المسمى والوصف وراتباً صحيحاً');return}
  D.jobs.push({id:D.nextId++,emp:E,title,cat:g('n_cat'),wil:g('n_wil'),type:g('n_type'),min,max,exp:+g('n_exp')||0,nat:g('n_nat'),skills:g('n_skills').split(/[,،]/).map(s=>s.trim()).filter(Boolean),desc:g('n_desc'),reqs:g('n_reqs').split('\n').map(s=>s.trim()).filter(Boolean),ago:0,status:'pending',gig:$('#n_gig').checked,views:0});
  save();toast('أُرسلت الوظيفة للمراجعة');S.view='jobs';render();return}
 case 'closejob':case 'openjob':job(+v).status=a==='closejob'?'closed':'active';save();render();return;
 case 'empfilter':S.empJob=v;S.view='applicants';render();return;
 case 'approve':{const j=job(+v);j.status='active';j.ago=0;
  if(D.alerts.some(x=>(!x.cat||x.cat===j.cat)&&(!x.wil||x.wil===j.wil)))notify('وظيفة جديدة تطابق تنبيهك 🔔',j.title+' في '+j.wil);
  save();toast('تم نشر الوظيفة');render();return}
 case 'reject':job(+v).status='rejected';save();render();return;
 case 'feat':job(+v).feat=!job(+v).feat;save();render();return;
 case 'pausejob':job(+v).status='paused';if(t.dataset.r)D.reports.find(r=>r.id===+t.dataset.r).status='resolved';save();toast('تم إيقاف الوظيفة');render();return;
 case 'verify':{const x=D.employers.find(y=>y.id===+v);x.verified=!x.verified;save();render();return}
 case 'dismiss':D.reports.find(r=>r.id===+v).status='dismissed';save();render();return;
 case 'reset':D=seed();D.welcomed=true;save();S.role='seeker';S.view='home';render();toast('تمت إعادة البيانات التجريبية');return;
 }
});
document.addEventListener('submit',e=>{if(e.target.id==='composer'){e.preventDefault();const i=$('#chatin');const q=i.value;i.value='';sendChat(q)}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='askq'){e.preventDefault();document.querySelector('[data-a=askhero]').click()}if(e.key==='Escape'){closeModal();if(S.chatOpen){S.chatOpen=false;chatPanel()}}});
function onField(e){
 const t=e.target,c=t.dataset.c;if(!c)return;
 if(c==='appstatus'){const x=D.apps.find(y=>y.id===+t.dataset.id);x.status=t.value;if(x.mine)notify('تحديث على طلبك','أصبحت حالة طلبك في «'+job(x.job).title+'»: '+x.status);save();toast('تم تحديث الحالة');renderShell();return}
 if(c==='empjob'){S.empJob=t.value;render();return}
 S.f[c]=t.type==='checkbox'?t.checked:t.value;updateRes();
}
document.addEventListener('input',e=>{if(e.target.dataset.c==='q')onField(e)});
document.addEventListener('change',e=>{if(e.target.dataset.c&&e.target.dataset.c!=='q')onField(e)});

/* ---------- تشغيل ---------- */
render();
if(!D.welcomed)welcome();
AI.init();
