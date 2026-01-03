import mercadopago from "mercadopago";

export function getMpClient() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não definido.");
  mercadopago.configure({ access_token: token });
  return mercadopago;
}
