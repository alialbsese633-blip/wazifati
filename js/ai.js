/* =====================================================
   مساعد وظيفتي الذكي
   3 أوضاع تلقائية:
   1) claude : داخل Claude (قدرة sample)
   2) remote : خادم خاص (Supabase Edge Function) عبر js/config.js
   3) local  : محرك محلي ذكي بدون إنترنت (احتياطي دائماً)
   ===================================================== */
const AI={
 mode:'local',sample:null,endpoint:null,key:null,
 async init(){
  const cfg=window.WAZIFATI_CONFIG||{};
  if(cfg.aiEndpoint){this.mode='remote';this.endpoint=cfg.aiEndpoint;this.key=cfg.supabaseAnonKey||''}
  try{
   if(window.claude&&typeof window.claude.use==='function'){
    const s=await window.claude.use('sample');
    if(s){this.sample=s;this.mode='claude'}
   }
  }catch(e){}
  if(typeof onAIReady==='function')onAIReady();
 },
 label(){return {claude:'ذكاء اصطناعي متصل',remote:'ذكاء اصطناعي متصل',local:'الوضع الذكي المحلي'}[this.mode]},

 /* ---------- سياق المنصة ---------- */
 jobsCtx(){return activeJobs().map(j=>`#${j.id} | ${j.title} | ${emp(j.emp).name}${emp(j.emp).verified?' (موثّقة)':''} | ${j.wil} | ${j.type} | ${j.min}-${j.max} ر.ع${j.gig?' يومياً':' شهرياً'} | خبرة ${j.exp} | ${j.nat} | مهارات: ${j.skills.join('، ')}`).join('\n')},
 profileCtx(){const p=D.profile;return `الاسم: ${p.name}\nالمسمى: ${p.title}\nالولاية: ${p.wil}\nالجنسية: ${p.nat==='omani'?'عماني':'مقيم'}\nالخبرة: ${p.exp} سنوات\nالتعليم: ${p.edu}\nالمهارات: ${p.skills.join('، ')}\nنبذة: ${p.about}\nالخبرات: ${(p.experiences||[]).map(x=>x.title+' في '+x.company+' ('+x.period+')').join('؛ ')}`},
 base(){return `أنت «مساعد وظيفتي»، مساعد توظيف ذكي داخل منصة «وظيفتي» في سلطنة عُمان.
اكتب بالعربية البسيطة الواضحة، باختصار ودقة، واستخدم نقاطاً قصيرة عند الحاجة. العملة: الريال العماني (ر.ع).
لا تخترع وظائف أو شركات غير موجودة في القائمة. عندما تذكر وظيفة من القائمة اكتب بعدها رمزها هكذا: [[job:رقمها]].
نبّه دائماً: لا يجوز دفع أي رسوم مقابل التوظيف.`},

 /* ---------- الاستدعاء العام ---------- */
 async call(prompt,{onText,tools,history=[]}={}){
  if(this.mode==='claude'){
   const msgs=[...history.slice(-8),{role:'user',content:prompt}];
   const opts={cache:false};if(onText)opts.onText=x=>onText(x.text);if(tools)opts.tools=tools;
   try{return (await this.sample(msgs,opts)).text}
   catch(err){
    if(tools&&err&&err.code!=='not_granted'&&err.code!=='rate_limited'){delete opts.tools;return (await this.sample(msgs,opts)).text}
    if(err&&err.code==='not_granted'){this.mode='local';if(typeof onAIReady==='function')onAIReady()}
    throw err;
   }
  }
  if(this.mode==='remote'){
   const r=await fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(this.key?{Authorization:'Bearer '+this.key,apikey:this.key}:{})},
    body:JSON.stringify({messages:[...history.slice(-8),{role:'user',content:prompt}]})});
   if(!r.ok)throw new Error('ai http '+r.status);
   const j=await r.json();const t=j.text||'';if(onText)onText(t);return t;
  }
  throw new Error('local');
 },
 async type(text,onText){ // تأثير كتابة سلس للوضع المحلي
  if(!onText)return text;const w=text.split(/(\s+)/);let out='';
  for(let i=0;i<w.length;i++){out+=w[i];if(i%3===0){onText(out);await new Promise(r=>setTimeout(r,14))}}
  onText(text);return text;
 },
 parseJSON(t){try{return JSON.parse(t)}catch(e){const m=String(t).match(/\{[\s\S]*\}/);if(m){try{return JSON.parse(m[0])}catch(_){}}return null}},

 /* ---------- المهام ---------- */
 async run(task,data={},onText){
  const T=TASKS[task];
  if(this.mode!=='local'){
   try{
    const prompt=T.prompt(data);
    const t=await this.call(prompt,{onText:T.json?null:onText,tools:T.tools?T.tools():undefined,history:data.history||[]});
    if(T.json){const v=this.parseJSON(t);if(v)return v;throw new Error('bad json')}
    return t;
   }catch(e){/* ننتقل للمحرك المحلي */}
  }
  const r=T.local(data);
  return T.json?r:this.type(r,onText);
 }
};

/* ============ محرك المهام ============ */
const N=s=>String(s||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
const TASKS={
 chat:{
  prompt:d=>`${AI.base()}
دور المستخدم الآن: ${({seeker:'باحث عن عمل',employer:'صاحب عمل (شركة الواحة للضيافة)',admin:'مشرف المنصة'})[S.role]}.
ملف الباحث:
${AI.profileCtx()}

الوظائف المنشورة حالياً:
${AI.jobsCtx()}

سؤال المستخدم: ${d.q}`,
  tools:()=>[{name:'search_jobs',description:'ابحث في وظائف المنصة المنشورة حسب كلمة أو ولاية أو تخصص. يعيد قائمة مختصرة.',
    inputSchema:{type:'object',properties:{query:{type:'string'},wilayat:{type:'string'},category:{type:'string'}}},
    execute:i=>activeJobs().filter(j=>(!i.wilayat||j.wil===i.wilayat)&&(!i.category||j.cat===i.category)&&(!i.query||N([j.title,j.cat,...j.skills].join(' ')).includes(N(i.query)))).slice(0,8).map(j=>({id:j.id,title:j.title,wil:j.wil,salary:j.min+'-'+j.max}))},
   {name:'my_applications',description:'طلبات التوظيف التي قدمها المستخدم وحالتها',inputSchema:{type:'object',properties:{}},
    execute:()=>D.apps.filter(a=>a.mine).map(a=>({job:job(a.job).title,status:a.status}))}],
  local:d=>localChat(d.q)
 },
 about:{
  prompt:()=>`${AI.base()}\nأعد كتابة النبذة المهنية لهذا الباحث بأسلوب احترافي جذاب في 3 إلى 4 أسطر فقط، بصيغة المتكلم، بدون عناوين ولا رموز. اكتب النبذة فقط.\n\n${AI.profileCtx()}`,
  local:()=>{const p=D.profile;return `${p.title} بخبرة ${p.exp} سنوات، أتميز بـ${p.skills.slice(0,3).join(' و')}. حاصل على ${p.edu||'مؤهل في مجالي'}، وعملت ${(p.experiences||[])[0]?'مؤخراً '+p.experiences[0].title+' في '+p.experiences[0].company:'في بيئات عمل منظمة'}. أحرص على الدقة والالتزام بالمواعيد، وأبحث عن فرصة في ${p.wil} أضيف فيها قيمة حقيقية وأطوّر مسيرتي المهنية.`}
 },
 cover:{
  prompt:d=>`${AI.base()}\nاكتب رسالة تقديم قصيرة (5 إلى 7 أسطر) من الباحث إلى صاحب العمل لهذه الوظيفة. ابدأ بالتحية، اربط خبرته ومهاراته بمتطلبات الوظيفة تحديداً، واختم بشكر. بدون عناوين.\n\nالوظيفة: ${d.j.title} في ${emp(d.j.emp).name}\nالمتطلبات: ${d.j.reqs.join('، ')}\nالمهارات: ${d.j.skills.join('، ')}\n\n${AI.profileCtx()}`,
  local:d=>{const p=D.profile,j=d.j,hit=j.skills.filter(s=>p.skills.map(N).includes(N(s)));return `السلام عليكم ورحمة الله،\n\nأتقدم بطلبي لوظيفة «${j.title}» لدى ${emp(j.emp).name}. أعمل ${p.title} بخبرة ${p.exp} سنوات${hit.length?'، وأمتلك المهارات التي تطلبونها مثل '+hit.join(' و'):''}. ${(p.experiences||[])[0]?'في عملي الحالي ('+p.experiences[0].company+') '+p.experiences[0].details:''}\n\nأنا مقيم في ${p.wil} وجاهز للمقابلة في الوقت الذي يناسبكم.\n\nشاكراً لكم وقتكم،\n${p.name}\n${p.phone}`}
 },
 fit:{
  prompt:d=>`${AI.base()}\nقيّم مدى مناسبة الباحث لهذه الوظيفة بصراحة. اكتب: سطر خلاصة، ثم «نقاط القوة» (2-3 نقاط)، ثم «ما ينقصك» (1-3 نقاط)، ثم «نصيحة قبل التقديم» (سطر).\n\nالوظيفة: ${d.j.title} | ${d.j.wil} | خبرة ${d.j.exp} | ${d.j.nat}\nالمتطلبات: ${d.j.reqs.join('، ')}\nالمهارات: ${d.j.skills.join('، ')}\nنسبة المطابقة المحسوبة: ${match(d.j,D.profile)}%\n\n${AI.profileCtx()}`,
  local:d=>{const p=D.profile,j=d.j,m=match(j,p),ps=p.skills.map(N);const hit=j.skills.filter(s=>ps.includes(N(s))),miss=j.skills.filter(s=>!ps.includes(N(s)));
   return `**الخلاصة:** مطابقتك ${m}%، ${m>=75?'أنت مرشح قوي لهذه الوظيفة.':m>=50?'فرصتك جيدة مع بعض التحسينات.':'الوظيفة أعلى من ملفك الحالي قليلاً.'}\n\n**نقاط القوة**\n${hit.length?hit.map(s=>'- تمتلك مهارة '+s).join('\n'):'- لديك خبرة عامة يمكن البناء عليها'}\n${p.exp>=j.exp?'- خبرتك ('+p.exp+' سنوات) تكفي المطلوب':''}\n${p.wil===j.wil?'- أنت في نفس الولاية':''}\n\n**ما ينقصك**\n${miss.length?miss.map(s=>'- مهارة '+s+' غير مذكورة في ملفك'):['- لا شيء جوهري']}${p.exp<j.exp?'\n- الخبرة المطلوبة '+j.exp+' سنوات وخبرتك '+p.exp:''}\n\n**نصيحة قبل التقديم:** ${miss.length?'إن كنت تملك '+miss[0]+' فأضفها لملفك، واكتب رسالة تقديم تربط خبرتك بالمتطلبات.':'قدّم الآن مع رسالة تقديم قصيرة.'}`.replace(/\n{3,}/g,'\n\n')}
 },
 interview:{
  prompt:d=>`${AI.base()}\nجهّز الباحث لمقابلة وظيفة «${d.j.title}». اكتب 6 أسئلة متوقعة مرقمة، وتحت كل سؤال سطر قصير يبدأ بـ «💡» يوضح كيف يجيب مستفيداً من خبرته. ثم نصيحتين عامتين لمقابلات العمل في عُمان.\n\nالمهارات المطلوبة: ${d.j.skills.join('، ')}\n\n${AI.profileCtx()}`,
  local:d=>{const j=d.j,p=D.profile;const q=[['عرّفنا بنفسك باختصار.','ابدأ بمسماك وسنوات خبرتك ثم أبرز إنجاز.'],[`لماذا تريد العمل في ${emp(j.emp).name}؟`,'اذكر شيئاً محدداً عن الشركة وربطه بطموحك.'],...j.skills.slice(0,3).map(s=>[`حدثنا عن موقف استخدمت فيه مهارة ${s}.`,'استخدم أسلوب: الموقف، المهمة، ما فعلته، النتيجة.']),['ما الراتب الذي تتوقعه؟',`النطاق المعلن ${j.min}-${j.max} ر.ع، اذكر رقماً داخله مع مرونة.`]];
   return q.map((x,i)=>`${i+1}. ${x[0]}\n💡 ${x[1]}`).join('\n\n')+`\n\n**نصيحتان:**\n- احضر قبل الموعد بـ10 دقائق ومعك نسخة من سيرتك وبطاقتك.\n- جهّز سؤالين تسألهما في النهاية عن مهام الوظيفة وفرص التطور.`}
 },
 jobad:{json:true,
  prompt:d=>`${AI.base()}\nصاحب عمل في عُمان يريد نشر وظيفة بعنوان «${d.title}»${d.wil?' في '+d.wil:''}${d.notes?'. ملاحظاته: '+d.notes:''}.
أعد فقط كائن JSON بهذا الشكل بدون أي نص آخر:
{"desc":"وصف جذاب من 2-3 جمل","reqs":["متطلب","..."],"skills":["مهارة","..."],"cat":"واحد من: ${CATS.join(' | ')}","type":"واحد من: ${TYPES.join(' | ')}","exp":0,"min":0,"max":0}
الرواتب بالريال العماني شهرياً وواقعية لسوق عُمان.`,
  local:d=>{const t=N(d.title);const tp=JOB_TEMPLATES.find(x=>x.key.split('|').some(k=>t.includes(N(k)))||N(x.title).split(' ').some(w=>w.length>3&&t.includes(w)))||{desc:`نبحث عن ${d.title} ملتزم ومتحمس للانضمام إلى فريقنا، يتولى المهام اليومية للوظيفة بكفاءة ويعمل بروح الفريق.`,reqs:['خبرة مناسبة في المجال','مهارات تواصل جيدة','الالتزام والانضباط'],skills:['العمل ضمن فريق','تنظيم الوقت'],cat:CATS[0],type:'دوام كامل',exp:1,min:300,max:450};
   return {desc:tp.desc,reqs:tp.reqs,skills:tp.skills,cat:tp.cat,type:tp.type,exp:tp.exp,min:tp.min,max:tp.max}}
 },
 shortlist:{
  prompt:d=>`${AI.base()}\nأنت تساعد صاحب عمل. هؤلاء المتقدمون لوظيفة «${d.j.title}» (المهارات المطلوبة: ${d.j.skills.join('، ')}، الخبرة: ${d.j.exp}):\n${d.apps.map(a=>`- ${a.name} | ${a.wil} | خبرة ${a.exp} | مهارات: ${a.skills.join('، ')} | مطابقة ${match(d.j,a)}% | الحالة: ${a.status}`).join('\n')}\nرتّب أفضل 3 مع سبب سطر لكل واحد، ثم اقترح سؤالاً ذكياً لكل منهم في المقابلة.`,
  local:d=>{const r=[...d.apps].sort((x,y)=>match(d.j,y)-match(d.j,x)).slice(0,3);if(!r.length)return 'لا يوجد متقدمون لهذه الوظيفة بعد.';
   return `**أفضل المرشحين لوظيفة ${d.j.title}:**\n\n`+r.map((a,i)=>{const hit=d.j.skills.filter(s=>a.skills.map(N).includes(N(s)));return `${i+1}. **${a.name}** (مطابقة ${match(d.j,a)}%)\n- خبرة ${a.exp} سنوات${hit.length?'، ويمتلك: '+hit.join('، '):''}\n- سؤال مقترح: «حدثنا عن آخر مرة استخدمت فيها ${hit[0]||d.j.skills[0]} في عملك؟»`}).join('\n\n')}
 },
 fraud:{json:true,
  prompt:d=>`أنت مدقق إعلانات وظائف في منصة عمانية. افحص هذا الإعلان بحثاً عن علامات الاحتيال (طلب رسوم، رواتب غير منطقية، تواصل خارج المنصة فقط، وعود مبالغ فيها، معلومات ناقصة).
أعد فقط JSON: {"risk":0-100,"level":"منخفض|متوسط|مرتفع","reasons":["سبب قصير","..."],"advice":"توصية للمشرف في سطر"}
الإعلان: ${d.j.title} | الجهة: ${emp(d.j.emp).name} (${emp(d.j.emp).verified?'موثّقة':'غير موثّقة'}) | الراتب ${d.j.min}-${d.j.max} ر.ع | خبرة ${d.j.exp} | النوع ${d.j.type}\nالوصف: ${d.j.desc}\nالمتطلبات: ${d.j.reqs.join('، ')}`,
  local:d=>localFraud(d.j)
 }
};

function localFraud(j){
 const t=N(j.title+' '+j.desc+' '+j.reqs.join(' '));let risk=0;const reasons=[];
 const rules=[[/رسوم|رسم|تحويل|ادفع|دفع مبلغ|تامين مالي/, 45,'يطلب مبلغاً أو رسوماً من الباحث'],[/واتساب فقط|تواصل خاص|خارج المنصه/,15,'يطلب التواصل خارج المنصة فقط'],[/سهله|من البيت|بدون خبره|لا يشترط/,10,'وعود عمل سهل بلا شروط'],[/راتب عالي|مضمون|ارباح/,10,'مبالغة في وعود الدخل']];
 rules.forEach(([re,w,why])=>{if(re.test(t)){risk+=w;reasons.push(why)}});
 const avg=(j.min+j.max)/2;if(!j.gig&&j.exp===0&&avg>700){risk+=20;reasons.push('راتب مرتفع جداً لوظيفة بلا خبرة')}
 if(!emp(j.emp).verified){risk+=10;reasons.push('الجهة غير موثّقة')}
 if(j.desc.length<40){risk+=5;reasons.push('الوصف قصير وغير واضح')}
 risk=Math.min(100,risk);const level=risk>=50?'مرتفع':risk>=20?'متوسط':'منخفض';
 return {risk,level,reasons:reasons.length?reasons:['لا توجد علامات احتيال واضحة'],advice:risk>=50?'ارفض الإعلان وتواصل مع الجهة للتحقق.':risk>=20?'راجع الجهة قبل النشر.':'آمن للنشر.'};
}

function localChat(q){
 const n=N(q),p=D.profile,all=activeJobs();
 const wil=WIL.find(w=>n.includes(N(w)));
 const cat=CATS.find(c=>c.split(' ').some(w=>w.length>3&&n.includes(N(w))));
 const words=n.split(/\s+/).filter(w=>w.length>2);
 const kw=all.filter(j=>words.some(w=>N([j.title,...j.skills].join(' ')).includes(w.replace(/^ال/,''))));
 const has=re=>re.test(n);
 if(has(/رسوم|نصب|احتيال|دفع|يطلبون مبلغ/))return 'انتبه: **لا تدفع أي مبلغ مقابل التوظيف** مهما كان السبب.\n- الجهات الموثّقة عليها علامة ✓\n- إذا طلب منك إعلان رسوماً، افتح الوظيفة واضغط «أبلغ عنها» وسنوقفها فوراً.';
 if(has(/سير|cv|سي في/))return `لتقوية سيرتك:\n- اكتب نبذة من 3 أسطر تبدأ بمسماك وخبرتك (زر «حسّن بالذكاء» في ملفي يكتبها لك)\n- أضف 5 مهارات على الأقل، لديك الآن ${p.skills.length}\n- اذكر خبراتك بالأرقام والنتائج\n- اختر قالباً من «قوالب السيرة»: الخنجر للإدارة، اللبان للعصري، مسقط للبسيط، الخريف للإبداعي.`;
 if(has(/مقابله|interview/))return 'أكثر أسئلة المقابلات شيوعاً:\n1. عرّفنا بنفسك\n2. لماذا تركت عملك السابق؟\n3. ما نقاط قوتك وضعفك؟\n4. أين ترى نفسك بعد 3 سنوات؟\n5. كم الراتب المتوقع؟\n\nافتح أي وظيفة واضغط «جهّزني للمقابلة» لأسئلة مخصصة لها.';
 if(has(/راتب|رواتب|معاش|كم يعطون/)){const list=all.filter(j=>!j.gig&&(!cat||j.cat===cat));const g={};list.forEach(j=>{(g[j.cat]=g[j.cat]||[]).push(j)});
  return '**متوسط الرواتب المعلنة في المنصة (شهرياً):**\n'+Object.entries(g).map(([c,a])=>`- ${c}: ${Math.round(a.reduce((s,j)=>s+j.min,0)/a.length)} إلى ${Math.round(a.reduce((s,j)=>s+j.max,0)/a.length)} ر.ع`).join('\n')}
 if(has(/طلبات|طلبي|قدمت/)){const a=D.apps.filter(x=>x.mine);return a.length?'**طلباتك:**\n'+a.map(x=>`- ${job(x.job).title}: ${x.status} [[job:${x.job}]]`).join('\n'):'لم تقدّم على أي وظيفة بعد. قل لي ما تبحث عنه وأقترح لك.'}
 if(wil||cat||kw.length||has(/وظيف|شغل|عمل|فرص|ابحث|ابي|ابغي|اريد|مناسب|تناسبني|اقترح/)){
  let r=all.filter(j=>(!wil||j.wil===wil)&&(!cat||j.cat===cat));
  if(kw.length&&!has(/تناسبني|مناسب|اقترح/)){const f=r.filter(j=>kw.includes(j));if(f.length)r=f}
  if(!r.length)r=all;
  r=r.filter(fits).sort((x,y)=>match(y,p)-match(x,p)).slice(0,4);
  if(!r.length)return 'لم أجد وظائف مطابقة الآن. فعّل تنبيهاً من صفحة «التنبيهات» وسأخبرك فور نشر وظيفة مناسبة.';
  return `وجدت لك ${r.length} ${wil?'في '+wil:''} مرتبة حسب مطابقتها لملفك:\n`+r.map(j=>`- **${j.title}** في ${emp(j.emp).name}، ${j.min}-${j.max} ر.ع، مطابقة ${match(j,p)}% [[job:${j.id}]]`).join('\n')+'\n\nاضغط على أي وظيفة لفتحها.';
 }
 if(S.role==='employer')return 'أستطيع مساعدتك في:\n- كتابة إعلان وظيفة كامل من المسمى فقط (صفحة «نشر وظيفة»)\n- ترتيب أفضل المتقدمين (صفحة «المتقدمون» ثم «رشّح لي الأفضل»)\n- اقتراح رواتب مناسبة للسوق، اسألني: كم رواتب المحاسبين؟';
 return 'أهلاً! أنا مساعد وظيفتي 👋 جرّب أن تسألني:\n- أبغى وظيفة في صلالة\n- ما الوظائف التي تناسبني؟\n- كم رواتب المحاسبة؟\n- كيف أحسّن سيرتي؟\n- كيف أستعد للمقابلة؟';
}

/* ---------- تحويل نص المساعد إلى HTML آمن ---------- */
function md(t){
 let h=esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\[\[job:(\d+)\]\]/g,(m,id)=>{const j=job(+id);return j?`<a class="jl" data-a="open" data-v="${id}">↗ ${esc(j.title)}</a>`:''});
 const lines=h.split('\n');let out='',ul=false;
 for(const l of lines){const m=l.match(/^\s*[-•]\s+(.*)/);
  if(m){if(!ul){out+='<ul>';ul=true}out+=`<li>${m[1]}</li>`}else{if(ul){out+='</ul>';ul=false}out+=l.trim()?`<div>${l}</div>`:'<div style="height:6px"></div>'}}
 if(ul)out+='</ul>';return out;
}
