import { getCorretores } from "@/lib/queries";
import { formatBRL, inputMoney, num } from "@/lib/format";
import { Card, PageHeader, StatCard, Th } from "@/components/ui";
import { createComissao, deleteComissao, updateComissao } from "./actions";

export default async function CorretoresPage() {
  const rows = await getCorretores();

  const totais = rows.reduce(
    (acc, r) => ({
      comissaoTotal: acc.comissaoTotal + num(r.comissaoTotal),
      parcela1: acc.parcela1 + num(r.parcela1),
      parcela2: acc.parcela2 + num(r.parcela2),
      parcela3: acc.parcela3 + num(r.parcela3),
      parcela4: acc.parcela4 + num(r.parcela4),
    }),
    { comissaoTotal: 0, parcela1: 0, parcela2: 0, parcela3: 0, parcela4: 0 }
  );
  const pago = totais.parcela1 + totais.parcela2 + totais.parcela3 + totais.parcela4;

  return (
    <div>
      <PageHeader title="Corretores" description="Controle de comissões por lote/cliente e parcelas pagas — aba “Corretores”." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Comissões totais" value={formatBRL(totais.comissaoTotal)} />
        <StatCard label="Já pago (1ª a 4ª pcl)" value={formatBRL(pago)} />
        <StatCard label="Saldo a pagar" value={formatBRL(totais.comissaoTotal - pago)} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th>Cliente / Lote</Th>
              <Th>Corretor</Th>
              <Th className="text-right">Comissão</Th>
              <Th className="text-right">1ª Pcl</Th>
              <Th className="text-right">2ª Pcl</Th>
              <Th className="text-right">3ª Pcl</Th>
              <Th className="text-right">4ª Pcl</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const updateWithId = updateComissao.bind(null, r.id);
              const deleteWithId = deleteComissao.bind(null, r.id);
              const formId = `corretor-${r.id}`;
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-1.5">
                    <input
                      form={formId}
                      name="clienteLote"
                      defaultValue={r.clienteLote}
                      className="w-48 rounded border border-transparent px-1.5 py-1 text-sm hover:border-slate-200 focus:border-slate-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      form={formId}
                      name="corretor"
                      defaultValue={r.corretor}
                      className="w-32 rounded border border-transparent px-1.5 py-1 text-sm hover:border-slate-200 focus:border-slate-400 focus:outline-none"
                    />
                  </td>
                  {(["comissaoTotal", "parcela1", "parcela2", "parcela3", "parcela4"] as const).map((field) => (
                    <td key={field} className="px-2 py-1.5">
                      <input
                        form={formId}
                        type="number"
                        step="0.01"
                        name={field}
                        defaultValue={inputMoney(r[field])}
                        className="w-24 rounded border border-transparent px-1.5 py-1 text-right text-sm hover:border-slate-200 focus:border-slate-400 focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-1.5 text-right">
                    <form id={formId} action={updateWithId} className="inline" />
                    <button
                      form={formId}
                      type="submit"
                      className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Salvar
                    </button>
                    <form action={deleteWithId} className="inline">
                      <button type="submit" className="ml-2 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
            <tr>
              <td className="px-3 py-2 text-sm text-slate-900" colSpan={2}>
                TOTAIS
              </td>
              <td className="px-3 py-2 text-right text-sm">{formatBRL(totais.comissaoTotal)}</td>
              <td className="px-3 py-2 text-right text-sm">{formatBRL(totais.parcela1)}</td>
              <td className="px-3 py-2 text-right text-sm">{formatBRL(totais.parcela2)}</td>
              <td className="px-3 py-2 text-right text-sm">{formatBRL(totais.parcela3)}</td>
              <td className="px-3 py-2 text-right text-sm">{formatBRL(totais.parcela4)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </Card>

      <Card className="mt-6">
        <p className="mb-4 text-sm font-semibold text-slate-900">Adicionar nova comissão</p>
        <form action={createComissao} className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <input
            name="clienteLote"
            placeholder="Cliente / Lote"
            required
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none sm:col-span-2"
          />
          <input
            name="corretor"
            placeholder="Corretor"
            required
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          />
          <input name="comissaoTotal" type="number" step="0.01" placeholder="Comissão" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          <input name="parcela1" type="number" step="0.01" placeholder="1ª Pcl" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          <input name="parcela2" type="number" step="0.01" placeholder="2ª Pcl" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
            Adicionar
          </button>
        </form>
      </Card>
    </div>
  );
}
