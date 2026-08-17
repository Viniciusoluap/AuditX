# AuditX — Front-End Specification (Levantamento Brownfield)

**Sistema:** AuditX — Painel de Auditoria e Gestão de Obras da Prospecta Construções
**Fase:** Brownfield Discovery — Fase 3 (`create-front-end-spec`)
**Agente:** @ux-design-expert (Uma)
**Data:** 2026-08-16
**Commit base:** `ebf7d64`
**Status:** LEVANTAMENTO — nenhum código foi alterado neste documento

---

## 0. Regra Inegociável deste Documento

> **NENHUMA recomendação aqui pode alterar, arredondar, truncar ou reformatar valores financeiros reais.**

O AuditX é o instrumento de controle de entrada de recursos do dono da empresa. A fidelidade
numérica é o requisito de negócio nº 1. Toda sugestão deste documento é de **layout, botão,
navegação, estado e acessibilidade**. Onde uma melhoria visual esbarra em cálculo ou formatação,
ela foi marcada com **`[BLOQUEADO — NÃO IMPLEMENTAR SEM @data-engineer]`** e permanece fora do
escopo de UI.

Três achados de fidelidade numérica foram detectados durante a leitura e estão registrados na
**Seção 9** como observações para @architect / @data-engineer — **não** como tarefas de UX.

---

## 1. Sumário Executivo

O AuditX é um app Next.js 16 / React 19 / Tailwind v4 com **6 telas de negócio + login**, todas
Server Components (excelente base — apenas 2 client components no projeto inteiro). A arquitetura
técnica é sólida. O problema não é técnico: é **ausência de sistema de design**.

| Métrica | Estado atual | Alvo |
|---|---|---|
| Componentes compartilhados | 7 (`ui.tsx`) | 14 |
| Componente `Button` | **0** — não existe | 1 atom, 4 variantes |
| Strings de classe de botão distintas | **7** (em 15 botões) | 1 |
| Componente `Input` / `Field` | **0** globais (1 local em `ObraForm`) | 1 atom + 1 molécula |
| Strings de classe de input distintas | **12** (em ~30 inputs) | 1 |
| Tokens de design definidos | **2** (`--background`, `--foreground`) — e **nenhum usado** | ~24 semânticos |
| Cores hardcoded (`slate-*`, `emerald-*`, `red-*`, `amber-*`) | 10 arquivos, ~180 ocorrências | 0 |
| `focus:outline-none` sem substituto acessível | **33 ocorrências** | 0 |
| Navegação em mobile (<768px) | **INEXISTENTE** | Drawer + bottom nav |
| Estados vazios (empty state) | **0 de 6 telas** | 6 |
| `loading.tsx` / `error.tsx` / `not-found.tsx` | **0 arquivos** | 8 |
| Feedback de sucesso após salvar | **0 de 5 formulários** | 5 |
| Confirmação antes de excluir | **1 de 3** (só Obras) | 3 |
| Estado de pendência no submit (`useFormStatus`) | **0 de 15 botões** | 15 |
| Estado ativo no menu lateral | **Ausente** | Presente |
| Ícones (`lucide-react` está instalado) | **0 usados** | ~20 |

**Diagnóstico em uma frase:** o app tem a *estrutura* de um sistema de gestão sério, mas a *camada
de interface* foi escrita tela a tela, sem vocabulário comum — o que produz 7 botões diferentes,
zero feedback de ação e um app que **não navega em celular**.

---

## 2. Inventário de Padrões Atuais

### 2.1 Arquitetura de telas

| Rota | Arquivo | Tipo | Padrão de edição |
|---|---|---|---|
| `/` | `src/app/(app)/page.tsx` | Server, read-only | — |
| `/obras` | `src/app/(app)/obras/page.tsx` | Server, tabela | navegação p/ detalhe |
| `/obras/[id]` | `src/app/(app)/obras/[id]/page.tsx` | Server + form | **formulário de página** (40 campos) |
| `/obras/novo` | `src/app/(app)/obras/novo/page.tsx` | Server + form | formulário de página |
| `/taxas` | `src/app/(app)/taxas/page.tsx` | Server, cards | **bulk por card** (1 save p/ cliente) |
| `/corretores` | `src/app/(app)/corretores/page.tsx` | Server, tabela editável | **inline por linha** (1 save p/ linha) |
| `/lotes` | `src/app/(app)/lotes/page.tsx` | Server, tabela editável | **inline por linha** |
| `/investidores` | `src/app/(app)/investidores/page.tsx` | Server, cards aninhados | **append-only** (2 mini-forms p/ aporte) |
| `/login` | `src/app/login/page.tsx` | Server + form | — |

> **Achado estrutural:** existem **4 paradigmas de edição diferentes** em 5 telas de escrita. O usuário
> precisa reaprender "como se salva" em cada módulo. Nenhum deles é errado isoladamente; a mistura é.

### 2.2 Componentes compartilhados (`src/components/ui.tsx`)

| Componente | Linhas | Uso | Observação |
|---|---|---|---|
| `PageHeader` | 4–22 | 8/8 telas | ✅ único padrão realmente consistente |
| `Card` | 24–28 | 7 telas | `p-5` sobrescrito p/ `p-0` em 4 lugares |
| `StatCard` | 30–50 | 3 telas | **tone `warning` não existe** (ver 4.1) |
| `Pill` | 52–60 | 2 telas | 4 tones, ok |
| `Tabs` | 62–78 | 2 telas | descarta outros query params |
| `Th` | 80–86 | 3 telas | sem `scope="col"` |
| `Td` | 88–102 | 1 tela (só Obras) | corretores/lotes usam `<td>` cru |

### 2.3 Componentes de entrada

| Componente | Arquivo | Uso |
|---|---|---|
| `MoneyInput` | `src/components/money-input.tsx` | 5 telas, ~18 instâncias — **client component** |
| `Field` | `src/app/(app)/obras/ObraForm.tsx:6-44` | **local**, só ObraForm — não exportado |
| `DeleteButton` | `src/app/(app)/obras/DeleteButton.tsx` | 1 tela — **client component** |

### 2.4 Tokens e tema

`src/app/globals.css` (17 linhas) é o arquivo de tema inteiro:

```css
:root { --background: #ffffff; --foreground: #0f172a; }
@theme inline { --color-background: var(--background); --color-foreground: var(--foreground); }
```

- Não existe `tailwind.config.*` (Tailwind v4 — esperado), mas o bloco `@theme` define **2 tokens**.
- **Nenhuma tela usa `bg-background` ou `text-foreground`.** Os 2 tokens são efetivamente mortos.
- Toda a paleta real está hardcoded: `slate-50/100/200/300/400/500/600/700/800/900`,
  `emerald-100/600/700`, `red-50/200/600/700`, `amber-100/700`.

### 2.5 Dependências instaladas e **não utilizadas**

Verificado com busca em `src/` — **zero imports**:

| Pacote | `package.json` | Situação |
|---|---|---|
| `lucide-react` | linha 24 | **0 ícones usados** no app inteiro |
| `class-variance-authority` | linha 19 | **0 usos** — é exatamente a lib p/ variantes de Button |
| `clsx` | linha 20 | **0 usos** |
| `tailwind-merge` | linha 29 | **0 usos** — o par `clsx`+`twMerge` é o `cn()` padrão |
| `zod` | linha 30 | **0 usos** — nenhuma validação de formulário |
| `date-fns` | linha 21 | **0 usos** |

> **O toolkit completo para um design system já está instalado e pago.** Nada precisa ser adicionado
> ao `package.json` para executar as recomendações da Seção 6.

### 2.6 Utilitário morto

`src/lib/format.ts:23-26` — `inputMoney()` está exportado e **não é importado em lugar nenhum**.
Ver Seção 9.3 antes de qualquer decisão sobre ele.

---

## 3. Design System — Inconsistências (com localização)

### 3.1 Botões — 7 variantes de classe para 1 conceito

Nenhum componente `Button` existe. Cada botão repete a string inteira:

| Classe | Ocorrências | Onde |
|---|---|---|
| `rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800` | 4 | `taxas:88`, `corretores:132`, `lotes:121`, `investidores:138` |
| `rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800` | 4 | `corretores:84`, `lotes:88`, `investidores:82`, `investidores:114` |
| `rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800` | 2 | `obras:59`, `ObraForm:141` |
| `ml-2 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50` | 2 | `corretores:89`, `lotes:93` |
| `w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800` | 1 | `login:47` |
| `rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50` | 1 | `DeleteButton:13` |
| `rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800` | 1 | `taxas:148` |
| Link-botão sem classe de botão | 2 | `page.tsx:95`, `page.tsx:104` (underline puro) |

**Consequências concretas:**
- **3 alturas diferentes** para o mesmo botão "Salvar" (`py-1`, `py-1.5`, `py-2`).
- **2 tamanhos de fonte** (`text-xs`, `text-sm`) para a mesma ação.
- **`hover:` existe em 15/15 botões. `focus-visible:` existe em 0/15.** Usuário de teclado não vê onde está.
- **`disabled:` existe em 0/15.** Não há como impedir duplo clique num submit.
- O botão "Excluir" de corretores/lotes (`text-red-600` sem borda) tem **peso visual menor** que o
  "Salvar" ao lado — a ação destrutiva parece secundária, mas é a irreversível.

### 3.2 Inputs — 12 variantes de classe + 2 paradigmas visuais

| Padrão | Ocorrências | Onde |
|---|---|---|
| `rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none` | 8 | corretores, lotes, taxas, investidores |
| `...px-2 py-1 text-xs...` | 3 | `investidores:75,108,112` |
| `mt-1 w-full ... px-3 py-2 text-sm ...` | 2 | `login:30,42` |
| `mt-1 w-full ... px-2.5 py-1.5 text-sm ...` | 1 | `ObraForm:22` (+ textarea `ObraForm:135`) |
| variações com `w-24/w-28/w-32/w-36/min-w-64` | 6 | tabelas |
| **inline invisível:** `border border-transparent ... hover:border-slate-200 focus:border-slate-400` | 8 | `corretores:58,66,75`; `lotes:53,61,69,77` |

**Consequência crítica (descobribilidade):** em `/corretores` e `/lotes` as células editáveis usam
`border-transparent`. Elas são **visualmente idênticas a texto estático**. O usuário só descobre que
pode editar por acidente (hover ou clique). Numa tela de auditoria financeira, "campo editável
disfarçado de texto" é um risco de edição acidental.

### 3.3 Tipografia — hierarquia quebrada

| Papel | Implementações encontradas |
|---|---|
| Título de página | `PageHeader` → `h1 text-2xl font-semibold` ✅ consistente |
| Título de seção | `h2 text-sm font-semibold` (`page.tsx:84,101`; `obras:142`) |
| Título de seção | `h2 text-lg font-semibold` (`lotes:28`) |
| Título de seção | **`p` `text-sm font-semibold`** (`taxas:67,80,106`; `corretores:115`; `investidores:128`; `lotes:128`) |
| Título de seção | **`p` `text-base font-semibold`** (`investidores:22`) |
| Sub-rótulo | `p text-xs font-semibold uppercase text-slate-400` (`investidores:56,89`) |
| Sub-rótulo | `p text-xs font-medium uppercase tracking-wide text-slate-500` (`ui.tsx:45`) |

**5 estilos** para "título de seção", sendo que **6 deles usam `<p>` em vez de heading** — a árvore
de headings vai de `h1` direto para nada. Leitor de tela não consegue navegar por seções.

Ainda: `globals.css:16` declara `font-family: -apple-system, ...` no `body`, mas
`src/app/layout.tsx:12` aplica a classe `font-sans` no mesmo `body`. Classe (0,1,0) vence seletor de
elemento (0,0,1) → **a fonte declarada em `globals.css` nunca é aplicada**. Código morto silencioso.

### 3.4 Cor — semântica divergente para "valor positivo"

| Verde | Onde | Significado pretendido |
|---|---|---|
| `text-emerald-600` | `ui.tsx:42` (StatCard positive) | valor bom |
| `text-emerald-600` | `obras/page.tsx:108` (Vlr Disponível ≥ 0) | valor bom |
| `text-emerald-700` | `obras/page.tsx:114` (Lucro Total ≥ 0) | valor bom |
| `text-emerald-700` | `obras/page.tsx:129` (rodapé totais) | valor bom |
| `text-emerald-700` | `lotes/page.tsx:80` (Valor Prospecta) | valor calculado |
| `text-emerald-700` | `investidores/page.tsx:50` (Saldo atual) | valor bom |

Dois verdes para o mesmo conceito, na mesma tela (`obras/page.tsx:108` vs `:114`). E a regra de
quando colorir muda por coluna: `vlrDisponivel` e `lucroTotal` são coloridos, mas `vgv`,
`vlrFinanciado`, `custoObra` nunca são — sem critério documentado.

### 3.5 Espaçamento — sem escala

`mb-6`, `mt-6`, `mt-8`, `mt-3`, `space-y-6`, `space-y-8`, `gap-2`, `gap-3`, `gap-4`, `gap-6`
misturados sem regra. Sintoma mais claro: **`taxas/page.tsx:59` usa `mb-6 -mt-4`** — uma margem
negativa para desfazer o `mb-6` do grid acima. Gambiarra de espaçamento é sintoma de escala ausente.

### 3.6 Tabelas — 2 implementações

- `obras/page.tsx` usa os átomos `Th`/`Td` (correto).
- `corretores/page.tsx:100-108` e `lotes/page.tsx:104-108` usam `<td className="px-3 py-2 text-sm">`
  cru no rodapé — os átomos existem e foram ignorados.
- `taxas/page.tsx:115-117` usa `<th className="px-4 py-2 text-left font-medium">` cru — nem `Th`.
- `investidores/page.tsx:57,92` usa `<table>` **sem `<thead>`** — tabelas de dados sem cabeçalho.

---

## 4. Bugs Visuais Confirmados

### 4.1 `[ALTO]` StatCard "warning" não renderiza — card de alerta aparece preto

`src/components/ui.tsx:39` declara `tone?: "default" | "positive" | "negative"`.
`src/components/ui.tsx:41-42` mapeia apenas 3 casos, sem branch para `warning`.

`src/app/(app)/taxas/page.tsx:53-57`:

```tsx
tone={totalPrevisto - totalPago > 0 ? "warning" as never : "positive"}
```

O `as never` fura o type checker. Em runtime, `toneClass` cai no `else` e o card **"Valor ainda a
receber" renderiza em `text-slate-900` (preto comum)** — exatamente o card que deveria chamar
atenção do dono da empresa para dinheiro pendente. O alerta visual não existe.

> Correção é puramente de cor de classe CSS. **O valor exibido não muda.**

### 4.2 `[ALTO]` "+ Nova obra" perde o ano da aba ativa

`src/app/(app)/obras/page.tsx:57-62` — o link é fixo:

```tsx
<Link href="/obras/novo">+ Nova obra</Link>
```

`src/app/(app)/obras/novo/page.tsx:11` — `const ano = anoParam === "2026" ? 2026 : 2025;`

Usuário na aba **"Obras 2026"** clica em "+ Nova obra" → cai num formulário de **2025**, sem nenhum
aviso. O campo `ano` é `<input type="hidden">` (`ObraForm.tsx:66`) — invisível. A obra é criada no
ano errado e só aparece na aba errada.

> Correção: `href={`/obras/novo?ano=${ano}`}`. É navegação, não cálculo.

### 4.3 `[MÉDIO]` Formulário de nova comissão não tem 3ª e 4ª parcela

`src/app/(app)/corretores/page.tsx:116-135` — o form de criação oferece apenas
`clienteLote`, `corretor`, `comissaoTotal`, `parcela1`, `parcela2`.
`src/app/(app)/corretores/actions.ts:19-20` — `createComissao` lê `parcela3` e `parcela4`, que
nunca são enviados → gravados como `"0"`.

O usuário precisa criar a comissão e **depois** editar a linha inline para lançar as parcelas 3 e 4.
Assimetria entre criar e editar.

### 4.4 `[MÉDIO]` Fonte declarada em `globals.css` nunca é aplicada

Ver 3.3. `globals.css:16` vs `src/app/layout.tsx:12`.

### 4.5 `[BAIXO]` Header do shell tem `<div />` vazio como espaçador

`src/app/(app)/layout.tsx:49` — `<div />` puro para empurrar o bloco de usuário. Funciona, mas
ocupa o slot onde deveria estar o breadcrumb / título da página atual.

---

## 5. Acessibilidade (WCAG 2.1 AA)

### 5.1 `[CRÍTICO]` Foco de teclado invisível — 33 ocorrências

Todo input do app usa `focus:outline-none` e substitui o anel de foco por **apenas uma mudança de
cor de borda de 1px** (`focus:border-slate-500` ou `focus:border-slate-400`).

| Arquivo | Ocorrências |
|---|---|
| `src/app/(app)/lotes/page.tsx` | 9 |
| `src/app/(app)/corretores/page.tsx` | 8 |
| `src/app/(app)/investidores/page.tsx` | 9 |
| `src/app/(app)/taxas/page.tsx` | 3 |
| `src/app/(app)/obras/ObraForm.tsx` | 2 |
| `src/app/login/page.tsx` | 2 |

Nos inputs inline (`corretores:58,66,75`; `lotes:53,61,69,77`) a borda de foco é
`slate-400` sobre `transparent` — praticamente imperceptível.

**Pior ainda:** os **15 botões não têm nenhum estilo de foco** (só `hover:`). Um usuário navegando
por Tab não consegue saber em qual botão está antes de apertar Enter — num app onde alguns botões
**excluem registros financeiros sem confirmação** (ver 5.6).

→ Falha **WCAG 2.4.7 (Focus Visible, AA)** e **2.4.11 (Focus Appearance)**.

### 5.2 `[CRÍTICO]` `MoneyInput` sem nome acessível em 5 telas

`src/components/money-input.tsx:45-60` — o input visível só recebe `id` se o pai passar.

| Uso | `id`? | `label`? | `placeholder`? | Nome acessível |
|---|---|---|---|---|
| `ObraForm.tsx:30` | ✅ | ✅ | — | ✅ OK |
| `taxas/page.tsx:128,135` | ❌ | ❌ | ❌ | **nenhum** |
| `corretores/page.tsx:71` | ❌ | ❌ | ❌ | **nenhum** |
| `lotes/page.tsx:57,65,73` | ❌ | ❌ | ❌ | **nenhum** |
| `corretores/page.tsx:129-131` | ❌ | ❌ | ✅ | placeholder apenas |
| `lotes/page.tsx:117,118,120` | ❌ | ❌ | ✅ | placeholder apenas |
| `investidores/page.tsx:77,109,132` | ❌ | ❌ | ✅ | placeholder apenas |

Um leitor de tela em `/lotes` anuncia literalmente "edit text, edit text, edit text" — o usuário não
sabe qual campo é "Valor de Avaliação" e qual é "Valor Pago pela CEF". Em campos monetários isso é
risco de lançamento no campo errado.

→ Falha **WCAG 4.1.2 (Name, Role, Value, A)** e **1.3.1 (Info and Relationships, A)**.

### 5.3 `[ALTO]` Placeholder usado como rótulo — ~18 inputs

`corretores:118,124,129,130,131`; `lotes:116,117,118,119,120`; `investidores:130,131,132,133`;
`taxas:83`.

O rótulo desaparece assim que o usuário começa a digitar — ele perde a referência do que está
preenchendo no meio do preenchimento.

Caso mais grave: `investidores/page.tsx:133`
`placeholder="Taxa mensal (0.01 = 1%)"` — o usuário precisa **converter mentalmente percentual para
decimal**, e a instrução dessa conversão some ao digitar. Alto risco de digitar `1` querendo dizer
1% e gravar 100% ao mês.

→ Falha **WCAG 3.3.2 (Labels or Instructions, A)**.

### 5.4 `[ALTO]` Contraste insuficiente

| Classe | Contraste sobre branco | AA (4.5:1) | Onde |
|---|---|---|---|
| `text-slate-400` (#94a3b8) | **2.85:1** | ❌ **FALHA** | `ui.tsx:47` (hint do StatCard), `page.tsx:103`, `taxas:59,92`, `obras` anotações, `investidores:56,63,89` |
| `text-emerald-600` (#059669) | **3.76:1** | ❌ **FALHA** | `ui.tsx:42` (StatCard positive), `obras/page.tsx:108` |
| `text-slate-500` (#64748b) | 4.76:1 | ✅ passa (no limite) | difundido |
| `text-emerald-700` (#047857) | 5.10:1 | ✅ passa | lotes, investidores, totais |
| `text-red-600` (#dc2626) | 4.83:1 | ✅ passa | valores negativos |

`text-slate-400` carrega informação real — o hint do `StatCard` (`ui.tsx:47`) mostra
`VGV: R$ ...` e `Pago: ... • Saldo: ...`. **São valores financeiros em contraste 2.85:1.**

O `text-emerald-600` do `StatCard` é a cor do "Lucro total" e do "Vlr disponível" no Painel Geral —
os dois números mais importantes do sistema, no contraste mais fraco.

> Correção: trocar `slate-400`→`slate-600` e `emerald-600`→`emerald-700`. **Só a cor do texto muda;
> o número renderizado é literalmente o mesmo.**

### 5.5 `[MÉDIO]` Estrutura semântica e navegação

- `src/app/(app)/layout.tsx:34` — `<nav>` sem `aria-label`, e **sem indicação de página atual**
  (`aria-current="page"` ausente; nem estilo visual de item ativo). O usuário não sabe em que módulo está.
- Nenhum **skip link** ("Pular para o conteúdo") antes da sidebar de 6 itens.
- `src/components/ui.tsx:80-86` — `Th` renderiza `<th>` **sem `scope="col"`**.
- Nenhuma tabela tem `<caption>`.
- `investidores/page.tsx:57,92` — `<table>` sem `<thead>`; as colunas (data / saldo / juros) não têm
  cabeçalho algum, nem visual nem programático.
- 6 títulos de seção usam `<p>` em vez de `<h2>` (ver 3.3).
- `src/app/login/page.tsx:16-18` — mensagem de erro sem `role="alert"` / `aria-live`. Leitor de tela
  não anuncia a falha de login.

### 5.6 `[CRÍTICO — UX + risco]` Exclusão sem confirmação

| Ação | Confirmação? | Arquivo |
|---|---|---|
| Excluir **obra** | ✅ `confirm()` | `obras/DeleteButton.tsx:8` |
| Excluir **comissão de corretor** | ❌ **NENHUMA** | `corretores/page.tsx:88-92` → `actions.ts:42` |
| Excluir **lote** | ❌ **NENHUMA** | `lotes/page.tsx:92-96` → `actions.ts:48` |

Em `/corretores` e `/lotes` o botão "Excluir" fica a `ml-2` (8px) do botão "Salvar", em `text-xs`,
sem estilo de foco. **Um clique errado apaga um registro financeiro permanentemente, sem aviso e sem
desfazer.** Este é o achado de maior risco do levantamento.

---

## 6. Responsividade

### 6.1 `[CRÍTICO]` O app não navega em celular

`src/app/(app)/layout.tsx:29`:

```tsx
<aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
```

A sidebar — **única navegação existente** — é `hidden` abaixo de 768px. Não há hamburger, drawer,
bottom nav ou qualquer substituto. O header mobile (`layout.tsx:48`) exibe apenas o texto
"Prospecta Construções", sem link.

**Resultado:** em qualquer celular, depois do login o usuário cai no Painel Geral e **não consegue
sair dele** a não ser digitando URLs na barra de endereço. Os únicos escapes são dois links dentro
de cards do dashboard (`page.tsx:95` → `/obras`, `page.tsx:104` → `/investidores`) — e de `/obras`
não há como voltar nem ir para `/taxas`.

O dono da empresa acompanha obra **em campo**. Esta é a falha #1 do sistema.

### 6.2 `[ALTO]` Formulário de obra: 2 colunas em telas de 360px

`src/app/(app)/obras/ObraForm.tsx:50`:

```tsx
<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
```

O breakpoint base é `grid-cols-2`. Num celular de 360px, descontando padding do `main` (`px-4`), do
`Card` (`p-5`) e o `gap-4`, cada campo monetário fica com **≈130px**. Rótulos como
"Vlr a Receber da Entrada" e "Vlr P/ Terminar a Obra" quebram em 3 linhas, e o campo mal comporta
`1.234.567,89`.

> Correção: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.

### 6.3 `[ALTO]` Tabela de Obras: 11 colunas em scroll horizontal cego

`obras/page.tsx:79-89` — 11 colunas, todas `whitespace-nowrap` (`ui.tsx:82,98`), dentro de
`overflow-x-auto` (`obras/page.tsx:75`).

Em tablet/mobile o usuário arrasta lateralmente e **perde a coluna "Cliente"** — que é a única
identificação da linha. Ao chegar em "Lucro Total" não sabe mais de quem é aquele lucro.
Não há coluna sticky, nem indicador visual de que há mais conteúdo à direita.

### 6.4 `[MÉDIO]` Larguras fixas em px dentro de tabelas fluidas

`corretores:58 (w-48)`, `:66 (w-32)`, `:75 (w-24)`; `lotes:53 (w-44)`, `:61,:69,:77 (w-28)`;
`taxas:131,138 (w-24)`; `investidores:80 (w-28)`, `:112 (w-24)`.

`w-24` = 96px. Com `px-1.5` e `text-right`, um valor como `1.234.567,89` (13 caracteres) **não cabe
e é cortado visualmente** dentro do input. O usuário não consegue conferir o valor inteiro que está
digitando num campo monetário.

> **Atenção:** o valor armazenado não é afetado — é apenas recorte visual. Mas num painel de
> auditoria, "não conseguir ler o número que você digitou" é falha funcional. Correção: largura
> mínima em `ch` ou `min-w-[10rem]`, sem tocar em formatação.

### 6.5 `[MÉDIO]` Grids de formulário com contagem de colunas arbitrária

- `corretores/page.tsx:116` — `grid-cols-2 sm:grid-cols-4 lg:grid-cols-7` para 6 filhos.
- `investidores/page.tsx:129` — `grid-cols-2 sm:grid-cols-5` com um `sm:col-span-4` no checkbox.

Em `grid-cols-2` (base, mobile) o botão "Adicionar" fica sozinho numa linha, desalinhado.

### 6.6 Breakpoints usados no projeto

| Breakpoint | Usos | Observação |
|---|---|---|
| `sm:` (640) | 12 | mais usado |
| `md:` (768) | 8 | usado no shell e em 2 grids |
| `lg:` (1024) | 9 | |
| `xl:` / `2xl:` | **0** | monitor grande fica com muito espaço vazio |

Nenhuma tela define `max-w-*` no container principal (`layout.tsx:59` — `main` é 100% fluido). Em
monitor ultrawide, a tabela de Obras estica os 11 campos até 2500px, com linhas de leitura
desconfortáveis.

---

## 7. Estados Ausentes

### 7.1 Empty states — 0 de 6 telas

| Tela | Comportamento com base vazia |
|---|---|
| `/` | "Obras por status" renderiza `<ul>` vazio; StatCards mostram `R$ 0,00` sem contexto |
| `/obras` | Cabeçalho da tabela + rodapé **"TOTAIS (0 obras)"**, corpo vazio. Parece bug de carregamento |
| `/taxas` | Nenhum card. Sobra só o form "Adicionar novo cliente" flutuando |
| `/corretores` | Tabela com cabeçalho e rodapé "TOTAIS" zerado |
| `/lotes` | Empreendimento com título e tabela vazia |
| `/investidores` | Página com só o header e o form de criação no rodapé |

Em nenhum caso há mensagem "Nenhum registro ainda — comece adicionando X". O usuário não distingue
"não há dados" de "falhou ao carregar".

### 7.2 Loading — 0 arquivos

Nenhum `loading.tsx`, nenhum `<Suspense>`, nenhum skeleton no projeto.

Impacto direto medido no código:
- `src/app/(app)/page.tsx:8-14` — 5 `SELECT *` de tabela inteira em `Promise.all`. O TTFB do
  Painel Geral é o da consulta mais lenta. Tela branca até tudo terminar.
- `src/lib/queries.ts:66-85` — `getInvestidoresCompletos()` é **N+1 aninhado e sequencial**:
  1 query de investidores → para cada investidor, 1 query de aportes → para cada aporte, 2 queries
  (saldos + movimentos), tudo com `await` em `for`. Com 10 investidores × 2 aportes = **41 queries
  em série**. A tela `/investidores` fica em branco o tempo todo.
- `src/lib/queries.ts:49-64` — `getEmpreendimentosComLotes()` idem (2 queries por empreendimento, em série).

### 7.3 Error boundaries — 0 arquivos

Nenhum `error.tsx` e nenhum `global-error.tsx`. Qualquer falha do Postgres/Supabase resulta na tela
de erro padrão do Next.js — em inglês, sem identidade, sem botão de "tentar novamente".

Nenhum `not-found.tsx`: `src/app/(app)/obras/[id]/page.tsx:13` chama `notFound()` e o usuário recebe
o 404 genérico do framework, fora do shell do app (sem menu para voltar).

### 7.4 Feedback de sucesso — 0 de 5 formulários

| Ação | Feedback ao usuário |
|---|---|
| Salvar obra (`obras/actions.ts:83-93`) | `redirect` para a **mesma página** — visualmente nada muda |
| Salvar taxas do cliente (`taxas/actions.ts:45-61`) | apenas `revalidatePath` — a página re-renderiza igual |
| Salvar linha de corretor (`corretores/actions.ts:26-40`) | idem |
| Salvar linha de lote (`lotes/actions.ts:12-28`) | idem |
| Registrar saldo/movimento (`investidores/actions.ts:37-69`) | a linha nova aparece na tabela (único feedback implícito do app) |

Em `/corretores`, o usuário edita um valor, clica "Salvar", e a tela volta **exatamente igual**.
Não há toast, não há checkmark, não há nada. **É indistinguível de "o botão não funcionou"** — e
num painel financeiro isso leva o usuário a clicar Salvar várias vezes por insegurança.

### 7.5 Estado de pendência — 0 de 15 botões

Nenhum uso de `useFormStatus` / `useTransition`. Nenhum botão fica `disabled` durante o submit.
Em conexão lenta (obra em campo, 3G), o usuário clica "Salvar" 3 vezes achando que não pegou.
Para `createTaxasCliente` (`taxas/actions.ts:28-43`), que **insere 17 linhas de uma vez**, o duplo
clique cria 34 categorias duplicadas para o mesmo cliente.

### 7.6 Erros de validação silenciosos

| Local | Comportamento |
|---|---|
| `taxas/actions.ts:30` | `if (!cliente) return;` — retorna sem mensagem. A tela não muda |
| `investidores/actions.ts:9` | `if (!nome) return;` — idem |
| `investidores/actions.ts:40` | `if (!mesRef) return;` — idem |

`zod` está instalado (`package.json:30`) e não é usado em lugar nenhum. Não há nenhum `useActionState`
para devolver mensagens de erro ao formulário.

### 7.7 Erro de login exibido em inglês

`src/app/login/actions.ts:14`:

```ts
redirect(`/login?erro=${encodeURIComponent(error.message)}`);
```

`error.message` vem cru do Supabase. O usuário brasileiro vê **"Invalid login credentials"**.
Além disso, o texto do erro fica na URL, visível na barra de endereço e no histórico.

---

## 8. Fluxos de Usuário — Atrito Identificado

### 8.1 Criar obra — 3 pontos de atrito

1. Ir em `/obras` → escolher aba do ano → "+ Nova obra" → **o ano se perde** (bug 4.2).
2. Formulário de **40 campos, 8 seções, todas abertas simultaneamente**
   (`ObraForm.tsx:68-138`). Não há indicação de quais são obrigatórios — apenas `cliente` tem
   `required` (`ObraForm.tsx:69`), e não há asterisco nem legenda.
3. O único botão "Salvar obra" fica **no fim de tudo** (`ObraForm.tsx:141`). Em mobile são
   ~2400px de scroll até o botão. Sem barra de ação fixa.

### 8.2 Editar obra — sem caminho de volta

`/obras/[id]` tem `PageHeader` com título e **apenas o botão "Excluir obra"** como ação
(`obras/[id]/page.tsx:23`). Não há breadcrumb, não há "← Voltar para Obras". O único retorno é a
sidebar — **que não existe em mobile** (6.1). Em celular, ao entrar numa obra o usuário fica preso.

Além disso, na régua visual do header, a ação de maior destaque disponível na tela é a **destrutiva**.

### 8.3 Excluir — inconsistência de proteção

Ver 5.6. Três telas, três comportamentos: obra confirma, comissão não confirma, lote não confirma.

### 8.4 Editar comissões / lotes — 1 save por linha

Cada `<tr>` é um form independente (`corretores:80`, `lotes:84`). Ajustar 8 linhas = **8 cliques em
Salvar + 8 revalidações de página completa**. Não há "Salvar tudo". Ironicamente, `/taxas` **tem**
save em lote por card (`taxas:111`) — o padrão bom existe no projeto e não foi reaproveitado.

### 8.5 Sem busca, filtro ou ordenação — em nenhuma tela

Nenhum `<input type="search">`, nenhum header de coluna clicável, nenhum filtro por status,
empreiteiro, cidade ou corretor. O único recorte disponível no sistema inteiro é a aba de ano em
`/obras` e `/taxas`. Com 50+ obras, encontrar uma exige Ctrl+F do navegador (que falha, porque a
tabela tem scroll horizontal).

O `statusTone()` (`src/lib/status.ts`) já normaliza status em 4 categorias — a base para um filtro
por status já está pronta e não é usada como filtro.

### 8.6 Navegação entre módulos — sem contexto

`layout.tsx:36-43` — os 6 links são visualmente idênticos, sem estado ativo. Não há breadcrumb.
O `<div />` vazio do header (`layout.tsx:49`) é exatamente o espaço onde caberia
"Obras › Maria Silva".

### 8.7 Dashboard não é ponto de partida acionável

`src/app/(app)/page.tsx` mostra 8 StatCards + lista de status + card de investidores, mas:
- Só **2 links de saída** (`page.tsx:95`, `page.tsx:104`), estilizados como texto sublinhado.
- Nenhum StatCard é clicável. "Taxas de obra a receber: R$ X" não leva a `/taxas`.
- A lista "Obras por status" (`page.tsx:86-93`) não filtra nada ao clicar.
- Não há nenhum "próxima ação": obras com prazo vencido, taxas atrasadas, comissões a pagar.

---

## 9. Fidelidade Numérica — Observações (NÃO SÃO TAREFAS DE UX)

> Registradas por dever de levantamento. **Nenhuma deve ser tocada em trabalho de layout.**
> Encaminhar para @architect / @data-engineer.

### 9.1 `[BLOQUEADO]` Banco tem escala 4, exibição tem 2 casas

`src/db/schema.ts` armazena valores em `numeric(16, 4)` (ex.: linhas 32-38, 43-45, 48-53).
`src/lib/format.ts:1-4` — `formatBRL` usa `Intl.NumberFormat` com `style: "currency"`, que para BRL
usa 2 casas por padrão. Um valor `1234.5678` no banco é **exibido** como `R$ 1.234,57`.

Isso é apenas exibição (o dado permanece íntegro), mas quem confere a tela contra a planilha pode
ver divergência de centavos. **Decisão de produto, não de UX.**

### 9.2 `[BLOQUEADO — RISCO REAL]` `MoneyInput` pode gravar valor arredondado

`src/components/money-input.tsx:14` — `formatMoneyDisplay` usa `maximumFractionDigits: 2`.
`src/components/money-input.tsx:5-9` — `parseMoneyInput` lê de volta o texto exibido.
`src/components/money-input.tsx:54-58` — no `onBlur`, `raw` é reescrito a partir do texto visível.

Consequência: se o banco contém `1234.5678` e o usuário apenas **passa o foco** pelo campo em
`/corretores`, `/lotes` ou `/taxas` e depois clica "Salvar", o hidden input envia `1234.57` e o
banco é atualizado com o valor arredondado. As 3ª e 4ª casas são perdidas silenciosamente.

**Isto é um risco de fidelidade pré-existente, não introduzido por UX.** Qualquer refatoração de
`MoneyInput` (inclusive as melhorias de acessibilidade da Seção 5.2, que só adicionam `id`/`label`)
deve preservar o comportamento numérico atual **byte a byte** até que @data-engineer decida.

> **Regra para a fase de implementação:** ao adicionar `label`/`aria-label`/`id` ao `MoneyInput`,
> **não tocar** em `parseMoneyInput`, `formatMoneyDisplay`, `useState(raw)` ou no `onBlur`.

### 9.3 `[BLOQUEADO]` `inputMoney()` é código morto com arredondamento embutido

`src/lib/format.ts:23-26` — `Math.round(n * 100) / 100`. Não é importado em nenhum lugar.
Não remover nem usar sem decisão de @architect.

### 9.4 `[BLOQUEADO]` `valorProspecta` é calculado em JS com `Number`

`src/app/(app)/lotes/actions.ts:23,41` — `String(valorPagoCef - valorTerceiro)` com floats JS.
Fora do escopo de UX. Mencionado apenas para que nenhuma melhoria de layout em `/lotes` mexa nessa
linha.

### 9.5 Agregações em JS no Dashboard e listagens

`src/app/(app)/page.tsx:24-41`, `obras/page.tsx:17-42`, `corretores/page.tsx:10-20`,
`lotes/page.tsx:19-22`, `taxas/page.tsx:31-32,100-101` — todos os totais são somados em JavaScript
com `num()` (`format.ts:18-20`), que faz `Number(string)`.

Mover para `SUM()` em SQL melhoraria performance **e** precisão (numeric do Postgres é exato), mas
**mudaria os valores exibidos em casos de borda** — exatamente o que este documento proíbe.
`[BLOQUEADO — requer validação de @data-engineer com comparação lado a lado]`.

---

## 10. Recomendações — Roadmap Priorizado

Todas as ações abaixo são de **layout, componente, navegação, estado e acessibilidade**.
Nenhuma altera cálculo ou formatação de valor.

### Fase 0 — Fundação (nenhuma tela muda visualmente ainda)

| # | Ação | Arquivos |
|---|---|---|
| 0.1 | Criar `src/lib/cn.ts` com `clsx` + `tailwind-merge` (já instalados) | novo |
| 0.2 | Definir tokens semânticos no `@theme` do `globals.css`: `--color-surface`, `--color-border`, `--color-text-{primary,secondary,muted}`, `--color-{positive,negative,warning}`, escala `--spacing-*` | `src/app/globals.css` |
| 0.3 | Remover `font-family` morto de `globals.css:16` **ou** remover `font-sans` de `layout.tsx:12` — escolher um | 3.3 |

### Fase 1 — Bloqueadores (semana 1)

| # | Prioridade | Ação | Arquivo:linha |
|---|---|---|---|
| 1.1 | 🔴 CRÍTICO | **Navegação mobile**: `<MobileNav>` client component com drawer + botão hamburger no header; sidebar vira `md:block` com drawer abaixo | `layout.tsx:29,47-49` |
| 1.2 | 🔴 CRÍTICO | **Confirmação de exclusão** em corretores e lotes — reusar o padrão de `DeleteButton.tsx` (idealmente promovendo-o a `src/components/confirm-delete-button.tsx`) | `corretores:88-92`, `lotes:92-96` |
| 1.3 | 🔴 CRÍTICO | **Anel de foco visível**: substituir os 33 `focus:outline-none` por `focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1`; adicionar foco aos 15 botões | 5.1 |
| 1.4 | 🟠 ALTO | `href={`/obras/novo?ano=${ano}`}` — corrigir perda do ano | `obras/page.tsx:57` |
| 1.5 | 🟠 ALTO | `StatCard`: adicionar tone `warning` de verdade e remover o `as never` | `ui.tsx:39-42`, `taxas:56` |
| 1.6 | 🟠 ALTO | Contraste: `text-slate-400`→`text-slate-600`; `text-emerald-600`→`text-emerald-700` (apenas classe de cor) | 5.4 |

### Fase 2 — Componentes atômicos (semana 2)

| # | Ação | Detalhe |
|---|---|---|
| 2.1 | `src/components/ui/button.tsx` com `cva` (já instalado) | variantes `primary \| secondary \| ghost \| danger`; tamanhos `sm \| md \| lg`; estados `hover / focus-visible / disabled / pending`; substitui as **7** strings da 3.1 |
| 2.2 | `src/components/ui/submit-button.tsx` | envolve `useFormStatus`: `disabled` + spinner + "Salvando..." — resolve 7.5 e o duplo-submit de `createTaxasCliente` |
| 2.3 | `src/components/ui/input.tsx` + `field.tsx` | promover o `Field` local de `ObraForm.tsx:6-44` para global; `label` obrigatório; `id` auto; `aria-describedby` para erro |
| 2.4 | `MoneyInput`: aceitar `label`/`aria-label` obrigatórios | **⚠️ só adicionar props de acessibilidade — não tocar em `parseMoneyInput`/`formatMoneyDisplay`/`onBlur` (ver 9.2)** |
| 2.5 | `Th`: adicionar `scope="col"`; migrar `corretores:100-108`, `lotes:104-108`, `taxas:115-117` para `Th`/`Td` | 3.6 / 5.5 |
| 2.6 | `SectionTitle` como `<h2>` — substituir os 6 `<p className="text-sm font-semibold">` | 3.3 |
| 2.7 | Adotar ícones do `lucide-react` (já instalado): `Plus`, `Save`, `Trash2`, `ChevronLeft`, `Menu`, `Search` | 2.5 |

### Fase 3 — Estados (semana 3)

| # | Ação |
|---|---|
| 3.1 | `<EmptyState>` (ícone + texto + CTA) nas 6 telas — ver 7.1 |
| 3.2 | `loading.tsx` com skeleton em `/`, `/obras`, `/taxas`, `/corretores`, `/lotes`, `/investidores` |
| 3.3 | `error.tsx` por rota + `global-error.tsx`, em pt-BR, com botão "Tentar novamente" |
| 3.4 | `not-found.tsx` dentro de `(app)` para `obras/[id]` — dentro do shell, com link de volta |
| 3.5 | Toast/banner de sucesso após salvar (`useActionState` + mensagem) nas 5 telas de escrita — 7.4 |
| 3.6 | Mensagens de validação visíveis nos `return` silenciosos (7.6) usando `zod`, já instalado |
| 3.7 | Traduzir/mapear erro de login para pt-BR e tirá-lo da URL — `login/actions.ts:14` |
| 3.8 | `<Suspense>` em `/investidores` e `/lotes` para não bloquear no N+1 (`queries.ts:49-85`) |

### Fase 4 — Layout e navegação (semana 4)

| # | Ação | Alvo |
|---|---|---|
| 4.1 | `ObraForm` responsivo: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | `ObraForm.tsx:50` |
| 4.2 | Barra de ação fixa (`sticky bottom-0`) com "Salvar obra" no formulário de 40 campos | `ObraForm.tsx:140-144` |
| 4.3 | Seções colapsáveis no `ObraForm` (`<details>` nativo, zero JS) — abrir "Identificação" e "Lucro" por padrão | `ObraForm.tsx:46-53` |
| 4.4 | Coluna "Cliente" sticky (`sticky left-0 bg-white`) na tabela de Obras | `obras/page.tsx:95-99`, `ui.tsx:98` |
| 4.5 | Breadcrumb no header (ocupando o `<div />` vazio) + "← Voltar para Obras" em `/obras/[id]` | `layout.tsx:49`, `obras/[id]/page.tsx:20-24` |
| 4.6 | Estado ativo no menu: `aria-current="page"` + fundo `bg-slate-100` no item atual | `layout.tsx:36-43` |
| 4.7 | Skip link "Pular para o conteúdo" + `aria-label` no `<nav>` | `layout.tsx:34` |
| 4.8 | `max-w-[1600px] mx-auto` no `<main>` para monitores grandes | `layout.tsx:59` |
| 4.9 | Ampliar larguras dos inputs monetários em tabelas (`w-24`→`min-w-[9rem]`) para caber valores longos | 6.4 |

### Fase 5 — Produtividade (backlog)

| # | Ação |
|---|---|
| 5.1 | Busca por cliente em `/obras`, `/corretores`, `/lotes` (server-side via `searchParams`) |
| 5.2 | Filtro por status em `/obras` reaproveitando `src/lib/status.ts` |
| 5.3 | Ordenação por coluna (VGV, Lucro, Prazo) via `searchParams` |
| 5.4 | "Salvar tudo" em `/corretores` e `/lotes`, seguindo o padrão de bulk que já existe em `taxas:111` |
| 5.5 | StatCards do dashboard clicáveis → navegam para o módulo filtrado |
| 5.6 | Bloco "Requer atenção" no dashboard: prazos vencidos, taxas em aberto, comissões pendentes |
| 5.7 | Adicionar `parcela3`/`parcela4` ao form de criação de comissão | `corretores:116-135` (bug 4.3) |
| 5.8 | Paginação nas listagens quando ultrapassarem ~100 registros |

---

## 11. Metas Mensuráveis

| Métrica | Antes | Depois | Redução |
|---|---|---|---|
| Strings de classe de botão | 7 | 1 componente / 4 variantes | **85,7%** |
| Strings de classe de input | 12 | 1 componente / 3 tamanhos | **91,7%** |
| `focus:outline-none` sem substituto | 33 | 0 | **100%** |
| Telas navegáveis em mobile | 2 de 8 | 8 de 8 | **+300%** |
| Empty states | 0 | 6 | — |
| Arquivos `loading`/`error`/`not-found` | 0 | 8+ | — |
| Formulários com feedback de sucesso | 0 de 5 | 5 de 5 | **100%** |
| Ações destrutivas com confirmação | 1 de 3 | 3 de 3 | **100%** |
| Falhas WCAG AA identificadas | 6 | 0 | **100%** |
| Componentes compartilhados | 7 | 14 | **+100%** |
| Novas dependências necessárias | — | **0** | já instaladas |

---

## 12. Handoff

| Destino | Item |
|---|---|
| **@dev (Dex)** | Fases 0–4. Ler obrigatoriamente a Seção 0 e a Seção 9 antes de tocar em `money-input.tsx` ou `format.ts` |
| **@architect (Aria)** | Decisão sobre 9.1 (escala 4 vs exibição 2) e 9.3 (`inputMoney` morto) |
| **@data-engineer (Dara)** | 9.2 (arredondamento no `onBlur`), 9.4 (`valorProspecta` em float), 9.5 (agregações JS → SQL), N+1 em `queries.ts:49-85` |
| **@qa (Quinn)** | Gate WCAG AA (Seção 5) + regressão de valores: comparar todos os totais de todas as telas antes/depois de cada PR de UI |
| **@po (Pax)** | Priorização das Fases 1–5 em stories |

---

**Documento gerado por @ux-design-expert (Uma) — Brownfield Discovery Fase 3.**
*Nenhum arquivo de código foi modificado durante este levantamento.*
