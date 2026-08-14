ALTER TABLE "anotacoes_financeiras" ALTER COLUMN "valor" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "anotacoes_financeiras" ALTER COLUMN "valor_secundario" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "comissao_total" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "comissao_total" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "parcela_1" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "parcela_1" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "parcela_2" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "parcela_2" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "parcela_3" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "parcela_3" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "parcela_4" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "corretores_comissoes" ALTER COLUMN "parcela_4" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "investidor_aportes" ALTER COLUMN "valor_inicial" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "investidor_aportes" ALTER COLUMN "valor_inicial" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "investidor_movimentos" ALTER COLUMN "valor" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "investidor_movimentos" ALTER COLUMN "valor" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "investidor_saldos_mensais" ALTER COLUMN "saldo" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "investidor_saldos_mensais" ALTER COLUMN "saldo" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "investidor_saldos_mensais" ALTER COLUMN "juros_mes" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "lote_resumo_financeiro" ALTER COLUMN "valor" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "lote_resumo_financeiro" ALTER COLUMN "valor" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "valor_avaliacao" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "valor_avaliacao" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "valor_pago_cef" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "valor_pago_cef" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "valor_terceiro" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "valor_terceiro" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "valor_prospecta" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "lotes" ALTER COLUMN "valor_prospecta" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vgv" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vgv" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_financiado" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_financiado" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "fgts" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "fgts" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "subsidio" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "subsidio" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "entrada" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "entrada" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_pago_entrada" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_pago_entrada" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_receber_entrada" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_receber_entrada" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_recebido_cef" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_recebido_cef" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_gasto_obra" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_gasto_obra" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_receber_cef" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_receber_cef" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "custo_lote" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "custo_lote" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_comissao_corretor" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_comissao_corretor" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "corretor_ja_recebeu" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "corretor_ja_recebeu" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "custo_obra" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "custo_obra" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_disponivel" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_disponivel" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_terminar_obra" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_terminar_obra" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_estimado" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_estimado" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_investidor" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_investidor" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_cliente" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_cliente" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_prospecta" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_prospecta" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "pro_soluto" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "pro_soluto" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_parcela" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "vlr_parcela" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "valor_final" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "valor_final" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_total" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "obras" ALTER COLUMN "lucro_total" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "taxas_obra" ALTER COLUMN "valor_previsto" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "taxas_obra" ALTER COLUMN "valor_previsto" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "taxas_obra" ALTER COLUMN "valor_pago" SET DATA TYPE numeric(16, 4);--> statement-breakpoint
ALTER TABLE "taxas_obra" ALTER COLUMN "valor_pago" SET DEFAULT '0';