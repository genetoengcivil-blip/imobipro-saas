import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateMagicLogin(email: string) {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/crm/first-access`,
    },
  });

  if (error || !data?.properties?.action_link) {
    throw new Error("Erro ao gerar magic link");
  }

  return data.properties.action_link;
}
