"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taxasObra } from "@/db/schema";

const CATEGORIAS_TAXA = [
  { tipo: "Projetos", ordem: 0, categoria: "durante_obra" },
  { tipo: "PCI", ordem: 1, categoria: "durante_obra" },
  { tipo: "Impressões", ordem: 2, categoria: "durante_obra" },
  { tipo: "Agua", ordem: 3, categoria: "durante_obra" },
  { tipo: "Despachante", ordem: 4, categoria: "durante_obra" },
  { tipo: "Cert. Inteiro Teor", ordem: 5, categoria: "durante_obra" },
  { tipo: "ART", ordem: 6, categoria: "durante_obra" },
  { tipo: "Alvara", ordem: 7, categoria: "durante_obra" },
  { tipo: "Vistoria CEF", ordem: 8, categoria: "durante_obra" },
  { tipo: "Tx Ass CEF", ordem: 9, categoria: "durante_obra" },
  { tipo: "Seguro CEF", ordem: 10, categoria: "durante_obra" },
  { tipo: "ITBI", ordem: 11, categoria: "durante_obra" },
  { tipo: "Registro Cartório", ordem: 12, categoria: "durante_obra" },
  { tipo: "Encargos de Obra", ordem: 13, categoria: "durante_obra" },
  { tipo: "Habite-se", ordem: 14, categoria: "casa_pronta" },
  { tipo: "CND e CNO", ordem: 15, categoria: "casa_pronta" },
  { tipo: "Averbação", ordem: 16, categoria: "casa_pronta" },
] as const;

export async function createTaxasCliente(ano: number, formData: FormData) {
  const cliente = String(formData.get("cliente") ?? "").trim();
  if (!cliente) return;

  await db.insert(taxasObra).values(
    CATEGORIAS_TAXA.map((c) => ({
      ano,
      cliente,
      tipo: c.tipo,
      ordem: c.ordem,
      categoria: c.categoria,
    }))
  );

  revalidatePath("/taxas");
}

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
