"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taxasObra } from "@/db/schema";

export async function updateTaxasCliente(ano: number, cliente: string, formData: FormData) {
  const ids = formData.getAll("taxaId").map((v) => Number(v));

  for (const id of ids) {
    const previsto = formData.get(`previsto-${id}`);
    const pago = formData.get(`pago-${id}`);
    await db
      .update(taxasObra)
      .set({
        valorPrevisto: previsto === null || previsto === "" ? "0" : String(Number(previsto)),
        valorPago: pago === null || pago === "" ? "0" : String(Number(pago)),
      })
      .where(eq(taxasObra.id, id));
  }

  revalidatePath("/taxas");
}
