# دليل تشغيل وظيفتي بالوضع الحقيقي

التطبيق يعمل الآن بالوضع التجريبي بدون أي إعداد. لتشغيله فعلياً لمستخدمين حقيقيين نحتاج 5 مراحل.
نفّذها مرحلة مرحلة، ولا تنتقل للتالية حتى تنجح السابقة.

| المرحلة | ماذا تعطينا | التكلفة |
|---|---|---|
| 1. Supabase | قاعدة البيانات، الحسابات، الملفات، التحديث اللحظي | مجاني للبداية (الخطة المجانية) |
| 2. الدخول بـ Google | تسجيل الدخول بجيميل | مجاني |
| 3. الذكاء الاصطناعي | المساعد الذكي الحقيقي في الرابط و APK | حسب الاستخدام (يُحدّ يومياً لكل مستخدم) |
| 4. إشعارات الجوال | إشعار يصل للجوال حتى لو التطبيق مغلق | مجاني (Firebase) |
| 5. الدخول برقم الجوال (اختياري) | رمز تحقق SMS | مدفوع لكل رسالة (مزوّد SMS) |

---

## المرحلة 1: Supabase
1. افتح https://supabase.com وسجّل بحساب GitHub.
2. **New project**: الاسم `wazifati`، كلمة سر قوية لقاعدة البيانات (احفظها)، المنطقة الأقرب: **Frankfurt** أو **Mumbai**.
3. بعد الإنشاء: **SQL Editor ← New query**، الصق محتوى `supabase/schema.sql` كاملاً ثم **Run**.
4. **Project Settings ← API**: انسخ **Project URL** و **anon public key** وضعهما في `js/config.js`:
   ```js
   supabaseUrl: 'https://xxxx.supabase.co',
   supabaseAnonKey: 'eyJ...'
   ```
5. **Authentication ← URL Configuration**:
   - Site URL: `https://alialbsese633-blip.github.io/wazifati/`
   - Redirect URLs: أضف `https://alialbsese633-blip.github.io/wazifati/` و `com.wazifati.app://auth`

## المرحلة 2: الدخول بحساب Google
1. https://console.cloud.google.com ← مشروع جديد `wazifati`.
2. **APIs & Services ← OAuth consent screen**: External، اسم التطبيق «وظيفتي»، بريدك، ثم Publish.
3. **Credentials ← Create credentials ← OAuth client ID**: النوع **Web application**.
   - Authorized redirect URI: `https://xxxx.supabase.co/auth/v1/callback` (من Supabase ← Authentication ← Providers ← Google).
4. انسخ Client ID و Client secret إلى Supabase: **Authentication ← Providers ← Google ← Enable**.
5. سجّل الدخول بحسابك من التطبيق، ثم اجعل نفسك مشرفاً من SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'your@gmail.com';
   ```

## المرحلة 3: الذكاء الاصطناعي الحقيقي
1. أنشئ مفتاح API من https://console.anthropic.com (يحتاج رصيداً مدفوعاً).
2. Supabase ← **Edge Functions ← Secrets**: أضف `ANTHROPIC_API_KEY`.
   اختياري: `AI_DAILY_LIMIT` (الافتراضي 40 طلباً يومياً لكل مستخدم) و `AI_MODEL`.
3. **Edge Functions ← Deploy a new function ← Via Editor**: الاسم `ai`، الصق `supabase/functions/ai/index.ts`.
   وأنشئ في نفس المحرر ملف `../_shared/guide.ts` من `supabase/functions/_shared/guide.ts`.
   (أو عبر Supabase CLI: `supabase functions deploy ai`)

## المرحلة 4: إشعارات الجوال (Firebase)
1. https://console.firebase.google.com ← مشروع جديد ← **Add app ← Android**، الحزمة: `com.wazifati.app`.
2. نزّل `google-services.json`، وضع محتواه في GitHub: **Settings ← Secrets and variables ← Actions ← New secret** باسم `GOOGLE_SERVICES_JSON`.
3. Firebase ← **Project settings ← Service accounts ← Generate new private key**، وضع محتوى الملف في Supabase Secrets باسم `FIREBASE_SERVICE_ACCOUNT`، وأضف `WEBHOOK_SECRET` بأي كلمة سر طويلة.
4. انشر الدالة `push` (من `supabase/functions/push/index.ts`) مع إيقاف **Verify JWT** لها.
5. Supabase ← **Database ← Webhooks ← Create**: الجدول `notifications`، الحدث `Insert`، النوع Supabase Edge Function ← `push`، وأضف ترويسة `x-webhook-secret` بنفس قيمة `WEBHOOK_SECRET`.
6. في `js/config.js` اجعل `pushEnabled: true` وارفع التعديل؛ سيُبنى APK جديد تلقائياً.

## المرحلة 5 (اختيارية): الدخول برقم الجوال
1. Supabase ← **Authentication ← Providers ← Phone ← Enable** واختر مزوّد SMS (مثل Twilio) وأدخل بياناته.
2. في `js/config.js` اجعل `phoneLogin: true`.
> تنبيه: وصول رسائل SMS للأرقام اليمنية (+967) يختلف حسب المزوّد وتكلفته أعلى. جرّب برقمك أولاً.

---

## ملاحظات قبل الإطلاق العلني
- أضف بريد الدعم في `js/config.js` ← `supportEmail` ليظهر في سياسة الخصوصية.
- راجع سياسة الخصوصية والشروط (`docs/PRIVACY.md`, `docs/TERMS.md`) مع مستشار قانوني في اليمن.
- تأكد أن مزوّدي الخدمة (الذكاء الاصطناعي، Firebase، Google) يسمحون بخدمة المستخدمين في اليمن وفق شروطهم.
