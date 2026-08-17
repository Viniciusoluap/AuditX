import Link from "next/link";
import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  const toneClass = {
    default: "text-slate-900",
    positive: "text-emerald-700",
    negative: "text-red-600",
    warning: "text-amber-600",
  }[tone];
  return (
    <Card>
      <p className="min-h-8 text-xs font-medium uppercase leading-4 tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "positive" | "negative" | "warning" }) {
  const map: Record<string, string> = {
    default: "bg-slate-100 text-slate-700",
    positive: "bg-emerald-100 text-emerald-700",
    negative: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>;
}

export function Tabs({ items, active, basePath }: { items: { value: string; label: string }[]; active: string; basePath: string }) {
  return (
    <div className="mb-5 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
      {items.map((item) => (
        <Link
          key={item.value}
          href={`${basePath}?ano=${item.value}`}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === item.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`whitespace-nowrap px-3 py-2 text-sm text-slate-700 ${className}`}>
      {children}
    </td>
  );
}
