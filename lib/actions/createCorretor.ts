import { createAdminClient } from "@/lib/supabase-admin";

interface CreateCorretorInput {
  email: string;
  password: string;
  nome: string;
}

export async function createCorretor({
  email,
  password,
  nome,
}: CreateCorretorInput) {
  const supabase = createAdminClient();

  // 1️⃣ Criar usuário no Auth
  const { data: userData, error: userError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (userError) {
    throw new Error(userError.message);
  }

  const userId = userData.user.id;

  // 2️⃣ Criar registro do corretor
  const { error: insertError } = await supabase
    .from("corretores")
    .insert({
      id: userId,
      nome,
      email,
      plano: "free",
      ativo: true,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    userId,
  };
}
