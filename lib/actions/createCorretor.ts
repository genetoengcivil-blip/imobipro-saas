import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // OBRIGATÓRIO (service role)
);

type Plano = "basic" | "pro" | "premium";

export async function createCorretor(
  email: string,
  plano: Plano,
  nome?: string,
  telefone?: string
) {
  /**
   * 1️⃣ Verifica se o usuário já existe no Auth
   */
  const { data: existingUser } = await supabase.auth.admin.getUserByEmail(
    email
  );

  let userId: string;

  if (existingUser?.user) {
    userId = existingUser.user.id;
  } else {
    /**
     * 2️⃣ Cria usuário no Auth com senha provisória
     */
    const tempPassword = Math.random().toString(36).slice(-10);

    const { data: newUser, error: createAuthError } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (createAuthError || !newUser.user) {
      throw new Error("Erro ao criar usuário no Auth");
    }

    userId = newUser.user.id;
  }

  /**
   * 3️⃣ Garante registro na tabela users
   */
  await supabase.from("users").upsert({
    id: userId,
    email,
    role: "corretor",
  });

  /**
   * 4️⃣ Cria ou garante corretor
   */
  await supabase.from("corretores").upsert({
    user_id: userId,
    nome: nome ?? null,
    telefone: telefone ?? null,
    status: "ativo",
  });

  /**
   * 5️⃣ Define TRIAL Premium (7 dias)
   */
  const trialAte = new Date();
  trialAte.setDate(trialAte.getDate() + 7);

  /**
   * 6️⃣ Cria ou atualiza assinatura
   */
  await supabase.from("assinaturas").upsert({
    user_id: userId,
    plano_base: plano,
    plano_atual: "premium",
    status: "ativa",
    trial_premium_ate: trialAte.toISOString(),
  });

  /**
   * 7️⃣ Retorno estratégico
   */
  return {
    userId,
    email,
    plano,
    trialAte,
  };
}
