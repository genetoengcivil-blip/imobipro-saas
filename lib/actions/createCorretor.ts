import { supabaseAdmin } from '@/lib/supabase-admin';

interface CreateCorretorInput {
  email: string;
  nome: string;
  telefone?: string;
}

export async function createCorretor({
  email,
  nome,
  telefone,
}: CreateCorretorInput) {
  /**
   * 1️⃣ Verifica se já existe usuário no Auth (Supabase v2)
   */
  const { data: list, error: listError } =
    await supabaseAdmin.auth.admin.listUsers({
      email,
      perPage: 1,
    });

  if (listError) {
    throw new Error(`Erro ao buscar usuário: ${listError.message}`);
  }

  let userId: string;

  if (list.users.length > 0) {
    userId = list.users[0].id;
  } else {
    /**
     * 2️⃣ Cria usuário no Auth
     */
    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (createError || !created.user) {
      throw new Error(
        `Erro ao criar usuário: ${createError?.message}`
      );
    }

    userId = created.user.id;
  }

  /**
   * 3️⃣ Cria registro do corretor no banco
   */
  const { error: insertError } = await supabaseAdmin
    .from('corretores')
    .insert({
      id: userId,
      nome,
      email,
      telefone,
      plano: 'free',
      ativo: true,
    });

  if (insertError) {
    throw new Error(
      `Erro ao criar corretor: ${insertError.message}`
    );
  }

  return {
    success: true,
    userId,
  };
}
