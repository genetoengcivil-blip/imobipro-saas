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

  // 1️⃣ Criar usuário no Auth (Supabase v2)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // Email já existe → Supabase retorna erro aqui
    throw new Error(error.message);
  }

  const userId = data.user.id;

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

  return { userId };
}
