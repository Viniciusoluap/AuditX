import Link from "next/link";
import { redirect } from "next/navigation";
import { authConfigured, createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

const NAV = [
  { href: "/", label: "Painel" },
  { href: "/obras", label: "Obras" },
  { href: "/taxas", label: "Taxas de Obra" },
  { href: "/corretores", label: "Corretores" },
  { href: "/lotes", label: "Compra de Lotes" },
  { href: "/investidores", label: "Investidores" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let userEmail: string | null = null;
  if (authConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    userEmail = user.email ?? null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
          <div className="px-5 py-5">
            <p className="text-sm font-semibold text-slate-900">Prospecta Construções</p>
            <p className="text-xs text-slate-500">Painel de Gestão de Obras</p>
          </div>
          <nav className="flex flex-col gap-0.5 px-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8">
            <p className="text-sm text-slate-500 md:hidden">Prospecta Construções</p>
            <div />
            {userEmail ? (
              <form action={logout} className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{userEmail}</span>
                <button type="submit" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Sair
                </button>
              </form>
            ) : null}
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
