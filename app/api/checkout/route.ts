import { NextResponse } from "next/server";
import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

type Body = {
  plano: "basico" | "profissional" | "premium";
  user_id: string;
  email: string;
};

export async function POST(req: Request) {
  try {
    const { plano, user_id, email } = (await req.json()) as Body;

    if (!plano || !user_id || !email) {
      return NextResponse.json(
        { error: "Dados incompletos para checkout" },
        { status: 400 }
      );
    }

    // valores de exemplo (ajuste se necessário)
    const prices: Record<string, number> = {
      basico: 97,
      profissional: 197,
      premium: 397,
    };

    const preference = {
      items: [
        {
          id: plano,
          title: `Plano ${plano}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: prices[plano],
        },
      ],
      payer: {
        email,
      },

      // 🔑 ESSENCIAL PARA O WEBHOOK
      external_reference: user_id,
      metadata: {
        email,
        plano,
      },

      back_urls: {
        success: "https://imobi-pro.com/checkout/sucesso",
        failure: "https://imobi-pro.com/checkout/erro",
        pending: "https://imobi-pro.com/checkout/pendente",
      },
      auto_return: "approved",
    };

    const mpRes = await mercadopago.preferences.create(preference);

    return NextResponse.json({
      init_point: mpRes.body.init_point,
    });
  } catch (err) {
    console.error("Erro checkout:", err);
    return NextResponse.json(
      { error: "Erro ao criar checkout" },
      { status: 500 }
    );
  }
}

