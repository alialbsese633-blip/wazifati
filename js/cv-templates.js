/* قوالب السيرة الذاتية الحصرية - وظيفتي
   كل قالب دالة تستقبل الملف وتعيد HTML بحجم A4 (794px عرض) */
const CV_TPLS={
 khanjar:{name:'الخنجر',desc:'رسمي وفخم، مناسب للمحاسبة والإدارة',render:p=>`
 <div class="cvx" style="font-family:Tajawal,sans-serif;width:794px;min-height:1123px;background:#fff;color:#1B1035;padding:56px 60px;direction:rtl">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #1B1035;padding-bottom:16px">
   <div><div style="font-size:38px;font-weight:800;line-height:1.1">${e(p.name)}</div><div style="font-size:18px;color:#FF6B4A;font-weight:700;margin-top:6px">${e(p.title)}</div></div>
   <div style="text-align:left;font-size:13px;line-height:1.9;color:#4F4A63">${e(p.phone)}<br>${e(p.email||'')}<br>${e(p.wil)}، سلطنة عُمان</div>
  </div>
  ${sec('نبذة مهنية',`<p style="font-size:14.5px;line-height:1.9">${e(p.about)}</p>`,'#1B1035')}
  ${sec('الخبرات العملية',(p.experiences||[]).map(x=>`<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><b style="font-size:15.5px">${e(x.title)} · ${e(x.company)}</b><span style="color:#6E6889;font-size:13px">${e(x.period)}</span></div><div style="font-size:14px;color:#3a3550;margin-top:3px">${e(x.details)}</div></div>`).join(''),'#1B1035')}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px">
   ${sec('التعليم',`<p style="font-size:14.5px">${e(p.edu)}</p>`,'#1B1035')}
   ${sec('اللغات',`<p style="font-size:14.5px;line-height:1.9">${(p.langs||[]).map(e).join('<br>')}</p>`,'#1B1035')}
  </div>
  ${sec('المهارات',`<div>${p.skills.map(s=>`<span style="display:inline-block;border:1.5px solid #1B1035;border-radius:6px;padding:3px 12px;margin:0 0 6px 6px;font-size:13.5px">${e(s)}</span>`).join('')}</div>`,'#1B1035')}
 </div>`},

 luban:{name:'اللبان',desc:'عمود جانبي بنفسجي، عصري ولافت',render:p=>`
 <div class="cvx" style="font-family:Tajawal,sans-serif;width:794px;min-height:1123px;background:#fff;color:#1B1035;display:grid;grid-template-columns:260px 1fr;direction:rtl">
  <aside style="background:linear-gradient(180deg,#2A1A52,#120A26);color:#fff;padding:48px 28px">
   <div style="width:96px;height:96px;border-radius:30px;background:#C8F135;color:#1B1035;display:grid;place-items:center;font-size:42px;font-weight:800">${e((p.name||'?').trim()[0])}</div>
   <div style="font-size:26px;font-weight:800;margin-top:18px;line-height:1.25">${e(p.name)}</div>
   <div style="color:#C8F135;font-weight:700;margin-top:4px">${e(p.title)}</div>
   ${side('التواصل',`${e(p.phone)}<br>${e(p.email||'')}<br>${e(p.wil)}، عُمان`)}
   ${side('المهارات',p.skills.map(s=>`<div style="margin-bottom:8px">${e(s)}<div style="height:5px;background:rgba(255,255,255,.15);border-radius:5px;margin-top:4px"><i style="display:block;height:100%;width:${70+((s.length*7)%30)}%;background:linear-gradient(90deg,#7FE3A0,#C8F135);border-radius:5px"></i></div></div>`).join(''))}
   ${side('اللغات',(p.langs||[]).map(e).join('<br>'))}
  </aside>
  <section style="padding:48px 40px">
   ${sec('عنّي',`<p style="font-size:14.5px;line-height:1.9">${e(p.about)}</p>`,'#FF6B4A')}
   ${sec('الخبرات',(p.experiences||[]).map(x=>`<div style="border-right:3px solid #C8F135;padding-right:14px;margin-bottom:16px"><b style="font-size:15.5px">${e(x.title)}</b><div style="color:#6E6889;font-size:13px">${e(x.company)} · ${e(x.period)}</div><div style="font-size:14px;margin-top:4px">${e(x.details)}</div></div>`).join(''),'#FF6B4A')}
   ${sec('التعليم',`<p style="font-size:14.5px">${e(p.edu)}</p>`,'#FF6B4A')}
  </section>
 </div>`},

 muscat:{name:'مسقط',desc:'بسيط ونظيف، يقرأه نظام الفرز بسهولة',render:p=>`
 <div class="cvx" style="font-family:Tajawal,sans-serif;width:794px;min-height:1123px;background:#fff;color:#222;padding:60px 70px;direction:rtl">
  <div style="text-align:center"><div style="font-size:34px;font-weight:800;letter-spacing:.5px">${e(p.name)}</div>
  <div style="font-size:16px;color:#555;margin-top:4px">${e(p.title)}</div>
  <div style="font-size:13px;color:#777;margin-top:8px">${e(p.phone)} | ${e(p.email||'')} | ${e(p.wil)}، سلطنة عُمان</div></div>
  <hr style="border:0;border-top:1px solid #ddd;margin:22px 0">
  ${sec('الملخص',`<p style="font-size:14.5px;line-height:1.9">${e(p.about)}</p>`,'#222')}
  ${sec('الخبرة العملية',(p.experiences||[]).map(x=>`<div style="margin-bottom:12px"><b>${e(x.title)}</b>، ${e(x.company)} <span style="color:#777">(${e(x.period)})</span><div style="font-size:14px;margin-top:2px">${e(x.details)}</div></div>`).join(''),'#222')}
  ${sec('التعليم',`<p>${e(p.edu)}</p>`,'#222')}
  ${sec('المهارات',`<p style="font-size:14.5px">${p.skills.map(e).join('، ')}</p>`,'#222')}
  ${sec('اللغات',`<p style="font-size:14.5px">${(p.langs||[]).map(e).join('، ')}</p>`,'#222')}
 </div>`},

 khareef:{name:'الخريف',desc:'ترويسة متدرجة جريئة، للإبداع والتقنية',render:p=>`
 <div class="cvx" style="font-family:Tajawal,sans-serif;width:794px;min-height:1123px;background:#F6F4FB;color:#1B1035;direction:rtl">
  <header style="background:linear-gradient(120deg,#C8F135 0%,#7FE3A0 45%,#5B3DF5 100%);padding:50px 56px 70px;position:relative">
   <div style="font-size:40px;font-weight:800;line-height:1.1">${e(p.name)}</div>
   <div style="display:inline-block;background:#1B1035;color:#C8F135;border-radius:30px;padding:4px 16px;font-weight:700;margin-top:10px">${e(p.title)}</div>
   <div style="font-size:13px;margin-top:12px;font-weight:500">${e(p.phone)} · ${e(p.email||'')} · ${e(p.wil)}</div>
  </header>
  <div style="margin:-40px 40px 0;background:#fff;border-radius:22px;padding:30px 34px;box-shadow:0 10px 30px rgba(30,16,60,.08)">
   ${sec('نبذة',`<p style="font-size:14.5px;line-height:1.9">${e(p.about)}</p>`,'#5B3DF5')}
   ${sec('المسيرة المهنية',(p.experiences||[]).map(x=>`<div style="display:grid;grid-template-columns:120px 1fr;gap:14px;margin-bottom:14px"><span style="color:#5B3DF5;font-weight:700;font-size:13px">${e(x.period)}</span><div><b>${e(x.title)}</b> · ${e(x.company)}<div style="font-size:14px;color:#4F4A63">${e(x.details)}</div></div></div>`).join(''),'#5B3DF5')}
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
    ${sec('التعليم',`<p>${e(p.edu)}</p>`,'#5B3DF5')}
    ${sec('اللغات',`<p style="line-height:1.9">${(p.langs||[]).map(e).join('<br>')}</p>`,'#5B3DF5')}
   </div>
   ${sec('المهارات',p.skills.map(s=>`<span style="display:inline-block;background:#EEE9FB;color:#2A1A52;border-radius:20px;padding:4px 14px;margin:0 0 6px 6px;font-size:13.5px;font-weight:700">${e(s)}</span>`).join(''),'#5B3DF5')}
  </div>
 </div>`}
};
function e(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function sec(t,body,c){return `<div style="margin-top:24px"><div style="font-size:15px;font-weight:800;color:${c};margin-bottom:8px;letter-spacing:.3px">${t}</div>${body}</div>`}
function side(t,body){return `<div style="margin-top:28px"><div style="font-size:12px;letter-spacing:2px;color:#C8F135;font-weight:800;margin-bottom:8px">${t}</div><div style="font-size:13.5px;line-height:1.9;color:#E9E4FA">${body}</div></div>`}
