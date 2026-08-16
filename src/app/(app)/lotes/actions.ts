"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lotes } from "@/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { toMoneyString as toNum } from "@/lib/parse-money";

export async function updateLote(id: number, formData: FormData) {
  await requireAuth();
  const valorPagoCef = Number(toNum(formData.get("valorPagoCef")));
  const valorTerceiro = Number(toNum(formData.get("valorTerceiro")));

  await db
    .update(lotes)
    .set({
      lote: String(formData.get("lote") ?? ""),
      valorAvaliacao: toNum(formData.get("valorAvaliacao")),
      valorPagoCef: toNum(formData.get("valorPagoCef")),
      valorTerceiro: toNum(formData.get("valorTerceiro")),
      valorProspecta: String(valorPagoCef - valorTerceiro),
    })
    .where(eq(lotes.id, id));

  revalidatePath("/lotes");
}

export async function createLote(empreendimentoId: number, formData: FormData) {
  await requireAuth();
  const valorPagoCef = Number(toNum(formData.get("valorPagoCef")));
  const valorTerceiro = Number(toNum(formData.get("valorTerceiro")));

  await db.insert(lotes).values({
    empreendimentoId,
    lote: String(formData.get("lote") ?? ""),
    valorAvaliacao: toNum(formData.get("valorAvaliacao")),
    valorPagoCef: toNum(formData.get("valorPagoCef")),
    valorTerceiroLabel: String(formData.get("valorTerceiroLabel") ?? ""),
    valorTerceiro: toNum(formData.get("valorTerceiro")),
    valorProspecta: String(valorPagoCef - valorTerceiro),
    ordem: 999,
  });

  revalidatePath("/lotes");
}

export async function deleteLote(id: number) {
  await requireAuth();
  await db.delete(lotes).where(eq(lotes.id, id));
  revalidatePath("/lotes");
}
