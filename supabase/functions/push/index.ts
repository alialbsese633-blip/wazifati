// =====================================================
// وظيفتي — إرسال الإشعارات إلى الجوال (Firebase Cloud Messaging)
// تُستدعى تلقائياً من Database Webhook عند إضافة صف في جدول notifications.
// الأسرار المطلوبة:
//   FIREBASE_SERVICE_ACCOUNT  محتوى ملف حساب الخدمة JSON من Firebase
//   WEBHOOK_SECRET            كلمة سر تضعها أيضاً في ترويسة الـ Webhook: x-webhook-secret
// =====================================================
import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleAuth } from 'npm:google-auth-library@9';

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) return json({ error: 'forbidden' }, 403);
  try {
    const payload = await req.json();
    const n = payload?.record;
    if (payload?.type !== 'INSERT' || !n?.user_id) return json({ skipped: true });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: tokens } = await admin.from('push_tokens').select('token').eq('user_id', n.user_id);
    if (!tokens?.length) return json({ sent: 0 });

    const sa = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!);
    const auth = new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/firebase.messaging'] });
    const access = await (await auth.getClient()).getAccessToken();
    const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

    let sent = 0;
    for (const { token } of tokens) {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: n.title, body: n.body ?? '' },
            data: { type: String(n.type ?? ''), job_id: String(n.job_id ?? ''), application_id: String(n.application_id ?? '') },
            android: { priority: 'high', notification: { channel_id: 'jobs', color: '#1B1035', sound: 'default' } },
          },
        }),
      });
      if (r.ok) sent++;
      else {
        const t = await r.text();
        if (r.status === 404 || t.includes('UNREGISTERED') || t.includes('INVALID_ARGUMENT')) await admin.from('push_tokens').delete().eq('token', token);
        console.error('fcm', r.status, t);
      }
    }
    return json({ sent });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
