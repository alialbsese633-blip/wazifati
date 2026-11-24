/* =====================================================
   قراءة السيرة الذاتية PDF
   1) استخراج النص بـ pdf.js (محلياً على الجهاز)
   2) فهم النص بالذكاء الاصطناعي، أو بمحلل محلي احتياطي
   ===================================================== */
const CVParse = {
  lib: null,
  async loadLib() {
    if (window.pdfjsLib) return window.pdfjsLib;
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/vendor/pdf.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/vendor/pdf.worker.min.js';
    return window.pdfjsLib;
  },
  async extract(file) {
    const lib = await this.loadLib();
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    let out = [];
    for (let i = 1; i <= Math.min(doc.numPages, 6); i++) {
      const page = await doc.getPage(i), tc = await page.getTextContent();
      let line = [], lastY = null;
      for (const it of tc.items) {
        const y = Math.round(it.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 3) { out.push(line.join(' ')); line = []; }
        line.push(it.str); lastY = y;
      }
      if (line.length) out.push(line.join(' '));
    }
    return out.map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n').slice(0, 15000);
  },
  /* محلل محلي احتياطي */
  local(text) {
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean), low = text.toLowerCase();
    const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [''])[0];
    const phone = ((text.match(/(\+?967[\s-]?)?7\d[\s-]?\d{3}[\s-]?\d{4}/) || text.match(/\+?\d[\d\s-]{7,}\d/) || [''])[0]).trim();
    const name = (lines.find(l => l.length < 40 && !/@|\d/.test(l)) || '').trim();
    const loc = (LOCS.find(x => low.includes(x.ar) || low.includes(x.en.toLowerCase())) || {}).id || '';
    const skills = SKILL_VOCAB.filter(s => low.includes(s.toLowerCase()));
    const yrs = text.match(/(\d{1,2})\s*\+?\s*(سنوات|سنة|عام|اعوام|أعوام|years?|yrs)/i);
    const edu = lines.find(l => /بكالوريوس|دبلوم|ماجستير|دكتوراه|ليسانس|bachelor|diploma|master|b\.?sc|university|جامعة/i.test(l)) || '';
    const experiences = lines.filter(l => /(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|الآن|حتى الآن|present|now|current)/i.test(l)).slice(0, 4).map(l => {
      const period = (l.match(/(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|الآن|حتى الآن|present|now|current)/i) || [''])[0];
      const rest = l.replace(period, '').replace(/[|•·,،-]+/g, ' ').trim();
      return { title: rest.slice(0, 60), company: '', period, details: '' };
    });
    const langs = [['العربية', /عرب|arabic/i], ['الإنجليزية', /انجليز|إنجليز|english/i], ['الفرنسية', /فرنس|french/i]].filter(x => x[1].test(text)).map(x => x[0]);
    const summary = lines.find(l => l.length > 60) || '';
    const title = (lines.slice(1, 6).find(l => l.length < 50 && !/@|\d/.test(l) && l !== name) || '');
    return { name, title, email, phone, loc, exp: yrs ? +yrs[1] : (experiences.length ? experiences.length : 0), edu, skills, langs, about: summary.slice(0, 400), experiences };
  }
};
