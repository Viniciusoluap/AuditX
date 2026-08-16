# AuditX / Prospecta CRM — Arquitetura do Sistema (Estado Atual)

> **Documento de levantamento brownfield — Fase 1 do workflow `brownfield-discovery`.**
> Este documento descreve o sistema **como ele é hoje**, não como deveria ser.
> Inclui débitos técnicos, gambiarras e restrições reais encontradas no código.
> **Nenhuma linha de código foi alterada na produção deste documento.**

| Campo | Valor |
|---|---|
| Sistema | Prospecta CRM — Painel de Gestão de Obras (repo: `AuditX`) |
| Dono do produto | Prospecta Construções |
| Criticidade | **ALTA** — é o sistema de controle financeiro real da empresa |
| Analista | Aria (@architect) |
| Data | 2026-08-16 |
| Commit base | `ebf7d64` (merge PR #12) |
| Escopo | Documentação abrangente de todo o sistema (não há PRD prévio) |

### Change Log

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 2026-08-16 | 1.0 | Levantamento brownfield inicial (Fase 1) | Aria (@architect) |

---

## 1. Sumário Executivo

O sistema é um **CRUD web de porte pequeno** (34 arquivos em `src/`, ~3.500 linhas) que substitui a planilha `CRM_PROSPECTA.xlsx`. É construído em Next.js 16 (App Router) com Server Actions, Drizzle ORM e PostgreSQL/Supabase, e cobre 5 domínios de negócio: obras, taxas de obra, comissões de corretores, compra de lotes e investidores.

A arquitetura é **simples, coesa e legível** — não há over-engineering, não há acoplamento cruzado grave entre módulos, e a modelagem de dados é fiel à planilha original (com uso correto de `numeric`, não `float`, no banco). Esse é o ponto forte.

O ponto fraco é grave e concentrado em três eixos:

1. **Não existe nenhuma regra de cálculo financeiro no sistema.** Lucro, comissões e juros de investidores são campos digitados manualmente. O sistema é um *visualizador da planilha*, não um *motor de cálculo*. Nada é verificado, recalculado ou conciliado.
2. **A camada de entrada de valores monetários tem defeitos que corrompem dados silenciosamente** — incluindo um caso de inflação de 100x confirmado por teste.
3. **Nenhuma Server Action verifica autenticação.** Todo o controle de acesso está na renderização de página, não nas operações de escrita.

Detalhamento nas seções 8 e 11.

---

## 2. Referência Rápida — Arquivos-Chave

| Papel | Arquivo |
|---|---|
| Entrada / layout raiz | `src/app/layout.tsx` |
| Layout autenticado + navegação | `src/app/(app)/layout.tsx` |
| **Gate de autenticação (parcial)** | `middleware.ts` |
| Cliente Supabase (server) | `src/lib/supabase/server.ts`, `src/lib/supabase/config.ts` |
| **Modelo de dados (12 tabelas)** | `src/db/schema.ts` |
| Conexão com o banco | `src/db/index.ts` |
| Leitura de dados (queries) | `src/lib/queries.ts` |
| **Carga inicial destrutiva** | `src/db/seed.ts` + `src/db/seed-data.json` |
| **Parsing de valores monetários** | `src/components/money-input.tsx` |
| Formatação (BRL, %, data) | `src/lib/format.ts` |
| Componentes compartilhados | `src/components/ui.tsx` |
| Escrita — obras | `src/app/(app)/obras/actions.ts` |
| Escrita — taxas | `src/app/(app)/taxas/actions.ts` |
| Escrita — corretores | `src/app/(app)/corretores/actions.ts` |
| Escrita — lotes | `src/app/(app)/lotes/actions.ts` |
| Escrita — investidores | `src/app/(app)/investidores/actions.ts` |
| Migrations | `drizzle/0000_long_northstar.sql`, `drizzle/0001_lumpy_richard_fisk.sql` |
| Workaround Edge Runtime | `src/lib/edge-dirname-polyfill.ts` |

---

## 3. Stack Tecnológico (real, extraído de `package.json`)

### Runtime e framework

| Categoria | Tecnologia | Versão declarada | Observações |
|---|---|---|---|
| Framework | Next.js | `16.3.1` (pin exato) | App Router; Server Actions como única camada de escrita; **sem API routes** |
| UI | React / React DOM | `19.2.8` (pin exato) | Server Components por padrão; apenas 2 componentes `"use client"` |
| Linguagem | TypeScript | `^5` | `strict: true`; `target: ES2017`; alias `@/*` → `./src/*` |
| Node | — | 20+ (só no README) | **Não há `engines` no `package.json`** |
| Estilo | Tailwind CSS | `^4` | via `@tailwindcss/postcss`; **sem `tailwind.config`** (Tailwind 4 CSS-first) |
| Lint | ESLint | `^9` + `eslint-config-next@16.3.1` | flat config; `core-web-vitals` + `typescript` |

### Dados

| Categoria | Tecnologia | Versão | Observações |
|---|---|---|---|
| Banco | PostgreSQL | 16 (local, via Docker) / Supabase (prod) | |
| ORM | Drizzle ORM | `^0.45.2` | dialeto `postgresql`; schema único em `src/db/schema.ts` |
| Migrations | drizzle-kit | `^0.31.10` | 2 migrations aplicadas; `strict: true`, `verbose: true` |
| Driver | postgres (postgres.js) | `^3.4.9` | `prepare: false` (obrigatório p/ pooler transacional do Supabase) |
| Seed | tsx | `^4.23.12` | `npm run db:seed` executa `src/db/seed.ts` |

### Autenticação

| Categoria | Tecnologia | Versão |
|---|---|---|
| Auth | `@supabase/ssr` | `^0.12.4` |
| SDK | `@supabase/supabase-js` | `^2.112.3` |

### Dependências declaradas e **nunca importadas**

Verificado por busca em todo `src/` — nenhuma ocorrência:

| Pacote | Versão | Situação |
|---|---|---|
| `zod` | `^4.4.3` | **Nunca usado.** Instalado, mas não há validação de schema em lugar nenhum |
| `date-fns` | `^4.4.0` | Nunca usado (`Intl` nativo é usado no lugar) |
| `clsx` | `^2.1.1` | Nunca usado (template strings no lugar) |
| `tailwind-merge` | `^3.6.0` | Nunca usado |
| `class-variance-authority` | `^0.7.1` | Nunca usado |
| `lucide-react` | `^1.31.0` | Nunca usado (não há um único ícone no sistema) |
| `dotenv` | `^17.4.2` | Usado apenas por `seed.ts` e `drizzle.config.ts` (legítimo) |

**6 de 14 dependências de runtime são código morto.** O caso do `zod` é o mais significativo: indica uma intenção de validação que nunca foi implementada.

---

## 4. Estrutura de Pastas (real)

```text
AuditX/
├── middleware.ts                    # ⚠ Gate de auth fraco (só checa presença de cookie)
├── drizzle.config.ts
├── next.config.ts                   # VAZIO — nenhuma configuração customizada
├── docker-compose.yml               # Postgres 16 local, credenciais postgres/postgres
├── .env.example                     # 3 vars do app + ~20 vars do AIOX misturadas
├── drizzle/
│   ├── 0000_long_northstar.sql      # DDL inicial (numeric(14,2))
│   ├── 0001_lumpy_richard_fisk.sql  # Alarga p/ numeric(16,4) — ganho de precisão
│   └── meta/
├── public/                          # apenas SVGs default do create-next-app (não usados)
└── src/
    ├── app/
    │   ├── layout.tsx               # <html lang="pt-BR">, metadata
    │   ├── globals.css
    │   ├── login/
    │   │   ├── page.tsx             # form e-mail/senha
    │   │   └── actions.ts           # signInWithPassword
    │   └── (app)/                   # ── área "autenticada" ──
    │       ├── layout.tsx           # ✓ ÚNICO lugar com validação real de sessão
    │       ├── page.tsx             # Painel geral (KPIs)
    │       ├── actions.ts           # logout
    │       ├── obras/
    │       │   ├── page.tsx          novo/page.tsx   [id]/page.tsx
    │       │   ├── ObraForm.tsx     # form de 28 campos (server component)
    │       │   ├── DeleteButton.tsx # "use client" — único delete com confirm()
    │       │   └── actions.ts       # create/update/delete
    │       ├── taxas/       page.tsx + actions.ts
    │       ├── corretores/  page.tsx + actions.ts
    │       ├── lotes/       page.tsx + actions.ts
    │       └── investidores/page.tsx + actions.ts
    ├── components/
    │   ├── ui.tsx                   # PageHeader, Card, StatCard, Pill, Tabs, Th, Td
    │   └── money-input.tsx          # "use client" — ⚠ ponto crítico de integridade
    ├── db/
    │   ├── schema.ts                # 12 tabelas, colunas em português
    │   ├── index.ts                 # singleton do Drizzle
    │   ├── seed.ts                  # ⚠ DESTRUTIVO — apaga tudo e recarrega
    │   └── seed-data.json           # 168 KB — snapshot da planilha original
    └── lib/
        ├── queries.ts               # 8 funções de leitura
        ├── format.ts                # formatBRL, formatPercent, formatDate, num, inputMoney
        ├── status.ts                # mapeia status de obra → cor
        ├── edge-dirname-polyfill.ts # workaround de bug do Next 16 no Edge
        └── supabase/                # config.ts (isomórfico) + server.ts (Node)
```

**Não existem:** `tests/`, `docs/` (até este documento), `.github/workflows/`, `scripts/`, camada de serviços/domínio, camada de repositório.

### Realidade do repositório

- **Tipo:** monorepo simples (uma aplicação única, sem workspaces)
- **Gerenciador:** npm (`package-lock.json` presente)
- **Particularidade:** o diretório do repo chama-se `AuditX`, o `package.json` chama-se `prospecta-crm`, e o README/telas chamam-se "Prospecta CRM". A pasta `.aiox-core/` (framework AIOX) coexiste com o app na raiz e polui `.env.example`.

---

## 5. Modelo de Dados

12 tabelas em `src/db/schema.ts`, com nomes de coluna em **português**, deliberadamente espelhando os cabeçalhos da planilha original.

### Grafo de relacionamentos

```text
obras (1) ──< taxas_obra              (obra_id, ON DELETE CASCADE)
obras (1) ──< corretores_comissoes    (obra_id, ON DELETE SET NULL)

empreendimentos (1) ──< lotes                   (ON DELETE CASCADE)
empreendimentos (1) ──< lote_resumo_financeiro  (ON DELETE CASCADE)

investidores (1) ──< investidor_aportes         (ON DELETE CASCADE)
investidor_aportes (1) ──< investidor_saldos_mensais  (ON DELETE CASCADE)
investidor_aportes (1) ──< investidor_movimentos      (ON DELETE CASCADE)

anotacoes_financeiras   (ilha — sem FK, agrupada por `modulo`/`grupo`)
configuracoes           (ilha — key/value)
```

### Decisões de modelagem relevantes

| Decisão | Avaliação |
|---|---|
| `numeric(16,4)` para todo valor monetário | ✅ **Correto.** Precisão exata no banco. Foi elevado de `numeric(14,2)` na migration `0001` |
| `numeric(9,6)` para percentuais (`pct_pls_cef`, `taxa_mensal`) | ✅ Correto |
| Abas "Obras 2025"/"Obras 2026" unificadas por coluna `ano` | ✅ Boa normalização |
| Tabela `anotacoes_financeiras` para blocos manuais/heterogêneos | ✅ Pragmático e honesto — preserva fidelidade sem forçar normalização enganosa |
| `lucro_cliente` só existe na aba 2026, mas a coluna é global | ⚠️ Aceitável; o form esconde o campo quando `ano !== 2026` |
| `qtd_parcelas` como `numeric(6,2)` | ⚠️ Contagem de parcelas deveria ser `integer` |
| `investidor_movimentos.tipo` como `text` livre | ⚠️ Sem CHECK/enum; deveria ser `saque | prorrogacao` |
| **Zero índices além das PKs** | ⚠️ Consultas filtram por `ano`, `cliente`, `obra_id`, `empreendimento_id` — nenhum indexado |
| **Zero constraints UNIQUE** | ⚠️ Nada impede duplicar cliente/taxa/lote (ver DT-10) |
| **Zero constraints CHECK** | ⚠️ Nada impede lucro/valor absurdo ou negativo onde não faz sentido |
| **Zero colunas de auditoria** exceto `created_at`/`updated_at` em `obras` | ⚠️ Nenhuma outra tabela tem timestamp. Nenhuma tem "quem alterou" |

### Fonte da verdade dos dados

`src/db/seed-data.json` (168 KB, 6.844 linhas) é o **único snapshot versionado** da planilha original. Segundo o README, foi extraído programaticamente com Python/`openpyxl` (lendo valores já calculados pelas fórmulas), e os totais foram conferidos contra as linhas "TOTAIS" da planilha. Isso é uma boa prática de auditabilidade — mas veja DT-06 sobre o risco de recarregá-lo.

---

## 6. Padrões de Código Existentes

### 6.1 Padrão de página (Server Component + Server Action)

Todas as 5 páginas de domínio seguem a mesma forma:

```
async function Page({ searchParams })
  → await searchParams
  → chama queries de src/lib/queries.ts (ou db.select() direto no dashboard)
  → calcula totais com .reduce() em memória
  → renderiza <form action={serverAction.bind(null, id)}>
```

Consistente e previsível. É o ponto mais forte do código.

### 6.2 Padrão de Server Action

```ts
"use server";
export async function updateX(id: number, formData: FormData) {
  await db.update(x).set({ ...campos }).where(eq(x.id, id));
  revalidatePath("/x");
}
```

Características uniformes (e uniformemente problemáticas):
- **Sem verificação de autenticação** (nenhuma das 13 actions de mutação)
- **Sem validação de entrada** (nenhum `zod`, apesar de instalado)
- **Sem `try/catch`** — qualquer erro vira 500 genérico do Next
- **Sem transação** — mesmo quando há N escritas (`updateTaxasCliente`)
- **Falha silenciosa** — `if (!cliente) return;` retorna sem sinalizar nada ao usuário
- `revalidatePath` sempre chamado ao final (correto)

### 6.3 Padrão de "bind" para passar IDs

`action.bind(null, id)` é usado consistentemente em todas as tabelas editáveis. Combinado com `<form id={formId}>` + `form={formId}` nos inputs, permite edição inline em linha de tabela sem JavaScript. É uma solução elegante para o contexto.

### 6.4 Componentes compartilhados

**`src/components/ui.tsx`** — 7 primitivos sem estado (`PageHeader`, `Card`, `StatCard`, `Pill`, `Tabs`, `Th`, `Td`). Server Components puros. Estilos Tailwind inline, sem `cva`/`clsx`. Simples e adequado ao tamanho do sistema.

**`src/components/money-input.tsx`** — o único componente com estado. Renderiza um `<input type="text">` visível formatado em pt-BR + um `<input type="hidden">` com o número puro. É o componente mais crítico do sistema para a integridade dos dados — ver seção 8.

**`src/lib/format.ts`** — 5 funções de apresentação. `formatBRL`/`formatPercent`/`formatDate` usam `Intl` nativo (correto). `num()` e `inputMoney()` fazem conversão para `number` do JS (ver DT-03/DT-05).

### 6.5 Convenções observadas

| Convenção | Aderência |
|---|---|
| Imports absolutos `@/...` | ✅ Consistente, exceto em `middleware.ts` (relativo, por limitação do bundler Edge — documentado no próprio arquivo) |
| Nomes de domínio em português | ✅ Consistente (schema, variáveis, UI) |
| Comentários explicando o "porquê" | ✅ Notavelmente bons em `middleware.ts`, `edge-dirname-polyfill.ts`, `schema.ts`, `taxas/page.tsx` |
| Server Components por padrão | ✅ Apenas 2 arquivos `"use client"` |
| Tipos derivados do schema (`$inferSelect`) | ✅ Usado em `ObraForm.tsx` |
| `as typeof x.$inferInsert` (cast de escape) | ⚠️ Usado em `obras/actions.ts` para contornar o payload dinâmico — anula a type-safety justamente na escrita mais complexa do sistema |

---

## 7. Pontos de Integração

### 7.1 Supabase Auth

- **Como:** `@supabase/ssr` com `createServerClient`, sessão em cookies.
- **Onde:** login (`src/app/login/actions.ts`), verificação (`src/app/(app)/layout.tsx`), logout (`src/app/(app)/actions.ts`).
- **Fluxo real:**
  1. `middleware.ts` (Edge) verifica apenas se **existe** um cookie cujo nome contém `-auth-token`. Não valida assinatura, não valida expiração.
  2. `src/app/(app)/layout.tsx` (Node) chama `supabase.auth.getUser()` e redireciona se não houver usuário. **Esta é a única validação real.**
  3. Server Actions: **nenhuma verificação.**
- **Cadastro:** não existe cadastro público (por design). Usuários são criados manualmente no painel do Supabase.
- **Papéis/permissões:** não existem. Todo usuário autenticado pode fazer tudo.

### 7.2 PostgreSQL via Drizzle

- **Como:** `postgres.js` com `prepare: false`, singleton em `src/db/index.ts`.
- **Credencial:** `DATABASE_URL` — conexão direta com o Postgres (role `postgres` ou equivalente no pooler do Supabase).
- **Consequência arquitetural importante:** como a aplicação conecta com credencial de banco direta, **o Row Level Security do Supabase não se aplica**. Toda a autorização precisaria estar no código da aplicação — e não está.
- **Pooling:** delegado ao Transaction Pooler do Supabase (pgbouncer). Sem configuração de pool no lado da aplicação.

### 7.3 Deploy

- **Alvo documentado:** Vercel (README seção "Colocando em produção").
- **3 variáveis de ambiente:** `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Pipeline:** **não existe.** `.github/` contém apenas definições de agentes AIOX — nenhum workflow de CI/CD.
- **Migrations em produção:** manuais (`npm run db:migrate` apontando `DATABASE_URL` para o Supabase).
- **Local:** `docker-compose.yml` sobe Postgres 16 com credenciais `postgres/postgres` na porta 5432.

### 7.4 Workaround do Edge Runtime

`src/lib/edge-dirname-polyfill.ts` define `globalThis.__dirname = "/"` antes do import de `next/server`, contornando um `ReferenceError: __dirname is not defined` causado pelo `ua-parser-js` embutido no próprio `next/server` (bug do Next.js, ainda presente na 16.3.1). Está bem documentado no código, incluindo as alternativas já tentadas e descartadas. **É frágil e acoplado à versão do Next** — deve ser revalidado a cada upgrade.

---

## 8. Regras de Cálculo Financeiro — Onde Estão (e Onde Não Estão)

> Esta é a seção mais importante deste documento para a auditoria.

### 8.1 Achado central: o sistema não calcula quase nada

Foi feita uma varredura completa nos 34 arquivos de `src/`. **Não existe nenhum módulo, serviço, função ou camada de domínio dedicada a cálculo financeiro.**

Todos os valores financeiros são **campos digitados manualmente** que o sistema apenas armazena e exibe. As únicas operações aritméticas que existem no sistema são:

| Cálculo | Onde | Tipo |
|---|---|---|
| `valorProspecta = valorPagoCef - valorTerceiro` | `src/app/(app)/lotes/actions.ts:23,41` | **Único cálculo derivado persistido** |
| `diasObra = (prazoTermino - prazoInicio) / 86400000` | `src/app/(app)/obras/actions.ts:58-65` | Cálculo de prazo (não financeiro) |
| Somatórios de coluna (`.reduce()`) | Todas as 6 páginas | Apenas apresentação, não persistido |
| `totalPrevisto - totalPago` | `taxas/page.tsx:55`, `corretores/page.tsx:29` | Apenas apresentação |

### 8.2 O que o schema promete e o código não entrega

O `src/db/schema.ts` documenta fórmulas em comentários que **nunca são aplicadas nem verificadas**:

```
entrada: ... // = VGV - Subsídio - Financiado - FGTS      ← nunca calculado nem validado
valorProspecta: ... // = valorPagoCef - valorTerceiro     ← calculado só em lotes/actions.ts
```

Consequência: se o usuário digitar valores incoerentes (ex.: `entrada` que não fecha com `VGV - subsídio - financiado - FGTS`), o sistema aceita silenciosamente. Não há uma única checagem de coerência financeira em todo o código.

### 8.3 Lucro (`lucroEstimado`, `lucroInvestidor`, `lucroCliente`, `lucroProspecta`, `lucroTotal`)

**Não são calculados.** São 5 campos de texto livre no `ObraForm.tsx` (linhas 107-114) que o usuário preenche à mão. O sistema não sabe a relação entre eles, não verifica se `lucroTotal = lucroProspecta + lucroInvestidor + lucroCliente`, e não recalcula nada quando custos ou VGV mudam.

**Risco:** se o usuário alterar `custoObra` ou `vgv` numa obra, os campos de lucro ficam **desatualizados e errados** sem nenhum aviso. O painel geral (`src/app/(app)/page.tsx`) soma esses campos obsoletos e apresenta como "Lucro total (2025+2026)".

### 8.4 Comissões de corretores

**Não são calculadas.** `comissaoTotal` e `parcela1..4` são campos digitados. O sistema não valida que `parcela1+2+3+4 <= comissaoTotal`. A tela mostra "Saldo a pagar = comissaoTotal - somaParcelas", mas nada impede que as parcelas ultrapassem o total (gerando saldo negativo silencioso).

Há ainda **duplicação de fonte de verdade**: `obras.vlrComissaoCorretor` e `obras.corretorJaRecebeu` guardam a comissão do corretor por obra, enquanto a tabela `corretores_comissoes` guarda os mesmos dados por lote/cliente. **Nada mantém as duas em sincronia.** Elas podem divergir e não há nenhuma tela que compare as duas.

### 8.5 Juros de investidores — o caso mais grave

A tela `/investidores` se descreve como *"Aportes com juros mensais compostos, saques e prorrogações"*. Na realidade:

- **Não existe nenhum cálculo de juros compostos no sistema.**
- `investidorAportes.taxaMensal` é armazenada, exibida e **nunca usada em nenhuma conta**.
- `investidorSaldosMensais.jurosMes` é uma coluna **nullable** que só é preenchida pelo seed (vinda da planilha). A action `registrarSaldoMensal` (`investidores/actions.ts:37-54`) insere um novo saldo **sem preencher `jurosMes` e sem calcular nada** — o usuário digita o saldo do mês inteiro à mão.
- Não há validação de que o saldo informado é coerente com `saldoAnterior × (1 + taxaMensal)`.
- Os `movimentos` (saques e prorrogações) **não afetam o saldo**. A tela soma saques e prorrogações no mesmo total (`totalSaques`, `investidores/page.tsx:29`), tratando naturezas opostas como se fossem a mesma coisa.

**Risco:** o passivo com investidores — dinheiro real que a empresa deve a terceiros — depende inteiramente de o operador digitar corretamente um valor calculado fora do sistema. Um erro de digitação não é detectável por nenhum mecanismo.

### 8.6 Onde valores monetários podem ser perdidos ou corrompidos

Todos os casos abaixo foram **confirmados por execução** das funções reais extraídas do código:

| # | Cenário | Entrada | Resultado gravado | Impacto |
|---|---|---|---|---|
| 1 | Usuário digita com ponto decimal (`1500.50`) | `1500.50` | **`150050`** | **Inflação de 100x** |
| 2 | Formato pt-BR correto | `1.500,50` | `1500.5` | ✅ OK |
| 3 | Valor com 4 casas | `1500,5075` | `1500.5075` | ✅ OK na digitação |
| 4 | Reexibição de valor com 4 casas | banco `7200.1234` | exibe `7.200,12` → ao sair do campo grava `7200.12` | **Perde `0.0034` a cada toque** |
| 5 | Duas vírgulas | `1,5,5` | `1.55` | Aceito silenciosamente |
| 6 | Valor não parseado chega cru na action | `"1.500,50"` | `String(Number(...))` = **`"NaN"`** | Erro 500 ou gravação inválida |
| 7 | Subtração em float | `45000.10 - 12000.20` | `32999.899999999994` | Resíduo de ponto flutuante |
| 8 | Submit via tecla Enter | valor digitado sem sair do campo | grava o valor **anterior** (ou `0` em criação) | **Perda silenciosa do valor digitado** |

O caso **#1** é o mais perigoso: digitar `1500.50` é um hábito absolutamente natural (é o formato que aparece no banco, em exportações, em calculadoras e no `type="number"` do próprio sistema para os campos percentuais). O resultado é `R$ 150.050,00` gravado no lugar de `R$ 1.500,50`, **sem nenhum aviso**.

O caso **#8** ocorre porque o `MoneyInput` só sincroniza o `<input hidden>` no evento `onBlur`. Clicar no botão "Salvar" dispara o blur antes do submit (caminho seguro), mas pressionar **Enter** submete o formulário diretamente, sem blur.

### 8.7 Testes cobrindo cálculos financeiros

**Não existe nenhum teste no repositório.** Verificado:
- Nenhum arquivo `*.test.*` ou `*.spec.*`
- Nenhum test runner instalado (sem Vitest, Jest, Playwright)
- Nenhum script `test` no `package.json`
- Nenhum workflow de CI em `.github/`
- Diretório `/coverage` no `.gitignore` (aspiracional, nunca produzido)

Ou seja: **zero cobertura de teste sobre o sistema financeiro real da empresa.**

---

## 9. Configuração e Deploy

### `.env.example`

3 variáveis pertencem à aplicação:
```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Aproximadamente 20 outras variáveis foram acrescentadas pelo instalador do AIOX em 2026-08-16 (`DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`, `VERCEL_TOKEN`, etc.). Isso confunde quem for configurar o ambiente e, pior, **sugere a presença de `SUPABASE_SERVICE_ROLE_KEY`** — uma chave de bypass total de RLS que nunca deveria estar no ambiente de uma aplicação Next.js com componentes client.

### `next.config.ts`

Vazio (`{}`). Nenhum header de segurança configurado: sem CSP, sem `X-Frame-Options`, sem HSTS, sem `Referrer-Policy`.

### `docker-compose.yml`

Postgres 16 com `postgres/postgres` e porta 5432 exposta ao host. Adequado para desenvolvimento local; **jamais deve ser usado como referência de produção**.

### Scripts disponíveis

| Comando | Efeito |
|---|---|
| `npm run dev` / `build` / `start` | Ciclo Next.js padrão |
| `npm run lint` | ESLint |
| `npm run db:generate` | Gera migration a partir do schema |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:push` | Empurra schema direto (perigoso em prod) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | **APAGA TODAS AS TABELAS** e recarrega `seed-data.json` |

Não existe `npm run typecheck` (apesar de a instrução global do projeto pedir sua execução).

---

## 10. Realidade dos Testes

| Camada | Situação |
|---|---|
| Testes unitários | ❌ Inexistentes |
| Testes de integração | ❌ Inexistentes |
| Testes E2E | ❌ Inexistentes |
| Testes de regressão financeira | ❌ Inexistentes |
| CI | ❌ Inexistente |
| Type checking automatizado | ❌ Sem script; só no `next build` |
| QA manual | ✅ Método único (conferência contra a planilha, feita uma vez na migração) |

A verificação de fidelidade descrita no README ("totais conferidos célula a célula contra as linhas TOTAIS da planilha") foi uma **conferência pontual na migração**, não um teste automatizado. Ela não protege contra regressões futuras.

---

## 11. Débitos Técnicos Identificados

Severidade: **CRÍTICO** (risco imediato a dinheiro ou dados) · **ALTO** · **MÉDIO** · **BAIXO**

### 11.1 Integridade de dados financeiros

| ID | Sev. | Débito | Local |
|---|---|---|---|
| **DT-01** | 🔴 CRÍTICO | `parseMoneyInput` remove todos os pontos antes de tratar a vírgula. Digitar `1500.50` grava `150050` — **inflação de 100x sem aviso** | `src/components/money-input.tsx:6` |
| **DT-02** | 🟠 ALTO | O `<input hidden>` só sincroniza no `onBlur`. Submeter com **Enter** grava o valor anterior (ou `0` em formulários de criação) | `src/components/money-input.tsx:39-58` |
| **DT-03** | 🟠 ALTO | Exibição e `inputMoney` truncam para 2 casas, mas o banco é `numeric(16,4)`. Todo valor com 3-4 decimais **perde precisão ao ser editado**, mesmo sem alteração intencional | `money-input.tsx:14`, `src/lib/format.ts:23-26` |
| **DT-04** | 🟠 ALTO | `String(Number(raw))` produz literalmente `"NaN"` quando a entrada não é numérica pura, e é enviado ao Postgres | `obras/actions.ts:51`, `taxas/actions.ts:54`, `corretores/actions.ts:9`, `lotes/actions.ts:9` |
| **DT-05** | 🟡 MÉDIO | Toda aritmética monetária usa `number` do JS (IEEE-754). `valorProspecta` é persistido a partir de subtração em float; todos os totais das telas são somas em float | `lotes/actions.ts:23,41` e todos os `.reduce()` das páginas |
| **DT-06** | 🔴 CRÍTICO | `npm run db:seed` executa `DELETE` em **todas as 12 tabelas** sem nenhuma guarda de ambiente, confirmação ou flag. Rodá-lo contra produção **apaga tudo que foi digitado desde a migração** | `src/db/seed.ts:47-59` |
| **DT-07** | 🟠 ALTO | Nenhuma regra de negócio financeira implementada. Lucro, comissões e composições são campos digitados; nenhuma coerência é verificada | Sistema inteiro |
| **DT-08** | 🟠 ALTO | Juros compostos de investidores nunca são calculados. `taxaMensal` é armazenada e ignorada; `jurosMes` fica `null` em todo registro novo; saques/prorrogações não afetam o saldo e são somados juntos | `investidores/actions.ts:37-69`, `investidores/page.tsx:29` |
| **DT-09** | 🟡 MÉDIO | `updateTaxasCliente` faz N `UPDATE`s em loop **fora de transação**. Falha no meio deixa o cliente com taxas parcialmente salvas | `taxas/actions.ts:48-58` |
| **DT-10** | 🟡 MÉDIO | `createTaxasCliente` não checa duplicidade. Cadastrar o mesmo cliente duas vezes cria 17 linhas duplicadas que **inflam os totais** de "a receber" | `taxas/actions.ts:28-43` |
| **DT-11** | 🟠 ALTO | Os anos 2025/2026 estão **hardcoded em 5 lugares**. Obras de 2027 em diante ficam invisíveis nas telas e **não entram em nenhum total do painel** | `page.tsx:16`, `obras/page.tsx:13`, `taxas/page.tsx:20`, `obras/novo/page.tsx:11`, `obras/actions.ts:67` |
| **DT-12** | 🟠 ALTO | Exclusão de **lotes** e **comissões** não tem confirmação — um clique apaga o registro. Só `/obras` tem `confirm()`. Não há soft delete nem trilha de auditoria em nenhum módulo | `lotes/page.tsx:92-96`, `corretores/page.tsx:88-92` |
| **DT-13** | 🟡 MÉDIO | Duplicação de fonte de verdade de comissões: `obras.vlrComissaoCorretor`/`corretorJaRecebeu` vs. tabela `corretores_comissoes`. Nada as sincroniza nem as compara | `schema.ts:49-50` vs `schema.ts:97-108` |

### 11.2 Segurança

| ID | Sev. | Débito | Local |
|---|---|---|---|
| **DT-14** | 🔴 CRÍTICO | **Nenhuma das 13 Server Actions de mutação verifica autenticação.** Em Next.js, Server Actions são endpoints HTTP POST. Criar, editar e excluir obras, taxas, comissões, lotes e investidores é possível **sem sessão válida** | Todos os `actions.ts` |
| **DT-15** | 🔴 CRÍTICO | O middleware valida apenas a **presença** de um cookie cujo nome contenha `-auth-token`. Definir um cookie arbitrário chamado `x-auth-token` no navegador passa pelo gate. Sem validação de assinatura nem de expiração | `middleware.ts:31` |
| **DT-16** | 🟠 ALTO | **Fail-open:** se `NEXT_PUBLIC_SUPABASE_URL` estiver ausente ou contiver `xxxxxxxx`, `authConfigured` vira `false` e **o sistema inteiro roda sem login**. Um erro de configuração em produção expõe todos os dados financeiros publicamente | `src/lib/supabase/config.ts:3-5`, `middleware.ts:15-17`, `(app)/layout.tsx:17` |
| **DT-17** | 🟠 ALTO | Acesso ao banco por `DATABASE_URL` com credencial direta — **RLS do Supabase não se aplica**. Não há papéis nem permissões: qualquer usuário autenticado pode alterar e excluir qualquer registro | `src/db/index.ts` |
| **DT-18** | 🟡 MÉDIO | IDOR em `updateTaxasCliente`: os parâmetros `ano` e `cliente` são recebidos e **nunca usados** para verificação. Qualquer `taxaId` enviado no formulário é atualizado, independentemente de a quem pertença | `taxas/actions.ts:45-58` |
| **DT-19** | 🟢 BAIXO | `registrarMovimento` aceita `tipo` como texto arbitrário, sem whitelist nem CHECK no banco | `investidores/actions.ts:57` |
| **DT-20** | 🟢 BAIXO | Mensagem de erro do Supabase é refletida na querystring e renderizada (`/login?erro=...`), permitindo injeção de texto arbitrário na tela de login (phishing/spoofing de conteúdo) | `login/actions.ts:14`, `login/page.tsx:16-18` |
| **DT-21** | 🟡 MÉDIO | `next.config.ts` vazio — sem CSP, HSTS, `X-Frame-Options` ou `Referrer-Policy` | `next.config.ts` |
| **DT-22** | 🟡 MÉDIO | `.env.example` sugere `SUPABASE_SERVICE_ROLE_KEY` no ambiente da aplicação — chave de bypass total de RLS que nunca deveria estar aqui | `.env.example` |

### 11.3 Qualidade, testes e manutenção

| ID | Sev. | Débito | Local |
|---|---|---|---|
| **DT-23** | 🟠 ALTO | **Zero testes.** Nenhum runner, nenhum arquivo de teste, nenhum CI, nenhum script `test`. Sistema financeiro real sem rede de segurança | Repositório |
| **DT-24** | 🟡 MÉDIO | `zod` instalado e **nunca usado**. Nenhuma validação de entrada em nenhuma action | `package.json:30` |
| **DT-25** | 🟡 MÉDIO | **Nenhum tratamento de erro.** Nenhuma action tem `try/catch`. Falhas viram 500 genérico; validações falham em silêncio com `return` vazio, sem feedback ao usuário | Todos os `actions.ts` |
| **DT-26** | 🟡 MÉDIO | Lógica de parse duplicada: `toNum` idêntico em `corretores/actions.ts:8` e `lotes/actions.ts:8`; conversão equivalente inline em `obras/actions.ts:51` e `taxas/actions.ts:54`. Corrigir DT-04 exige tocar em 4 arquivos | 4 arquivos |
| **DT-27** | 🟢 BAIXO | 6 dependências de runtime declaradas e nunca importadas: `zod`, `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react` | `package.json` |
| **DT-28** | 🟢 BAIXO | N+1 queries: `getEmpreendimentosComLotes` (2 queries por empreendimento) e `getInvestidoresCompletos` (2 queries por aporte, em loop aninhado) | `src/lib/queries.ts:49-85` |
| **DT-29** | 🟢 BAIXO | O painel faz `SELECT *` de 5 tabelas inteiras e agrega em memória. Aceitável no volume atual; não escala | `src/app/(app)/page.tsx:8-14` |
| **DT-30** | 🟢 BAIXO | Zero índices além das PKs, apesar de filtros recorrentes por `ano`, `cliente`, `obra_id`, `empreendimento_id` | `drizzle/0000_*.sql` |
| **DT-31** | 🟢 BAIXO | `getAnotacoes` tem um ternário morto (ambos os ramos idênticos) e faz o filtro por ano em JS em vez de SQL | `src/lib/queries.ts:30-36` |
| **DT-32** | 🟢 BAIXO | `Number(id)` sem validação em rota dinâmica — `/obras/abc` produz `NaN` na query | `obras/[id]/page.tsx:10` |
| **DT-33** | 🟡 MÉDIO | Workaround de `__dirname` no Edge Runtime: bem documentado, mas frágil e acoplado à versão do Next. Deve ser revalidado a cada upgrade | `src/lib/edge-dirname-polyfill.ts` |
| **DT-34** | 🟢 BAIXO | Campos percentuais (`pctPlsCef`, `taxa`, `taxaMensal`) e `qtdParcelas` usam `<input type="number">` cru, inconsistente com o `MoneyInput` do resto do formulário e sensível ao locale do navegador | `ObraForm.tsx:21`, `investidores/page.tsx:133` |
| **DT-35** | 🟢 BAIXO | Formulário de criação de comissão só tem `parcela1` e `parcela2`; `parcela3`/`parcela4` são gravadas como `0` sem opção de preenchimento | `corretores/page.tsx:116-135` |
| **DT-36** | 🟡 MÉDIO | Sem estratégia de backup/restore documentada. `seed-data.json` é o único snapshot e representa o **estado da migração**, não o estado atual | Repositório |
| **DT-37** | 🟢 BAIXO | Identidade inconsistente: diretório `AuditX`, pacote `prospecta-crm`, README/telas "Prospecta CRM". `.aiox-core/` coexiste com o app e polui `.env.example` | Raiz |
| **DT-38** | 🟢 BAIXO | Sem CI/CD. `.github/` só tem definições de agentes AIOX. Deploy e migrations são manuais | `.github/` |

### 11.4 Resumo por severidade

| Severidade | Quantidade |
|---|---|
| 🔴 CRÍTICO | 4 (DT-01, DT-06, DT-14, DT-15) |
| 🟠 ALTO | 9 |
| 🟡 MÉDIO | 13 |
| 🟢 BAIXO | 12 |
| **Total** | **38** |

---

## 12. Gotchas — Conhecimento Não Documentado

Coisas que qualquer pessoa (ou agente) mexendo neste código precisa saber:

1. **`npm run db:seed` é uma bomba.** Apaga todas as tabelas. Nunca rodar com `DATABASE_URL` apontando para o Supabase de produção.
2. **`middleware.ts` usa import relativo de propósito.** O alias `@/` não resolve no bundler de Edge Functions da Vercel a partir da raiz. Não "corrija" para `@/`.
3. **`edge-dirname-polyfill` precisa ser o primeiro import de `middleware.ts`.** Reordenar imports quebra o deploy em produção com `ReferenceError: __dirname is not defined`.
4. **Digite valores monetários no formato pt-BR (`1.500,50`).** Usar ponto como separador decimal grava um valor 100x maior (DT-01).
5. **Clique em "Salvar"; não pressione Enter.** Enter submete sem sincronizar o campo de valor (DT-02).
6. **`prepare: false` no `postgres.js` é obrigatório**, não opcional — o Transaction Pooler do Supabase quebra com prepared statements.
7. **Migration `0001` alargou `numeric(14,2)` → `numeric(16,4)`.** Qualquer dado carregado antes dela já foi truncado para 2 casas de forma irreversível.
8. **Sem `NEXT_PUBLIC_SUPABASE_URL` o sistema abre sem login.** Isso é intencional para avaliação local (README) e é exatamente o risco de DT-16.
9. **A coluna `lucro_cliente` só faz sentido em obras de 2026.** O formulário a esconde quando `ano !== 2026`, mas a coluna existe e é somada em 2025 também.
10. **Anos são hardcoded.** Quando chegar 2027, dados novos não aparecerão em lugar nenhum sem alteração de código (DT-11).

---

## 13. Recomendações Priorizadas

> Recomendações apenas. **Nada foi implementado.** Cada item requer story própria, com testes, antes de tocar o sistema de produção.

### Onda 0 — Contenção imediata (antes de qualquer mudança de layout ou função)

| # | Ação | Débito | Justificativa |
|---|---|---|---|
| 0.1 | **Backup completo do banco de produção**, verificado por restore | DT-36 | Pré-requisito de qualquer trabalho. Não há rede de segurança hoje |
| 0.2 | Adicionar guarda de ambiente em `db:seed` (exigir `AIOX_SEED_CONFIRM` + bloquear host não-local) | DT-06 | Um comando acidental hoje destrói o controle financeiro da empresa |
| 0.3 | Conferir os dados atuais contra a planilha para detectar **valores já corrompidos** por DT-01 (procurar valores 100x maiores que o esperado) | DT-01 | O bug já está em produção; pode já ter corrompido registros |
| 0.4 | Adicionar verificação de sessão em **todas** as Server Actions de mutação | DT-14, DT-15 | Escrita financeira acessível sem autenticação |
| 0.5 | Trocar o fail-open por fail-closed: sem Supabase configurado, **bloquear**, não liberar | DT-16 | Um erro de env em prod expõe tudo |

### Onda 1 — Integridade da entrada de valores

| # | Ação | Débito |
|---|---|---|
| 1.1 | Reescrever `parseMoneyInput` com regras explícitas de separador (pt-BR e ponto-decimal), com testes cobrindo os 8 cenários da seção 8.6 | DT-01, DT-05 |
| 1.2 | Sincronizar o `<input hidden>` no `onChange`, não apenas no `onBlur` | DT-02 |
| 1.3 | Preservar 4 casas decimais na exibição/reparse, ou reduzir o schema para `numeric(16,2)` — mas **decidir conscientemente** | DT-03 |
| 1.4 | Centralizar parse/validação numa única função com `zod` (já instalado), usada pelas 4 actions | DT-04, DT-24, DT-26 |
| 1.5 | Rejeitar `NaN` explicitamente e devolver erro ao usuário em vez de gravar/quebrar | DT-04, DT-25 |

### Onda 2 — Rede de segurança

| # | Ação | Débito |
|---|---|---|
| 2.1 | Instalar Vitest e escrever testes para `format.ts`, `money-input.tsx` (parse) e cada Server Action | DT-23 |
| 2.2 | Teste de regressão que carrega `seed-data.json` e confere os totais conhecidos da planilha | DT-23 |
| 2.3 | CI no GitHub Actions: `lint` + `typecheck` + `test` em cada PR | DT-23, DT-38 |
| 2.4 | Adicionar script `typecheck` ao `package.json` | DT-38 |

### Onda 3 — Regras de negócio

| # | Ação | Débito |
|---|---|---|
| 3.1 | Decidir e documentar: o sistema **calcula** ou apenas **registra**? Essa é uma decisão do dono do produto, não técnica | DT-07 |
| 3.2 | Se calcular: extrair camada de domínio para lucro, comissões e juros compostos, com testes por fórmula | DT-07, DT-08 |
| 3.3 | Se apenas registrar: adicionar **validações de coerência** que alertam (sem bloquear) quando os números não fecham | DT-07 |
| 3.4 | Separar saques de prorrogações no cálculo do saldo de investidores | DT-08 |
| 3.5 | Resolver a duplicação de comissões (`obras` vs. `corretores_comissoes`): eleger uma fonte de verdade | DT-13 |

### Onda 4 — Robustez operacional

| # | Ação | Débito |
|---|---|---|
| 4.1 | Envolver `updateTaxasCliente` em transação | DT-09 |
| 4.2 | Adicionar UNIQUE em `(ano, cliente, tipo)` de `taxas_obra` | DT-10 |
| 4.3 | Derivar a lista de anos do banco (`SELECT DISTINCT ano`) em vez de hardcode | DT-11 |
| 4.4 | Confirmação em todas as exclusões + soft delete + trilha de auditoria (quem, quando, valor anterior) | DT-12 |
| 4.5 | Papéis (admin vs. leitura) — já previsto nos "próximos passos" do README | DT-17 |
| 4.6 | Verificar propriedade do registro em `updateTaxasCliente` | DT-18 |
| 4.7 | Headers de segurança em `next.config.ts`; limpar `.env.example` | DT-21, DT-22 |

### Onda 5 — Higiene

Índices (DT-30), remover dependências mortas (DT-27), corrigir N+1 (DT-28), ternário morto (DT-31), validação de rota (DT-32), padronizar campos percentuais (DT-34), completar form de comissões (DT-35), unificar identidade do produto (DT-37).

---

## 14. Restrições a Respeitar em Qualquer Mudança

1. **Compatibilidade retroativa dos dados é inegociável.** Os dados em produção são o controle financeiro real da empresa. Nenhuma migration pode ser destrutiva sem backup verificado.
2. **A fidelidade à planilha é um requisito documentado do produto** (README, seção "Fidelidade dos dados"). Qualquer arredondamento ou normalização precisa ser decidido explicitamente com o dono do produto.
3. **Os nomes de coluna em português são deliberados** — servem para que quem conhecia a planilha reconheça o sistema. Não "modernizar" para inglês.
4. **A tabela `anotacoes_financeiras` guarda registros pontuais do dono do negócio**, não valores recalculáveis. Não tentar normalizá-la em colunas rígidas.
5. **Não alterar a ordem de imports do `middleware.ts`** (ver Gotcha #3).
6. **O sistema é operado por poucas pessoas.** Soluções devem privilegiar simplicidade e legibilidade sobre sofisticação arquitetural — o padrão atual (Server Components + Server Actions, sem camadas extras) está adequado ao porte e deve ser preservado.

---

## 15. Apêndice — Comandos Úteis

```bash
# Desenvolvimento
npm install
cp .env.example .env.local
docker compose up -d          # Postgres 16 local
npm run db:migrate            # cria/atualiza tabelas
npm run db:seed               # ⚠ DESTRUTIVO — apaga tudo e recarrega a planilha
npm run dev                   # http://localhost:3000

# Qualidade
npm run lint
npx tsc --noEmit              # não há script `typecheck`

# Banco
npm run db:studio             # explorador visual
npm run db:generate           # gera migration a partir de src/db/schema.ts
```

---

## 16. Próximos Passos do Workflow Brownfield

| Fase | Agente | Entregável |
|---|---|---|
| ✅ 1 | @architect | `docs/architecture/system-architecture.md` (este documento) |
| 2 | @data-engineer | `SCHEMA.md` + `DB-AUDIT.md` — auditoria de integridade dos dados reais em produção, incluindo busca por valores corrompidos por DT-01 |
| 3 | @ux-design-expert | `frontend-spec.md` — levantamento das telas antes de qualquer mudança de layout |
| 4 | @architect | `technical-debt-DRAFT.md` |
| 5-7 | @data-engineer, @ux-design-expert, @qa | Revisões especializadas + QA Gate |
| 8-10 | @architect, @analyst, @pm | Assessment final, relatório executivo, epic + stories |
