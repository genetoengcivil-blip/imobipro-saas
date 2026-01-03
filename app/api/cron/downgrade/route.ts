import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = supabaseAdmin;

  const agora = new Date().toISOString();

  const { data: expiradas } = await supabase
    .from("assinaturas")
    .select("*")
    .lt("trial_premium_ate", agora)
    .eq("plano_atual", "premium");

  if (!expiradas?.length) {
    return NextResponse.json({ ok: true });
  }

  for (const sub of expiradas) {
    await supabase
      .from("assinaturas")
      .update({
        plano_atual: sub.plano_base,
        trial_premium_ate: null,
      })
      .eq("id", sub.id);
  }

  return NextResponse.json({ downgraded: expiradas.length });
}
