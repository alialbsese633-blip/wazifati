/* =====================================================
   وظيفتي - الثوابت، اللغة، القوالب، والبيانات التجريبية (اليمن)
   ===================================================== */
let D = null; // ذاكرة التطبيق المشتركة بين كل الملفات

/* ---------- اللغة ---------- */
let LANG = (() => { try { return localStorage.getItem('wz-lang') || 'ar'; } catch (e) { return 'ar'; } })();
const L = (ar, en) => (LANG === 'en' ? (en ?? ar) : ar);
const nm = (list, id) => { const x = list.find(i => i.id === id); return x ? (LANG === 'en' ? x.en : x.ar) : (id || ''); };
function setLang(l) {
  LANG = l === 'en' ? 'en' : 'ar';
  try { localStorage.setItem('wz-lang', LANG); } catch (e) {}
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'en' ? 'ltr' : 'rtl';
}

/* ---------- القوائم ---------- */
const LOCS = [
  { id: 'sanaa', ar: 'صنعاء', en: "Sana'a" }, { id: 'aden', ar: 'عدن', en: 'Aden' }, { id: 'taiz', ar: 'تعز', en: 'Taiz' },
  { id: 'hodeidah', ar: 'الحديدة', en: 'Hodeidah' }, { id: 'ibb', ar: 'إب', en: 'Ibb' }, { id: 'mukalla', ar: 'المكلا', en: 'Mukalla' },
  { id: 'seiyun', ar: 'سيئون', en: 'Seiyun' }, { id: 'dhamar', ar: 'ذمار', en: 'Dhamar' }, { id: 'marib', ar: 'مأرب', en: 'Marib' },
  { id: 'ataq', ar: 'عتق', en: 'Ataq' }, { id: 'ghaydah', ar: 'الغيضة', en: 'Al Ghaydah' }, { id: 'lahj', ar: 'لحج', en: 'Lahj' },
  { id: 'abyan', ar: 'أبين', en: 'Abyan' }, { id: 'bayda', ar: 'البيضاء', en: 'Al Bayda' }, { id: 'hajjah', ar: 'حجة', en: 'Hajjah' },
  { id: 'saada', ar: 'صعدة', en: "Sa'dah" }, { id: 'amran', ar: 'عمران', en: 'Amran' }, { id: 'dhale', ar: 'الضالع', en: "Ad Dali'" },
  { id: 'socotra', ar: 'سقطرى', en: 'Socotra' }, { id: 'remote', ar: 'عن بعد', en: 'Remote' }
];
const CATS = [
  { id: 'accounting', ar: 'محاسبة ومالية', en: 'Accounting & Finance' }, { id: 'admin', ar: 'إدارة وسكرتارية', en: 'Administration' },
  { id: 'sales', ar: 'مبيعات وتسويق', en: 'Sales & Marketing' }, { id: 'hospitality', ar: 'فنادق ومطاعم', en: 'Hospitality' },
  { id: 'engineering', ar: 'هندسة وفنيون', en: 'Engineering & Technical' }, { id: 'it', ar: 'تقنية معلومات', en: 'IT & Software' },
  { id: 'education', ar: 'تعليم وتدريب', en: 'Education' }, { id: 'health', ar: 'صحة وتمريض', en: 'Healthcare' },
  { id: 'ngo', ar: 'منظمات وتنمية', en: 'NGOs & Development' }, { id: 'transport', ar: 'نقل وتوصيل', en: 'Transport & Delivery' },
  { id: 'support', ar: 'خدمة عملاء', en: 'Customer Service' }, { id: 'gigs', ar: 'أعمال مؤقتة', en: 'Gigs' }
];
const TYPES = [
  { id: 'full_time', ar: 'دوام كامل', en: 'Full-time' }, { id: 'part_time', ar: 'دوام جزئي', en: 'Part-time' },
  { id: 'contract', ar: 'عقد مؤقت', en: 'Contract' }, { id: 'internship', ar: 'تدريب', en: 'Internship' }
];
const STATUSES = [
  { id: 'new', ar: 'جديد', en: 'New', c: 'blue' }, { id: 'reviewed', ar: 'تمت المراجعة', en: 'Reviewed', c: 'gray' },
  { id: 'interview', ar: 'مقابلة', en: 'Interview', c: 'gold' }, { id: 'accepted', ar: 'مقبول', en: 'Accepted', c: '' },
  { id: 'rejected', ar: 'مرفوض', en: 'Rejected', c: 'red' }
];
const CURS = [{ id: 'YER', ar: 'ريال يمني', en: 'YER' }, { id: 'USD', ar: 'دولار', en: 'USD' }, { id: 'SAR', ar: 'ريال سعودي', en: 'SAR' }];
const MODES = [{ id: 'onsite', ar: 'حضوري', en: 'In person' }, { id: 'phone', ar: 'اتصال هاتفي', en: 'Phone call' }, { id: 'video', ar: 'مكالمة فيديو', en: 'Video call' }];
const COLORS = ['#2A1A52', '#5B3DF5', '#9C5B1F', '#1F7A8C', '#B3402F', '#0E5A4A', '#5A6B1F', '#8C3F5B'];
const SKILL_VOCAB = ['محاسبة', 'Excel', 'مطابقات بنكية', 'تقارير مالية', 'خدمة عملاء', 'إنجليزي', 'حجوزات', 'مبيعات', 'تفاوض', 'رخصة قيادة', 'إدارة', 'تدريس', 'تمريض', 'إسعافات أولية', 'React', 'JavaScript', 'CSS', 'Git', 'Python', 'SQL', 'كهرباء', 'سباكة', 'تكييف', 'صيانة', 'تصوير', 'مونتاج', 'تصميم', 'Photoshop', 'إدارة مشاريع', 'كتابة تقارير', 'تسويق رقمي', 'سكرتارية', 'أرشفة', 'Word', 'PowerPoint', 'قيادة فريق', 'تواصل', 'طبخ'];

/* ---------- قوالب إعلانات الوظائف ---------- */
const JOB_TEMPLATES = [
  { key: 'محاسب|حسابات|مالي|accountant', icon: '🧮', title: 'محاسب', cat: 'accounting', type: 'full_time', min: 150000, max: 250000, cur: 'YER', exp: 2, skills: ['محاسبة', 'Excel', 'مطابقات بنكية', 'تقارير مالية'],
    desc: 'نبحث عن محاسب منظم يتولى تسجيل القيود اليومية، ومتابعة الحسابات البنكية والمطابقات الشهرية، وإعداد التقارير المالية للإدارة، ومتابعة المديونيات والتحصيل.',
    reqs: ['بكالوريوس محاسبة أو ما يعادله', 'خبرة لا تقل عن سنتين', 'إجادة Excel والأنظمة المحاسبية', 'دقة عالية والتزام بالمواعيد'] },
  { key: 'استقبال|ريسبشن|فندق|reception', icon: '🛎️', title: 'موظف استقبال', cat: 'hospitality', type: 'full_time', min: 100000, max: 160000, cur: 'YER', exp: 1, skills: ['خدمة عملاء', 'إنجليزي', 'حجوزات'],
    desc: 'استقبال النزلاء وتسجيل الدخول والخروج، وإدارة الحجوزات عبر الهاتف والمنصات، ومتابعة طلبات النزلاء والتنسيق مع فريق النظافة والصيانة.',
    reqs: ['إجادة العربية والإنجليزية', 'لباقة ومظهر لائق', 'القدرة على العمل بنظام الورديات'] },
  { key: 'مبيعات|مندوب|تسويق|sales', icon: '📈', title: 'مندوب مبيعات', cat: 'sales', type: 'full_time', min: 90000, max: 180000, cur: 'YER', exp: 1, skills: ['مبيعات', 'تفاوض', 'رخصة قيادة'],
    desc: 'زيارة العملاء الحاليين والمحتملين، وعرض منتجات الشركة، وتحقيق أهداف المبيعات الشهرية، مع راتب أساسي وعمولات مجزية.',
    reqs: ['خبرة في المبيعات الميدانية', 'رخصة قيادة سارية', 'مهارات تواصل وإقناع'] },
  { key: 'سائق|توصيل|driver', icon: '🚗', title: 'سائق توصيل', cat: 'transport', type: 'part_time', min: 60000, max: 100000, cur: 'YER', exp: 0, skills: ['رخصة قيادة', 'تواصل'],
    desc: 'توصيل الطلبات للعملاء داخل المدينة بأمان وفي الوقت المحدد، مع مكافآت على عدد الطلبات المنجزة.',
    reqs: ['رخصة قيادة سارية', 'سيارة أو دراجة نارية خاصة', 'معرفة جيدة بالمنطقة'] },
  { key: 'معلم|مدرس|مدرب|teacher', icon: '📚', title: 'معلم', cat: 'education', type: 'full_time', min: 80000, max: 130000, cur: 'YER', exp: 2, skills: ['تدريس', 'تواصل'],
    desc: 'تدريس المادة وفق المنهج المعتمد، وإعداد خطط الدروس والاختبارات، ومتابعة مستوى الطلاب والتواصل مع أولياء الأمور.',
    reqs: ['بكالوريوس في التخصص أو التربية', 'خبرة تدريس سنتين على الأقل'] },
  { key: 'صيانة|تكييف|سباك|كهرب|فني|technician', icon: '🔧', title: 'فني صيانة عامة', cat: 'engineering', type: 'full_time', min: 90000, max: 150000, cur: 'YER', exp: 2, skills: ['سباكة', 'كهرباء', 'تكييف', 'صيانة'],
    desc: 'تنفيذ أعمال الصيانة الوقائية والطارئة (سباكة، كهرباء، تكييف) والاستجابة السريعة لبلاغات الأعطال وتوثيقها.',
    reqs: ['خبرة في الصيانة العامة', 'القدرة على التشخيص السريع', 'الاستعداد للعمل الطارئ'] },
  { key: 'مطور|مبرمج|برمج|developer', icon: '💻', title: 'مطور برمجيات', cat: 'it', type: 'full_time', min: 400, max: 900, cur: 'USD', exp: 2, skills: ['JavaScript', 'React', 'SQL', 'Git'],
    desc: 'تطوير وصيانة تطبيقات الويب والجوال، والعمل مع فريق التصميم والمنتج لتسليم ميزات عالية الجودة.',
    reqs: ['خبرة سنتين في تطوير الويب', 'معرفة بـ React وقواعد البيانات', 'مهارة حل المشكلات'] },
  { key: 'منظم|مشاريع|ميداني|ngo|project', icon: '🤝', title: 'مسؤول مشاريع', cat: 'ngo', type: 'contract', min: 600, max: 1000, cur: 'USD', exp: 3, skills: ['إدارة مشاريع', 'إنجليزي', 'كتابة تقارير'],
    desc: 'متابعة تنفيذ أنشطة المشروع الميدانية، والتنسيق مع الشركاء المحليين، وإعداد التقارير الدورية للمانحين.',
    reqs: ['بكالوريوس في مجال ذي صلة', 'خبرة 3 سنوات مع المنظمات', 'إجادة الإنجليزية كتابةً'] }
];

/* ---------- البيانات التجريبية ---------- */
function seed() {
  const day = 864e5, t = Date.now();
  const ago = d => t - d * day;
  const fake = (id, name, loc, exp, skills, title) => ({ id, name, loc, exp, skills, title, about: title + ' بخبرة ' + exp + ' سنوات.', edu: 'بكالوريوس', langs: ['العربية'], experiences: [], cvTpl: 'muscat', phone: '', email: '' });
  return {
    v: 2,
    users: [
      { id: 'u-seeker', role: 'seeker', name: 'سالم أحمد', email: 'salem@example.com', phone: '+967 770 000 000', loc: 'sanaa', title: 'محاسب', exp: 3,
        edu: 'بكالوريوس محاسبة - جامعة صنعاء', skills: ['محاسبة', 'Excel', 'خدمة عملاء'], langs: ['العربية (اللغة الأم)', 'الإنجليزية (جيد جداً)'],
        about: 'محاسب بخبرة 3 سنوات في الحسابات والمطابقات، أبحث عن فرصة في شركة منظمة.', cat: 'accounting', open: true, cvTpl: 'khanjar', cvPath: '',
        experiences: [{ title: 'محاسب', company: 'شركة تجارية في صنعاء', period: '2023 - الآن', details: 'تسجيل القيود اليومية والمطابقات البنكية الشهرية وإعداد التقارير.' },
                      { title: 'متدرب حسابات', company: 'مكتب تدقيق', period: '2022 - 2023', details: 'المساعدة في إعداد القوائم المالية وأرشفة المستندات.' }] },
      { id: 'u-emp', role: 'employer', name: 'أمل - الموارد البشرية', email: 'hr@example.com', phone: '', loc: 'aden', skills: [], langs: [], experiences: [] },
      { id: 'u-admin', role: 'admin', name: 'مشرف المنصة', email: 'admin@example.com', phone: '', loc: 'sanaa', skills: [], langs: [], experiences: [] }
    ],
    companies: [
      { id: 'c1', owner: 'u-emp', name: 'شركة الريان للضيافة', cr: '12345', loc: 'aden', about: 'فنادق وشقق مفروشة في عدن', status: 'verified', rating: 4.5, ratingCount: 12, appsTotal: 0, appsResponded: 0 },
      { id: 'c2', owner: 'x2', name: 'مجموعة الصفوة التجارية', cr: '22871', loc: 'sanaa', about: 'استيراد وتوزيع مواد غذائية', status: 'verified', rating: 4.1, ratingCount: 8, appsTotal: 40, appsResponded: 31 },
      { id: 'c3', owner: 'x3', name: 'أكاديمية المستقبل', cr: '30190', loc: 'taiz', about: 'تعليم وتدريب', status: 'verified', rating: 4.3, ratingCount: 5, appsTotal: 20, appsResponded: 17 },
      { id: 'c4', owner: 'x4', name: 'مستشفى الأمل التخصصي', cr: '41022', loc: 'sanaa', about: 'خدمات صحية', status: 'verified', rating: 3.8, ratingCount: 9, appsTotal: 30, appsResponded: 21 },
      { id: 'c5', owner: 'x5', name: 'سريع للتوصيل', cr: '55301', loc: 'sanaa', about: 'توصيل طلبات', status: 'pending', rating: 0, ratingCount: 0, appsTotal: 10, appsResponded: 4 },
      { id: 'c6', owner: 'x6', name: 'حلول سبأ الرقمية', cr: '61877', loc: 'sanaa', about: 'برمجيات وحلول رقمية', status: 'verified', rating: 4.7, ratingCount: 6, appsTotal: 25, appsResponded: 22 },
      { id: 'c7', owner: 'x7', name: 'مؤسسة البناء الحديث', cr: '70455', loc: 'mukalla', about: 'مقاولات', status: 'verified', rating: 3.9, ratingCount: 4, appsTotal: 15, appsResponded: 10 },
      { id: 'c8', owner: 'x8', name: 'منظمة رعاية المجتمع', cr: '80912', loc: 'aden', about: 'منظمة تنموية محلية', status: 'verified', rating: 4.4, ratingCount: 10, appsTotal: 60, appsResponded: 48 },
      { id: 'c9', owner: 'x9', name: 'مؤسسة الربح السريع', cr: '', loc: 'sanaa', about: 'تسويق', status: 'pending', rating: 0, ratingCount: 0, appsTotal: 0, appsResponded: 0 }
    ],
    jobs: [
      { id: 'j1', company: 'c1', title: 'محاسب أول', cat: 'accounting', loc: 'aden', type: 'full_time', min: 250000, max: 350000, cur: 'YER', exp: 3, skills: ['محاسبة', 'Excel', 'مطابقات بنكية'], desc: 'إدارة الحسابات اليومية وإعداد التقارير المالية الشهرية للفنادق والشقق التابعة للشركة.', reqs: ['بكالوريوس محاسبة', 'خبرة 3 سنوات', 'إجادة Excel'], status: 'active', gig: false, feat: true, views: 182, created: ago(2) },
      { id: 'j2', company: 'c1', title: 'موظف استقبال فندقي', cat: 'hospitality', loc: 'aden', type: 'full_time', min: 150000, max: 200000, cur: 'YER', exp: 1, skills: ['خدمة عملاء', 'إنجليزي', 'حجوزات'], desc: 'استقبال النزلاء وإدارة الحجوزات وتسجيل الدخول والخروج.', reqs: ['إجادة العربية والإنجليزية', 'العمل بنظام الورديات'], status: 'active', gig: false, feat: false, views: 240, created: ago(1) },
      { id: 'j3', company: 'c1', title: 'مشرف شقق مفروشة', cat: 'admin', loc: 'aden', type: 'full_time', min: 220000, max: 300000, cur: 'YER', exp: 4, skills: ['إدارة', 'صيانة', 'كتابة تقارير'], desc: 'الإشراف على تشغيل المبنى ومتابعة الصيانة والعمال والنظافة.', reqs: ['خبرة في إدارة المباني', 'مهارات تواصل'], status: 'active', gig: false, feat: false, views: 97, created: ago(4) },
      { id: 'j4', company: 'c2', title: 'مندوب مبيعات ميداني', cat: 'sales', loc: 'sanaa', type: 'full_time', min: 90000, max: 160000, cur: 'YER', exp: 2, skills: ['مبيعات', 'تفاوض', 'رخصة قيادة'], desc: 'زيارة البقالات والمحلات وتحقيق أهداف المبيعات الشهرية مع عمولات.', reqs: ['خبرة في المبيعات', 'رخصة قيادة سارية'], status: 'active', gig: false, feat: true, views: 310, created: ago(3) },
      { id: 'j5', company: 'c3', title: 'معلم رياضيات', cat: 'education', loc: 'taiz', type: 'full_time', min: 80000, max: 120000, cur: 'YER', exp: 2, skills: ['تدريس', 'تواصل'], desc: 'تدريس الرياضيات للمرحلة الثانوية وإعداد الاختبارات.', reqs: ['بكالوريوس رياضيات أو تربية', 'خبرة تدريس'], status: 'active', gig: false, feat: false, views: 76, created: ago(6) },
      { id: 'j6', company: 'c4', title: 'ممرض / ممرضة', cat: 'health', loc: 'sanaa', type: 'full_time', min: 100000, max: 150000, cur: 'YER', exp: 2, skills: ['تمريض', 'إسعافات أولية'], desc: 'رعاية المرضى بالأقسام الداخلية ضمن فريق طبي.', reqs: ['دبلوم أو بكالوريوس تمريض', 'ترخيص مزاولة'], status: 'active', gig: false, feat: false, views: 154, created: ago(5) },
      { id: 'j7', company: 'c5', title: 'سائق توصيل (دوام جزئي)', cat: 'transport', loc: 'sanaa', type: 'part_time', min: 60000, max: 100000, cur: 'YER', exp: 0, skills: ['رخصة قيادة'], desc: 'توصيل الطلبات في فترة المساء مع مكافآت على عدد الطلبات.', reqs: ['رخصة قيادة', 'دراجة نارية خاصة'], status: 'active', gig: false, feat: false, views: 420, created: ago(1) },
      { id: 'j8', company: 'c6', title: 'مطور واجهات React', cat: 'it', loc: 'remote', type: 'full_time', min: 500, max: 800, cur: 'USD', exp: 3, skills: ['React', 'JavaScript', 'CSS'], desc: 'بناء واجهات تطبيقات ويب لعملاء في الخليج.', reqs: ['خبرة 3 سنوات في React', 'معرفة Git'], status: 'active', gig: false, feat: false, views: 268, created: ago(2) },
      { id: 'j9', company: 'c7', title: 'فني كهرباء', cat: 'engineering', loc: 'mukalla', type: 'contract', min: 1500, max: 2200, cur: 'SAR', exp: 3, skills: ['كهرباء', 'صيانة'], desc: 'أعمال تمديدات وصيانة كهربائية في مشروع سكني.', reqs: ['شهادة فني كهرباء', 'خبرة 3 سنوات'], status: 'active', gig: false, feat: false, views: 88, created: ago(7) },
      { id: 'j10', company: 'c8', title: 'مسؤول مشاريع ميدانية', cat: 'ngo', loc: 'aden', type: 'contract', min: 700, max: 1000, cur: 'USD', exp: 3, skills: ['إدارة مشاريع', 'إنجليزي', 'كتابة تقارير'], desc: 'متابعة أنشطة مشروع سبل العيش في محافظات الجنوب وإعداد التقارير للمانح.', reqs: ['بكالوريوس', 'خبرة 3 سنوات مع المنظمات', 'إنجليزي ممتاز'], status: 'active', gig: false, feat: false, views: 512, created: ago(2) },
      { id: 'j11', company: 'c2', title: 'محاسب مبتدئ', cat: 'accounting', loc: 'sanaa', type: 'full_time', min: 80000, max: 110000, cur: 'YER', exp: 0, skills: ['محاسبة', 'Excel'], desc: 'إدخال الفواتير والقيود ومتابعة حسابات العملاء تحت إشراف المحاسب الرئيسي.', reqs: ['دبلوم أو بكالوريوس محاسبة'], status: 'active', gig: false, feat: false, views: 64, created: ago(1) },
      { id: 'j12', company: 'c1', title: 'مساعد تصوير فيديو (يوم واحد)', cat: 'gigs', loc: 'aden', type: 'contract', min: 15000, max: 20000, cur: 'YER', exp: 0, skills: ['تصوير', 'مونتاج'], desc: 'مساعدة في تصوير فيديو ترويجي يوم السبت (أجر لليوم).', reqs: ['معرفة بالتصوير', 'التزام بالموعد'], status: 'active', gig: true, feat: false, views: 51, created: ago(0) },
      { id: 'j13', company: 'c3', title: 'مدرب لغة إنجليزية (تدريب)', cat: 'education', loc: 'taiz', type: 'internship', min: 40000, max: 60000, cur: 'YER', exp: 0, skills: ['إنجليزي', 'تدريس'], desc: 'برنامج تدريبي لحديثي التخرج لمدة 3 أشهر مع شهادة.', reqs: ['خريج حديث', 'إجادة الإنجليزية'], status: 'active', gig: false, feat: false, views: 119, created: ago(2) },
      { id: 'j14', company: 'c2', title: 'محاسب تكاليف', cat: 'accounting', loc: 'sanaa', type: 'full_time', min: 150000, max: 220000, cur: 'YER', exp: 2, skills: ['محاسبة', 'Excel', 'تقارير مالية'], desc: 'حساب تكلفة المنتجات ومتابعة المخزون وإعداد تقارير الربحية الشهرية.', reqs: ['بكالوريوس محاسبة', 'خبرة سنتين'], status: 'pending', gig: false, feat: false, views: 0, created: ago(0) },
      { id: 'j15', company: 'c9', title: 'مندوب تحصيل - راتب 500 دولار', cat: 'sales', loc: 'sanaa', type: 'part_time', min: 500, max: 800, cur: 'USD', exp: 0, skills: ['تواصل'], desc: 'وظيفة سهلة من البيت براتب عالي. مطلوب تحويل رسوم تسجيل 10,000 ريال قبل المقابلة، والتواصل على واتساب فقط.', reqs: ['لا يشترط خبرة'], status: 'pending', gig: false, feat: false, views: 0, created: ago(0) }
    ],
    apps: [
      { id: 'a1', job: 'j1', seeker: 's1', snap: fake('s1', 'ناصر الحداد', 'aden', 5, ['محاسبة', 'Excel', 'مطابقات بنكية', 'Tally'], 'محاسب'), status: 'new', note: '', created: ago(1), responded: false },
      { id: 'a2', job: 'j1', seeker: 's2', snap: fake('s2', 'منى الشرعبي', 'aden', 3, ['محاسبة', 'Excel'], 'محاسبة'), status: 'interview', note: '', created: ago(3), responded: true },
      { id: 'a3', job: 'j1', seeker: 's3', snap: fake('s3', 'يوسف العمودي', 'sanaa', 1, ['Excel'], 'مدخل بيانات'), status: 'rejected', note: '', created: ago(4), responded: true },
      { id: 'a4', job: 'j2', seeker: 's4', snap: fake('s4', 'ريم باوزير', 'aden', 2, ['خدمة عملاء', 'إنجليزي', 'حجوزات'], 'موظفة استقبال'), status: 'new', note: '', created: ago(0), responded: false },
      { id: 'a5', job: 'j2', seeker: 's5', snap: fake('s5', 'خالد السقاف', 'aden', 1, ['خدمة عملاء', 'إنجليزي'], 'خدمة عملاء'), status: 'reviewed', note: '', created: ago(1), responded: true },
      { id: 'a6', job: 'j3', seeker: 's6', snap: fake('s6', 'سعيد بن بريك', 'aden', 6, ['إدارة', 'صيانة', 'كتابة تقارير'], 'مشرف مبانٍ'), status: 'new', note: '', created: ago(2), responded: false }
    ],
    msgs: [
      { id: 'm1', app: 'a2', sender: 'u-emp', body: 'مرحباً منى، أعجبنا ملفك. هل يناسبك حضور مقابلة هذا الأسبوع؟', created: ago(2) },
      { id: 'm2', app: 'a2', sender: 's2', body: 'أهلاً بكم، نعم يناسبني. شكراً لكم.', created: ago(2) + 36e5 }
    ],
    interviews: [
      { id: 'i1', app: 'a2', slots: [ago(-2), ago(-3)], chosen: ago(-2), mode: 'onsite', place: 'مكتب الشركة - خور مكسر', note: 'أحضري نسخة من الشهادات', status: 'confirmed', created: ago(2) }
    ],
    reviews: [
      { id: 'r1', company: 'c1', seeker: 'x', name: 'باحث عن عمل', rating: 5, comment: 'ردوا عليّ خلال يومين وكانت المقابلة محترمة.', created: ago(20) },
      { id: 'r2', company: 'c1', seeker: 'y', name: 'متقدمة', rating: 4, comment: 'إجراءات واضحة، تأخر الرد قليلاً.', created: ago(12) },
      { id: 'r3', company: 'c2', seeker: 'z', name: 'مندوب سابق', rating: 4, comment: 'بيئة عمل جيدة والعمولات تُصرف في وقتها.', created: ago(30) }
    ],
    saved: [], alerts: [], reports: [{ id: 'rp1', job: 'j7', reason: 'طلب رسوم قبل التوظيف', status: 'open', created: ago(1) }],
    notifs: [{ id: 'n1', user: 'u-seeker', type: 'welcome', title: 'مرحباً بك في وظيفتي 👋', body: 'أكمل ملفك وارفع سيرتك، والمساعد الذكي جاهز لمساعدتك.', read: false, created: ago(0) }],
    chat: [], welcomed: false, demoRole: 'seeker'
  };
}
