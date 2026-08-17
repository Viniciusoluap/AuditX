-- Aplicada diretamente no projeto Supabase de produção em 2026-08-16 via MCP
-- (não gerada por `drizzle-kit generate`, porque este projeto não modela RLS
-- em src/db/schema.ts). Mantida aqui só como registro reprodutível.
--
-- Motivo: `get_advisors` (security) apontou as 12 tabelas com RLS desabilitado
-- — qualquer um com a anon key pública (embutida no bundle do site) conseguia
-- ler e escrever nos dados financeiros direto pela API REST do Supabase,
-- sem passar pelo login. A conexão do próprio app usa o papel `postgres`
-- (DATABASE_URL), que tem BYPASSRLS = true, então isso não muda em nada o
-- funcionamento do site — só fecha o acesso público via API REST.
--
-- Nenhuma policy foi criada de propósito: RLS habilitado sem nenhuma policy
-- é "nega tudo" por padrão para os papéis `anon`/`authenticated` (nenhum dos
-- dois tem BYPASSRLS). Se um dia o app passar a acessar o banco via
-- PostgREST/Supabase client (em vez da conexão direta atual), será
-- necessário criar policies explícitas para o papel `authenticated`.

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxas_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corretores_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lote_resumo_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investidor_aportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investidor_saldos_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investidor_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anotacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
