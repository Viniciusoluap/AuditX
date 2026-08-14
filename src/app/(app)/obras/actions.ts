"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { obras } from "@/db/schema";

const NUMERIC_FIELDS = [
  "vgv",
  "vlrFinanciado",
  "fgts",
  "subsidio",
  "entrada",
  "vlrPagoEntrada",
  "vlrReceberEntrada",
  "pctPlsCef",
  "pctRealRecebida",
  "vlrRecebidoCef",
  "vlrGastoObra",
  "vlrReceberCef",
  "custoLote",
  "vlrComissaoCorretor",
  "corretorJaRecebeu",
  "custoObra",
  "vlrDisponivel",
  "vlrTerminarObra",
  "lucroEstimado",
  "lucroInvestidor",
  "lucroCliente",
  "lucroProspecta",
  "proSoluto",
  "taxa",
  "qtdParcelas",
  "vlrParcela",
  "valorFinal",
  "lucroTotal",
] as const;

const TEXT_FIELDS = ["cliente", "status", "empreiteiro", "cidadeUf", "observacoes"] as const;
const DATE_FIELDS = ["prazoInicio", "prazoTermino"] as const;

function buildPayload(formData: FormData) {
  const payload: Record<string, unknown> = {};

  for (const field of TEXT_FIELDS) {
    payload[field] = String(formData.get(field) ?? "");
  }
  for (const field of NUMERIC_FIELDS) {
    const raw = formData.get(field);
    payload[field] = raw === null || raw === "" ? "0" : String(Number(raw));
  }
  for (const field of DATE_FIELDS) {
    const raw = formData.get(field);
    payload[field] = raw ? String(raw) : null;
  }

  const inicio = payload.prazoInicio as string | null;
  const termino = payload.prazoTermino as string | null;
  if (inicio && termino) {
    const dias = Math.round((new Date(termino).getTime() - new Date(inicio).getTime()) / 86400000);
    payload.diasObra = Number.isFinite(dias) ? dias : 0;
  } else {
    payload.diasObra = 0;
  }

  payload.ano = Number(formData.get("ano") ?? 2025);

  return payload;
}

export async function createObra(formData: FormData) {
  const payload = buildPayload(formData);
  const [row] = await db
    .insert(obras)
    .values(payload as typeof obras.$inferInsert)
    .returning({ id: obras.id });

  revalidatePath("/obras");
  redirect(`/obras/${row.id}`);
}

export async function updateObra(id: number, formData: FormData) {
  const payload = buildPayload(formData);
  await db
    .update(obras)
    .set({ ...(payload as Partial<typeof obras.$inferInsert>), updatedAt: new Date() })
    .where(eq(obras.id, id));

  revalidatePath("/obras");
  revalidatePath(`/obras/${id}`);
  redirect(`/obras/${id}`);
}

export async function deleteObra(id: number) {
  await db.delete(obras).where(eq(obras.id, id));
  revalidatePath("/obras");
  redirect("/obras");
}
