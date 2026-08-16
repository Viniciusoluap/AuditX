import { getInvestidoresCompletos } from "@/lib/queries";
import { formatBRL, formatDate, formatPercent, num } from "@/lib/format";
import { Card, PageHeader, Pill } from "@/components/ui";
import { MoneyInput } from "@/components/money-input";
import { createInvestidor, registrarMovimento, registrarSaldoMensal } from "./actions";

export default async function InvestidoresPage() {
  const investidores = await getInvestidoresCompletos();

  return (
    <div>
      <PageHeader
        title="Investidores"
        description="Aportes com juros mensais compostos, saques e prorrogações — aba “Investidores”."
      />

      <div className="space-y-6">
        {investidores.map((inv) => (
          <Card key={inv.id}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-slate-900">{inv.nome}</p>
                {inv.ehDivida ? <Pill tone="warning">Passivo / dívida</Pill> : <Pill tone="positive">Investidor</Pill>}
              </div>
            </div>

            {inv.aportes.map((aporte) => {
              const ultimoSaldo = aporte.saldos[aporte.saldos.length - 1];
              const totalSaques = aporte.movimentos.reduce((s, m) => s + num(m.valor), 0);
              const registrarSaldoAction = registrarSaldoMensal.bind(null, aporte.id);
              const registrarMovimentoAction = registrarMovimento.bind(null, aporte.id);

              return (
                <div key={aporte.id} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                  <div className="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-500">Data do aporte</p>
                      <p className="text-sm font-medium text-slate-900">{formatDate(aporte.dataAporte)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Valor inicial</p>
                      <p className="text-sm font-medium text-slate-900">{formatBRL(aporte.valorInicial)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Taxa mensal</p>
                      <p className="text-sm font-medium text-slate-900">{formatPercent(aporte.taxaMensal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Saldo atual</p>
                      <p className="text-sm font-semibold text-emerald-700">{formatBRL(ultimoSaldo?.saldo ?? aporte.valorInicial)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase text-slate-400">Histórico de saldo mensal</p>
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-50">
                          {aporte.saldos.map((s) => (
                            <tr key={s.id}>
                              <td className="py-1 text-slate-500">{formatDate(s.mesRef)}</td>
                              <td className="py-1 text-right font-medium text-slate-800">{formatBRL(s.saldo)}</td>
                              <td className="py-1 text-right text-xs text-slate-400">
                                {s.jurosMes ? `juros: ${formatBRL(s.jurosMes)}` : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <form action={registrarSaldoAction} className="mt-2 flex gap-2">
                        <input
                          type="date"
                          name="mesRef"
                          required
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none"
                        />
                        <MoneyInput
                          name="saldo"
                          placeholder="Novo saldo"
                          className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none"
                        />
                        <button type="submit" className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800">
                          Registrar mês
                        </button>
                      </form>
                    </div>

                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase text-slate-400">
                        Saques / Prorrogações {totalSaques ? `(total: ${formatBRL(totalSaques)})` : ""}
                      </p>
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-50">
                          {aporte.movimentos.map((m) => (
                            <tr key={m.id}>
                              <td className="py-1 capitalize text-slate-500">{m.tipo}</td>
                              <td className="py-1 text-slate-500">{formatDate(m.data)}</td>
                              <td className="py-1 text-right font-medium text-slate-800">{formatBRL(m.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <form action={registrarMovimentoAction} className="mt-2 flex gap-2">
                        <select name="tipo" className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none">
                          <option value="saque">Saque</option>
                          <option value="prorrogacao">Prorrogação</option>
                        </select>
                        <input type="date" name="data" className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none" />
                        <MoneyInput
                          name="valor"
                          placeholder="Valor"
                          className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none"
                        />
                        <button type="submit" className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800">
                          Registrar
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <p className="mb-4 text-sm font-semibold text-slate-900">Novo investidor / aporte</p>
        <form action={createInvestidor} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <input name="nome" placeholder="Nome" required className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none sm:col-span-2" />
          <input name="dataAporte" type="date" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          <MoneyInput name="valorInicial" placeholder="Valor inicial" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          <input name="taxaMensal" type="number" step="0.0001" placeholder="Taxa mensal (0.01 = 1%)" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none" />
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-4">
            <input type="checkbox" name="ehDivida" className="rounded border-slate-300" />
            Marcar como passivo/dívida (ex.: valores a pagar, não aporte de terceiro)
          </label>
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
            Adicionar
          </button>
        </form>
      </Card>
    </div>
  );
}
