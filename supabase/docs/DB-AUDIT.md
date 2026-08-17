# DB-AUDIT.md — Auditoria de Banco e Segurança (Prospecta CRM / AuditX)

> **Agente:** @data-engineer (Dara) · **Fase 2** do workflow `brownfield-discovery`
> **Data:** 2026-08-16 · **Escopo:** `src/db/**`, `drizzle/**`, `middleware.ts`, `src/lib/supabase/**`, server actions e camada de leitura
> **Natureza:** somente leitura. **Nenhum dado, schema ou migration foi alterado.**
> **Fora de escopo (task separada):** conferência célula a célula contra `CRM_PROSPECTA.xlsx` — o arquivo ainda não foi fornecido. Esta auditoria avalia **estrutura e integridade interna** do que já está carregado.

---

## Sumário executivo

| Severidade | Qtd | Natureza |
|---|---|---|
| 🔴 CRITICAL | 4 | Exposição/perda dos valores financeiros reais |
| 🟠 HIGH | 7 | Corrupção silenciosa, divergência de valores, precisão |
| 🟡 MEDIUM | 9 | Integridade referencial, ausência de constraints, auditoria |
| 🔵 LOW | 3 | Dívida técnica menor |

**Veredito:** o *modelo de dados* está sólido para a finalidade (tipos `numeric` corretos, FKs presentes, captura fiel de blocos não normalizáveis em `anotacoes_financeiras`). O risco não está no schema — está em **quem pode escrever nele** e em **como os números são convertidos e somados fora do banco**. Há também três divergências numéricas internas que precisam ser resolvidas *antes* da conferência com o Excel, sob pena de a conferência acusar erro sem saber qual lado está certo.

---

## 🔴 CRITICAL

### F-01 — Server Actions sem qualquer verificação de autenticação
**Arquivos:** `src/app/(app)/obras/actions.ts`, `taxas/actions.ts`, `corretores/actions.ts`, `lotes/actions.ts`, `investidores/actions.ts` · **Evidência:** nenhum dos 5 arquivos importa `createClient`/`authConfigured`.

A checagem de sessão existe **apenas** em `src/app/(app)/layout.tsx` (`if (!user) redirect("/login")`). Server Actions do Next.js são endpoints POST próprios — **não passam pela renderização do layout**. O `middleware.ts` também não protege: ele apenas verifica a *presença* de um cookie cujo nome contenha `-auth-token`, sem validar o token:

```ts
const hasSessionCookie = request.cookies.getAll().some((c) => c.name.includes("-auth-token"));
```

Qualquer cookie chamado `x-auth-token=1` satisfaz essa condição. Combinado, isso significa que um POST anônimo para o endpoint da action consegue executar `updateObra`, `deleteObra`, `deleteLote`, `deleteComissao` e `updateTaxasCliente` sobre dados financeiros reais da empresa.

**Impacto:** alteração ou exclusão não autorizada de VGV, lucro, comissões e taxas reais, sem trilha de auditoria (F-17) e sem backup definido (F-22).
**Recomendação:** guard obrigatório no topo de **toda** action (`const { data:{user} } = await supabase.auth.getUser(); if (!user) throw new Error("unauthorized")`), preferencialmente via helper único `requireUser()`; e no middleware, validar a sessão de fato em vez de conferir nome de cookie.

### F-02 — Autenticação *fail-open* por variável de ambiente
**Arquivos:** `src/lib/supabase/config.ts`, `middleware.ts`, `src/app/(app)/layout.tsx`

```ts
export const authConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxxxxxx");
```

Quando `authConfigured` é `false`, o middleware libera tudo e o layout nem chama o Supabase. O comportamento documentado no README ("sem `NEXT_PUBLIC_SUPABASE_URL` configurado, o sistema roda sem exigir login") é **aceitável em desenvolvimento local, inaceitável em produção**: um deploy na Vercel com a variável faltando, com nome errado, escopada ao ambiente errado (Preview vs Production), ou removida por engano, resulta em **todo o painel financeiro publicamente acessível na internet** — sem erro, sem alerta, sem log. Falha silenciosa em direção ao aberto.

**Recomendação:** inverter o default — `if (process.env.NODE_ENV === "production" && !authConfigured) throw` no boot. O modo aberto deve exigir opt-in explícito (`ALLOW_ANONYMOUS=true`) e nunca ser consequência da *ausência* de configuração.

### F-03 — Comissões de corretor: R$ 34.100,00 de divergência entre duas fontes, sem vínculo relacional
**Tabelas:** `obras.vlr_comissao_corretor` vs `corretores_comissoes`

| Fonte | Total |
|---|---|
| Σ `corretores_comissoes.comissao_total` | **R$ 85.400,00** |
| Σ `obras.vlr_comissao_corretor` | **R$ 119.500,00** |
| Divergência | **R$ 34.100,00** |

Pior: o vínculo entre as duas tabelas praticamente não existe. `src/db/seed.ts:152` resolve a FK assim:

```ts
obraId: obraIdByKey.get(obraKey(c.clienteLote as string, 2025)) ?? null,
```

`cliente_lote` guarda `"LOTE 01 - LUCIA BRENA"`, enquanto `obras.cliente` guarda `"Lucia Brena Silva Sousa"` — os textos não coincidem. Além disso o ano está **fixo em 2025**, excluindo por construção qualquer obra de 2026. Resultado medido: **1 de 15 linhas** (apenas "Mariana Torres da Silva") recebe `obra_id`; **14 ficam NULL**.

**Impacto:** não é possível reconciliar comissão por obra em SQL. Os R$ 34.100 podem ser (a) comissões de obras 2026 ausentes da aba Corretores, (b) comissões previstas ainda não lançadas, ou (c) erro real. Sem FK, ninguém consegue provar qual.
**Recomendação:** priorizar como item nº 1 da conferência com o Excel; mapear `cliente_lote` → `obra_id` manualmente uma única vez (são 15 linhas) e persistir o vínculo.

### F-05 — `db:seed` é destrutivo, sem transação e sem trava de ambiente
**Arquivo:** `src/db/seed.ts:47-59`

```ts
await db.delete(investidorMovimentos);
await db.delete(investidorSaldosMensais);
... 12 DELETEs sem WHERE ...
```

Três problemas somados:
1. **Sem transação.** Os 12 `DELETE` e os `INSERT` subsequentes são statements independentes. Uma falha de rede no meio (bastante plausível no pooler do Supabase) deixa o banco **parcialmente vazio**, sem rollback automático.
2. **Sem trava de ambiente.** O script obedece cegamente ao `DATABASE_URL` carregado por `dotenv`. Um `.env` apontando para produção + um `npm run db:seed` distraído = todos os dados de produção substituídos pelo snapshot de julho/2026.
3. **Apaga edições feitas na aplicação.** O README já documenta ("apaga e insere de novo"), mas depois que o time começar a usar as telas, `seed-data.json` deixa de ser a verdade — e o seed reverte tudo silenciosamente.

**Recomendação:** envolver em `db.transaction()`; exigir confirmação explícita (`SEED_CONFIRM=<nome-do-banco>`) e abortar se o host do `DATABASE_URL` não for local; e `pg_dump` obrigatório antes de qualquer execução.

---

## 🟠 HIGH

### F-04 — Alargamento `numeric(14,2)` → `numeric(16,4)` não recupera dígitos já perdidos
**Migrations:** `0000_long_northstar.sql` (scale 2) → `0001_lumpy_richard_fisk.sql` (scale 4)

Se o banco foi semeado enquanto o schema estava em `0000`, o Postgres **arredondou na gravação**. O `ALTER COLUMN ... SET DATA TYPE numeric(16,4)` alarga a coluna, mas os dígitos descartados não voltam. Medição sobre `seed-data.json`:

| | Valores afetados | Delta absoluto total |
|---|---|---|
| Arredondamento a 2 casas | 69 valores monetários | **R$ 0,3195** |
| Arredondamento a 4 casas | 0 valores monetários relevantes | R$ 0,00122 (só percentuais) |

Exemplos: `lucro_prospecta = 318.852,342` → `318.852,34`; `vlr_pago_entrada = 23.177,305` → `23.177,30`; `saldo` de investidor `78.519,23921` → `78.519,24`.

**Impacto:** sub-centavo por linha, mas quebra a afirmação de fidelidade absoluta do README e produz diferenças de centavos em somas grandes.
**Recomendação:** verificar `SELECT vlr_pago_entrada FROM obras WHERE ... ` no banco real; se vier `23177.3000`, o banco está no estado pós-`0000` e precisa de re-seed **após** confirmar que não há edições humanas a preservar.

### F-06 — Todos os totais exibidos são somas em ponto flutuante (float64), não `SUM()` no banco
**Arquivos:** `src/app/(app)/page.tsx:24-41`, `obras/page.tsx:17-28`, `taxas/page.tsx:31-32,100-101`, `lotes/page.tsx:19-22`, `corretores/page.tsx:10-16`, `investidores/page.tsx:29` · **Helper:** `src/lib/format.ts:18`

```ts
export function num(value) { return typeof value === "string" ? Number(value) : value ?? 0; }
// e então: rows.reduce((s, r) => s + num(r.vgv), 0)
```

O banco guarda `numeric` exato, o driver devolve **string** exata — e a aplicação converte para `Number` (IEEE-754) e soma em JS. Toda a razão de ter escolhido `numeric` se perde na última etapa. Com 38 obras o erro é sub-centavo; com centenas de linhas e valores de 6 dígitos, aparecem diferenças de centavos justamente nos totais que serão comparados com a planilha.

**Agravante — `formatBRL` mascara valores inválidos:**
```ts
return new Intl.NumberFormat("pt-BR", {...}).format(n || 0);   // NaN || 0 === 0
```
Qualquer `NaN` na cadeia é exibido como **`R$ 0,00`**, não como erro. Ver F-07.

**Recomendação:** mover as agregações para SQL (`sum(obras.vgv)` do Drizzle, que retorna string `numeric`) e formatar a partir da string, sem passar por `Number`.

### F-07 — `'NaN'` é um valor válido para `numeric` no PostgreSQL e o código consegue gravá-lo
**Arquivos:** `obras/actions.ts:51`, `taxas/actions.ts:54-55`, `corretores/actions.ts:9`, `lotes/actions.ts`

```ts
payload[field] = raw === null || raw === "" ? "0" : String(Number(raw));
```

Se `raw` não for numérico (ex.: `"7.200,00"` em pt-BR enviado direto, ou um POST forjado — que F-01 torna trivial), `Number(raw)` é `NaN` e `String(NaN)` é `"NaN"`. O PostgreSQL **aceita** `'NaN'` em coluna `numeric` — não há erro, não há rejeição. E `SUM()` sobre uma coluna contendo `NaN` retorna `NaN`, contaminando o total inteiro. Combinado com F-06, o resultado é exibido como **`R$ 0,00`**.

Cadeia completa de falha silenciosa: POST não autenticado (F-01) → grava `NaN` → total vira `NaN` → tela mostra R$ 0,00 → ninguém percebe.

**Recomendação:** validar com Zod (já está nas dependências, sem uso) antes de qualquer gravação — `z.number().finite()`; e adicionar `CHECK (coluna = coluna)` nas colunas monetárias, que rejeita `NaN` no nível do banco.

### F-08 — `updateObra` reescreve **todos** os 28 campos numéricos; campo ausente no form vira `0`
**Arquivos:** `src/app/(app)/obras/actions.ts:43-93` + `src/app/(app)/obras/ObraForm.tsx:110-112`

`buildPayload` percorre a lista fixa `NUMERIC_FIELDS` e, para cada campo não presente no `FormData`, grava `"0"`. Já existe um caso concreto no código:

```tsx
{ano === 2026 ? <Field label="Lucro Cliente" name="lucroCliente" .../> : null}
```

Para uma obra de 2025 o campo não é renderizado → qualquer edição zera `lucro_cliente`. Hoje isso é inócuo (todas as 13 obras de 2025 têm `lucro_cliente = 0`), mas é uma **armadilha ativa**: qualquer campo que venha a ser escondido por condicional, permissão ou erro de render passa a zerar dinheiro real ao salvar.

**Segundo vetor de perda, este já ativo:** o `MoneyInput` exibe com `maximumFractionDigits: 2` e, no `onBlur`, **re-parseia o texto exibido** de volta para o valor:
```ts
onBlur={(e) => { const parsed = parseMoneyInput(e.target.value); setRaw(parsed); ... }}
```
Ou seja, apenas dar foco e tirar o foco de um campo com 4 casas converte `318.852,3420` em `318852.34`. `inputMoney()` (`format.ts:23`) reforça isso arredondando para 2 casas.

**Recomendação:** montar o payload apenas com as chaves efetivamente presentes no `FormData`; e no `MoneyInput`, nunca derivar `raw` do texto formatado quando o campo não foi editado.

### F-09 — Inconsistência de lucro em obra 2026 (Δ R$ 26.178,74)
**Registro:** 2026 / "Emilly Victoria Brito Sousa"

A relação `lucro_estimado = lucro_prospecta + lucro_investidor + lucro_cliente` fecha em **37 das 38 obras**. Nessa única linha há divergência de **R$ 26.178,74**. Como a regra vale para todas as outras, é improvável que seja uma exceção de negócio.
**Recomendação:** item nº 2 da lista de conferência com o Excel — verificar se a divergência já existe na planilha (fórmula quebrada na origem) ou se foi introduzida na extração.

### F-11 — 80 de 508 taxas ficam órfãs + chave duplicada corrompe o mapeamento
**Arquivo:** `src/db/seed.ts:107-126`

O vínculo `taxas_obra.obra_id` é resolvido por **string**: `${ano}::${cliente}`.

- **80 linhas (15,7 %)** ficam com `obra_id = NULL` porque o nome do cliente diverge entre abas. Casos medidos:
  `"Luciano Oliveira Leite"` (taxas) vs `"Luciano Oliveira Leite *Aurora"` (obras); `"D'Anne Almeida Rodrigues"`, `"Joao Flavio"`, `"Rubens Tadeu Gomes dos Reis"` e `"Cliente não identificado (coluna AL/AM)"` sem obra correspondente.
- **Chave duplicada:** `2026::Lot. Morada do Bosque` aparece **2 vezes** em `obras`. Como o mapa é um `Map`, a segunda ocorrência sobrescreve a primeira → todas as taxas desse cliente apontam para **uma só** das duas obras, e a outra fica sem taxas. Não há `UNIQUE (ano, cliente)` impedindo isso.

**Impacto:** R$ em taxas que não podem ser atribuídas à obra correta; relatórios por obra subestimam custo.
**Recomendação:** `UNIQUE (ano, cliente)` em `obras` (após decidir o que fazer com a duplicata), normalização dos nomes e reconciliação manual das 5 chaves órfãs.

### F-12 — KPIs da tela `/taxas` não batem com as linhas TOTAIS da própria planilha
**Arquivo:** `src/app/(app)/taxas/page.tsx:12,31-32`

A tela calcula os cartões "Valor total a receber / recebido" sobre um subconjunto **hardcoded na página**:
```ts
const TAXAS_RECEITA_PROSPECTA = ["Projetos", "PCI", "Agua", "Despachante", "Habite-se", "CND e CNO"];
```

Comparando com os totais da planilha preservados em `anotacoes_financeiras` (células A24/A26/A28 e A55/A57/A59):

| Ano | Tela (previsto) | Planilha "Total geral" | Δ |
|---|---|---|---|
| 2025 | R$ 62.680,00 | R$ 102.951,02 | **−40.271,02** |
| 2026 | R$ 168.565,29 | R$ 137.592,42 | **+30.972,87** |

| Ano | Tela (pago) | Planilha "Total recebido" | Δ |
|---|---|---|---|
| 2025 | R$ 31.000,00 | R$ 36.899,29 | −5.899,29 |
| 2026 | R$ 38.465,29 | R$ 30.344,00 | +8.121,29 |

Nenhum dos quatro pares fecha. Ou o subconjunto de 6 tipos é diferente do critério usado pelo dono na planilha, ou os valores por linha divergem. **A afirmação do README de que os totais foram conferidos célula a célula não se sustenta para esta tela.**
**Recomendação:** item nº 3 da conferência com o Excel. Independente do resultado, a classificação "receita própria da Prospecta" é **regra de negócio e pertence ao dado** (coluna em `taxas_obra` ou tabela `tipos_taxa`), não a um array literal dentro de um componente React.

### F-10 — Cadeia de juros compostos estagnada em um investidor
**Registro:** "Paulo Freitas", `taxa_mensal = 0.01`

Os saldos seguem `saldo[n] = saldo[n-1] × 1,01` até 19/10/2025 (R$ 80.097,47592) e então **repetem exatamente o mesmo valor** em 19/11/2025, sem `movimento` de saque ou prorrogação que justifique. Provavelmente a última linha da planilha ainda não atualizada — mas, como o sistema **não recalcula juros** (apenas importa saldos), o valor congelado permanece indefinidamente e subestima o passivo com o investidor a cada mês que passa.
**Recomendação:** confirmar com o dono; considerar coluna gerada/rotina de projeção em vez de saldos estáticos.

---

## 🟡 MEDIUM

### F-13 — `ON DELETE CASCADE` apaga histórico financeiro sem soft delete nem auditoria
`taxas_obra.obra_id → obras ON DELETE CASCADE`. Excluir uma obra elimina em silêncio até 17 lançamentos de taxas (previsto + pago). Não há `deleted_at`, tabela de histórico ou log. A única barreira é um `confirm()` de navegador (`DeleteButton.tsx`) — que não existe para quem chama a action diretamente (F-01). Note ainda a assimetria: `corretores_comissoes` usa `ON DELETE SET NULL` para a mesma relação.
**Recomendação:** soft delete (`deleted_at`) em `obras`, ou `ON DELETE RESTRICT` + arquivamento explícito.

### F-14 — Ausência total de constraints além de PK/FK
Nenhum `UNIQUE`, nenhum `CHECK`, nenhuma FK `NOT NULL` onde o negócio exige.
Faltando: `UNIQUE (ano, cliente)` em `obras` (ver F-11); `UNIQUE (obra_id, tipo)` ou `(ano, cliente, tipo)` em `taxas_obra`; `CHECK (categoria IN ('durante_obra','casa_pronta'))`; `CHECK (tipo IN (...))` nos 17 tipos de taxa; `CHECK (investidor_movimentos.tipo IN ('saque','prorrogacao'))`; `CHECK (valor = valor)` anti-`NaN` (F-07); `CHECK (ano BETWEEN 2020 AND 2100)`.

### F-15 — Nenhum índice além das PKs
7 colunas FK sem índice + `obras.ano`, `taxas_obra.ano`, `anotacoes_financeiras.modulo` usadas como filtro. Irrelevante no volume atual (máx. 508 linhas), relevante para os `CASCADE` e para o crescimento previsto no README.

### F-16 — N+1 de queries na camada de leitura
`src/lib/queries.ts:49-85`. `getEmpreendimentosComLotes` faz 1 + 2×N queries; `getInvestidoresCompletos` faz 1 + N + 2×M — todas dentro de `for` sequenciais com `await`. Hoje: ~15 round-trips. Com o pooler do Supabase (latência de rede real, não localhost) isso já é perceptível.
**Recomendação:** `with: { ... }` do Drizzle relational queries ou `JOIN` único.

### F-17 — Auditoria inexistente
Apenas `obras` tem `created_at`/`updated_at`; as outras 11 tabelas não têm nenhum. Não há trigger de `updated_at` (a atualização é manual em `updateObra`, e **não é feita** em `updateTaxasCliente`, `updateComissao`, `updateLote`). Não há registro de *quem* alterou o quê. Em um sistema que controla entrada de recurso financeiro real, isso impede qualquer investigação posterior.
**Recomendação:** `created_at`/`updated_at` em todas as tabelas + trigger `moddatetime` + tabela `auditoria` (ou extensão `pgaudit`) capturando usuário e valores antigo/novo nas colunas monetárias.

### F-18 — `createTaxasCliente` nunca preenche `obra_id` e permite duplicar cliente
`src/app/(app)/taxas/actions.ts:32-40` insere as 17 linhas de taxa sem qualquer `obraId` — ou seja, **todo cliente criado pela tela nasce órfão**, agravando F-11. Também não há verificação de existência: chamar duas vezes com o mesmo nome gera 34 linhas duplicadas, sem `UNIQUE` para impedir.

### F-19 — `updateTaxasCliente` faz N `UPDATE` sequenciais fora de transação
`taxas/actions.ts:48-57`. Salvar o bloco de taxas de um cliente dispara até 17 `UPDATE` independentes. Falha no meio = metade dos valores novos, metade dos antigos, sem indicação na tela.
**Recomendação:** `db.transaction()`.

### F-20 — Valores derivados gravados como dados estáticos, com a fórmula duplicada em JS
`lotes.valor_prospecta` é persistido e recalculado em `lotes/actions.ts` (`String(valorPagoCef - valorTerceiro)`, em float). A invariante fecha 22/22 hoje, mas qualquer escrita por outro caminho (Drizzle Studio, SQL manual, novo re-seed) pode dessincronizar sem que nada acuse.
**Recomendação:** `GENERATED ALWAYS AS (valor_pago_cef - valor_terceiro) STORED`, que torna a divergência impossível por construção.

### F-21 — `toStr()` converte ausência de valor em zero, apagando a distinção "vazio" vs "R$ 0,00"
`src/db/seed.ts:39-41`: `return (n ?? 0).toString()`. Célula em branco na planilha e célula com zero chegam ao banco idênticas. Como todas as colunas monetárias são `NOT NULL DEFAULT '0'`, a informação "não preenchido" é irrecuperável — o que importa para campos como `vlr_receber_cef` ou `pro_soluto`, onde "ainda não sei" e "é zero" têm significados de negócio diferentes.

---

## 🔵 LOW

### F-22 — Bug lógico sem efeito em `getAnotacoes`
`src/lib/queries.ts:32`: `where: ano ? eq(modulo, ...) : eq(modulo, ...)` — os dois ramos do ternário são idênticos; o filtro por `ano` é feito depois em JS (`rows.filter`). Funciona, mas é código morto que sinaliza intenção não concluída.

### F-23 — Colunas e captura incompletas
`anotacoes_financeiras.valor_secundario` existe no schema e **nunca** é preenchida pelo seed (sempre `null`). `configuracoes` captura o "Atualizado em" de apenas 2 das 6 abas (obras 2025/2026); Taxas, Corretores, Lotes e Investidores ficaram sem.

### F-24 — `timestamp` sem timezone e ausência de rollback scripts
`created_at`/`updated_at` usam `timestamp` (não `timestamptz`); com deploy na Vercel (UTC) e usuários em UTC−3 isso gera ambiguidade em horários. Além disso, as 2 migrations não possuem scripts de rollback correspondentes, e não há rotina de `pg_dump` documentada (crítico dado F-05).

---

## Débitos técnicos consolidados

| Débito | Situação |
|---|---|
| Migrations versionadas | ✅ 2 migrations rastreadas em `drizzle/meta/_journal.json`, consistentes com `schema.ts` |
| Scripts de rollback | ❌ inexistentes |
| Snapshot/backup antes de operações destrutivas | ❌ inexistente (agrava F-05) |
| RLS | ❌ nenhuma tabela; a aplicação acessa via `DATABASE_URL` direto, ignorando o modelo do Supabase |
| Constraints de domínio | ❌ nenhuma (F-14) |
| Índices | ❌ nenhum além de PK (F-15) |
| Dados órfãos | ⚠️ 80/508 taxas + 14/15 comissões (F-03, F-11) |
| Normalização | ⚠️ adequada no geral; `cliente` como texto livre repetido em 3 tabelas é a principal fragilidade — não existe tabela `clientes` |
| Testes | ❌ nenhum teste automatizado no repositório; nenhuma validação de que os totais permanecem corretos após deploy |
| Validação de entrada | ❌ `zod` está nas dependências e não é usado em nenhuma action |

---

## Recomendações priorizadas

| # | Ação | Trata | Esforço |
|---|---|---|---|
| 1 | `requireUser()` no topo de todas as server actions | F-01 | baixo |
| 2 | Falhar o boot em produção quando `authConfigured === false` | F-02 | baixo |
| 3 | Validação Zod (`z.number().finite()`) + `CHECK (col = col)` anti-`NaN` | F-07 | baixo |
| 4 | Trava de ambiente + `transaction()` no `seed.ts`; `pg_dump` antes | F-05 | baixo |
| 5 | Agregações via `SUM()` no SQL; remover `n \|\| 0` de `formatBRL` | F-06 | médio |
| 6 | Payload de `updateObra` apenas com chaves presentes | F-08 | baixo |
| 7 | Conferir no banco real se as colunas estão em `scale 4` (pós-`0001`) | F-04 | baixo |
| 8 | Reconciliar F-03 / F-09 / F-12 contra o Excel quando o arquivo chegar | — | médio |
| 9 | `UNIQUE (ano, cliente)` + normalização de nomes + FK das comissões | F-11, F-03 | médio |
| 10 | `created_at`/`updated_at` em todas as tabelas + trigger + tabela de auditoria | F-17 | médio |
| 11 | Índices nas 7 FKs e em `obras.ano` / `taxas_obra.ano` | F-15 | baixo |
| 12 | Habilitar RLS (mesmo que policy única `authenticated`) como defesa em profundidade | F-01 | médio |

---

## Itens a levar para a conferência com o Excel (task futura)

1. **R$ 34.100,00** de diferença entre `Σ obras.vlr_comissao_corretor` (119.500) e `Σ corretores_comissoes.comissao_total` (85.400) — F-03.
2. **R$ 26.178,74** de inconsistência de lucro em 2026 / Emilly Victoria Brito Sousa — F-09.
3. **R$ 40.271,02 (2025)** e **R$ 30.972,87 (2026)** entre os KPIs de `/taxas` e as linhas TOTAIS da planilha (A24/A26/A28, A55/A57/A59) — F-12.
4. Duplicidade de `2026::Lot. Morada do Bosque` em `obras` — F-11.
5. 5 clientes de taxas sem obra correspondente — F-11.
6. Saldo congelado de "Paulo Freitas" em nov/2025 — F-10.
7. Confirmar se as colunas do banco de produção estão em `numeric(16,4)` ou ainda em `(14,2)` — F-04.
8. Totais de referência calculados a partir do seed: VGV 2025 = 2.382.298,99 · VGV 2026 = 7.922.985,00 · lucro_total 2025 = 181.183,76 · lucro_total 2026 = 1.572.193,38 · taxas previsto = 437.178,31 · taxas pago = 155.980,12.
