import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: Request) {
  try {
    const { plano } = await req.json();

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });

    const preference = new Preference(client);

    let title = "";
    let price = 0;

    if (plano === "basic") {
      title = "Plano BASIC - ImobiPro";
      price = 97;
    }

    if (plano === "pro") {
      title = "Plano PRO - ImobiPro";
      price = 197;
    }

    if (plano === "premium") {
      title = "Plano PREMIUM - ImobiPro";
      price = 397;
    }

    const response = await preference.create({
      body: {
        items: [
          {
            title,
            quantity: 1,
            unit_price: price,
            currency_id: "BRL",
          },
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/sucesso`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/falha`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/pendente`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({
      init_point: response.init_point,
    });
  } catch (error) {
    console.error("Erro no checkout:", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout" },
      { status: 500 }
    );
  }
}

