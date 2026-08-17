import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "./index";
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
} from "./schema";

type SeedData = {
  obras: Array<Record<string, unknown>>;
  anotacoesObras: Array<Record<string, unknown>>;
  taxasObra: Array<Record<string, unknown>>;
  anotacoesTaxas: Array<Record<string, unknown>>;
  corretores: Array<Record<string, unknown>>;
  empreendimentos: string[];
  lotes: Record<string, Array<Record<string, unknown>>>;
  resumoFinanceiroLotes: Record<string, Array<Record<string, unknown>>>;
  investidores: Array<{
    nome: string;
    ehDivida: boolean;
    aporte: { dataAporte: string | null; valorInicial: number; taxaMensal: number };
    saldosMensais: Array<{ mesRef: string | null; saldo: number; jurosMes: number | null; ordem: number }>;
    movimentos: Array<{ tipo: string; data: string | null; valor: number }>;
  }>;
  configuracoes: Record<string, string | null>;
};

function toStr(n: number | null | undefined): string {
  return (n ?? 0).toString();
}

function assertSeedIsSafeToRun() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isLocalDatabase = /localhost|127\.0\.0\.1/.test(databaseUrl);

  if (!isLocalDatabase && process.env.SEED_CONFIRM !== "WIPE") {
    console.error(
      "\nATENÇÃO: este comando APAGA todas as 12 tabelas antes de recarregar os dados da planilha.\n" +
        "DATABASE_URL não aponta para localhost — parece ser um banco real (produção/Supabase).\n\n" +
        "Se é isso mesmo que você quer fazer, rode de novo com:\n\n" +
        "  SEED_CONFIRM=WIPE npm run db:seed\n"
    );
    process.exit(1);
  }
}

async function main() {
  assertSeedIsSafeToRun();

  const raw = readFileSync(join(process.cwd(), "src/db/seed-data.json"), "utf-8");
  const data: SeedData = JSON.parse(raw);

  console.log("Limpando tabelas...");
  await db.delete(investidorMovimentos);
  await db.delete(investidorSaldosMensais);
  await db.delete(investidorAportes);
  await db.delete(investidores);
  await db.delete(loteResumoFinanceiro);
  await db.delete(lotes);
  await db.delete(empreendimentos);
  await db.delete(corretoresComissoes);
  await db.delete(anotacoesFinanceiras);
  await db.delete(taxasObra);
  await db.delete(obras);
  await db.delete(configuracoes);

  // ---- Obras ----
  console.log(`Inserindo ${data.obras.length} obras...`);
  const insertedObras = await db
    .insert(obras)
    .values(
      data.obras.map((o) => ({
        ano: o.ano as number,
        cliente: o.cliente as string,
        status: o.status as string,
        empreiteiro: o.empreiteiro as string,
        cidadeUf: o.cidadeUf as string,
        vgv: toStr(o.vgv as number),
        vlrFinanciado: toStr(o.vlrFinanciado as number),
        fgts: toStr(o.fgts as number),
        subsidio: toStr(o.subsidio as number),
        entrada: toStr(o.entrada as number),
        vlrPagoEntrada: toStr(o.vlrPagoEntrada as number),
        vlrReceberEntrada: toStr(o.vlrReceberEntrada as number),
        pctPlsCef: toStr(o.pctPlsCef as number),
        pctRealRecebida: toStr(o.pctRealRecebida as number),
        vlrRecebidoCef: toStr(o.vlrRecebidoCef as number),
        vlrGastoObra: toStr(o.vlrGastoObra as number),
        vlrReceberCef: toStr(o.vlrReceberCef as number),
        custoLote: toStr(o.custoLote as number),
        vlrComissaoCorretor: toStr(o.vlrComissaoCorretor as number),
        corretorJaRecebeu: toStr(o.corretorJaRecebeu as number),
        custoObra: toStr(o.custoObra as number),
        vlrDisponivel: toStr(o.vlrDisponivel as number),
        vlrTerminarObra: toStr(o.vlrTerminarObra as number),
        prazoInicio: (o.prazoInicio as string) || null,
        diasObra: (o.diasObra as number) ?? 0,
        prazoTermino: (o.prazoTermino as string) || null,
        lucroEstimado: toStr(o.lucroEstimado as number),
        lucroInvestidor: toStr(o.lucroInvestidor as number),
        lucroCliente: toStr(o.lucroCliente as number),
        lucroProspecta: toStr(o.lucroProspecta as number),
        proSoluto: toStr(o.proSoluto as number),
        taxa: toStr(o.taxa as number),
        qtdParcelas: toStr(o.qtdParcelas as number),
        vlrParcela: toStr(o.vlrParcela as number),
        valorFinal: toStr(o.valorFinal as number),
        lucroTotal: toStr(o.lucroTotal as number),
      }))
    )
    .returning({ id: obras.id, cliente: obras.cliente, ano: obras.ano });

  const obraKey = (cliente: string, ano: number) => `${ano}::${cliente}`;
  const obraIdByKey = new Map(insertedObras.map((o) => [obraKey(o.cliente, o.ano), o.id]));
  // Nomes de cliente são únicos entre todas as obras (checado na migração dos lotes);
  // usado só pra vincular lote comprado -> obra/venda, quando existe.
  const obraIdByCliente = new Map(insertedObras.map((o) => [o.cliente, o.id]));

  // ---- Anotações (obras) ----
  const anotacoesObrasRows = data.anotacoesObras.map((a, idx) => ({
    modulo: a.modulo as string,
    ano: a.ano as number,
    grupo: (a.grupo as string) ?? null,
    rotulo: a.rotulo as string,
    valor: a.valor === null || a.valor === undefined ? null : toStr(a.valor as number),
    valorSecundario: null,
    observacao: (a.observacao as string) ?? null,
    ordem: idx,
  }));
  if (anotacoesObrasRows.length) await db.insert(anotacoesFinanceiras).values(anotacoesObrasRows);

  // ---- Taxas de obra ----
  console.log(`Inserindo ${data.taxasObra.length} lançamentos de taxas...`);
  const taxasRows = data.taxasObra.map((t) => ({
    obraId: obraIdByKey.get(obraKey(t.cliente as string, t.ano as number)) ?? null,
    ano: t.ano as number,
    cliente: t.cliente as string,
    tipo: t.tipo as string,
    categoria: t.categoria as string,
    ordem: t.ordem as number,
    valorPrevisto: toStr(t.valorPrevisto as number),
    valorPago: toStr(t.valorPago as number),
  }));
  if (taxasRows.length) await db.insert(taxasObra).values(taxasRows);

  const anotacoesTaxasRows = data.anotacoesTaxas.map((a, idx) => ({
    modulo: a.modulo as string,
    ano: a.ano as number,
    grupo: (a.grupo as string) ?? null,
    rotulo: a.rotulo as string,
    valor: a.valor === null || a.valor === undefined ? null : toStr(a.valor as number),
    valorSecundario: null,
    observacao: (a.observacao as string) ?? null,
    ordem: idx,
  }));
  if (anotacoesTaxasRows.length) await db.insert(anotacoesFinanceiras).values(anotacoesTaxasRows);

  // ---- Corretores ----
  console.log(`Inserindo ${data.corretores.length} comissões de corretores...`);
  const corretoresRows = data.corretores.map((c) => ({
    obraId: obraIdByKey.get(obraKey(c.clienteLote as string, 2025)) ?? null,
    clienteLote: c.clienteLote as string,
    corretor: c.corretor as string,
    comissaoTotal: toStr(c.comissaoTotal as number),
    parcela1: toStr(c.parcela1 as number),
    parcela2: toStr(c.parcela2 as number),
    parcela3: toStr(c.parcela3 as number),
    parcela4: toStr(c.parcela4 as number),
    ordem: c.ordem as number,
  }));
  if (corretoresRows.length) await db.insert(corretoresComissoes).values(corretoresRows);

  // ---- Empreendimentos / Lotes ----
  console.log("Inserindo empreendimentos e lotes...");
  const empIds = new Map<string, number>();
  for (let i = 0; i < data.empreendimentos.length; i++) {
    const nome = data.empreendimentos[i];
    const [row] = await db.insert(empreendimentos).values({ nome, ordem: i }).returning({ id: empreendimentos.id });
    empIds.set(nome, row.id);
  }

  for (const [empNome, itens] of Object.entries(data.lotes)) {
    const empreendimentoId = empIds.get(empNome);
    if (!empreendimentoId || !itens.length) continue;
    await db.insert(lotes).values(
      itens.map((l) => ({
        empreendimentoId,
        obraId: l.obraCliente ? (obraIdByCliente.get(l.obraCliente as string) ?? null) : null,
        lote: l.lote as string,
        valorAvaliacao: toStr(l.valorAvaliacao as number),
        valorPagoCef: toStr(l.valorPagoCef as number),
        valorTerceiroLabel: l.valorTerceiroLabel as string,
        valorTerceiro: toStr(l.valorTerceiro as number),
        valorProspecta: toStr(l.valorProspecta as number),
        ordem: l.ordem as number,
      }))
    );
  }

  for (const [empNome, itens] of Object.entries(data.resumoFinanceiroLotes)) {
    const empreendimentoId = empIds.get(empNome);
    if (!empreendimentoId || !itens.length) continue;
    await db.insert(loteResumoFinanceiro).values(
      itens.map((r) => ({
        empreendimentoId,
        descricao: r.descricao as string,
        valor: toStr(r.valor as number),
        ordem: r.ordem as number,
      }))
    );
  }

  // ---- Investidores ----
  console.log(`Inserindo ${data.investidores.length} investidores...`);
  for (let i = 0; i < data.investidores.length; i++) {
    const inv = data.investidores[i];
    const [invRow] = await db
      .insert(investidores)
      .values({ nome: inv.nome, ehDivida: inv.ehDivida, ordem: i })
      .returning({ id: investidores.id });

    const [aporteRow] = await db
      .insert(investidorAportes)
      .values({
        investidorId: invRow.id,
        dataAporte: inv.aporte.dataAporte ?? new Date().toISOString().slice(0, 10),
        valorInicial: toStr(inv.aporte.valorInicial),
        taxaMensal: toStr(inv.aporte.taxaMensal),
      })
      .returning({ id: investidorAportes.id });

    if (inv.saldosMensais.length) {
      await db.insert(investidorSaldosMensais).values(
        inv.saldosMensais.map((s) => ({
          aporteId: aporteRow.id,
          mesRef: s.mesRef ?? inv.aporte.dataAporte ?? new Date().toISOString().slice(0, 10),
          saldo: toStr(s.saldo),
          jurosMes: s.jurosMes === null ? null : toStr(s.jurosMes),
          ordem: s.ordem,
        }))
      );
    }

    if (inv.movimentos.length) {
      await db.insert(investidorMovimentos).values(
        inv.movimentos.map((m) => ({
          aporteId: aporteRow.id,
          tipo: m.tipo,
          data: m.data,
          valor: toStr(m.valor),
        }))
      );
    }
  }

  // ---- Configurações ----
  const cfg = data.configuracoes;
  const cfgRows = Object.entries(cfg)
    .filter(([, v]) => v)
    .map(([chave, valor]) => ({ chave, valor: String(valor) }));
  if (cfgRows.length) await db.insert(configuracoes).values(cfgRows);

  console.log("Seed concluído com sucesso.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
