import Link from "next/link";
import { getAnotacoes, getObras } from "@/lib/queries";
import { formatBRL, formatDate, formatPercent, num } from "@/lib/format";
import { Card, PageHeader, Pill, Tabs, Td, Th } from "@/components/ui";
import { statusTone } from "@/lib/status";

export default async function ObrasPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano: anoParam } = await searchParams;
  const ano = anoParam === "2026" ? 2026 : 2025;

  const [rows, anotacoes] = await Promise.all([getObras(ano), getAnotacoes("obras", ano)]);

  const MONEY_FIELDS = [
    "vgv",
    "vlrFinanciado",
    "fgts",
    "subsidio",
    "entrada",
    "vlrPagoEntrada",
    "vlrReceberEntrada",
    "vlrRecebidoCef",
    "vlrGastoObra",
    "vlrReceberCef",
    "custoLote",
    "vlrComissaoCorretor",
    "corretorJaRecebeu",
    "custoObra",
    "vlrDisponivel",
    "vlrTerminarObra",
    "lucroEstimado",
    "lucroInvestidor",
    "lucroCliente",
    "lucroProspecta",
    "proSoluto",
    "vlrParcela",
    "valorFinal",
    "lucroTotal",
  ] as const;

  const totais = rows.reduce((acc, r) => {
    for (const field of MONEY_FIELDS) acc[field] += num(r[field]);
    return acc;
  }, Object.fromEntries(MONEY_FIELDS.map((f) => [f, 0])) as Record<(typeof MONEY_FIELDS)[number], number>);

  const grupos = new Map<string, typeof anotacoes>();
  for (const a of anotacoes) {
    const key = a.grupo ?? "Geral";
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(a);
  }

  return (
    <div>
      <PageHeader
        title="Obras"
        description="Controle completo de vendas, financiamento CEF, custos e lucro por obra — equivalente às abas “Obras 2025” e “Obras 2026”."
        action={
          <Link
            href="/obras/novo"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Nova obra
          </Link>
        }
      />

      <Tabs
        basePath="/obras"
        active={String(ano)}
        items={[
          { value: "2025", label: "Obras 2025" },
          { value: "2026", label: "Obras 2026" },
        ]}
      />

      <p className="mb-2 text-xs text-slate-400">
        Tabela completa, igual à planilha original — arraste para o lado para ver todas as colunas.
      </p>
      <Card className="overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th>Cliente</Th>
              <Th>Status</Th>
              <Th>Empreiteiro</Th>
              <Th>Cidade / UF</Th>
              <Th className="text-right">VGV</Th>
              <Th className="text-right">Vlr Financiado</Th>
              <Th className="text-right">FGTS</Th>
              <Th className="text-right">Subsídio</Th>
              <Th className="text-right">Entrada</Th>
              <Th className="text-right">Vlr já Pago Entrada</Th>
              <Th className="text-right">Vlr a Receber Entrada</Th>
              <Th className="text-right">% PLS CEF</Th>
              <Th className="text-right">% Real Recebida</Th>
              <Th className="text-right">Vlr Recebido CEF</Th>
              <Th className="text-right">Vlr Gasto Obra</Th>
              <Th className="text-right">Vlr a Receber CEF</Th>
              <Th className="text-right">Custo do Lote</Th>
              <Th className="text-right">Comissão Corretor</Th>
              <Th className="text-right">Corretor já Recebeu</Th>
              <Th className="text-right">Custo de Obra</Th>
              <Th className="text-right">Vlr Disponível</Th>
              <Th className="text-right">Vlr p/ Terminar Obra</Th>
              <Th>Prazo Início</Th>
              <Th className="text-right">Dias de Obra</Th>
              <Th>Prazo Término</Th>
              <Th className="text-right">Lucro Estimado</Th>
              <Th className="text-right">Lucro Investidor</Th>
              {ano === 2026 ? <Th className="text-right">Lucro Cliente</Th> : null}
              <Th className="text-right">Lucro Prospecta</Th>
              <Th className="text-right">Pró Soluto</Th>
              <Th className="text-right">Taxa</Th>
              <Th className="text-right">Qtd Parcelas</Th>
              <Th className="text-right">Vlr Parcela</Th>
              <Th className="text-right">Valor Final</Th>
              <Th className="text-right">Lucro Total</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">
                  <Link href={`/obras/${r.id}`} className="hover:underline">
                    {r.cliente}
                  </Link>
                </Td>
                <Td>
                  <Pill tone={statusTone(r.status)}>{r.status || "—"}</Pill>
                </Td>
                <Td>{r.empreiteiro || "—"}</Td>
                <Td>{r.cidadeUf || "—"}</Td>
                <Td className="text-right">{formatBRL(r.vgv)}</Td>
                <Td className="text-right">{formatBRL(r.vlrFinanciado)}</Td>
                <Td className="text-right">{formatBRL(r.fgts)}</Td>
                <Td className="text-right">{formatBRL(r.subsidio)}</Td>
                <Td className="text-right">{formatBRL(r.entrada)}</Td>
                <Td className="text-right">{formatBRL(r.vlrPagoEntrada)}</Td>
                <Td className="text-right">{formatBRL(r.vlrReceberEntrada)}</Td>
                <Td className="text-right">{formatPercent(r.pctPlsCef)}</Td>
                <Td className="text-right">{formatPercent(r.pctRealRecebida)}</Td>
                <Td className="text-right">{formatBRL(r.vlrRecebidoCef)}</Td>
                <Td className="text-right">{formatBRL(r.vlrGastoObra)}</Td>
                <Td className="text-right">{formatBRL(r.vlrReceberCef)}</Td>
                <Td className="text-right">{formatBRL(r.custoLote)}</Td>
                <Td className="text-right">{formatBRL(r.vlrComissaoCorretor)}</Td>
                <Td className="text-right">{formatBRL(r.corretorJaRecebeu)}</Td>
                <Td className="text-right">{formatBRL(r.custoObra)}</Td>
                <Td className={`text-right ${num(r.vlrDisponivel) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatBRL(r.vlrDisponivel)}
                </Td>
                <Td className="text-right">{formatBRL(r.vlrTerminarObra)}</Td>
                <Td>{formatDate(r.prazoInicio)}</Td>
                <Td className="text-right">{r.diasObra}</Td>
                <Td>{formatDate(r.prazoTermino)}</Td>
                <Td className={`text-right ${num(r.lucroEstimado) < 0 ? "text-red-600" : "text-slate-700"}`}>
                  {formatBRL(r.lucroEstimado)}
                </Td>
                <Td className="text-right">{formatBRL(r.lucroInvestidor)}</Td>
                {ano === 2026 ? <Td className="text-right">{formatBRL(r.lucroCliente)}</Td> : null}
                <Td className="text-right">{formatBRL(r.lucroProspecta)}</Td>
                <Td className="text-right">{formatBRL(r.proSoluto)}</Td>
                <Td className="text-right">{formatPercent(r.taxa)}</Td>
                <Td className="text-right">{num(r.qtdParcelas)}</Td>
                <Td className="text-right">{formatBRL(r.vlrParcela)}</Td>
                <Td className="text-right">{formatBRL(r.valorFinal)}</Td>
                <Td className={`text-right font-medium ${num(r.lucroTotal) < 0 ? "text-red-600" : "text-emerald-700"}`}>
                  {formatBRL(r.lucroTotal)}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
            <tr>
              <Td colSpan={4} className="font-semibold text-slate-900">
                TOTAIS ({rows.length} obras)
              </Td>
              <Td className="text-right">{formatBRL(totais.vgv)}</Td>
              <Td className="text-right">{formatBRL(totais.vlrFinanciado)}</Td>
              <Td className="text-right">{formatBRL(totais.fgts)}</Td>
              <Td className="text-right">{formatBRL(totais.subsidio)}</Td>
              <Td className="text-right">{formatBRL(totais.entrada)}</Td>
              <Td className="text-right">{formatBRL(totais.vlrPagoEntrada)}</Td>
              <Td className="text-right">{formatBRL(totais.vlrReceberEntrada)}</Td>
              <Td />
              <Td />
              <Td className="text-right">{formatBRL(totais.vlrRecebidoCef)}</Td>
              <Td className="text-right">{formatBRL(totais.vlrGastoObra)}</Td>
              <Td className="text-right">{formatBRL(totais.vlrReceberCef)}</Td>
              <Td className="text-right">{formatBRL(totais.custoLote)}</Td>
              <Td className="text-right">{formatBRL(totais.vlrComissaoCorretor)}</Td>
              <Td className="text-right">{formatBRL(totais.corretorJaRecebeu)}</Td>
              <Td className="text-right">{formatBRL(totais.custoObra)}</Td>
              <Td className={`text-right ${totais.vlrDisponivel < 0 ? "text-red-600" : "text-emerald-700"}`}>
                {formatBRL(totais.vlrDisponivel)}
              </Td>
              <Td className="text-right">{formatBRL(totais.vlrTerminarObra)}</Td>
              <Td />
              <Td />
              <Td />
              <Td className="text-right">{formatBRL(totais.lucroEstimado)}</Td>
              <Td className="text-right">{formatBRL(totais.lucroInvestidor)}</Td>
              {ano === 2026 ? <Td className="text-right">{formatBRL(totais.lucroCliente)}</Td> : null}
              <Td className="text-right">{formatBRL(totais.lucroProspecta)}</Td>
              <Td className="text-right">{formatBRL(totais.proSoluto)}</Td>
              <Td />
              <Td />
              <Td className="text-right">{formatBRL(totais.vlrParcela)}</Td>
              <Td className="text-right">{formatBRL(totais.valorFinal)}</Td>
              <Td className="text-right">{formatBRL(totais.lucroTotal)}</Td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {grupos.size > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Anotações e resumos financeiros da planilha original
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...grupos.entries()].map(([grupo, itens]) => (
              <Card key={grupo}>
                <p className="text-sm font-semibold text-slate-900">{grupo}</p>
                <ul className="mt-3 space-y-1.5">
                  {itens.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-slate-500">{item.rotulo}</span>
                      <span className="text-right font-medium text-slate-800">
                        {item.valor !== null ? formatBRL(item.valor) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
