import { NextResponse, type NextRequest } from "next/server";

const authConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxxxxxx");

/**
 * Middleware leve, sem dependências externas (só APIs nativas do Next.js).
 *
 * O crash "ReferenceError: __dirname is not defined" que aparecia em produção
 * era do bundler Turbopack ao empacotar o middleware pro Edge Runtime, não
 * do código em si — por isso o build (`npm run build`, que usa `--webpack`,
 * ver package.json) usa Webpack em vez de Turbopack. Tentamos trocar pra
 * `proxy.ts` (runtime Node.js) antes disso, mas o builder da Vercel não
 * conseguia gerar rotas corretamente pra essa combinação (produção
 * respondia 404 em tudo, com zero invocações de função nos logs).
 *
 * Faz apenas uma checagem de presença do cookie de sessão do Supabase —
 * a validação real (token válido/expirado) acontece no layout autenticado,
 * que roda em Node.js e pode usar @supabase/ssr sem restrições de Edge.
 */
export function middleware(request: NextRequest) {
  if (!authConfigured) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.getAll().some((c) => c.name.includes("-auth-token"));
  const isLoginRoute = request.nextUrl.pathname.startsWith("/login");

  if (!hasSessionCookie && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSessionCookie && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
