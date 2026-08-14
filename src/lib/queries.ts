import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  obras,
  taxasObra,
  corretoresComissoes,
  empreendimentos,
  lotes,
  loteResumoFinanceiro,
  investidores,
  investidorAportes,
  investidorSaldosMensais,
  investidorMovimentos,
  anotacoesFinanceiras,
  configuracoes,
} from "@/db/schema";

export async function getObras(ano?: number) {
  const rows = await db.query.obras.findMany({
    where: ano ? eq(obras.ano, ano) : undefined,
    orderBy: [asc(obras.ano), asc(obras.cliente)],
  });
  return rows;
}

export async function getObraById(id: number) {
  return db.query.obras.findFirst({ where: eq(obras.id, id) });
}

export async function getAnotacoes(modulo: string, ano?: number) {
  const rows = await db.query.anotacoesFinanceiras.findMany({
    where: ano ? eq(anotacoesFinanceiras.modulo, modulo) : eq(anotacoesFinanceiras.modulo, modulo),
    orderBy: [asc(anotacoesFinanceiras.ordem)],
  });
  return ano ? rows.filter((r) => r.ano === ano || r.ano === null) : rows;
}

export async function getTaxasByAno(ano: number) {
  return db.query.taxasObra.findMany({
    where: eq(taxasObra.ano, ano),
    orderBy: [asc(taxasObra.cliente), asc(taxasObra.ordem)],
  });
}

export async function getCorretores() {
  return db.query.corretoresComissoes.findMany({ orderBy: [asc(corretoresComissoes.ordem)] });
}

export async function getEmpreendimentosComLotes() {
  const emps = await db.query.empreendimentos.findMany({ orderBy: [asc(empreendimentos.ordem)] });
  const result = [];
  for (const emp of emps) {
    const itens = await db.query.lotes.findMany({
      where: eq(lotes.empreendimentoId, emp.id),
      orderBy: [asc(lotes.ordem)],
    });
    const resumo = await db.query.loteResumoFinanceiro.findMany({
      where: eq(loteResumoFinanceiro.empreendimentoId, emp.id),
      orderBy: [asc(loteResumoFinanceiro.ordem)],
    });
    result.push({ ...emp, lotes: itens, resumo });
  }
  return result;
}

export async function getInvestidoresCompletos() {
  const invs = await db.query.investidores.findMany({ orderBy: [asc(investidores.ordem)] });
  const result = [];
  for (const inv of invs) {
    const aportes = await db.query.investidorAportes.findMany({ where: eq(investidorAportes.investidorId, inv.id) });
    const aportesComDetalhe = [];
    for (const aporte of aportes) {
      const saldos = await db.query.investidorSaldosMensais.findMany({
        where: eq(investidorSaldosMensais.aporteId, aporte.id),
        orderBy: [asc(investidorSaldosMensais.ordem)],
      });
      const movimentos = await db.query.investidorMovimentos.findMany({
        where: eq(investidorMovimentos.aporteId, aporte.id),
      });
      aportesComDetalhe.push({ ...aporte, saldos, movimentos });
    }
    result.push({ ...inv, aportes: aportesComDetalhe });
  }
  return result;
}

export async function getConfig(chave: string) {
  const row = await db.query.configuracoes.findFirst({ where: eq(configuracoes.chave, chave) });
  return row?.valor ?? null;
}

export { desc };
