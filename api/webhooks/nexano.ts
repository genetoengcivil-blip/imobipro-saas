import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

/**
 * Webhook Nexano → ImobiPro
 * POST /api/webhooks/nexano
 *
 * Requisitos:
 * - POST JSON
 * - Token via header (X-Webhook-Token ou Authorization Bearer) quando NEXANO_WEBHOOK_TOKEN existir
 * - Extrai email/documento mesmo com payload variando (inclui casos em que email/doc vêm como objeto)
 * - Senha temporária = CPF/CNPJ, armazenada como hash (bcrypt)
 * - must_change_password = true
 * - Idempotência: por transaction_id (pagamentos) e por email (users)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const NEXANO_WEBHOOK_TOKEN = process.env.NEXANO_WEBHOOK_TOKEN || "";
const WEBHOOK_DEBUG = (process.env.WEBHOOK_DEBUG || "").toLowerCase() === "true";

function getHeader(req: VercelRequest, name: string): string {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

type Found<T = any> = { value: T; path: string } | null;

function pickFirstWithPath(obj: any, paths: string[]): Found {
  for (const path of paths) {
    const parts = path.split(".");
    let cur = obj;
    let ok = true;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = (cur as any)[p];
      else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined && cur !== null && cur !== "") {
      return { value: cur, path };
    }
  }
  return null;
}

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

function normalizeDocument(doc: string): string {
  return (doc || "").replace(/\D/g, "");
}

function isEmailLike(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function getEventType(payload: any): string {
  return (pickFirstWithPath(payload, ["event", "type", "name", "action"])?.value ?? "unknown_event").toString();
}

// 🔥 IMPORTANT: “desembrulha” valores quando vierem como objeto
function unwrapPrimitive(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);

  // Se vier como objeto, tenta campos comuns
  if (typeof v === "object") {
    const found = pickFirstWithPath(v, [
      "value",
      "number",
      "document",
      "document_number",
      "cpf",
      "cnpj",
      "email",
      "address.email",
    ]);
    if (found) return unwrapPrimitive(found.value);

    // fallback: se tiver 1 chave só, usa ela
    const keys = Object.keys(v);
    if (keys.length === 1) return unwrapPrimitive((v as any)[keys[0]]);
  }

  return "";
}

// Busca recursiva por email/doc em qualquer lugar do JSON,
// inclusive quando email/doc vêm como objeto.
function findRecursive(
  obj: any,
  options: {
    keyMatchers?: RegExp[];
    valuePredicate?: (v: any) => boolean;
    maxDepth?: number;
  },
  basePath = "",
  depth = 0
): Found {
  const maxDepth = options.maxDepth ?? 12;
  if (depth > maxDepth) return null;
  if (obj === null || obj === undefined) return null;

  // Se o valor em si bater no predicate
  if (options.valuePredicate && options.valuePredicate(obj)) {
    return { value: obj, path: basePath || "$" };
  }

  if (typeof obj !== "object") return null;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const found = findRecursive(obj[i], options, `${basePath}[${i}]`, depth + 1);
      if (found) return found;
    }
    return null;
  }

  for (const [k, v] of Object.entries(obj)) {
    const p = basePath ? `${basePath}.${k}` : k;

    // Se a chave bater, tenta devolver um valor útil (inclusive se for objeto)
    if (options.keyMatchers?.some((rx) => rx.test(k))) {
      const unwrapped = unwrapPrimitive(v);
      if (unwrapped) return { value: unwrapped, path: p };
      // Se não der para “desembrulhar”, continua descendo
    }

    const found = findRecursive(v, options, p, depth + 1);
    if (found) return found;
  }

  return null;
}

function safeClone(obj: any) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
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

function validateToken(req: VercelRequest) {
  const xToken = getHeader(req, "x-webhook-token");
  const auth = getHeader(req, "authorization");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  const provided = xToken || bearer;

  // Se token não configurado ainda: deixa passar para o evento de teste
  if (!NEXANO_WEBHOOK_TOKEN) return { ok: true, provided, enforced: false };

  if (!provided) return { ok: false, provided, enforced: true };
  if (provided !== NEXANO_WEBHOOK_TOKEN) return { ok: false, provided, enforced: true };

  return { ok: true, provided, enforced: true };
}

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

async function ensureUniqueSlug(
  supabase: ReturnType<typeof createClient>,
  base: string
): Promise<string> {
  const baseSlug = slugify(base || "corretor") || "corretor";
  let slug = baseSlug;

  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase.from("tenants").select("id").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return slug;
    slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

function extractBuyerData(payload: any) {
  // 1) Tenta paths comuns
  const nameFound =
    pickFirstWithPath(payload, [
      "customer.name",
      "customer.full_name",
      "buyer.name",
      "buyer.full_name",
      "payer.name",
      "payer.full_name",
      "transaction.customer.name",
      "transaction.buyer.name",
      "data.customer.name",
      "data.buyer.name",
      "data.payer.name",
      "data.transaction.customer.name",
    ]) || null;

  const emailFound =
    pickFirstWithPath(payload, [
      "customer.email",
      "buyer.email",
      "payer.email",
      "transaction.customer.email",
      "transaction.buyer.email",
      "data.customer.email",
      "data.buyer.email",
      "data.email",
      // casos onde email vem como objeto
      "customer.email.value",
      "buyer.email.value",
      "data.customer.email.value",
    ]) || null;

  const docFound =
    pickFirstWithPath(payload, [
      "customer.document",
      "customer.document_number",
      "customer.cpf",
      "customer.cnpj",
      "buyer.document",
      "buyer.document_number",
      "buyer.cpf",
      "buyer.cnpj",
      "transaction.customer.document",
      "transaction.customer.document_number",
      "data.customer.document",
      "data.customer.document_number",
      "data.customer.cpf",
      "data.customer.cnpj",
      // casos onde doc vem como objeto
      "customer.document.value",
      "customer.document.number",
      "data.customer.document.value",
      "data.customer.document.number",
    ]) || null;

  const transactionFound =
    pickFirstWithPath(payload, [
      "transaction_id",
      "transactionId",
      "transaction.id",
      "transaction.code",
      "payment.id",
      "order.id",
      "data.transaction_id",
      "data.transactionId",
      "data.transaction.id",
      "data.payment.id",
    ]) || null;

  const planFound =
    pickFirstWithPath(payload, ["product.plan", "plan", "offer", "data.plan", "data.offer", "data.product.plan"]) || null;

  const valueFound =
    pickFirstWithPath(payload, ["product.value", "value", "amount", "data.amount", "data.value"]) || null;

  // 2) Fallback: busca recursiva por email (valor ou objeto)
  const emailFallback =
    emailFound ||
    findRecursive(payload, {
      valuePredicate: (v) => {
        const s = unwrapPrimitive(v);
        return !!s && typeof s === "string" && isEmailLike(s);
      },
      maxDepth: 14,
    });

  // 3) Fallback: busca recursiva por CPF/CNPJ (chaves comuns ou valor com 11/14)
  const docFallback =
    docFound ||
    findRecursive(payload, {
      keyMatchers: [/cpf/i, /cnpj/i, /document/i, /documento/i, /tax/i, /doc/i],
      valuePredicate: (v) => {
        const s = unwrapPrimitive(v);
        const digits = normalizeDocument(s);
        return digits.length === 11 || digits.length === 14;
      },
      maxDepth: 14,
    });

  // 4) Nome fallback
  const nameFallback =
    nameFound ||
    findRecursive(payload, {
      keyMatchers: [/name/i, /full_name/i, /nome/i],
      valuePredicate: (v) => {
        const s = unwrapPrimitive(v);
        return !!s && s.trim().length >= 3;
      },
      maxDepth: 12,
    });

  const name = unwrapPrimitive(nameFallback?.value ?? "").trim();
  const email = normalizeEmail(unwrapPrimitive(emailFallback?.value ?? ""));
  const document = normalizeDocument(unwrapPrimitive(docFallback?.value ?? ""));
  const transactionId = unwrapPrimitive(transactionFound?.value ?? "");
  const plan = unwrapPrimitive(planFound?.value ?? "");
  const valueRaw = valueFound?.value;
  const value = typeof valueRaw === "number" ? valueRaw : valueRaw ? Number(unwrapPrimitive(valueRaw)) : NaN;

  return {
    name,
    email,
    document,
    transactionId,
    plan,
    value,
    _found: {
      name: nameFallback?.path || "",
      email: emailFallback?.path || "",
      document: docFallback?.path || "",
      transactionId: transactionFound?.path || "",
    },
  };
}

function printPayloadSample(payload: any) {
  const safePayload = safeClone(payload);

  // tenta mascarar “locais comuns”, sem garantir estrutura
  try {
    const candidates = [
      safePayload?.customer,
      safePayload?.buyer,
      safePayload?.payer,
      safePayload?.transaction?.customer,
      safePayload?.transaction?.buyer,
      safePayload?.data?.customer,
      safePayload?.data?.buyer,
      safePayload?.data?.payer,
      safePayload?.data?.transaction?.customer,
    ].filter(Boolean);

    for (const c of candidates) {
      const e = unwrapPrimitive(c?.email);
      const d = unwrapPrimitive(c?.document || c?.document_number || c?.cpf || c?.cnpj);

      if (c?.email) c.email = maskEmail(e);
      if (c?.document) c.document = maskDoc(d);
      if (c?.document_number) c.document_number = maskDoc(d);
      if (c?.cpf) c.cpf = maskDoc(d);
      if (c?.cnpj) c.cnpj = maskDoc(d);
    }
  } catch {}

  console.log("[NEXANO_WEBHOOK] payload_sample:", JSON.stringify(safePayload).slice(0, 6000));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const tokenCheck = validateToken(req);
  if (!tokenCheck.ok) {
    return res.status(401).json({ ok: false, error: "Unauthorized (invalid webhook token)" });
  }

  let payload: any = req.body;
  try {
    if (typeof payload === "string") payload = JSON.parse(payload);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON payload" });
  }

  const eventType = getEventType(payload);
  const buyer = extractBuyerData(payload);

  console.log("[NEXANO_WEBHOOK] eventType:", eventType);
  console.log("[NEXANO_WEBHOOK] extracted:", {
    email: buyer.email ? maskEmail(buyer.email) : "",
    document: buyer.document ? maskDoc(buyer.document) : "",
    transactionId: buyer.transactionId,
    plan: buyer.plan,
    value: buyer.value,
    token_enforced: tokenCheck.enforced,
    found_paths: buyer._found,
  });

  // Se debug ligado, sempre imprime amostra
  if (WEBHOOK_DEBUG) {
    printPayloadSample(payload);
  }

  // Se estiver faltando email/document, imprime amostra também (mesmo sem debug)
  if (!buyer.email || !buyer.document) {
    printPayloadSample(payload);

    return res.status(400).json({
      ok: false,
      error: "Missing required buyer data (email/document)",
      received: {
        eventType,
        email: buyer.email || "",
        document_present: !!buyer.document,
        transactionId: buyer.transactionId || "",
        found_paths: buyer._found,
      },
      hint: "Confira os logs da Vercel: procure por [NEXANO_WEBHOOK] payload_sample e me envie aqui.",
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1) Idempotência por transaction_id
    if (buyer.transactionId) {
      const { data: existingPay, error: payCheckErr } = await supabase
        .from("pagamentos")
        .select("id, tenant_id")
        .eq("transaction_id", buyer.transactionId)
        .maybeSingle();

      if (payCheckErr) throw payCheckErr;

      if (existingPay) {
        return res.status(200).json({
          ok: true,
          status: "already_processed",
          transactionId: buyer.transactionId,
        });
      }
    }

    // 2) Idempotência por email
    const { data: existingUser, error: userCheckErr } = await supabase
      .from("users")
      .select("id, tenant_id, email")
      .eq("email", buyer.email)
      .maybeSingle();

    if (userCheckErr) throw userCheckErr;

    if (existingUser) {
      if (buyer.transactionId) {
        await supabase.from("pagamentos").insert({
          tenant_id: existingUser.tenant_id,
          transaction_id: buyer.transactionId,
          plano: buyer.plan || null,
          valor: Number.isFinite(buyer.value) ? buyer.value : null,
          status: "approved",
        });
      }

      return res.status(200).json({
        ok: true,
        status: "user_exists",
        email: buyer.email,
      });
    }

    // 3) Criar tenant
    const tenantName = buyer.name || buyer.email.split("@")[0];
    const slug = await ensureUniqueSlug(supabase, tenantName);

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
    const tempPassword = buyer.document;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const { data: user, error: userErr } = await supabase
      .from("users")
      .insert({
        tenant_id: tenant.id,
        nome: buyer.name || tenantName,
        email: buyer.email,
        senha: passwordHash,
        role: "admin",
        must_change_password: true,
      })
      .select("id, email, tenant_id")
      .single();

    if (userErr) throw userErr;

    // 5) Registrar pagamento
    if (buyer.transactionId) {
      const { error: payInsErr } = await supabase.from("pagamentos").insert({
        tenant_id: tenant.id,
        transaction_id: buyer.transactionId,
        plano: buyer.plan || null,
        valor: Number.isFinite(buyer.value) ? buyer.value : null,
        status: "approved",
      });
      if (payInsErr) throw payInsErr;
    }

    return res.status(201).json({
      ok: true,
      status: "created",
      endpoint: "/api/webhooks/nexano",
      tenant: { id: tenant.id, slug: tenant.slug },
      user: { id: user.id, email: user.email },
      notes: {
        tokenValidationEnforced: tokenCheck.enforced,
        mustChangePassword: true,
        found_paths: buyer._found,
      },
    });
  } catch (err: any) {
    console.error("[NEXANO_WEBHOOK] error:", err?.message || err);
    return res.status(500).json({
      ok: false,
      error: "Internal Server Error",
      detail: err?.message || "unknown_error",
    });
  }
}