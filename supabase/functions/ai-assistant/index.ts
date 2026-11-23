// وظيفتي - دالة المساعد الذكي (Supabase Edge Function)
// النشر:
//   supabase secrets set ANTHROPIC_API_KEY=...   (المفتاح يبقى في الخادم فقط)
//   supabase functions deploy ai-assistant
// ثم ضع الرابط في js/config.js → aiEndpoint
const MODEL = Deno.env.get("AI_MODEL") ?? "claude-sonnet-5-5";
const MAX_INPUT = 12_000; // حد أعلى لطول المحادثة بالأحرف

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || !messages.length) return json({ error: "messages required" }, 400);
    const clean = messages
      .filter((m: any) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-10);
    if (JSON.stringify(clean).length > MAX_INPUT * 3) return json({ error: "too long" }, 413);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system: "أنت مساعد توظيف داخل منصة وظيفتي في سلطنة عُمان. اتبع التعليمات الموجودة داخل رسالة المستخدم، واكتب بالعربية الواضحة.",
        messages: clean,
      }),
    });
    if (!r.ok) return json({ error: "ai upstream " + r.status }, 502);
    const data = await r.json();
    const text = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    return json({ text });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
}
