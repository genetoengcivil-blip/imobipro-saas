import { createClient } from "@/lib/supabase-admin";
import { generateMagicLogin } from "@/lib/auth/generateMagicLogin";
import { sendAccessEmail } from "@/lib/email/sendAccessEmail";

type Plano = "basic" | "pro" | "premium";

export async function createCorretor(email: string, plano: Plano) {
  const supabase = createClient();

  // 1️⃣ Buscar usuário por email (Supabase v2)
  const { data, error } = await supabase.auth.admin.listUsers({
    email,
    perPage: 1,
  });

  if (error) {
    throw new Error(error.message);
  }

  let userId: string;

  if (data.users.length > 0) {
    userId = data.users[0].id;
  } else {
    // 2️⃣ Criar usuário
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (createError || !created.user) {
      throw new Error(createError?.message);
    }

    userId = created.user.id;
  }

  // 3️⃣ Salvar corretor
  const { error: dbError } = await supabase
    .from("corretores")
    .upsert({
      user_id: userId,
      email,
      plano,
      status: "ativo",
    });

  if (dbError) {
    throw new Error(dbError.message);
  }

  // 4️⃣ Login mágico
  const magicLink = await generateMagicLogin(email);

  // 5️⃣ Email
  await sendAccessEmail(email, magicLink);

  return { ok: true };
}
