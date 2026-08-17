# SCHEMA.md — Prospecta CRM (AuditX)

> Documentação do schema real, extraída de `src/db/schema.ts` + `drizzle/0000_long_northstar.sql` + `drizzle/0001_lumpy_richard_fisk.sql`.
> Gerado por @data-engineer (Dara) — Fase 2 do workflow brownfield-discovery.
> **Data:** 2026-08-16 · **Status:** somente leitura (nenhum dado ou migration foi alterado nesta auditoria).

---

## 1. Visão geral

| Item | Valor |
|---|---|
| Engine | PostgreSQL (local via docker-compose; produção prevista em Supabase pooler `:6543`) |
| ORM / migrations | Drizzle ORM `0.45.2` + drizzle-kit `0.31.10` |
| Driver | `postgres.js` com `prepare: false` (compatível com pgbouncer/transaction pooler) |
| Schema SQL | `public` (único) |
| Tabelas | 12 |
| Migrations versionadas | 2 (`0000`, `0001`) |
| Índices explícitos | **0** (apenas os implícitos de PRIMARY KEY) |
| Constraints CHECK / UNIQUE | **0** |
| Foreign keys | 7 |
| RLS | **não habilitada em nenhuma tabela** |
| Origem dos dados | `src/db/seed-data.json` (168 KB), extraído da planilha `CRM_PROSPECTA.xlsx` |

### Mapa aba da planilha → tabela

| Aba original | Tabela(s) | Linhas no seed |
|---|---|---|
| Obras 2025 + Obras 2026 | `obras` (discriminadas por `ano`) | 38 (13 de 2025, 25 de 2026) |
| Obras (blocos manuais linhas 19–33) | `anotacoes_financeiras` (`modulo='obras'`) | 28 |
| Taxas de Obras | `taxas_obra` | 508 |
| Taxas de Obras (totais manuais) | `anotacoes_financeiras` (`modulo='taxas_obra'`) | 6 |
| Corretores | `corretores_comissoes` | 15 |
| Compra de Lotes | `empreendimentos` + `lotes` + `lote_resumo_financeiro` | 3 + 22 + 8 |
| Investidores | `investidores` + `investidor_aportes` + `investidor_saldos_mensais` + `investidor_movimentos` | 4 + 4 + 12 + 2 |
| Cabeçalhos "Atualizado em" | `configuracoes` | 2 |

---

## 2. Tipagem monetária — confirmação

**Confirmado: nenhum valor monetário usa `float`/`real`/`double precision`.** Todos usam `numeric` (DECIMAL exato).

| Faixa de uso | Tipo atual (após `0001`) | Tipo original (`0000`) |
|---|---|---|
| Valores em R$ | `numeric(16,4)` | `numeric(14,2)` |
| Percentuais (`pct_pls_cef`, `pct_real_recebida`, `taxa`, `taxa_mensal`) | `numeric(9,6)` | `numeric(9,6)` (inalterado) |
| Quantidade de parcelas | `numeric(6,2)` | `numeric(6,2)` (inalterado) |
| Contadores/ordem/ano/dias | `integer` | idem |
| Datas de negócio | `date` | idem |
| Auditoria | `timestamp` (sem timezone) | idem |

A migration `0001` alargou **todas** as colunas monetárias de `numeric(14,2)` → `numeric(16,4)`.
Consequência auditável: um banco semeado enquanto ainda estava em `0000` guarda valores arredondados a 2 casas; o `ALTER TYPE` alarga a coluna mas **não restaura dígitos já descartados**. Ver DB-AUDIT F-04.

Precisão dos dados de origem (`seed-data.json`):

| Métrica | Valor |
|---|---|
| Máximo de casas decimais encontradas | 12 |
| Valores com > 2 casas | 119 (69 deles monetários) |
| Valores com > 4 casas | 56 (majoritariamente percentuais) |
| Delta absoluto total por arredondamento em `scale 4` | R$ 0,00122 |
| Delta absoluto total por arredondamento em `scale 2` | R$ 0,3195 |

---

## 3. Tabelas

### 3.1 `obras` — núcleo financeiro

PK `id serial`. Une "Obras 2025" e "Obras 2026" pela coluna `ano`.

| Grupo | Colunas |
|---|---|
| Identificação | `ano int NOT NULL`, `cliente text NOT NULL`, `status text NOT NULL DEFAULT ''`, `empreiteiro text DEFAULT ''`, `cidade_uf text DEFAULT ''` |
| Financiamento/venda | `vgv`, `vlr_financiado`, `fgts`, `subsidio`, `entrada`, `vlr_pago_entrada`, `vlr_receber_entrada` |
| Repasse CEF | `pct_pls_cef numeric(9,6)`, `pct_real_recebida numeric(9,6)`, `vlr_recebido_cef`, `vlr_gasto_obra`, `vlr_receber_cef` |
| Custos | `custo_lote`, `vlr_comissao_corretor`, `corretor_ja_recebeu`, `custo_obra`, `vlr_disponivel`, `vlr_terminar_obra` |
| Prazos | `prazo_inicio date NULL`, `dias_obra int NOT NULL DEFAULT 0`, `prazo_termino date NULL` |
| Lucro | `lucro_estimado`, `lucro_investidor`, `lucro_cliente`, `lucro_prospecta` |
| Pró-soluto | `pro_soluto`, `taxa numeric(9,6)`, `qtd_parcelas numeric(6,2)`, `vlr_parcela`, `valor_final`, `lucro_total` |
| Auditoria | `observacoes text DEFAULT ''`, `created_at timestamp NOT NULL DEFAULT now()`, `updated_at timestamp NOT NULL DEFAULT now()` |

Todas as colunas monetárias são `numeric(16,4) NOT NULL DEFAULT '0'`.

**Invariantes verificadas contra `seed-data.json`** (evidência empírica, não constraints no banco):

| Invariante | Resultado |
|---|---|
| `entrada = vgv − subsidio − vlr_financiado − fgts` (comentário do schema) | ✅ 38/38 |
| `vlr_receber_entrada = entrada − vlr_pago_entrada` | 37/38 (exceção: Cassio Lenon, pagamento a maior de R$ 171,19 → coerente) |
| `lucro_estimado = lucro_prospecta + lucro_investidor + lucro_cliente` | 37/38 (exceção: 2026 / Emilly Victoria Brito Sousa, Δ R$ 26.178,74 — ver DB-AUDIT F-09) |
| `lucro_total = lucro_estimado` | 4/38 — **não é uma regra**; `lucro_total` inclui o resultado do pró-soluto |
| `vlr_disponivel = vlr_recebido_cef − vlr_gasto_obra` | 0/38 — **não é uma regra** |
| `custo_obra = custo_lote + vlr_gasto_obra + comissão` | 2/38 — **não é uma regra** |

Ou seja: `custo_obra`, `vlr_disponivel`, `vlr_terminar_obra`, `lucro_estimado` e `lucro_total` são **valores importados da planilha, não derivados no sistema**. Nenhuma fórmula da planilha foi reimplementada no banco (sem colunas geradas, sem triggers).

Totais atuais do seed (base para a futura conferência contra o Excel):

| Métrica | 2025 | 2026 |
|---|---|---|
| Σ VGV | 2.382.298,99 | 7.922.985,00 |
| Σ lucro_total | 181.183,76 | 1.572.193,38 |

### 3.2 `taxas_obra`

| Coluna | Tipo |
|---|---|
| `id` | serial PK |
| `obra_id` | integer **NULL** → `obras(id)` ON DELETE **CASCADE** |
| `ano` | integer NOT NULL |
| `cliente` | text NOT NULL |
| `tipo` | text NOT NULL (17 valores fixos, sem enum/CHECK) |
| `categoria` | text NOT NULL DEFAULT `'durante_obra'` (`durante_obra` \| `casa_pronta`) |
| `ordem` | integer NOT NULL DEFAULT 0 |
| `valor_previsto`, `valor_pago` | numeric(16,4) NOT NULL DEFAULT '0' |

Sem `created_at`/`updated_at`. 32 combinações distintas de (ano, cliente); a maioria com 16 lançamentos, variando de 14 a 17.
Σ previsto 437.178,31 · Σ pago 155.980,12 (2025: 150.986,94 / 92.966,85 · 2026: 286.191,37 / 63.013,27).

### 3.3 `corretores_comissoes`

| Coluna | Tipo |
|---|---|
| `id` | serial PK |
| `obra_id` | integer **NULL** → `obras(id)` ON DELETE **SET NULL** |
| `cliente_lote` | text NOT NULL — string literal da planilha ("LOTE 01 - LUCIA BRENA") |
| `corretor` | text NOT NULL |
| `comissao_total`, `parcela_1..parcela_4` | numeric(16,4) NOT NULL DEFAULT '0' |
| `ordem` | integer NOT NULL DEFAULT 0 |

Σ `comissao_total` = 85.400,00 · Σ `obras.vlr_comissao_corretor` = 119.500,00 → **divergência de R$ 34.100,00 entre duas representações do mesmo dinheiro** (ver DB-AUDIT F-03).

### 3.4 `empreendimentos` / `lotes` / `lote_resumo_financeiro`

- `empreendimentos(id serial PK, nome text NOT NULL, ordem int)` — 3 registros: Residencial Aurora, Morada do Bosque, Jet Reginaldo.
- `lotes(id, empreendimento_id NOT NULL → empreendimentos ON DELETE CASCADE, lote text, valor_avaliacao, valor_pago_cef, valor_terceiro_label text, valor_terceiro, valor_prospecta, ordem)` — 22 lotes (8/12/2).
  Invariante `valor_prospecta = valor_pago_cef − valor_terceiro`: ✅ **22/22** no seed, e a server action `updateLote` recalcula com a mesma fórmula (em JS, não como coluna gerada).
- `lote_resumo_financeiro(id, empreendimento_id NOT NULL → empreendimentos ON DELETE CASCADE, descricao text, valor numeric(16,4), ordem)` — 8 linhas livres ("Valor a receber (Prospecta)", "Valor pago MARTINS", "Saldo a receber"). `Jet Reginaldo` não tem resumo.

### 3.5 Cadeia de investidores

```
investidores (4)
  └─ investidor_aportes (4)          FK investidor_id NOT NULL, CASCADE
       ├─ investidor_saldos_mensais (12)  FK aporte_id NOT NULL, CASCADE
       └─ investidor_movimentos (2)       FK aporte_id NOT NULL, CASCADE
```

| Tabela | Colunas relevantes |
|---|---|
| `investidores` | `nome text NOT NULL`, `eh_divida boolean NOT NULL DEFAULT false` (true = passivo Prospecta: "Ageu Debitos", "Ageu Polimeros"), `ordem` |
| `investidor_aportes` | `data_aporte date NOT NULL`, `valor_inicial numeric(16,4)`, `taxa_mensal numeric(9,6)` (0.01 = 1 % a.m.) |
| `investidor_saldos_mensais` | `mes_ref date NOT NULL`, `saldo numeric(16,4)`, `juros_mes numeric(16,4) NULL`, `ordem` |
| `investidor_movimentos` | `tipo text NOT NULL` (`saque` \| `prorrogacao`, sem CHECK), `data date NULL`, `valor numeric(16,4)` |

Modelo é **1 aporte por investidor** na prática (o seed cria exatamente um), embora a cardinalidade permita N.
Juros compostos: os saldos são **importados prontos** da planilha; o sistema não recalcula. A cadeia `saldo[n] = saldo[n-1] × (1+taxa)` fecha em todos os pontos exceto o último de "Paulo Freitas" (out/25 e nov/25 com saldo idêntico 80.097,47592 — ver DB-AUDIT F-10).

### 3.6 `anotacoes_financeiras`

Captura literal dos blocos heterogêneos da planilha.
`id serial PK, modulo text NOT NULL ('obras'|'taxas_obra'), ano int NULL, grupo text NULL, rotulo text NOT NULL, valor numeric(16,4) NULL, valor_secundario numeric(16,4) NULL, observacao text NULL, ordem int NOT NULL`.

Grupos presentes: Wagner - MA, Gabriel - MA, Outro, Pará, Ageu - Alessandra, Ageu - Cassio, Maranhão.
As 6 anotações de `taxas_obra` são as próprias **linhas TOTAIS da planilha** (células A24/A26/A28 de 2025 e A55/A57/A59 de 2026) — o melhor material disponível para reconciliação até o Excel chegar.
`valor_secundario` existe no schema mas o seed **sempre grava NULL** (coluna morta hoje).

### 3.7 `configuracoes`

`chave text PRIMARY KEY, valor text NOT NULL`. Apenas 2 chaves: `obras2025AtualizadoEm` (2026-07-29), `obras2026AtualizadoEm` (2026-07-28). As demais abas não tiveram seu "Atualizado em" capturado.

---

## 4. Relacionamentos (ERD textual)

```
obras 1──0..N taxas_obra            (obra_id NULL, ON DELETE CASCADE)   ← 80/508 linhas ficam órfãs
obras 1──0..N corretores_comissoes  (obra_id NULL, ON DELETE SET NULL)  ← 14/15 linhas ficam órfãs
empreendimentos 1──N lotes                    (NOT NULL, CASCADE)
empreendimentos 1──N lote_resumo_financeiro   (NOT NULL, CASCADE)
investidores 1──N investidor_aportes          (NOT NULL, CASCADE)
investidor_aportes 1──N investidor_saldos_mensais (NOT NULL, CASCADE)
investidor_aportes 1──N investidor_movimentos     (NOT NULL, CASCADE)
anotacoes_financeiras   — sem FK (ligação por `modulo`/`ano`/`grupo` textual)
configuracoes           — sem FK
```

**Assimetria relevante:** apagar uma obra apaga em cascata todas as suas taxas (até 17 registros financeiros históricos), mas apenas desvincula as comissões.

---

## 5. Índices

| Índice | Origem |
|---|---|
| PK de cada tabela (11 `serial` + `configuracoes.chave`) | implícito |
| **Nenhum outro** | — |

Colunas FK **sem índice** (PostgreSQL não indexa FK automaticamente): `taxas_obra.obra_id`, `corretores_comissoes.obra_id`, `lotes.empreendimento_id`, `lote_resumo_financeiro.empreendimento_id`, `investidor_aportes.investidor_id`, `investidor_saldos_mensais.aporte_id`, `investidor_movimentos.aporte_id`.

Colunas usadas em filtro pela aplicação e sem índice: `obras.ano`, `taxas_obra.ano`, `anotacoes_financeiras.modulo`.

Impacto hoje: nulo (maior tabela = 508 linhas; seq scan é mais rápido). Torna-se relevante a partir de ~10 mil linhas ou se `ON DELETE CASCADE` passar a varrer tabelas grandes.

---

## 6. Segurança do dado

| Camada | Situação |
|---|---|
| RLS | **Desabilitada em 100 % das tabelas** — nenhuma `ENABLE ROW LEVEL SECURITY` nas migrations |
| Policies | Nenhuma |
| GRANTs explícitos | Nenhum (herdam o default do Supabase para `public`) |
| Acesso da aplicação | `DATABASE_URL` direto via `postgres.js` (papel dono do banco) — **não** via PostgREST/anon key |
| Autenticação | Supabase Auth e-mail/senha, verificada em `src/app/(app)/layout.tsx`; `middleware.ts` só checa presença de cookie |
| Modo sem login | Ativo sempre que `NEXT_PUBLIC_SUPABASE_URL` estiver ausente ou contiver `xxxxxxxx` (fail-open) |

Detalhamento e risco em `DB-AUDIT.md` (F-01, F-02).

---

## 7. Fluxo de carga (`npm run db:seed`)

1. `DELETE` incondicional em 12 tabelas (ordem filho→pai), **sem transação**.
2. `INSERT` em lote a partir de `seed-data.json`.
3. Vínculo `taxas_obra.obra_id` por chave textual `${ano}::${cliente}`.
4. Vínculo `corretores_comissoes.obra_id` por `${2025}::${cliente_lote}` (ano fixo em código).
5. Conversão numérica única: `toStr(n) = (n ?? 0).toString()` — **null vira "0"**.

Não é idempotente no sentido de preservar edições: rodar o seed apaga tudo que foi editado pela aplicação. Ver DB-AUDIT F-05.

---

## 8. Convenções

- Nomes de coluna em **snake_case português**, espelhando os cabeçalhos da planilha (decisão explícita de legibilidade para o dono do negócio).
- Propriedades TypeScript em camelCase; mapeamento explícito em `schema.ts`.
- Valores monetários trafegam como **string** entre Drizzle e Postgres (comportamento de `numeric` no driver) — a agregação, porém, é feita em `Number` no React (ver DB-AUDIT F-06).
- Toda tabela tem `id serial`; **apenas `obras`** tem `created_at`/`updated_at`.
