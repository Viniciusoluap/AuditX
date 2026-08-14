# Prospecta CRM — Painel de Gestão de Obras

Sistema web que substitui a planilha `CRM_PROSPECTA.xlsx`. Todas as 6 abas da
planilha original foram modeladas em um banco de dados relacional (PostgreSQL)
e todos os valores nelas anotados foram migrados fielmente — nenhum dado foi
perdido ou arredondado incorretamente (ver [Fidelidade dos dados](#fidelidade-dos-dados)).

| Aba da planilha | Módulo no sistema |
|---|---|
| Obras 2025 / Obras 2026 | `/obras` (com seletor de ano) |
| Taxas de Obras | `/taxas` |
| Corretores | `/corretores` |
| Compra de Lotes | `/lotes` |
| Investidores | `/investidores` |
| — | `/` Painel geral (KPIs consolidados) |

## Stack e por que foi escolhida

- **Next.js 16 (App Router) + React 19 + TypeScript** — front-end e back-end
  (Server Actions) no mesmo projeto, sem precisar manter uma API separada.
- **PostgreSQL + Drizzle ORM** — banco relacional real com tipos numéricos
  exatos (`numeric`, não `float`), migrations versionadas e uma API type-safe.
- **Supabase** — Postgres gerenciado + autenticação por e-mail/senha prontos,
  com plano gratuito suficiente para o volume de dados da empresa.
- **Tailwind CSS** — estilização rápida e consistente sem dependência de um
  design system pesado.

Essa combinação (Next.js + Postgres/Supabase) é hoje a recomendação padrão da
comunidade para substituir controles em planilha por um sistema web real,
mantendo custo baixo (roda de graça em MVP) e podendo crescer para múltiplos
usuários, permissões e relatórios sem reescrever a base. Fontes consultadas:

- [The Best SaaS Stack in 2026 — Makerkit](https://makerkit.dev/blog/saas/saas-stack-2026)
- [Best Tech Stack to Build a SaaS in 2026 — StartuPage](https://startupa.ge/blog/best-tech-stack-saas-2026)
- [Neon vs Supabase vs PlanetScale — DEV Community](https://dev.to/whoffagents/neon-vs-supabase-vs-planetscale-managed-postgres-for-nextjs-in-2026-2el4)
- [Baserow vs NocoDB vs Airtable (alternativas no-code avaliadas e descartadas)](https://www.softr.io/blog/baserow-vs-nocodb)

Alternativas no-code (Baserow, NocoDB, Airtable) foram avaliadas e descartadas:
elas resolveriam o CRUD básico, mas não replicam com fidelidade as regras de
negócio específicas da Prospecta (cálculo de lucro por obra, juros compostos
de investidores, repasse CEF) nem oferecem uma tela sob medida para cada fluxo
— um sistema próprio, ainda que mais simples que um ERP completo, entrega isso
sem ficar refém das limitações de um construtor genérico de planilhas.

## Fidelidade dos dados

Os dados iniciais (`src/db/seed-data.json`) foram extraídos **programaticamente**
da planilha original com um script Python (`openpyxl`, lendo os valores já
calculados pelas fórmulas), não digitados à mão — eliminando risco de erro de
transcrição. Após a carga, os totais do sistema foram conferidos célula a
célula contra as linhas "TOTAIS" da planilha (VGV, lucro total, comissões,
margem de lotes) e batem exatamente.

Blocos heterogêneos da planilha que misturavam anotações manuais, fórmulas
cruzadas entre abas e observações soltas (ex.: resumos por empreiteiro em
"Obras 2025" linhas 19–33, totais manuais em "Taxas de Obras") foram
preservados na tabela `anotacoes_financeiras` e aparecem nas telas como
"Anotações e resumos financeiros da planilha original", em vez de serem
forçados dentro de colunas rígidas que fariam esses valores parecerem
recalculáveis quando na verdade são registros pontuais do dono do negócio.

## Rodando localmente

Pré-requisitos: Node.js 20+, PostgreSQL 16 (local ou via `docker-compose`).

```bash
npm install
cp .env.example .env.local        # ajuste DATABASE_URL se necessário

# banco local via Docker (alternativa: usar um Postgres já instalado)
docker compose up -d

npm run db:migrate                # cria as tabelas
npm run db:seed                   # carrega os dados reais da planilha

npm run dev                       # http://localhost:3000
```

Sem `NEXT_PUBLIC_SUPABASE_URL` configurado, o sistema roda **sem exigir login**
(facilita avaliar localmente). Em produção, configure o Supabase (abaixo) para
habilitar a tela de login automaticamente via middleware.

## Colocando em produção (Supabase + Vercel)

1. Crie um projeto em [supabase.com](https://supabase.com) (grátis).
2. Em **Project Settings → Database → Connection string → Transaction
   pooler**, copie a URL e use como `DATABASE_URL`.
3. Em **Project Settings → API**, copie `Project URL` e `anon public key`
   para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Rode as migrations apontando para o Supabase: `npm run db:migrate` e
   depois `npm run db:seed` (uma única vez).
5. Em **Authentication → Users**, crie o primeiro usuário (e-mail/senha) que
   vai acessar o painel — o login não tem cadastro público por design.
6. Faça o deploy do repositório na [Vercel](https://vercel.com), configurando
   as 3 variáveis de ambiente acima.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` / `npm run start` | Build e execução em produção |
| `npm run db:generate` | Gera uma nova migration a partir de `src/db/schema.ts` |
| `npm run db:migrate` | Aplica migrations pendentes no banco |
| `npm run db:studio` | Abre o Drizzle Studio (explorador visual do banco) |
| `npm run db:seed` | Recarrega os dados originais da planilha (apaga e insere de novo) |

## Estrutura

```
src/
  db/
    schema.ts        # modelo de dados (12 tabelas, fiel às 6 abas da planilha)
    seed.ts           # carrega src/db/seed-data.json no banco
    seed-data.json      # dados extraídos da planilha original (fonte da verdade)
  app/
    login/             # autenticação (Supabase)
    (app)/              # área autenticada
      page.tsx           # painel geral
      obras/              # aba "Obras 2025"/"Obras 2026"
      taxas/               # aba "Taxas de Obras"
      corretores/           # aba "Corretores"
      lotes/                 # aba "Compra de Lotes"
      investidores/           # aba "Investidores"
```

## Próximos passos sugeridos

- Exportação em PDF/Excel por obra (para enviar a investidores/CEF).
- Papéis de usuário (admin vs. leitura) via Supabase Row Level Security.
- Anexo de documentos por obra (contratos, laudos) usando Supabase Storage.
- Alertas automáticos de prazo de obra vencendo (`prazo_termino`).
