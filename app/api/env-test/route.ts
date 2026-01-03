import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    token: process.env.MERCADOPAGO_ACCESS_TOKEN ?? null,
    allEnv: Object.keys(process.env).filter(k =>
      k.includes("MERCADO")
    ),
  });
}
