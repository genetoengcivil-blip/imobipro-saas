export default async function handler(req, res) {
  // TODO: Validate Mercado Pago signature/token as recommended by MP
  // TODO: Update subscriptions/payments in Supabase using SUPABASE_SERVICE_ROLE_KEY
  return res.status(200).json({ ok: true });
}
