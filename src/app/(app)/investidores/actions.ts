"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { investidores, investidorAportes, investidorSaldosMensais, investidorMovimentos } from "@/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { toMoneyString } from "@/lib/parse-money";

export async function createInvestidor(formData: FormData) {
  await requireAuth();
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  const ehDivida = formData.get("ehDivida") === "on";
  const valorInicial = toMoneyString(formData.get("valorInicial"));
  const taxaMensal = toMoneyString(formData.get("taxaMensal"));
  const dataAporte = String(formData.get("dataAporte") ?? new Date().toISOString().slice(0, 10));

  const [inv] = await db.insert(investidores).values({ nome, ehDivida, ordem: 999 }).returning({ id: investidores.id });

  const [aporte] = await db
    .insert(investidorAportes)
    .values({
      investidorId: inv.id,
      dataAporte,
      valorInicial,
      taxaMensal,
    })
    .returning({ id: investidorAportes.id });

  await db.insert(investidorSaldosMensais).values({
    aporteId: aporte.id,
    mesRef: dataAporte,
    saldo: valorInicial,
    ordem: 0,
  });

  revalidatePath("/investidores");
}

export async function registrarSaldoMensal(aporteId: number, formData: FormData) {
  await requireAuth();
  const mesRef = String(formData.get("mesRef") ?? "");
  const saldo = toMoneyString(formData.get("saldo"));
  if (!mesRef) return;

  const existentes = await db.query.investidorSaldosMensais.findMany({
    where: (t, { eq }) => eq(t.aporteId, aporteId),
  });

  await db.insert(investidorSaldosMensais).values({
    aporteId,
    mesRef,
    saldo,
    ordem: existentes.length,
  });

  revalidatePath("/investidores");
}

export async function registrarMovimento(aporteId: number, formData: FormData) {
  await requireAuth();
  const tipo = String(formData.get("tipo") ?? "saque");
  const valor = toMoneyString(formData.get("valor"));
  const data = String(formData.get("data") ?? "") || null;

  await db.insert(investidorMovimentos).values({
    aporteId,
    tipo,
    data,
    valor,
  });

  revalidatePath("/investidores");
}
