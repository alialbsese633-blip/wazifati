/* =====================================================
   إعدادات وظيفتي
   اترك supabaseUrl فارغاً ليعمل التطبيق بالوضع التجريبي (بيانات أمثلة على الجهاز).
   عند تعبئته يعمل بالوضع الحقيقي: دخول Google/جوال، قاعدة بيانات، ذكاء اصطناعي حقيقي.
   مفتاح anon عام بطبيعته وآمن في الواجهة؛ لا تضع هنا أي مفتاح سري.
   ===================================================== */
window.WAZIFATI_CONFIG = {
  supabaseUrl:'https://smjqwojvzdayhxmcigay.supabase.co',            // مثال: https://abcd1234.supabase.co
  supabaseAnonKey:'sb_publishable_UMz1QuJaIQU2ZdTSXbczVQ_GFyTZ-1v',        // Project Settings ← API ← anon public
  googleLogin: true,          // الدخول بحساب Google
  phoneLogin: false,          // الدخول برقم الجوال (يحتاج مزوّد رسائل SMS في Supabase)
  pushEnabled: true ,         // إشعارات الجوال (بعد إضافة Firebase)
  nativeScheme: 'com.wazifati.app',
  webUrl: 'https://alialbsese633-blip.github.io/wazifati/',
  supportEmail: ''            // بريد الدعم الذي يظهر في سياسة الخصوصية
};
