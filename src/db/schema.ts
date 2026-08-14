import {
  pgTable,
  serial,
  text,
  numeric,
  integer,
  date,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Schema fiel à planilha CRM_PROSPECTA.xlsx (6 abas):
 * Obras 2025 / Obras 2026 / Taxas de Obras / Corretores / Compra de Lotes / Investidores
 *
 * Convenção: nomes de coluna em português, iguais aos cabeçalhos originais,
 * para que qualquer pessoa que conhecia a planilha reconheça o sistema.
 */

// ---------------------------------------------------------------------------
// OBRAS (unifica "Obras 2025" e "Obras 2026" com a coluna `ano`)
// ---------------------------------------------------------------------------
export const obras = pgTable("obras", {
  id: serial("id").primaryKey(),
  ano: integer("ano").notNull(), // 2025 ou 2026
  cliente: text("cliente").notNull(),
  status: text("status").notNull().default(""),
  empreiteiro: text("empreiteiro").default(""),
  cidadeUf: text("cidade_uf").default(""),

  // Financiamento / venda
  vgv: numeric("vgv", { precision: 16, scale: 4 }).notNull().default("0"),
  vlrFinanciado: numeric("vlr_financiado", { precision: 16, scale: 4 }).notNull().default("0"),
  fgts: numeric("fgts", { precision: 16, scale: 4 }).notNull().default("0"),
  subsidio: numeric("subsidio", { precision: 16, scale: 4 }).notNull().default("0"),
  entrada: numeric("entrada", { precision: 16, scale: 4 }).notNull().default("0"), // = VGV - Subsídio - Financiado - FGTS
  vlrPagoEntrada: numeric("vlr_pago_entrada", { precision: 16, scale: 4 }).notNull().default("0"),
  vlrReceberEntrada: numeric("vlr_receber_entrada", { precision: 16, scale: 4 }).notNull().default("0"),

  // Repasse CEF (Caixa Econômica Federal)
  pctPlsCef: numeric("pct_pls_cef", { precision: 9, scale: 6 }).notNull().default("0"),
  pctRealRecebida: numeric("pct_real_recebida", { precision: 9, scale: 6 }).notNull().default("0"),
  vlrRecebidoCef: numeric("vlr_recebido_cef", { precision: 16, scale: 4 }).notNull().default("0"),
  vlrGastoObra: numeric("vlr_gasto_obra", { precision: 16, scale: 4 }).notNull().default("0"),
  vlrReceberCef: numeric("vlr_receber_cef", { precision: 16, scale: 4 }).notNull().default("0"),

  // Custos
  custoLote: numeric("custo_lote", { precision: 16, scale: 4 }).notNull().default("0"),
  vlrComissaoCorretor: numeric("vlr_comissao_corretor", { precision: 16, scale: 4 }).notNull().default("0"), // coluna "Corretor"
  corretorJaRecebeu: numeric("corretor_ja_recebeu", { precision: 16, scale: 4 }).notNull().default("0"),
  custoObra: numeric("custo_obra", { precision: 16, scale: 4 }).notNull().default("0"),
  vlrDisponivel: numeric("vlr_disponivel", { precision: 16, scale: 4 }).notNull().default("0"),
  vlrTerminarObra: numeric("vlr_terminar_obra", { precision: 16, scale: 4 }).notNull().default("0"),

  // Prazos
  prazoInicio: date("prazo_inicio"),
  diasObra: integer("dias_obra").notNull().default(0),
  prazoTermino: date("prazo_termino"),

  // Lucro
  lucroEstimado: numeric("lucro_estimado", { precision: 16, scale: 4 }).notNull().default("0"),
  lucroInvestidor: numeric("lucro_investidor", { precision: 16, scale: 4 }).notNull().default("0"),
  lucroCliente: numeric("lucro_cliente", { precision: 16, scale: 4 }).notNull().default("0"), // só existe na aba 2026
  lucroProspecta: numeric("lucro_prospecta", { precision: 16, scale: 4 }).notNull().default("0"),

  // Pró-soluto / parcelamento
  proSoluto: numeric("pro_soluto", { precision: 16, scale: 4 }).notNull().default("0"),
  taxa: numeric("taxa", { precision: 9, scale: 6 }).notNull().default("0"),
  qtdParcelas: numeric("qtd_parcelas", { precision: 6, scale: 2 }).notNull().default("0"),
  vlrParcela: numeric("vlr_parcela", { precision: 16, scale: 4 }).notNull().default("0"),
  valorFinal: numeric("valor_final", { precision: 16, scale: 4 }).notNull().default("0"),
  lucroTotal: numeric("lucro_total", { precision: 16, scale: 4 }).notNull().default("0"),

  observacoes: text("observacoes").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// TAXAS DE OBRA (aba "Taxas de Obras" — taxas previstas x pagas por cliente)
// ---------------------------------------------------------------------------
export const taxasObra = pgTable("taxas_obra", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id").references(() => obras.id, { onDelete: "cascade" }),
  ano: integer("ano").notNull(),
  cliente: text("cliente").notNull(),
  tipo: text("tipo").notNull(), // Projetos, PCI, Impressões, Agua, Despachante, Cert. Inteiro Teor, ART, Alvara, Vistoria CEF, Tx Ass CEF, Seguro CEF, ITBI, Registro Cartório, Encargos de Obra, Habite-se, CND e CNO, Averbação
  categoria: text("categoria").notNull().default("durante_obra"), // durante_obra | casa_pronta
  ordem: integer("ordem").notNull().default(0),
  valorPrevisto: numeric("valor_previsto", { precision: 16, scale: 4 }).notNull().default("0"),
  valorPago: numeric("valor_pago", { precision: 16, scale: 4 }).notNull().default("0"),
});

// ---------------------------------------------------------------------------
// CORRETORES (aba "Corretores" — controle de comissões)
// ---------------------------------------------------------------------------
export const corretoresComissoes = pgTable("corretores_comissoes", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id").references(() => obras.id, { onDelete: "set null" }),
  clienteLote: text("cliente_lote").notNull(), // texto original, ex: "LOTE 01 - LUCIA BRENA"
  corretor: text("corretor").notNull(),
  comissaoTotal: numeric("comissao_total", { precision: 16, scale: 4 }).notNull().default("0"),
  parcela1: numeric("parcela_1", { precision: 16, scale: 4 }).notNull().default("0"),
  parcela2: numeric("parcela_2", { precision: 16, scale: 4 }).notNull().default("0"),
  parcela3: numeric("parcela_3", { precision: 16, scale: 4 }).notNull().default("0"),
  parcela4: numeric("parcela_4", { precision: 16, scale: 4 }).notNull().default("0"),
  ordem: integer("ordem").notNull().default(0),
});

// ---------------------------------------------------------------------------
// COMPRA DE LOTES (aba "Compra de Lotes" — 3 empreendimentos)
// ---------------------------------------------------------------------------
export const empreendimentos = pgTable("empreendimentos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(), // Residencial Aurora, Morada do Bosque, Jet Reginaldo
  ordem: integer("ordem").notNull().default(0),
});

export const lotes = pgTable("lotes", {
  id: serial("id").primaryKey(),
  empreendimentoId: integer("empreendimento_id").notNull().references(() => empreendimentos.id, { onDelete: "cascade" }),
  lote: text("lote").notNull(), // "LOTE 20 - CARINE"
  valorAvaliacao: numeric("valor_avaliacao", { precision: 16, scale: 4 }).notNull().default("0"),
  valorPagoCef: numeric("valor_pago_cef", { precision: 16, scale: 4 }).notNull().default("0"),
  valorTerceiroLabel: text("valor_terceiro_label").notNull().default(""), // "Valor Edimar" / "Valor Daniel" / "Valor Exclusive"
  valorTerceiro: numeric("valor_terceiro", { precision: 16, scale: 4 }).notNull().default("0"),
  valorProspecta: numeric("valor_prospecta", { precision: 16, scale: 4 }).notNull().default("0"), // = valorPagoCef - valorTerceiro
  ordem: integer("ordem").notNull().default(0),
});

export const loteResumoFinanceiro = pgTable("lote_resumo_financeiro", {
  id: serial("id").primaryKey(),
  empreendimentoId: integer("empreendimento_id").notNull().references(() => empreendimentos.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(), // "Valor a receber", "Valor pago", "Valor pago MARTINS", "Saldo a receber"...
  valor: numeric("valor", { precision: 16, scale: 4 }).notNull().default("0"),
  ordem: integer("ordem").notNull().default(0),
});

// ---------------------------------------------------------------------------
// INVESTIDORES (aba "Investidores" — aportes com juros compostos mensais)
// ---------------------------------------------------------------------------
export const investidores = pgTable("investidores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  ehDivida: boolean("eh_divida").notNull().default(false), // true para "Ageu Debitos" / "Ageu Polimeros" (passivos, não aportes de terceiros)
  ordem: integer("ordem").notNull().default(0),
});

export const investidorAportes = pgTable("investidor_aportes", {
  id: serial("id").primaryKey(),
  investidorId: integer("investidor_id").notNull().references(() => investidores.id, { onDelete: "cascade" }),
  dataAporte: date("data_aporte").notNull(),
  valorInicial: numeric("valor_inicial", { precision: 16, scale: 4 }).notNull().default("0"),
  taxaMensal: numeric("taxa_mensal", { precision: 9, scale: 6 }).notNull().default("0"), // 0.01 = 1% a.m.
});

export const investidorSaldosMensais = pgTable("investidor_saldos_mensais", {
  id: serial("id").primaryKey(),
  aporteId: integer("aporte_id").notNull().references(() => investidorAportes.id, { onDelete: "cascade" }),
  mesRef: date("mes_ref").notNull(),
  saldo: numeric("saldo", { precision: 16, scale: 4 }).notNull().default("0"),
  jurosMes: numeric("juros_mes", { precision: 16, scale: 4 }),
  ordem: integer("ordem").notNull().default(0),
});

export const investidorMovimentos = pgTable("investidor_movimentos", {
  id: serial("id").primaryKey(),
  aporteId: integer("aporte_id").notNull().references(() => investidorAportes.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // saque | prorrogacao
  data: date("data"),
  valor: numeric("valor", { precision: 16, scale: 4 }).notNull().default("0"),
});

// ---------------------------------------------------------------------------
// ANOTAÇÕES FINANCEIRAS — captura literal de blocos manuais/heterogêneos da
// planilha original (resumos por empreiteiro, saldos, observações soltas) que
// não são normalizáveis em colunas fixas sem perder o significado original.
// Garante 100% de fidelidade aos valores anotados na planilha.
// ---------------------------------------------------------------------------
export const anotacoesFinanceiras = pgTable("anotacoes_financeiras", {
  id: serial("id").primaryKey(),
  modulo: text("modulo").notNull(), // "obras" | "taxas_obra"
  ano: integer("ano"),
  grupo: text("grupo"), // ex: "Ageu - Alessandra", "Wagner - MA"
  rotulo: text("rotulo").notNull(), // ex: "Falta pagar terreno", "Total"
  valor: numeric("valor", { precision: 16, scale: 4 }),
  valorSecundario: numeric("valor_secundario", { precision: 16, scale: 4 }),
  observacao: text("observacao"),
  ordem: integer("ordem").notNull().default(0),
});

// ---------------------------------------------------------------------------
// CONFIGURAÇÕES simples (ex.: "Atualizado em" do cabeçalho de cada aba)
// ---------------------------------------------------------------------------
export const configuracoes = pgTable("configuracoes", {
  chave: text("chave").primaryKey(),
  valor: text("valor").notNull(),
});
