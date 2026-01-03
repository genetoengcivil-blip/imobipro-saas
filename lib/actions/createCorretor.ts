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
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome,
      role: "corretor",
    },
  });

  if (error) {
    // Email duplicado cai aqui automaticamente
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Falha ao criar usuário no Auth");
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
    // rollback de segurança
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(insertError.message);
  }

  return { userId };
}
