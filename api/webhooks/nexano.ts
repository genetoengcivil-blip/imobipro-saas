import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

/**
 * Webhook Nexano → ImobiPro
 * POST /api/webhooks/nexano
 *
 * - Valida token via header quando NEXANO_WEBHOOK_TOKEN estiver configurado
 * - Extrai nome/email/documento/plano/valor/transaction_id do payload (de forma adaptável)
 * - Cria tenant + user (senha hash do CPF/CNPJ)
 * - Marca must_change_password = true
 * - Idempotência por transaction_id (pagamentos) e por email (users)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const NEXANO_WEBHOOK_TOKEN = process.env.VITE_NEXANO_WEBHOOK_TOKEN || ""; // você vai preencher depois no ambiente

function getHeader(req: VercelRequest, name: string): string {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

// Pega o primeiro valor existente em uma lista de caminhos (bem útil para “adaptar ao objeto”)
function pickFirst(obj: any, paths: string[]): any {
  for (const path of paths) {
    const parts = path.split(".");
    let cur = obj;
    let ok = true;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = cur[p];
      else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return undefined;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function normalizeDocument(doc: string): string {
  return (doc || "").replace(/\D/g, ""); // só números
}

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

function getEventType(payload: any): string {
  return (
    pickFirst(payload, ["event", "type", "name", "action"]) ??
    "unknown_event"
  );
}

// Extrai dados de forma “adaptável” (sem forçar um modelo fixo)
function extractBuyerData(payload: any) {
  const name = pickFirst(payload, [
    "customer.name",
    "buyer.name",
    "payer.name",
    "customer.full_name",
    "cliente.nome",
    "data.customer.name",
    "data.buyer.name",
  ]);

  const email = pickFirst(payload, [
    "customer.email",
    "buyer.email",
    "payer.email",
    "cliente.email",
    "data.customer.email",
    "data.buyer.email",
  ]);

  const document = pickFirst(payload, [
    "customer.document",
    "customer.cpf",
    "customer.cnpj",
    "buyer.document",
    "buyer.cpf",
    "buyer.cnpj",
    "payer.document",
    "payer.cpf",
    "payer.cnpj",
    "cliente.documento",
    "data.customer.document",
    "data.buyer.document",
  ]);

  const transactionId = pickFirst(payload, [
    "transaction_id",
    "transaction.id",
    "payment.transaction_id",
    "payment.id",
    "order.id",
    "charge.id",
    "data.transaction_id",
    "data.payment.id",
  ]);

  const plan = pickFirst(payload, [
    "product.plan",
    "plan",
    "offer",
    "product.name",
    "data.product.plan",
    "data.plan",
  ]);

  const value = pickFirst(payload, [
    "product.value",
    "value",
    "amount",
    "payment.amount",
    "order.amount",
    "data.amount",
  ]);

  return {
    name: (name ?? "").toString().trim(),
    email: normalizeEmail((email ?? "").toString()),
    document: normalizeDocument((document ?? "").toString()),
    transactionId: (transactionId ?? "").toString(),
    plan: (plan ?? "").toString(),
    value: typeof value === "number" ? value : Number(value),
  };
}

function validateToken(req: VercelRequest) {
  // Você pode escolher QUAL header usar. Vamos aceitar 3 padrões comuns:
  const xToken = getHeader(req, "x-webhook-token");
  const auth = getHeader(req, "authorization");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : auth;

  const provided = xToken || bearer;

  // Se ainda não configurou o token no ambiente, NÃO bloqueia (para permitir o “evento de teste”)
  // Quando você colocar NEXANO_WEBHOOK_TOKEN, a validação passa a ser obrigatória.
  if (!NEXANO_WEBHOOK_TOKEN) {
    return { ok: true, provided, enforced: false };
  }

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

async function ensureUniqueSlug(
  supabase: ReturnType<typeof createClient>,
  base: string
): Promise<string> {
  const baseSlug = slugify(base || "corretor");
  let slug = baseSlug || "corretor";

  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return slug;

    slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // Validação do token
  const tokenCheck = validateToken(req);
  if (!tokenCheck.ok) {
    return res.status(401).json({ ok: false, error: "Unauthorized (invalid webhook token)" });
  }

  // Parse do body (Vercel geralmente já entrega JSON)
  let payload: any = req.body;
  try {
    if (typeof payload === "string") payload = JSON.parse(payload);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON payload" });
  }

  const eventType = getEventType(payload);
  const buyer = extractBuyerData(payload);

  // Logs básicos para o 1º teste (para “adaptar ao modelo do objeto”)
  console.log("[NEXANO_WEBHOOK] eventType:", eventType);
  console.log("[NEXANO_WEBHOOK] keys:", Object.keys(payload || {}));
  console.log("[NEXANO_WEBHOOK] extracted:", {
    email: buyer.email,
    hasDocument: !!buyer.document,
    transactionId: buyer.transactionId,
    plan: buyer.plan,
    value: buyer.value,
    token_enforced: tokenCheck.enforced,
  });

  // Validação mínima para criação do usuário
  if (!buyer.email || !buyer.document) {
    return res.status(400).json({
      ok: false,
      error: "Missing required buyer data (email/document)",
      received: {
        eventType,
        email: buyer.email,
        document_present: !!buyer.document,
        transactionId: buyer.transactionId,
      },
      hint: "Send a test event; we will adapt field mapping based on actual payload structure.",
    });
  }

  // (Opcional) Se quiser filtrar por evento “aprovado”, pode ativar depois, assim:
  // if (!String(eventType).toLowerCase().includes("approved")) { ... }

  try {
    const supabase = getSupabaseAdmin();

    // 1) Idempotência por transaction_id (se existir)
    if (buyer.transactionId) {
      const { data: existingPay, error: payCheckErr } = await supabase
        .from("pagamentos")
        .select("id, tenant_id")
        .eq("transaction_id", buyer.transactionId)
        .maybeSingle();

      if (payCheckErr) throw payCheckErr;
      if (existingPay) {
        // Evento repetido: já processado
        return res.status(200).json({
          ok: true,
          status: "already_processed",
          transactionId: buyer.transactionId,
        });
      }
    }

    // 2) Idempotência por email (se usuário já existir, não recria)
    const { data: existingUser, error: userCheckErr } = await supabase
      .from("users")
      .select("id, tenant_id, email")
      .eq("email", buyer.email)
      .maybeSingle();

    if (userCheckErr) throw userCheckErr;

    if (existingUser) {
      // Ainda registra pagamento (se tiver transactionId) para fechar idempotência completa
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

    // 4) Criar usuário com senha hash do documento
    const tempPassword = buyer.document; // CPF/CNPJ
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const { data: user, error: userErr } = await supabase
      .from("users")
      .insert({
        tenant_id: tenant.id,
        nome: buyer.name || tenantName,
        email: buyer.email,
        senha: passwordHash, // armazenando HASH (não texto puro)
        role: "admin",
        must_change_password: true,
      })
      .select("id, email, tenant_id")
      .single();

    if (userErr) throw userErr;

    // 5) Registrar pagamento (idempotência forte por transaction_id)
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

    // 6) Email de boas-vindas: vamos enviar no próximo passo (Resend/SMTP).
    // Por enquanto, retornamos que a conta foi criada.

    return res.status(201).json({
      ok: true,
      status: "created",
      endpoint: "/api/webhooks/nexano",
      tenant: { id: tenant.id, slug: tenant.slug },
      user: { id: user.id, email: user.email },
      notes: {
        tokenValidationEnforced: tokenCheck.enforced,
        mustChangePassword: true,
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