import { getSessionUser } from "@/lib/auth";

/**
 * Valida a sessão local no servidor antes de qualquer Server Action de escrita.
 */
export async function requireAuth(): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Sessão inválida ou expirada. Faça login novamente para salvar alterações.");
  }
}
