import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

const NEXANO_WEBHOOK_TOKENS = (process.env.NEXANO_WEBHOOK_TOKENS || "")
  .split(",")
  .map(t => t.trim())
  .filter(Boolean);
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
    const keys = ["value", "number", "document", "document_number", "cpf", "cnpj", "email", "id"];
    for (const k of keys) {
      if (k in v) return unwrapPrimitive(v[k]);
    }
    const onlyKeys = Object.keys(v);
    if (onlyKeys.length === 1) return unwrapPrimitive(v[onlyKeys[0]]);
  }
  return "";
}

function slugifyBase(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 50);
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

/**
 * Token: Nexano no seu caso vem no body (payload.token), mas aceitamos headers também.
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

  const tokenFromBody = unwrapPrimitive(payload?.token);

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
  if (!NEXANO_WEBHOOK_TOKENS.includes(provided)) {
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

/**
 * Adaptado ao payload real (keys: event, token, offerCode, client, transaction, subscription, orderItems...)
 */
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
    unwrapPrimitive(payload?.client?.taxId) ||
    unwrapPrimitive(payload?.client?.idNumber) ||
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

  const subscriptionId =
    unwrapPrimitive(payload?.subscription?.id) ||
    unwrapPrimitive(payload?.subscription?.subscriptionId) ||
    unwrapPrimitive(payload?.subscription) ||
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
    subscriptionId,
    offerCode,
    value,
  };
}

/**
 * Mapeia offerCode → plano (ajuste os códigos se quiser)
 */
function mapOfferToPlan(offerCode: string) {
  // Seus offers (do checkout):
  // mensal: offer=72D7TSV
  // semestral: offer=E5P0U6B
  // anual: offer=Q71NMPM
  switch ((offerCode || "").toUpperCase()) {
    case "72D7TSV":
      return { plan: "mensal", price: 97 };
    case "E5P0U6B":
      return { plan: "semestral", price: 397 };
    case "Q71NMPM":
      return { plan: "anual", price: 697 };
    default:
      return { plan: offerCode || null, price: null };
  }
}

/**
 * Atualiza status do tenant conforme eventos de assinatura/pagamento
 * (assumindo tenants.status: 'ativo' | 'suspenso' etc.)
 */
async function setTenantStatus(supabase: ReturnType<typeof createClient>, tenantId: string, status: string) {
  const { error } = await supabase.from("tenants").update({ status }).eq("id", tenantId);
  if (error) throw error;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || "").toUpperCase() !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method Not Allowed" });
  }

  // Body (precisa antes da validação, pois token vem no body)
  let payload: any;
  try {
    payload = await readJsonBody(req);
  } catch {
    return json(res, 400, { ok: false, error: "Invalid JSON payload" });
  }

  if (WEBHOOK_DEBUG) printPayloadSample(payload);

  // Token validation
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
    subscriptionId: common.subscriptionId,
    offerCode: common.offerCode,
    plan: mapped.plan,
    value: common.value,
    token_enforced: tokenCheck.enforced,
  });

  // Helper: localizar user/tenant por email (preferimos email, mas pode mudar para subscriptionId se quiser)
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

  // Helper: registrar pagamento
  async function insertPayment(tenantId: string, status: string) {
    if (!common.transactionId) return;

    // idempotência por transaction_id
    const { data: existing, error: chkErr } = await supabase
      .from("pagamentos")
      .select("id")
      .eq("transaction_id", common.transactionId)
      .maybeSingle();
    if (chkErr) throw chkErr;
    if (existing) return;

    const { error } = await supabase.from("pagamentos").insert({
      tenant_id: tenantId,
      transaction_id: common.transactionId,
      plano: mapped.plan,
      valor: typeof common.value === "number" ? common.value : mapped.price ?? null,
      status,
      subscription_id: common.subscriptionId || null,
      offer_code: common.offerCode || null,
      event: common.event,
    } as any);

    // Se suas colunas não existirem (subscription_id/offer_code/event), remova do insert.
    if (error) throw error;
  }

  /**
   * EVENTOS
   * Ajuste estes nomes conforme a Nexano usa (você já viu TRANSACTION_PAID).
   * Outros comuns:
   * - TRANSACTION_REFUSED
   * - TRANSACTION_CANCELED
   * - SUBSCRIPTION_CANCELED
   * - SUBSCRIPTION_RENEWED
   * - CHARGEBACK
   * - REFUND
   */
  try {
    switch (common.event) {
      // ✅ Pagamento aprovado: cria conta se não existir + ativa tenant
      case "TRANSACTION_PAID": {
        if (!common.email || !common.document) {
          printPayloadSample(payload);
          return json(res, 400, {
            ok: false,
            error: "Missing required buyer data (email/document) for TRANSACTION_PAID",
          });
        }

        const existingUser = await getUserByEmail(common.email);

        // se não existe, cria tenant + user
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
              subscription_id: common.subscriptionId || null,
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

          await insertPayment(tenant.id, "approved");

          return json(res, 201, {
            ok: true,
            status: "created",
            tenant_slug: tenant.slug,
          });
        }

        // existe: só ativa e registra pagamento
        await setTenantStatus(supabase, existingUser.tenant_id, "ativo");
        await insertPayment(existingUser.tenant_id, "approved");

        return json(res, 200, { ok: true, status: "user_exists_payment_registered" });
      }

      // ❌ Pagamento recusado/falhou: marca tenant como suspenso (se existir) e registra evento
      case "TRANSACTION_REFUSED":
      case "TRANSACTION_FAILED": {
        const user = await getUserByEmail(common.email);
        if (user) {
          await setTenantStatus(supabase, user.tenant_id, "suspenso");
          await insertPayment(user.tenant_id, "refused");
        }
        return json(res, 200, { ok: true, status: "processed_refused" });
      }

      // 🔁 Reembolso / chargeback: suspende tenant e registra
      case "REFUND":
      case "CHARGEBACK": {
        const user = await getUserByEmail(common.email);
        if (user) {
          await setTenantStatus(supabase, user.tenant_id, "suspenso");
          await insertPayment(user.tenant_id, common.event.toLowerCase());
        }
        return json(res, 200, { ok: true, status: "processed_refund_or_chargeback" });
      }

      // 🧾 Assinatura cancelada: suspende tenant
      case "SUBSCRIPTION_CANCELED":
      case "SUBSCRIPTION_CANCELLED": {
        const user = await getUserByEmail(common.email);
        if (user) {
          await setTenantStatus(supabase, user.tenant_id, "suspenso");
          // registra “pagamento” como evento de assinatura (opcional)
          await insertPayment(user.tenant_id, "subscription_canceled");
        }
        return json(res, 200, { ok: true, status: "processed_subscription_canceled" });
      }

      // ✅ Assinatura renovada/reativada: ativa tenant
      case "SUBSCRIPTION_RENEWED":
      case "SUBSCRIPTION_REACTIVATED":
      case "SUBSCRIPTION_ACTIVE": {
        const user = await getUserByEmail(common.email);
        if (user) {
          await setTenantStatus(supabase, user.tenant_id, "ativo");
          await insertPayment(user.tenant_id, "subscription_active");
        }
        return json(res, 200, { ok: true, status: "processed_subscription_active" });
      }

      default: {
        // Evento desconhecido: não falha o webhook, só loga (pra você adicionar depois)
        console.log("[NEXANO_WEBHOOK] unhandled event:", common.event);
        if (WEBHOOK_DEBUG) printPayloadSample(payload);
        return json(res, 200, { ok: true, status: "ignored_unhandled_event", event: common.event });
      }
    }
  } catch (err: any) {
    console.error("[NEXANO_WEBHOOK] error:", err?.message || err);
    return json(res, 500, { ok: false, error: "Internal Server Error", detail: err?.message || "unknown_error" });
  }
}