import Link from "next/link";
import { getEmpreendimentosComLotes } from "@/lib/queries";
import { formatBRL, num } from "@/lib/format";
import { Card, PageHeader, Pill, Th } from "@/components/ui";
import { MoneyInput } from "@/components/money-input";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createLote, deleteLote, updateLote } from "./actions";

export default async function LotesPage() {
  const empreendimentos = await getEmpreendimentosComLotes();

  return (
    <div>
      <PageHeader
        title="Compra de Lotes"
        description="Controle de aquisição de lotes por empreendimento — valor de avaliação, repasse CEF e margem Prospecta — aba “Compra de Lotes”."
      />

      <div className="space-y-8">
        {empreendimentos.map((emp) => {
          const totalAvaliacao = emp.lotes.reduce((s, l) => s + num(l.valorAvaliacao), 0);
          const totalPagoCef = emp.lotes.reduce((s, l) => s + num(l.valorPagoCef), 0);
          const totalTerceiro = emp.lotes.reduce((s, l) => s + num(l.valorTerceiro), 0);
          const totalProspecta = emp.lotes.reduce((s, l) => s + num(l.valorProspecta), 0);
          const terceiroLabel = emp.lotes[0]?.valorTerceiroLabel ?? "Valor terceiro";
          const createWithEmp = createLote.bind(null, emp.id);
          const disponiveis = emp.lotes.filter((l) => !l.obra).length;

          return (
            <div key={emp.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{emp.nome}</h2>
                <Pill tone={disponiveis > 0 ? "warning" : "default"}>
                  {disponiveis} de {emp.lotes.length} lote{emp.lotes.length === 1 ? "" : "s"} disponível
                  {disponiveis === 1 ? "" : "eis"}
                </Pill>
              </div>
              <Card className="overflow-x-auto p-0">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Lote</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Valor de Avaliação</Th>
                      <Th className="text-right">Valor Pago pela CEF</Th>
                      <Th className="text-right">{terceiroLabel}</Th>
                      <Th className="text-right">Valor Prospecta</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {emp.lotes.map((l) => {
                      const formId = `lote-${l.id}`;
                      const updateWithId = updateLote.bind(null, l.id);
                      const deleteWithId = deleteLote.bind(null, l.id);
                      return (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5">
                            <input
                              form={formId}
                              name="lote"
                              defaultValue={l.lote}
                              className="w-44 rounded border border-transparent px-1.5 py-1 text-sm hover:border-slate-200 focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            {l.obra ? (
                              <Link href={`/obras/${l.obra.id}`} className="hover:underline">
                                <Pill tone="positive">Vendido — {l.obra.cliente}</Pill>
                              </Link>
                            ) : (
                              <Pill tone="warning">Disponível</Pill>
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <MoneyInput
                              formId={formId}
                              name="valorAvaliacao"
                              defaultValue={l.valorAvaliacao}
                              className="w-28 rounded border border-transparent px-1.5 py-1 text-right text-sm hover:border-slate-200 focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <MoneyInput
                              formId={formId}
                              name="valorPagoCef"
                              defaultValue={l.valorPagoCef}
                              className="w-28 rounded border border-transparent px-1.5 py-1 text-right text-sm hover:border-slate-200 focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <MoneyInput
                              formId={formId}
                              name="valorTerceiro"
                              defaultValue={l.valorTerceiro}
                              className="w-28 rounded border border-transparent px-1.5 py-1 text-right text-sm hover:border-slate-200 focus:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right text-sm font-medium text-emerald-700">
                            {formatBRL(l.valorProspecta)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-right">
                            <form id={formId} action={updateWithId} />
                            <button
                              form={formId}
                              type="submit"
                              className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                            >
                              Salvar
                            </button>
                            <ConfirmSubmitButton
                              action={deleteWithId}
                              confirmMessage={`Excluir o lote "${l.lote}"? Esta ação não pode ser desfeita.`}
                              formClassName="inline"
                              className="ml-2 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                            >
                              Excluir
                            </ConfirmSubmitButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                    <tr>
                      <td className="px-3 py-2 text-sm">TOTAL</td>
                      <td />
                      <td className="px-3 py-2 text-right text-sm">{formatBRL(totalAvaliacao)}</td>
                      <td className="px-3 py-2 text-right text-sm">{formatBRL(totalPagoCef)}</td>
                      <td className="px-3 py-2 text-right text-sm">{formatBRL(totalTerceiro)}</td>
                      <td className="px-3 py-2 text-right text-sm">{formatBRL(totalProspecta)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </Card>

              <form action={createWithEmp} className="mt-3 flex flex-wrap gap-2">
                <input name="lote" placeholder="Novo lote" required className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1" />
                <MoneyInput name="valorAvaliacao" placeholder="Avaliação" className="w-32 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1" />
                <MoneyInput name="valorPagoCef" placeholder="Pago CEF" className="w-32 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1" />
                <input name="valorTerceiroLabel" placeholder={terceiroLabel} defaultValue={terceiroLabel} className="w-36 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1" />
                <MoneyInput name="valorTerceiro" placeholder="Valor terceiro" className="w-32 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1" />
                <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
                  + Lote
                </button>
              </form>

              {emp.resumo.length ? (
                <Card className="mt-3">
                  <p className="mb-2 text-sm font-semibold text-slate-900">Resumo financeiro</p>
                  <ul className="space-y-1.5">
                    {emp.resumo.map((r) => (
                      <li key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{r.descricao}</span>
                        <span className="font-medium text-slate-800">{formatBRL(r.valor)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
