import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

const NEXANO_WEBHOOK_TOKEN = process.env.NEXANO_WEBHOOK_TOKEN || "";
const WEBHOOK_DEBUG = (process.env.WEBHOOK_DEBUG || "").toLowerCase() === "true";

type AnyObj = Record<string, any>;

function json(res: ServerResponse, status: number, body: AnyObj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function getHeader(req: IncomingMessage, name: string): string {
  const v = req.headers[name.toLowerCase()];
  if (Array.isArray(v)) return v[0] ?? "";
  return (v ?? "").toString();
}

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

function normalizeDocument(doc: string): string {
  return (doc || "").replace(/\D/g, "");
}

function maskEmail(email: string) {
  if (!email) return "";
  const [u, d] = email.split("@");
  if (!d) return "***";
  return `${u.slice(0, 2)}***@${d}`;
}

function maskDoc(doc: string) {
  const digits = normalizeDocument(doc);
  if (!digits) return "";
  if (digits.length <= 4) return "****";
  return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

// “Desembrulha” valores quando vierem como objeto
function unwrapPrimitive(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);

  if (typeof v === "object") {
    const keys = [
      "value",
      "number",
      "document",
      "document_number",
      "cpf",
      "cnpj",
      "email",
      "documentNumber",
      "taxId",
      "idNumber",
    ];
    for (const k of keys) {
      if (k in v) return unwrapPrimitive(v[k]);
    }
    const onlyKeys = Object.keys(v);
    if (onlyKeys.length === 1) return unwrapPrimitive(v[onlyKeys[0]]);
  }

  return "";
}

function safeClone(obj: any) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

function printPayloadSample(payload: any) {
  const safe = safeClone(payload);

  // mascara client se existir
  try {
    if (safe?.client?.email) safe.client.email = maskEmail(String(safe.client.email));
    const d =
      safe?.client?.document ||
      safe?.client?.documentNumber ||
      safe?.client?.cpf ||
      safe?.client?.cnpj ||
      safe?.client?.taxId ||
      safe?.client?.idNumber;

    if (d) {
      if (safe?.client?.document) safe.client.document = maskDoc(String(d));
      if (safe?.client?.documentNumber) safe.client.documentNumber = maskDoc(String(d));
      if (safe?.client?.cpf) safe.client.cpf = maskDoc(String(d));
      if (safe?.client?.cnpj) safe.client.cnpj = maskDoc(String(d));
      if (safe?.client?.taxId) safe.client.taxId = maskDoc(String(d));
      if (safe?.client?.idNumber) safe.client.idNumber = maskDoc(String(d));
    }
  } catch {}

  console.log("[NEXANO_WEBHOOK] payload_sample:", JSON.stringify(safe).slice(0, 6000));
}

/**
 * ✅ Validação do token:
 * 1) tenta headers (x-webhook-token, authorization etc.)
 * 2) se não vier em header, tenta payload.token (Nexano está enviando no body)
 */
function validateToken(req: IncomingMessage, payload: any) {
  const xWebhookToken = getHeader(req, "x-webhook-token");
  const xNexanoToken = getHeader(req, "x-nexano-token");
  const xSignature = getHeader(req, "x-webhook-signature");
  const xApiKey = getHeader(req, "x-api-key");
  const auth = getHeader(req, "authorization");

  let tokenFromAuth = "";
  if (auth.startsWith("Bearer ")) tokenFromAuth = auth.slice(7);
  else if (auth.startsWith("Token ")) tokenFromAuth = auth.slice(6);
  else tokenFromAuth = auth;

  const tokenFromBody = unwrapPrimitive(payload?.token); // <- Nexano (pelo seu log)
  const provided =
    xWebhookToken || xNexanoToken || xSignature || xApiKey || tokenFromAuth || tokenFromBody;

  console.log("[NEXANO_WEBHOOK] token sources present:", {
    has_x_webhook_token: !!xWebhookToken,
    has_x_nexano_token: !!xNexanoToken,
    has_x_webhook_signature: !!xSignature,
    has_x_api_key: !!xApiKey,
    has_authorization: !!auth,
    has_body_token: !!tokenFromBody,
  });

  if (!NEXANO_WEBHOOK_TOKEN) return { ok: true, enforced: false };

  if (!provided) return { ok: false, enforced: true };
  if (provided !== NEXANO_WEBHOOK_TOKEN) return { ok: false, enforced: true };

  return { ok: true, enforced: true };
}

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// ✅ Agora adaptado ao objeto Nexano: client / transaction / offerCode
function extractBuyer(payload: any) {
  // Dados do comprador vêm em payload.client
  const email =
    unwrapPrimitive(payload?.client?.email) ||
    unwrapPrimitive(payload?.client?.mail) ||
    unwrapPrimitive(payload?.client?.emailAddress) ||
    "";

  const document =
    unwrapPrimitive(payload?.client?.document) ||
    unwrapPrimitive(payload?.client?.documentNumber) ||
    unwrapPrimitive(payload?.client?.cpf) ||
    unwrapPrimitive(payload?.client?.cnpj) ||
    unwrapPrimitive(payload?.client?.taxId) ||
    unwrapPrimitive(payload?.client?.idNumber) ||
    "";

  const name =
    unwrapPrimitive(payload?.client?.name) ||
    unwrapPrimitive(payload?.client?.fullName) ||
    unwrapPrimitive(payload?.client?.nome) ||
    "";

  // transaction id: pode estar em payload.transaction ou payload.transaction.id/code
  const transactionId =
    unwrapPrimitive(payload?.transaction) ||
    unwrapPrimitive(payload?.transaction?.id) ||
    unwrapPrimitive(payload?.transaction?.code) ||
    unwrapPrimitive(payload?.transaction?.transactionId) ||
    "";

  // plano/oferta: offerCode é chave real no seu log
  const plan =
    unwrapPrimitive(payload?.offerCode) ||
    unwrapPrimitive(payload?.subscription?.plan) ||
    unwrapPrimitive(payload?.subscription?.planCode) ||
    "";

  // valor: muitas plataformas colocam em orderItems
  // vamos tentar: subscription.amount, transaction.amount, orderItems[0].price/amount
  const value =
    payload?.subscription?.amount ??
    payload?.subscription?.value ??
    payload?.transaction?.amount ??
    payload?.transaction?.value ??
    payload?.orderItems?.[0]?.amount ??
    payload?.orderItems?.[0]?.value ??
    payload?.orderItems?.[0]?.price ??
    null;

  return {
    email: normalizeEmail(email),
    document: normalizeDocument(document),
    name: name || "",
    transactionId: transactionId || "",
    plan: plan || "",
    value,
  };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || "").toUpperCase() !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method Not Allowed" });
  }

  // Body
  let payload: any;
  try {
    payload = await readJsonBody(req);
  } catch {
    return json(res, 400, { ok: false, error: "Invalid JSON payload" });
  }

  if (WEBHOOK_DEBUG) printPayloadSample(payload);

  // Token (agora pode vir em header OU body.token)
  const tokenCheck = validateToken(req, payload);
  if (!tokenCheck.ok) {
    return json(res, 401, { ok: false, error: "Unauthorized (invalid webhook token)" });
  }

  const eventType = unwrapPrimitive(payload?.event);
  const buyer = extractBuyer(payload);

  console.log("[NEXANO_WEBHOOK] eventType:", eventType || "unknown");
  console.log("[NEXANO_WEBHOOK] keys:", Object.keys(payload || {}));
  console.log("[NEXANO_WEBHOOK] extracted:", {
    email: buyer.email ? maskEmail(buyer.email) : "",
    hasDocument: !!buyer.document,
    transactionId: buyer.transactionId,
    plan: buyer.plan,
    value: buyer.value,
    token_enforced: tokenCheck.enforced,
  });

  if (!buyer.email || !buyer.document) {
    // sempre imprime amostra quando falhar para mapear 100%
    printPayloadSample(payload);

    return json(res, 400, {
      ok: false,
      error: "Missing required buyer data (email/document)",
      received: {
        eventType: eventType || "",
        email: buyer.email || "",
        document_present: !!buyer.document,
        transactionId: buyer.transactionId || "",
      },
      hint: "Envie o payload_sample do log (ou confirme os campos dentro de payload.client).",
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1) Idempotência por transaction_id
    if (buyer.transactionId) {
      const { data: existingPay, error: payErr } = await supabase
        .from("pagamentos")
        .select("id, tenant_id")
        .eq("transaction_id", buyer.transactionId)
        .maybeSingle();

      if (payErr) throw payErr;

      if (existingPay) {
        return json(res, 200, { ok: true, status: "already_processed" });
      }
    }

    // 2) Idempotência por email
    const { data: existingUser, error: userErr } = await supabase
      .from("users")
      .select("id, tenant_id")
      .eq("email", buyer.email)
      .maybeSingle();

    if (userErr) throw userErr;

    if (existingUser) {
      if (buyer.transactionId) {
        await supabase.from("pagamentos").insert({
          tenant_id: existingUser.tenant_id,
          transaction_id: buyer.transactionId,
          plano: buyer.plan || null,
          valor: buyer.value,
          status: "approved",
        });
      }

      return json(res, 200, { ok: true, status: "user_exists" });
    }

    // 3) Criar tenant (slug simples + sufixo para evitar colisão)
    const tenantName = buyer.name || buyer.email.split("@")[0];
    const slugBase = tenantName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 50);

    const slug = `${slugBase || "corretor"}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({
        nome_empresa: tenantName,
        slug,
        plano: buyer.plan || null,
        status: "ativo",
      })
      .select("id, slug")
      .single();

    if (tenantErr) throw tenantErr;

    // 4) Criar usuário com senha temporária hash (CPF/CNPJ)
    const passwordHash = await bcrypt.hash(buyer.document, 10);

    const { data: user, error: insUserErr } = await supabase
      .from("users")
      .insert({
        tenant_id: tenant.id,
        nome: tenantName,
        email: buyer.email,
        senha: passwordHash,
        role: "admin",
        must_change_password: true,
      })
      .select("id")
      .single();

    if (insUserErr) throw insUserErr;

    // 5) Registrar pagamento
    if (buyer.transactionId) {
      const { error: payInsErr } = await supabase.from("pagamentos").insert({
        tenant_id: tenant.id,
        transaction_id: buyer.transactionId,
        plano: buyer.plan || null,
        valor: buyer.value,
        status: "approved",
      });
      if (payInsErr) throw payInsErr;
    }

    return json(res, 201, { ok: true, status: "created", tenant_id: tenant.id, user_id: user.id, slug: tenant.slug });
  } catch (err: any) {
    console.error("[NEXANO_WEBHOOK] error:", err?.message || err);
    return json(res, 500, {
      ok: false,
      error: "Internal Server Error",
      detail: err?.message || "unknown_error",
    });
  }
}