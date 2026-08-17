import { authConfigured, createClient } from "@/lib/supabase/server";

/**
 * Barreira de autenticação para Server Actions de escrita.
 *
 * O middleware só confere a *presença* de um cookie de sessão (checagem
 * rápida, compatível com Edge); a validação real do token acontece aqui,
 * em Node.js. Sem isso, um POST direto ao endpoint da Server Action (fora
 * da UI) conseguia gravar/apagar dados financeiros sem sessão válida.
 */
export async function requireAuth(): Promise<void> {
  if (!authConfigured) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sessão inválida ou expirada. Faça login novamente para salvar alterações.");
  }
}
