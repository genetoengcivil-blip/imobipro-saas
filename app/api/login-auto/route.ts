import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_SITE_URL)
    );
  }

  const supabase = supabaseAdmin;

  // 1. Validar token
  const { data: tokenData } = await supabase
    .from("login_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (!tokenData) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_SITE_URL)
    );
  }

  // 2. Criar sessão
  await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: tokenData.user_id,
  });

  // 3. Invalidar token
  await supabase.from("login_tokens").delete().eq("token", token);

  return NextResponse.redirect(
    new URL("/crm/corretor", process.env.NEXT_PUBLIC_SITE_URL)
  );
}
