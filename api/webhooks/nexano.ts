import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

/**
 * Webhook Nexano → ImobiPro
 * Rota: POST /api/webhooks/nexano
 *
 * - Token via headers (vários formatos)
 * - Hash senha temporária (CPF/CNPJ)
 * - must_change_password = true
 * - Idempotência por transaction_id e por email
 */

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

function unwrapPrimitive(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);

  if (typeof v === "object") {
    const keys = ["value", "number", "document", "document_number", "cpf", "cnpj", "email"];
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

function validateToken(req: IncomingMessage) {
  // Aceita múltiplos padrões
  const xWebhookToken = getHeader(req, "x-webhook-token");
  const xNexanoToken = getHeader(req, "x-nexano-token");
  const xSignature = getHeader(req, "x-webhook-signature");
  const xApiKey = getHeader(req, "x-api-key");
  const auth = getHeader(req, "authorization");

  let tokenFromAuth = "";
  if (auth.startsWith("Bearer ")) tokenFromAuth = auth.slice(7);
  else if (auth.startsWith("Token ")) tokenFromAuth = auth.slice(6);
  else tokenFromAuth = auth;

  const provided = xWebhookToken || xNexanoToken || xSignature || xApiKey || tokenFromAuth;

  console.log("[NEXANO_WEBHOOK] token headers present:", {
    has_x_webhook_token: !!xWebhookToken,
    has_x_nexano_token: !!xNexanoToken,
    has_x_webhook_signature: !!xSignature,
    has_x_api_key: !!xApiKey,
    has_authorization: !!auth,
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

function extractBuyer(payload: any) {
  const email =
    unwrapPrimitive(payload?.customer?.email) ||
    unwrapPrimitive(payload?.buyer?.email) ||
    unwrapPrimitive(payload?.payer?.email) ||
    unwrapPrimitive(payload?.data?.customer?.email) ||
    unwrapPrimitive(payload?.data?.buyer?.email) ||
    unwrapPrimitive(payload?.data?.email) ||
    "";

  const document =
    unwrapPrimitive(payload?.customer?.document) ||
    unwrapPrimitive(payload?.customer?.document_number) ||
    unwrapPrimitive(payload?.customer?.cpf) ||
    unwrapPrimitive(payload?.customer?.cnpj) ||
    unwrapPrimitive(payload?.buyer?.document) ||
    unwrapPrimitive(payload?.data?.customer?.document) ||
    unwrapPrimitive(payload?.data?.customer?.document_number) ||
    unwrapPrimitive(payload?.data?.customer?.cpf) ||
    unwrapPrimitive(payload?.data?.customer?.cnpj) ||
    "";

  const name =
    unwrapPrimitive(payload?.customer?.name) ||
    unwrapPrimitive(payload?.buyer?.name) ||
    unwrapPrimitive(payload?.data?.customer?.name) ||
    unwrapPrimitive(payload?.data?.buyer?.name) ||
    "";

  const transactionId =
    unwrapPrimitive(payload?.transaction_id) ||
    unwrapPrimitive(payload?.transactionId) ||
    unwrapPrimitive(payload?.transaction?.id) ||
    unwrapPrimitive(payload?.data?.transaction_id) ||
    unwrapPrimitive(payload?.data?.transactionId) ||
    unwrapPrimitive(payload?.data?.transaction?.id) ||
    "";

  const plan =
    unwrapPrimitive(payload?.plan) ||
    unwrapPrimitive(payload?.offer) ||
    unwrapPrimitive(payload?.data?.plan) ||
    unwrapPrimitive(payload?.data?.offer) ||
    "";

  const value =
    payload?.amount ??
    payload?.value ??
    payload?.data?.amount ??
    payload?.data?.value ??
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

function printPayloadSample(payload: any) {
  const safe = safeClone(payload);
  console.log("[NEXANO_WEBHOOK] payload_sample:", JSON.stringify(safe).slice(0, 6000));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Método
  if ((req.method || "").toUpperCase() !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method Not Allowed" });
  }

  // Token
  const tokenCheck = validateToken(req);
  if (!tokenCheck.ok) {
    return json(res, 401, { ok: false, error: "Unauthorized (invalid webhook token)" });
  }

  // Body
  let payload: any;
  try {
    payload = await readJsonBody(req);
  } catch {
    return json(res, 400, { ok: false, error: "Invalid JSON payload" });
  }

  if (WEBHOOK_DEBUG) printPayloadSample(payload);

  // Extração
  const buyer = extractBuyer(payload);

  console.log("[NEXANO_WEBHOOK] extracted:", {
    email: buyer.email ? maskEmail(buyer.email) : "",
    document: buyer.document ? maskDoc(buyer.document) : "",
    transactionId: buyer.transactionId,
    plan: buyer.plan,
  });

  if (!buyer.email || !buyer.document) {
    // imprime amostra sempre que falhar, para mapear
    printPayloadSample(payload);
    return json(res, 400, {
      ok: false,
      error: "Missing required buyer data (email/document)",
      received: {
        email: buyer.email || "",
        document_present: !!buyer.document,
        transactionId: buyer.transactionId || "",
      },
      hint: "Veja o log [NEXANO_WEBHOOK] payload_sample e me envie aqui.",
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
      // registra pagamento se tiver transactionId
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

    // 3) Criar tenant (slug simples por enquanto)
    const tenantName = buyer.name || buyer.email.split("@")[0];

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({
        nome_empresa: tenantName,
        slug: (tenantName || "corretor")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "")
            .slice(0, 60) + "-" + Math.floor(1000 + Math.random() * 9000), // se sua tabela exigir slug unique, me diga que eu ajusto para gerar slug
        plano: buyer.plan || null,
        status: "ativo",
      })
      .select("id")
      .single();

    if (tenantErr) throw tenantErr;

    // 4) Criar usuário com senha temporária hash
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

    return json(res, 201, { ok: true, status: "created", tenant_id: tenant.id, user_id: user.id });
  } catch (err: any) {
    console.error("[NEXANO_WEBHOOK] error:", err?.message || err);
    return json(res, 500, { ok: false, error: "Internal Server Error", detail: err?.message || "unknown_error" });
  }
}