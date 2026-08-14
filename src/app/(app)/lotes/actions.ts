"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lotes } from "@/db/schema";

function toNum(v: FormDataEntryValue | null) {
  return v === null || v === "" ? "0" : String(Number(v));
}

export async function updateLote(id: number, formData: FormData) {
  const valorPagoCef = Number(formData.get("valorPagoCef") ?? 0);
  const valorTerceiro = Number(formData.get("valorTerceiro") ?? 0);

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
  const valorPagoCef = Number(formData.get("valorPagoCef") ?? 0);
  const valorTerceiro = Number(formData.get("valorTerceiro") ?? 0);

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
  await db.delete(lotes).where(eq(lotes.id, id));
  revalidatePath("/lotes");
}
