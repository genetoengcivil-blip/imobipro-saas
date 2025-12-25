const { createClient } = require("@supabase/supabase-js");

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

    const SUPABASE_URL = must("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = must("SUPABASE_SERVICE_ROLE_KEY");
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Expira trials: tenant.plan='trial' e trial_end < now
    const { error } = await sb
      .from("tenants")
      .update({ active: false })
      .eq("plan", "trial")
      .lt("trial_end", new Date().toISOString());

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ ok: true, now: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: "server_error", details: err?.message || String(err) });
  }
};
