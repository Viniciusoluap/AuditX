import { getAnotacoes, getTaxasByAno } from "@/lib/queries";
import { formatBRL, inputMoney, num } from "@/lib/format";
import { Card, PageHeader, StatCard, Tabs } from "@/components/ui";
import { updateTaxasCliente } from "./actions";

export default async function TaxasPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano: anoParam } = await searchParams;
  const ano = anoParam === "2026" ? 2026 : 2025;

  const [rows, anotacoes] = await Promise.all([getTaxasByAno(ano), getAnotacoes("taxas_obra", ano)]);

  const porCliente = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!porCliente.has(r.cliente)) porCliente.set(r.cliente, []);
    porCliente.get(r.cliente)!.push(r);
  }

  const totalPrevisto = rows.reduce((s, r) => s + num(r.valorPrevisto), 0);
  const totalPago = rows.reduce((s, r) => s + num(r.valorPago), 0);

  return (
    <div>
      <PageHeader
        title="Taxas de Obra"
        description="Taxas, cartório, projetos e demais despesas administrativas previstas e pagas por cliente — aba “Taxas de Obras”."
      />

      <Tabs
        basePath="/taxas"
        active={String(ano)}
        items={[
          { value: "2025", label: "2025" },
          { value: "2026", label: "2026" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total previsto" value={formatBRL(totalPrevisto)} />
        <StatCard label="Total pago" value={formatBRL(totalPago)} />
        <StatCard
          label="Saldo a receber/pagar"
          value={formatBRL(totalPrevisto - totalPago)}
          tone={totalPrevisto - totalPago > 0 ? "warning" as never : "positive"}
        />
      </div>

      {anotacoes.length ? (
        <Card className="mb-6">
          <p className="text-sm font-semibold text-slate-900">Totais da planilha original ({ano})</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {anotacoes.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{a.rotulo}</span>
                <span className="font-medium text-slate-800">{a.valor !== null ? formatBRL(a.valor) : ""}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...porCliente.entries()].map(([cliente, itens]) => {
          const previsto = itens.reduce((s, i) => s + num(i.valorPrevisto), 0);
          const pago = itens.reduce((s, i) => s + num(i.valorPago), 0);
          const action = updateTaxasCliente.bind(null, ano, cliente);
          return (
            <Card key={cliente} className="p-0">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{cliente}</p>
                <p className="text-xs text-slate-500">
                  Previsto {formatBRL(previsto)} • Pago {formatBRL(pago)}
                </p>
              </div>
              <form action={action}>
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500">
                      <th className="px-4 py-2 text-left font-medium">Taxa</th>
                      <th className="px-2 py-2 text-right font-medium">Previsto</th>
                      <th className="px-2 py-2 text-right font-medium">Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {itens.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-1.5 text-slate-600">
                          {item.tipo}
                          <input type="hidden" name="taxaId" value={item.id} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            step="0.01"
                            name={`previsto-${item.id}`}
                            defaultValue={inputMoney(item.valorPrevisto)}
                            className="w-24 rounded border border-slate-200 px-1.5 py-1 text-right text-xs focus:border-slate-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            step="0.01"
                            name={`pago-${item.id}`}
                            defaultValue={inputMoney(item.valorPago)}
                            className="w-24 rounded border border-slate-200 px-1.5 py-1 text-right text-xs focus:border-slate-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end px-4 py-3">
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
