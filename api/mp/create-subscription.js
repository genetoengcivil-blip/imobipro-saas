const { createClient } = require("@supabase/supabase-js");

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function getSupabaseUser({ supabaseUrl, serviceRoleKey, jwt }) {
  const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${jwt}`,
    },
  });
  if (!r.ok) return null;
  return await r.json();
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (!req.body) return {};
  try { return JSON.parse(req.body); } catch { return {}; }
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

    const SUPABASE_URL = must("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = must("SUPABASE_SERVICE_ROLE_KEY");
    const MP_ACCESS_TOKEN = must("MP_ACCESS_TOKEN");
    const APP_URL = must("APP_URL");

    const auth = req.headers.authorization || "";
    const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!jwt) return res.status(401).json({ error: "missing_auth" });

    const user = await getSupabaseUser({ supabaseUrl: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY, jwt });
    if (!user?.id) return res.status(401).json({ error: "invalid_auth" });

    const body = parseBody(req);
    const plan = String(body.plan || "profissional").toLowerCase();

    // Ajuste preços conforme sua estratégia comercial
    const pricing = {
      basico: { amount: 59.9, reason: "Plano Básico ImobiPro (mensal)" },
      profissional: { amount: 99.9, reason: "Plano Profissional ImobiPro (mensal)" },
    };
    const chosen = pricing[plan] || pricing.profissional;

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Descobrir tenant do usuário
    const { data: prof, error: eProf } = await sb
      .from("profiles")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .single();
    if (eProf || !prof?.tenant_id) return res.status(400).json({ error: "profile_not_found" });
    const tenant_id = prof.tenant_id;

    const webhookUrl = `${APP_URL.replace(/\/$/, "")}/api/mp/webhook`;
    const backUrl = `${APP_URL.replace(/\/$/, "")}/corretor?billing=success`;

    // Cria assinatura recorrente via /preapproval (sem plano associado; mais simples)
    // Referência: https://www.mercadopago.com.br/developers/en/reference/subscriptions/_preapproval/post
    const payload = {
      reason: chosen.reason,
      payer_email: user.email,
      external_reference: String(tenant_id),
      back_url: backUrl,
      notification_url: webhookUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: chosen.amount,
        currency_id: "BRL",
      },
    };

    const mpResp = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const mpData = await mpResp.json().catch(() => ({}));
    if (!mpResp.ok) {
      await sb.from("mp_events").insert({ payload: { kind: "create_preapproval_error", mpData, payload } }).catch(() => null);
      return res.status(400).json({ error: "mp_error", details: mpData });
    }

    const mp_preapproval_id = mpData.id;
    const mp_status = mpData.status;

    await sb.from("subscriptions").insert({
      tenant_id,
      user_id: user.id,
      plan,
      status: mp_status === "authorized" ? "active" : "pending",
      mp_preapproval_id,
      mp_status,
    }).catch(async () => {
      await sb.from("mp_events").insert({ payload: { kind: "subscriptions_insert_failed", mpData } }).catch(() => null);
    });

    // Atualiza tenant.plan
    await sb.from("tenants").update({ plan }).eq("id", tenant_id);

    return res.status(200).json({
      ok: true,
      init_point: mpData.init_point || null,
      sandbox_init_point: mpData.sandbox_init_point || null,
      mp_preapproval_id,
      mp_status,
    });
  } catch (err) {
    return res.status(500).json({ error: "server_error", details: err?.message || String(err) });
  }
};
