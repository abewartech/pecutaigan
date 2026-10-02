// Cloudflare Pages Function: POST /api/chat
// Proxies to a free keyless LLM provider. No secrets needed.

const SYSTEM_PROMPT =
  "Kamu adalah asisten AI yang ramah dan membantu di situs PecutAigan. " +
  "Jawab dalam Bahasa Indonesia yang santai, jelas, dan ringkas kecuali diminta detail. " +
  "Kamu boleh membantu soal usaha, teknologi, menulis, hitung-hitungan, atau sekadar ngobrol.";

// Light per-IP guard (best-effort, per isolate)
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, reset: now + 60000 };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + 60000; }
  rec.count++;
  hits.set(ip, rec);
  return rec.count > 30; // 30 req/menit per IP
}

export async function onRequestPost(context) {
  const ip = context.request.headers.get("cf-connecting-ip") || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const clean = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!clean.length || clean[clean.length - 1].role !== "user") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  let upstream;
  try {
    upstream = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });
  } catch {
    return Response.json({ error: "upstream_unreachable" }, { status: 502 });
  }
  if (!upstream.ok) {
    return Response.json({ error: "upstream_error" }, { status: 502 });
  }
  let data;
  try {
    data = await upstream.json();
  } catch {
    return Response.json({ error: "upstream_error" }, { status: 502 });
  }
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return Response.json({ error: "empty_reply" }, { status: 502 });
  }
  return Response.json({ reply: reply.slice(0, 4000) });
}
