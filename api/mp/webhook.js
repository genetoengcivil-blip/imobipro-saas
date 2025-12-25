const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// Mercado Pago manda assinatura secreta em headers (x-signature, x-request-id).
// Se você configurar MP_WEBHOOK_SECRET, validamos; se não, aceitamos (útil para testes).
// Ref: Webhooks e assinatura secreta: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications/webhooks
function verifySignature(req, secret) {
  try {
    const signature = req.headers["x-signature"];
    const requestId = req.headers["x-request-id"];
    if (!signature || !requestId) return false;

    // x-signature costuma vir no formato: ts=...,v1=...
    const parts = String(signature).split(",");
    const tsPart = parts.find(p => p.trim().startsWith("ts="));
    const v1Part = parts.find(p => p.trim().startsWith("v1="));
    if (!tsPart || !v1Part) return false;

    const ts = tsPart.split("=")[1];
    const v1 = v1Part.split("=")[1];

    // String de assinatura: {ts}.{requestId}.{rawBody}
    // Observação: o MP documenta validação com base no conteúdo recebido.
    const raw = req.bodyRaw || (typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}));
    const manifest = `${ts}.${requestId}.${raw}`;

    const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (!req.body) return {};
  try { return JSON.parse(req.body); } catch { return {}; }
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

    // guardar raw body (Vercel pode entregar como objeto já; aqui best effort)
    req.bodyRaw = typeof req.body === "string" ? req.body : null;

    const SUPABASE_URL = must("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = must("SUPABASE_SERVICE_ROLE_KEY");
    const MP_ACCESS_TOKEN = must("MP_ACCESS_TOKEN");
    const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";

    if (MP_WEBHOOK_SECRET) {
      const ok = verifySignature(req, MP_WEBHOOK_SECRET);
      if (!ok) return res.status(401).json({ error: "invalid_signature" });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const body = parseBody(req);

    // Registrar evento (debug)
    await sb.from("mp_events").insert({ payload: body }).catch(() => null);

    // Muitos webhooks do MP vêm assim: { action, api_version, data: { id }, type/date_created }
    const mpId = body?.data?.id || body?.id || null;
    if (!mpId) return res.status(200).json({ ok: true });

    // Buscar status atualizado no MP
    // Ref: GET /preapproval/{id}: https://www.mercadopago.com.br/developers/en/reference/subscriptions/_preapproval_id/get
    const mpResp = await fetch(`https://api.mercadopago.com/preapproval/${mpId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const mpData = await mpResp.json().catch(() => ({}));
    if (!mpResp.ok) return res.status(200).json({ ok: true });

    const mp_status = mpData.status; // ex.: authorized, cancelled, paused, pending
    let status = "pending";
    if (mp_status === "authorized") status = "active";
    if (mp_status === "cancelled") status = "canceled";
    if (mp_status === "paused") status = "expired";

    // Atualiza subscription no banco
    const { data: sub } = await sb
      .from("subscriptions")
      .select("tenant_id, plan")
      .eq("mp_preapproval_id", mpId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    await sb
      .from("subscriptions")
      .update({ status, mp_status })
      .eq("mp_preapproval_id", mpId)
      .catch(() => null);

    // Atualiza tenant para liberar/bloquear
    if (sub?.tenant_id) {
      const updates = {};
      if (status === "active") {
        updates.plan = sub.plan || "profissional";
        updates.active = true;
      }
      if (status !== "active") {
        // mantém plan, mas pode bloquear por lógica de negócios
        // aqui, se cancelar, deixa tenant ativo = false apenas se plan era pago
        updates.active = false;
      }
      await sb.from("tenants").update(updates).eq("id", sub.tenant_id).catch(() => null);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "server_error", details: err?.message || String(err) });
  }
};
