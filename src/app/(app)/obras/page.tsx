import Link from "next/link";
import { getAnotacoes, getObras } from "@/lib/queries";
import { formatBRL, formatDate, num } from "@/lib/format";
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

  const totais = rows.reduce(
    (acc, r) => ({
      vgv: acc.vgv + num(r.vgv),
      vlrFinanciado: acc.vlrFinanciado + num(r.vlrFinanciado),
      fgts: acc.fgts + num(r.fgts),
      subsidio: acc.subsidio + num(r.subsidio),
      vlrReceberCef: acc.vlrReceberCef + num(r.vlrReceberCef),
      custoObra: acc.custoObra + num(r.custoObra),
      vlrDisponivel: acc.vlrDisponivel + num(r.vlrDisponivel),
      lucroEstimado: acc.lucroEstimado + num(r.lucroEstimado),
      lucroProspecta: acc.lucroProspecta + num(r.lucroProspecta),
      lucroTotal: acc.lucroTotal + num(r.lucroTotal),
    }),
    {
      vgv: 0,
      vlrFinanciado: 0,
      fgts: 0,
      subsidio: 0,
      vlrReceberCef: 0,
      custoObra: 0,
      vlrDisponivel: 0,
      lucroEstimado: 0,
      lucroProspecta: 0,
      lucroTotal: 0,
    }
  );

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
              <Th className="text-right">Custo de Obra</Th>
              <Th className="text-right">Vlr Disponível</Th>
              <Th className="text-right">Lucro Estimado</Th>
              <Th className="text-right">Lucro Total</Th>
              <Th>Prazo Término</Th>
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
                <Td className="text-right">{formatBRL(r.custoObra)}</Td>
                <Td className={`text-right ${num(r.vlrDisponivel) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatBRL(r.vlrDisponivel)}
                </Td>
                <Td className={`text-right ${num(r.lucroEstimado) < 0 ? "text-red-600" : "text-slate-700"}`}>
                  {formatBRL(r.lucroEstimado)}
                </Td>
                <Td className={`text-right font-medium ${num(r.lucroTotal) < 0 ? "text-red-600" : "text-emerald-700"}`}>
                  {formatBRL(r.lucroTotal)}
                </Td>
                <Td>{formatDate(r.prazoTermino)}</Td>
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
              <Td className="text-right">{formatBRL(totais.custoObra)}</Td>
              <Td className={`text-right ${totais.vlrDisponivel < 0 ? "text-red-600" : "text-emerald-700"}`}>
                {formatBRL(totais.vlrDisponivel)}
              </Td>
              <Td className="text-right">{formatBRL(totais.lucroEstimado)}</Td>
              <Td className="text-right">{formatBRL(totais.lucroTotal)}</Td>
              <Td />
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
