export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // TODO: Implement Mercado Pago subscription creation using MP_ACCESS_TOKEN
  // Expect body: { user_id, plan_id, payer: { email }, return_url }
  return res.status(200).json({
    ok: true,
    message: "Stub: implement create subscription with Mercado Pago",
  });
}
