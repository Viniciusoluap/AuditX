"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { investidores, investidorAportes, investidorSaldosMensais, investidorMovimentos } from "@/db/schema";

export async function createInvestidor(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  const ehDivida = formData.get("ehDivida") === "on";
  const valorInicial = Number(formData.get("valorInicial") ?? 0);
  const taxaMensal = Number(formData.get("taxaMensal") ?? 0);
  const dataAporte = String(formData.get("dataAporte") ?? new Date().toISOString().slice(0, 10));

  const [inv] = await db.insert(investidores).values({ nome, ehDivida, ordem: 999 }).returning({ id: investidores.id });

  const [aporte] = await db
    .insert(investidorAportes)
    .values({
      investidorId: inv.id,
      dataAporte,
      valorInicial: String(valorInicial),
      taxaMensal: String(taxaMensal),
    })
    .returning({ id: investidorAportes.id });

  await db.insert(investidorSaldosMensais).values({
    aporteId: aporte.id,
    mesRef: dataAporte,
    saldo: String(valorInicial),
    ordem: 0,
  });

  revalidatePath("/investidores");
}

export async function registrarSaldoMensal(aporteId: number, formData: FormData) {
  const mesRef = String(formData.get("mesRef") ?? "");
  const saldo = Number(formData.get("saldo") ?? 0);
  if (!mesRef) return;

  const existentes = await db.query.investidorSaldosMensais.findMany({
    where: (t, { eq }) => eq(t.aporteId, aporteId),
  });

  await db.insert(investidorSaldosMensais).values({
    aporteId,
    mesRef,
    saldo: String(saldo),
    ordem: existentes.length,
  });

  revalidatePath("/investidores");
}

export async function registrarMovimento(aporteId: number, formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "saque");
  const valor = Number(formData.get("valor") ?? 0);
  const data = String(formData.get("data") ?? "") || null;

  await db.insert(investidorMovimentos).values({
    aporteId,
    tipo,
    data,
    valor: String(valor),
  });

  revalidatePath("/investidores");
}
