import { db } from "@/db";
import { obras, taxasObra, corretoresComissoes, lotes, investidorAportes } from "@/db/schema";
import { formatBRL, num } from "@/lib/format";
import { Card, PageHeader, StatCard } from "@/components/ui";
import Link from "next/link";

export default async function DashboardPage() {
  const [todasObras, todasTaxas, todosCorretores, todosLotes, aportes] = await Promise.all([
    db.select().from(obras),
    db.select().from(taxasObra),
    db.select().from(corretoresComissoes),
    db.select().from(lotes),
    db.select().from(investidorAportes),
  ]);

  const anos = [2025, 2026] as const;
  const porAno = Object.fromEntries(
    anos.map((ano) => {
      const rows = todasObras.filter((o) => o.ano === ano);
      return [
        ano,
        {
          count: rows.length,
          vgv: rows.reduce((s, r) => s + num(r.vgv), 0),
          lucroTotal: rows.reduce((s, r) => s + num(r.lucroTotal), 0),
          lucroProspecta: rows.reduce((s, r) => s + num(r.lucroProspecta), 0),
          vlrDisponivel: rows.reduce((s, r) => s + num(r.vlrDisponivel), 0),
          vlrReceberCef: rows.reduce((s, r) => s + num(r.vlrReceberCef), 0),
        },
      ];
    })
  ) as Record<(typeof anos)[number], { count: number; vgv: number; lucroTotal: number; lucroProspecta: number; vlrDisponivel: number; vlrReceberCef: number }>;

  const taxasAReceber = todasTaxas.reduce((s, t) => s + (num(t.valorPrevisto) - num(t.valorPago)), 0);
  const comissoesTotais = todosCorretores.reduce((s, c) => s + num(c.comissaoTotal), 0);
  const comissoesPagas = todosCorretores.reduce(
    (s, c) => s + num(c.parcela1) + num(c.parcela2) + num(c.parcela3) + num(c.parcela4),
    0
  );
  const lotesValorProspecta = todosLotes.reduce((s, l) => s + num(l.valorProspecta), 0);
  const capitalInvestido = aportes.reduce((s, a) => s + num(a.valorInicial), 0);

  const statusCount = new Map<string, number>();
  for (const o of todasObras) {
    const key = o.status || "Sem status";
    statusCount.set(key, (statusCount.get(key) ?? 0) + 1);
  }

  return (
    <div>
      <PageHeader
        title="Painel Geral"
        description="Visão consolidada de todas as obras, taxas, comissões, lotes e investidores da Prospecta Construções."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Obras 2025" value={String(porAno[2025].count)} hint={`VGV: ${formatBRL(porAno[2025].vgv)}`} />
        <StatCard label="Obras 2026" value={String(porAno[2026].count)} hint={`VGV: ${formatBRL(porAno[2026].vgv)}`} />
        <StatCard
          label="Lucro total (2025+2026)"
          value={formatBRL(porAno[2025].lucroTotal + porAno[2026].lucroTotal)}
          tone={porAno[2025].lucroTotal + porAno[2026].lucroTotal >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Vlr disponível (2025+2026)"
          value={formatBRL(porAno[2025].vlrDisponivel + porAno[2026].vlrDisponivel)}
          tone={porAno[2025].vlrDisponivel + porAno[2026].vlrDisponivel >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vlr a receber CEF" value={formatBRL(porAno[2025].vlrReceberCef + porAno[2026].vlrReceberCef)} />
        <StatCard label="Taxas de obra a receber" value={formatBRL(taxasAReceber)} />
        <StatCard
          label="Comissões de corretores"
          value={formatBRL(comissoesTotais)}
          hint={`Pago: ${formatBRL(comissoesPagas)} • Saldo: ${formatBRL(comissoesTotais - comissoesPagas)}`}
        />
        <StatCard label="Margem em lotes (Prospecta)" value={formatBRL(lotesValorProspecta)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Obras por status</h2>
          <ul className="mt-4 space-y-2">
            {[...statusCount.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <li key={status} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{status}</span>
                  <span className="font-medium text-slate-900">{count}</span>
                </li>
              ))}
          </ul>
          <Link href="/obras" className="mt-4 inline-block text-sm font-medium text-slate-900 underline underline-offset-4">
            Ver todas as obras →
          </Link>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Investidores</h2>
          <p className="mt-4 text-2xl font-semibold text-slate-900">{formatBRL(capitalInvestido)}</p>
          <p className="mt-1 text-xs text-slate-500">Capital aportado (valor inicial, sem juros acumulados)</p>
          <Link href="/investidores" className="mt-4 inline-block text-sm font-medium text-slate-900 underline underline-offset-4">
            Ver investidores →
          </Link>
        </Card>
      </div>
    </div>
  );
}
