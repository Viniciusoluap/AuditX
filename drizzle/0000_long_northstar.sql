CREATE TABLE "anotacoes_financeiras" (
	"id" serial PRIMARY KEY NOT NULL,
	"modulo" text NOT NULL,
	"ano" integer,
	"grupo" text,
	"rotulo" text NOT NULL,
	"valor" numeric(14, 2),
	"valor_secundario" numeric(14, 2),
	"observacao" text,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuracoes" (
	"chave" text PRIMARY KEY NOT NULL,
	"valor" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corretores_comissoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"obra_id" integer,
	"cliente_lote" text NOT NULL,
	"corretor" text NOT NULL,
	"comissao_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"parcela_1" numeric(14, 2) DEFAULT '0' NOT NULL,
	"parcela_2" numeric(14, 2) DEFAULT '0' NOT NULL,
	"parcela_3" numeric(14, 2) DEFAULT '0' NOT NULL,
	"parcela_4" numeric(14, 2) DEFAULT '0' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "empreendimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investidor_aportes" (
	"id" serial PRIMARY KEY NOT NULL,
	"investidor_id" integer NOT NULL,
	"data_aporte" date NOT NULL,
	"valor_inicial" numeric(14, 2) DEFAULT '0' NOT NULL,
	"taxa_mensal" numeric(9, 6) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investidor_movimentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"aporte_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"data" date,
	"valor" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investidor_saldos_mensais" (
	"id" serial PRIMARY KEY NOT NULL,
	"aporte_id" integer NOT NULL,
	"mes_ref" date NOT NULL,
	"saldo" numeric(14, 2) DEFAULT '0' NOT NULL,
	"juros_mes" numeric(14, 2),
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investidores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"eh_divida" boolean DEFAULT false NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lote_resumo_financeiro" (
	"id" serial PRIMARY KEY NOT NULL,
	"empreendimento_id" integer NOT NULL,
	"descricao" text NOT NULL,
	"valor" numeric(14, 2) DEFAULT '0' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"empreendimento_id" integer NOT NULL,
	"lote" text NOT NULL,
	"valor_avaliacao" numeric(14, 2) DEFAULT '0' NOT NULL,
	"valor_pago_cef" numeric(14, 2) DEFAULT '0' NOT NULL,
	"valor_terceiro_label" text DEFAULT '' NOT NULL,
	"valor_terceiro" numeric(14, 2) DEFAULT '0' NOT NULL,
	"valor_prospecta" numeric(14, 2) DEFAULT '0' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obras" (
	"id" serial PRIMARY KEY NOT NULL,
	"ano" integer NOT NULL,
	"cliente" text NOT NULL,
	"status" text DEFAULT '' NOT NULL,
	"empreiteiro" text DEFAULT '',
	"cidade_uf" text DEFAULT '',
	"vgv" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vlr_financiado" numeric(14, 2) DEFAULT '0' NOT NULL,
	"fgts" numeric(14, 2) DEFAULT '0' NOT NULL,
	"subsidio" numeric(14, 2) DEFAULT '0' NOT NULL,
	"entrada" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vlr_pago_entrada" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vlr_receber_entrada" numeric(14, 2) DEFAULT '0' NOT NULL,
	"pct_pls_cef" numeric(9, 6) DEFAULT '0' NOT NULL,
	"pct_real_recebida" numeric(9, 6) DEFAULT '0' NOT NULL,
	"vlr_recebido_cef" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vlr_gasto_obra" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vlr_receber_cef" numeric(14, 2) DEFAULT '0' NOT NULL,
	"custo_lote" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vlr_comissao_corretor" numeric(14, 2) DEFAULT '0' NOT NULL,
	"corretor_ja_recebeu" numeric(14, 2) DEFAULT '0' NOT NULL,
	"custo_obra" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vlr_disponivel" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vlr_terminar_obra" numeric(14, 2) DEFAULT '0' NOT NULL,
	"prazo_inicio" date,
	"dias_obra" integer DEFAULT 0 NOT NULL,
	"prazo_termino" date,
	"lucro_estimado" numeric(14, 2) DEFAULT '0' NOT NULL,
	"lucro_investidor" numeric(14, 2) DEFAULT '0' NOT NULL,
	"lucro_cliente" numeric(14, 2) DEFAULT '0' NOT NULL,
	"lucro_prospecta" numeric(14, 2) DEFAULT '0' NOT NULL,
	"pro_soluto" numeric(14, 2) DEFAULT '0' NOT NULL,
	"taxa" numeric(9, 6) DEFAULT '0' NOT NULL,
	"qtd_parcelas" numeric(6, 2) DEFAULT '0' NOT NULL,
	"vlr_parcela" numeric(14, 2) DEFAULT '0' NOT NULL,
	"valor_final" numeric(14, 2) DEFAULT '0' NOT NULL,
	"lucro_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"observacoes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxas_obra" (
	"id" serial PRIMARY KEY NOT NULL,
	"obra_id" integer,
	"ano" integer NOT NULL,
	"cliente" text NOT NULL,
	"tipo" text NOT NULL,
	"categoria" text DEFAULT 'durante_obra' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"valor_previsto" numeric(14, 2) DEFAULT '0' NOT NULL,
	"valor_pago" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ADD CONSTRAINT "corretores_comissoes_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investidor_aportes" ADD CONSTRAINT "investidor_aportes_investidor_id_investidores_id_fk" FOREIGN KEY ("investidor_id") REFERENCES "public"."investidores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investidor_movimentos" ADD CONSTRAINT "investidor_movimentos_aporte_id_investidor_aportes_id_fk" FOREIGN KEY ("aporte_id") REFERENCES "public"."investidor_aportes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investidor_saldos_mensais" ADD CONSTRAINT "investidor_saldos_mensais_aporte_id_investidor_aportes_id_fk" FOREIGN KEY ("aporte_id") REFERENCES "public"."investidor_aportes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lote_resumo_financeiro" ADD CONSTRAINT "lote_resumo_financeiro_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxas_obra" ADD CONSTRAINT "taxas_obra_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;