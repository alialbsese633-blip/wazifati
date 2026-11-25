# بوسترات إنستجرام — وظيفتي

12 بوستراً بمقاس 1080×1350، و`preview.png` الذي يعرضها في شبكة 3×4 كما ستظهر في الصفحة (الأحدث أعلى اليسار). الكابشنات في `captions.txt`.

## إعادة التوليد
```bash
node posters/src/render.js /tmp/posters-2x                      # صفحات HTML ثم لقطات بـ deviceScaleFactor 2 مع فحص الهوامش والأسطر
python3 posters/src/build.py /tmp/posters-2x posters            # تصغير إلى 1080×1350 وبناء preview.png
```
- النصوص والأيقونات في `src/posters.js`، والشخصيات المرسومة بالكود في `src/people.js`، والتصميم في `src/poster.css`.
- الخط Tajawal (خط التطبيق) محفوظ محلياً في `src/fonts/` (رخصة OFL).
- الشعار يُحمَّل كما هو من `assets/brand/` (logo-horizontal-white.svg على الداكن، و logo-horizontal.svg على الفاتح).
