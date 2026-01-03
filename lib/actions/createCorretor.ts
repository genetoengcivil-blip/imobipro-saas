import { createClient } from "@/lib/supabase-admin";
import { generateMagicLogin } from "@/lib/auth/generateMagicLogin";
import { sendAccessEmail } from "@/lib/email/sendAccessEmail";

type Plano = "basic" | "pro" | "premium";

export async function createCorretor(email: string, plano: Plano) {
  const supabase = createClient();

  // Buscar usuário por email (Supabase v2)
  const { data, error } = await supabase.auth.admin.listUsers({
    email,
    perPage: 1,
  });

  if (error) throw new Error(error.message);

  let userId: string;

  if (data.users.length > 0) {
    userId = data.users[0].id;
  } else {
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

  const { error: dbError } = await supabase.from("corretores").upsert({
    user_id: userId,
    email,
    plano,
    status: "ativo",
  });

  if (dbError) throw new Error(dbError.message);

  const magicLink = await generateMagicLogin(email);
  await sendAccessEmail(email, magicLink);

  return { ok: true };
}
