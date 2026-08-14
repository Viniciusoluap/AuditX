export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}

export function formatPercent(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(n || 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function num(value: number | string | null | undefined): number {
  return typeof value === "string" ? Number(value) : value ?? 0;
}

/** Valor pronto para `defaultValue` de <input type="number">: 2 casas, sem zeros supérfluos do numeric(16,4) do banco. */
export function inputMoney(value: number | string | null | undefined): string {
  const n = num(value);
  return n === 0 ? "0" : String(Math.round(n * 100) / 100);
}
