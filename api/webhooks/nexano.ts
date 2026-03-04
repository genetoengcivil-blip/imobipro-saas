import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

// ✅ Lista de tokens (1 endpoint, vários webhooks/tokens)
const NEXANO_WEBHOOK_TOKENS = (process.env.NEXANO_WEBHOOK_TOKENS || "")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

// Debug
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

async function readJsonBody(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

function normalizeDocument(doc: string): string {
  return (doc || "").replace(/\D/g, "");
}

function unwrapPrimitive(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    for (const k of ["value", "number", "id", "code", "cpf", "cnpj", "document", "documentNumber", "email"]) {
      if (k in v) return unwrapPrimitive(v[k]);
    }
    const keys = Object.keys(v);
    if (keys.length === 1) return unwrapPrimitive(v[keys[0]]);
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
  try {
    if (safe?.token) safe.token = "***";
    if (safe?.client?.email) safe.client.email = "***";
    if (safe?.client?.document) safe.client.document = "***";
    if (safe?.client?.cpf) safe.client.cpf = "***";
    if (safe?.client?.cnpj) safe.client.cnpj = "***";
  } catch {}
  console.log("[NEXANO_WEBHOOK] payload_sample:", JSON.stringify(safe).slice(0, 6000));
}

function validateToken(req: IncomingMessage, payload: any) {
  // headers (pode vir vazio na Nexano)
  const xWebhookToken = getHeader(req, "x-webhook-token");
  const auth = getHeader(req, "authorization");
  let tokenFromAuth = "";
  if (auth.startsWith("Bearer ")) tokenFromAuth = auth.slice(7);
  else if (auth.startsWith("Token ")) tokenFromAuth = auth.slice(6);
  else tokenFromAuth = auth;

  // ✅ token vem no body (seu caso)
  const tokenFromBody = unwrapPrimitive(payload?.token);

  const provided = xWebhookToken || tokenFromAuth || tokenFromBody;

  console.log("[NEXANO_WEBHOOK] token sources present:", {
    has_x_webhook_token: !!xWebhookToken,
    has_authorization: !!auth,
    has_body_token: !!tokenFromBody,
    tokens_configured_count: NEXANO_WEBHOOK_TOKENS.length,
  });

  // se você ainda não configurou tokens, não bloqueia (mas recomendo configurar)
  if (NEXANO_WEBHOOK_TOKENS.length === 0) return { ok: true, enforced: false };

  if (!provided) return { ok: false, enforced: true };
  if (!NEXANO_WEBHOOK_TOKENS.includes(provided)) return { ok: false, enforced: true };

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

function extractCommon(payload: any) {
  const event = unwrapPrimitive(payload?.event) || "unknown";

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
    "";

  const name =
    unwrapPrimitive(payload?.client?.name) ||
    unwrapPrimitive(payload?.client?.fullName) ||
    unwrapPrimitive(payload?.client?.nome) ||
    "";

  const transactionId =
    unwrapPrimitive(payload?.transaction?.id) ||
    unwrapPrimitive(payload?.transaction?.code) ||
    unwrapPrimitive(payload?.transaction?.transactionId) ||
    unwrapPrimitive(payload?.transaction) ||
    "";

  const offerCode = unwrapPrimitive(payload?.offerCode) || "";

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
    event,
    email: normalizeEmail(email),
    document: normalizeDocument(document),
    name,
    transactionId,
    offerCode,
    value,
  };
}

function mapOfferToPlan(offerCode: string) {
  switch ((offerCode || "").toUpperCase()) {
    case "72D7TSV":
      return { plan: "mensal", fallbackPrice: 97 };
    case "E5P0U6B":
      return { plan: "semestral", fallbackPrice: 397 };
    case "Q71NMPM":
      return { plan: "anual", fallbackPrice: 697 };
    default:
      return { plan: offerCode || null, fallbackPrice: null };
  }
}

// status com fallback (caso seu enum/tabela não aceite "suspenso")
function normalizeTenantStatus(target: "ativo" | "suspenso") {
  if (target === "ativo") return "ativo";
  // fallback comum
  return "suspenso";
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || "").toUpperCase() !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method Not Allowed" });
  }

  let payload: any;
  try {
    payload = await readJsonBody(req);
  } catch {
    return json(res, 400, { ok: false, error: "Invalid JSON payload" });
  }

  if (WEBHOOK_DEBUG) printPayloadSample(payload);

  const tokenCheck = validateToken(req, payload);
  if (!tokenCheck.ok) {
    return json(res, 401, { ok: false, error: "Unauthorized (invalid webhook token)" });
  }

  const supabase = getSupabaseAdmin();
  const common = extractCommon(payload);
  const mapped = mapOfferToPlan(common.offerCode);

  console.log("[NEXANO_WEBHOOK] event:", common.event);
  console.log("[NEXANO_WEBHOOK] extracted:", {
    email_present: !!common.email,
    document_present: !!common.document,
    transactionId: common.transactionId,
    offerCode: common.offerCode,
    plan: mapped.plan,
    value: common.value,
    token_enforced: tokenCheck.enforced,
  });

  // helpers
  async function getUserByEmail(email: string) {
    if (!email) return null;
    const { data, error } = await supabase
      .from("users")
      .select("id, tenant_id, email")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function upsertPayment(tenantId: string, status: string) {
    if (!common.transactionId) return;

    const { data: existing, error: chkErr } = await supabase
      .from("pagamentos")
      .select("id")
      .eq("transaction_id", common.transactionId)
      .maybeSingle();
    if (chkErr) throw chkErr;
    if (existing) return;

    // ✅ Insere apenas colunas mínimas (não quebra se você não criou colunas extras)
    const { error } = await supabase.from("pagamentos").insert({
      tenant_id: tenantId,
      transaction_id: common.transactionId,
      plano: mapped.plan,
      valor: typeof common.value === "number" ? common.value : mapped.fallbackPrice,
      status,
    } as any);

    if (error) throw error;
  }

  async function setTenantStatus(tenantId: string, target: "ativo" | "suspenso") {
    const status = normalizeTenantStatus(target);

    const { error } = await supabase
      .from("tenants")
      .update({ status })
      .eq("id", tenantId);

    if (error) throw error;
  }

  try {
    switch (common.event) {
      // ✅ pagamento aprovado: cria conta (se não existir) e ativa
      case "TRANSACTION_PAID": {
        if (!common.email || !common.document) {
          printPayloadSample(payload);
          return json(res, 400, { ok: false, error: "Missing email/document for TRANSACTION_PAID" });
        }

        const existingUser = await getUserByEmail(common.email);

        if (!existingUser) {
          const tenantName = common.name || common.email.split("@")[0];
          const slug = `${slugifyBase(tenantName) || "corretor"}-${Math.floor(1000 + Math.random() * 9000)}`;

          const { data: tenant, error: tenantErr } = await supabase
            .from("tenants")
            .insert({
              nome_empresa: tenantName,
              slug,
              plano: mapped.plan,
              status: "ativo",
            } as any)
            .select("id, slug")
            .single();

          if (tenantErr) throw tenantErr;

          const passwordHash = await bcrypt.hash(common.document, 10);

          const { error: userErr } = await supabase.from("users").insert({
            tenant_id: tenant.id,
            nome: tenantName,
            email: common.email,
            senha: passwordHash,
            role: "admin",
            must_change_password: true,
          } as any);

          if (userErr) throw userErr;

          await upsertPayment(tenant.id, "approved");
          return json(res, 201, { ok: true, status: "created", tenant_slug: tenant.slug });
        }

        await setTenantStatus(existingUser.tenant_id, "ativo");
        await upsertPayment(existingUser.tenant_id, "approved");
        return json(res, 200, { ok: true, status: "user_exists_payment_registered" });
      }

      // ❌ pagamento falhou/recusado: suspende
      case "TRANSACTION_FAILED":
      case "TRANSACTION_REFUSED":
      case "TRANSACTION_CANCELED": {
        const user = await getUserByEmail(common.email);
        if (user) {
          await setTenantStatus(user.tenant_id, "suspenso");
          await upsertPayment(user.tenant_id, "failed");
        }
        return json(res, 200, { ok: true, status: "processed_failed" });
      }

      // 🧾 assinatura cancelada: suspende
      case "SUBSCRIPTION_CANCELED":
      case "SUBSCRIPTION_CANCELLED": {
        const user = await getUserByEmail(common.email);
        if (user) {
          await setTenantStatus(user.tenant_id, "suspenso");
        }
        return json(res, 200, { ok: true, status: "processed_subscription_canceled" });
      }

      // ✅ assinatura ativa/renovada: ativa
      case "SUBSCRIPTION_RENEWED":
      case "SUBSCRIPTION_REACTIVATED":
      case "SUBSCRIPTION_ACTIVE": {
        const user = await getUserByEmail(common.email);
        if (user) {
          await setTenantStatus(user.tenant_id, "ativo");
        }
        return json(res, 200, { ok: true, status: "processed_subscription_active" });
      }

      // 🔁 reembolso/chargeback: suspende
      case "REFUND":
      case "CHARGEBACK": {
        const user = await getUserByEmail(common.email);
        if (user) {
          await setTenantStatus(user.tenant_id, "suspenso");
        }
        return json(res, 200, { ok: true, status: "processed_refund_or_chargeback" });
      }

      default:
        // Não falha: só registra que ignorou
        return json(res, 200, { ok: true, status: "ignored_unhandled_event", event: common.event });
    }
  } catch (err: any) {
    // ✅ Agora você verá o motivo real do 500
    console.error("[NEXANO_WEBHOOK] fatal error:", err?.message || err);
    return json(res, 500, {
      ok: false,
      error: "Internal Server Error",
      detail: err?.message || "unknown_error",
      event: common.event,
    });
  }
}