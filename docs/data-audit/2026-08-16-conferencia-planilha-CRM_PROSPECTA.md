# Conferência de fidelidade — CRM_PROSPECTA.xlsx vs. banco de dados atual

**Data:** 2026-08-16
**Arquivo conferido:** `CRM_PROSPECTA.xlsx` (enviado pelo usuário no chat)
**Método:** comparação programática (Python/openpyxl) célula a célula entre as 6 abas da planilha original e `src/db/seed-data.json` (fonte de carga do banco via `npm run db:seed`).

## Resultado geral

| Aba | Linhas confrontadas | Divergências reais | Status |
|---|---|---|---|
| Obras 2025 | 13 obras, 33 campos cada | 0 | ✅ Fiel |
| Obras 2026 | 25 obras, 34 campos cada | **17 obras com `Lucro Investidor` e `Lucro Cliente` trocados entre si** | ⚠️ Bug confirmado |
| Taxas de Obras | 32 combinações cliente/ano, ~17 categorias cada | 0 | ✅ Fiel |
| Corretores | 15 comissões | 0 | ✅ Fiel |
| Compra de Lotes | 22 lotes em 3 empreendimentos | 0 | ✅ Fiel |
| Investidores | 4 investidores (aportes, saldos mensais, saques) | 0 | ✅ Fiel |

Totais consolidados (VGV, Lucro Total, comissões, margem em lotes, capital investido) batem exatamente com a planilha em todas as abas, inclusive em Obras 2026 (o bug abaixo não afeta o Lucro Total, só a categoria interna).

## Bug confirmado: troca de colunas em "Obras 2026"

A aba **Obras 2026** tem uma coluna extra ("Lucro Cliente") que não existe em "Obras 2025". No script original que gerou `seed-data.json`, os valores de **`Lucro Investidor`** e **`Lucro Cliente`** ficaram invertidos para as 17 obras onde pelo menos um dos dois campos é diferente de zero.

Isso está armazenado no banco (`obras.lucro_investidor`, `obras.lucro_cliente`) e é editável na tela `/obras/[id]/editar` (campos "Lucro Investidor" / "Lucro Cliente" em `ObraForm.tsx`). Ainda não aparece em nenhum relatório agregado (painel geral não soma esses campos separadamente), mas está errado no cadastro de cada obra afetada.

### Obras afetadas (planilha → correto)

| Cliente | Lucro Investidor (correto) | Lucro Cliente (correto) |
|---|---:|---:|
| Luciano ( Walisson SW4 ) | 16.307,43 | 15.220,27 |
| Joao Flavio - Jardim America | 0,00 | 36.000,00 |
| Daniel Melo Lima | 0,00 | 24.800,00 |
| Silmara Maciel Macedo | 0,00 | 26.833,33 |
| Felipe Sousa Nascimento | 0,00 | 31.633,33 |
| D'Anne Almeida Rodrigues | 0,00 | 34.833,33 |
| Mylca Costa de Oliveira | 0,00 | 23.953,33 |
| Vilde Luana Pereira de Sousa | 0,00 | 15.593,33 |
| Jeova da Silva Azevedo | 0,00 | 15.593,33 |
| Pedro Rodrigues Leal Neto | 0,00 | 15.593,33 |
| Luzia Marcia Alves de Sousa | 0,00 | 15.593,33 |
| Evenllyn Vitoria Domingas Rodrigues da Luz | 0,00 | 15.593,33 |
| Jeferson Sousa Silva | 0,00 | 25.400,00 |
| Luciano Oliveira Leite | 0,00 | 34.833,33 |
| Keilane Pereira da Costa | 0,00 | 38.000,00 |
| Lot. Morada do Bosque (2 lotes) | 0,00 | 31.633,33 (cada) |
| Lot. Morada do Bosque *Reginaldo | 0,00 | 36.920,00 |
| Vanessa Viana Boado Quiroga | 0,00 | 212.568,23 |
| Jesse ( Aurora ) | 25.676,13 | 0,00 |
| Joelson da Cruz dos Santos | 0,00 | 27.000,00 |
| Leonardo Santos do Prado | 0,00 | 100.000,00 |

(Hoje o banco tem essas duas colunas com os valores invertidos.)

### Divergência cosmética (não urgente)

5 obras de 2026 têm `empreiteiro: null` no banco onde a planilha tem a célula literalmente vazia (deveria ser string vazia `""` por consistência, mas não afeta valores financeiros).

## Script de verificação

`verify2.py` (scratchpad da sessão) — compara Obras 2025/2026, Corretores, Compra de Lotes, Taxas de Obras (agregado por cliente/ano) e Investidores linha a linha / total a total contra o `seed-data.json`.
