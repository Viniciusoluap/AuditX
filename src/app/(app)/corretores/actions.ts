"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { corretoresComissoes } from "@/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { toMoneyString as toNum } from "@/lib/parse-money";

export async function createComissao(formData: FormData) {
  await requireAuth();
  await db.insert(corretoresComissoes).values({
    clienteLote: String(formData.get("clienteLote") ?? ""),
    corretor: String(formData.get("corretor") ?? ""),
    comissaoTotal: toNum(formData.get("comissaoTotal")),
    parcela1: toNum(formData.get("parcela1")),
    parcela2: toNum(formData.get("parcela2")),
    parcela3: toNum(formData.get("parcela3")),
    parcela4: toNum(formData.get("parcela4")),
    ordem: 999,
  });
  revalidatePath("/corretores");
}

export async function updateComissao(id: number, formData: FormData) {
  await requireAuth();
  await db
    .update(corretoresComissoes)
    .set({
      clienteLote: String(formData.get("clienteLote") ?? ""),
      corretor: String(formData.get("corretor") ?? ""),
      comissaoTotal: toNum(formData.get("comissaoTotal")),
      parcela1: toNum(formData.get("parcela1")),
      parcela2: toNum(formData.get("parcela2")),
      parcela3: toNum(formData.get("parcela3")),
      parcela4: toNum(formData.get("parcela4")),
    })
    .where(eq(corretoresComissoes.id, id));
  revalidatePath("/corretores");
}

export async function deleteComissao(id: number) {
  await requireAuth();
  await db.delete(corretoresComissoes).where(eq(corretoresComissoes.id, id));
  revalidatePath("/corretores");
}
