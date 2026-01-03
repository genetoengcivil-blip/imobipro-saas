import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createCorretor } from "@/lib/actions/createCorretor";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1️⃣ Aceita apenas eventos de pagamento
    if (body.type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    // 2️⃣ Busca o pagamento direto na API do Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });

    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId });

    // 3️⃣ Processa apenas pagamentos aprovados
    if (paymentInfo.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    // 4️⃣ Extrai email do comprador
    const email = paymentInfo.payer?.email;
    if (!email) {
      console.warn("Pagamento aprovado sem email:", paymentId);
      return NextResponse.json({ ok: true });
    }

    // 5️⃣ Descobre o plano pelo título do item
    const title =
      paymentInfo.additional_info?.items?.[0]?.title?.toUpperCase() || "";

    let plano: "basic" | "pro" | "premium" | null = null;

    if (title.includes("BASIC")) plano = "basic";
    if (title.includes("PRO")) plano = "pro";
    if (title.includes("PREMIUM")) plano = "premium";

    if (!plano) {
      console.warn("Plano não identificado:", title);
      return NextResponse.json({ ok: true });
    }

    // 6️⃣ IDEMPOTÊNCIA: verifica se corretor já existe
    const { data: existing } = await supabase
      .from("corretores")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      console.log("Corretor já existe:", email);
      return NextResponse.json({ ok: true });
    }

    // 7️⃣ Cria corretor
    await createCorretor(email, plano);

    console.log("Corretor criado com sucesso:", email, plano);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
