import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

type Plano = "basic" | "pro" | "premium";

export async function createCorretor(email: string, plano: Plano) {
  // 1️⃣ Verifica se já existe
  const { data: existente } = await supabaseAdmin
    .from("corretores")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  let userId: string;

  if (!existente) {
    // 2️⃣ Cria usuário
    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (error || !data.user) {
      throw new Error("Erro ao criar usuário");
    }

    userId = data.user.id;

    // 3️⃣ Cria corretor
    await supabaseAdmin.from("corretores").insert({
      user_id: userId,
      email,
      plano,
      ativo: true,
    });
  } else {
    userId = existente.user_id;
  }

  // 4️⃣ Gera token temporário
  const token = crypto.randomBytes(32).toString("hex");

  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10); // 10 min

  await supabaseAdmin.from("login_tokens").insert({
    user_id: userId,
    token,
    expires_at: expires,
  });

  console.log("🔐 Token de login criado:", token);

  return token;
}
