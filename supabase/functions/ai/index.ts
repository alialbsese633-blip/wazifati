// =====================================================
// وظيفتي — دالة المساعد الذكي (Supabase Edge Function: ai)
// - تتحقق أن المستخدم مسجل الدخول
// - حد يومي لكل مستخدم (AI_DAILY_LIMIT، الافتراضي 40)
// - تضيف دليل التطبيق كاملاً ليعرف المساعد كل شيء عن وظيفتي
// الأسرار المطلوبة: ANTHROPIC_API_KEY   (اختياري: AI_MODEL, AI_DAILY_LIMIT, ALLOWED_ORIGIN)
// =====================================================
import { createClient } from 'npm:@supabase/supabase-js@2';
import { guideText } from '../_shared/guide.ts';

const MODEL = Deno.env.get('AI_MODEL') ?? 'claude-sonnet-5-5';
const LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '40');
const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const auth = req.headers.get('Authorization') ?? '';
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'sign in required' }, 401);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: ok } = await admin.rpc('ai_hit', { p_user: user.id, p_limit: LIMIT });
    if (ok === false) return json({ error: 'daily limit' }, 429);

    const { messages, lang } = await req.json();
    const clean = (Array.isArray(messages) ? messages : [])
      .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
      .slice(-10)
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 20000) }));
    if (!clean.length || clean[clean.length - 1].role !== 'user') return json({ error: 'messages required' }, 400);

    const l = lang === 'en' ? 'en' : 'ar';
    const system = `أنت «سند»، المساعد الذكي الرسمي لتطبيق «وظيفتي» للتوظيف (يبدأ في اليمن).
تعرف التطبيق جيداً، وهذا دليله الكامل — أجب منه عن أي سؤال عن طريقة الاستخدام:
${guideText(l)}

قواعد:
- ${l === 'en' ? 'Reply in clear, simple English.' : 'اكتب بالعربية البسيطة الواضحة.'} كن مختصراً ودقيقاً.
- اتبع التعليمات وصيغة الإخراج المطلوبة داخل رسالة المستخدم بدقة (مثل JSON فقط عند طلبه).
- لا تخترع وظائف أو شركات أو أرقام غير موجودة في البيانات المرسلة.
- لا يجوز أن يدفع الباحث أي رسوم مقابل التوظيف؛ نبّه على ذلك عند الحاجة.
- لا تطلب كلمات مرور أو بيانات بنكية.`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, system, messages: clean }),
    });
    if (!r.ok) { console.error('anthropic', r.status, await r.text()); return json({ error: 'ai upstream ' + r.status }, 502); }
    const data = await r.json();
    const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    return json({ text });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
