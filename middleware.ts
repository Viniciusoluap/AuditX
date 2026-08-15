// Precisa vir antes do import de "next/server": o crash de produção
// "ReferenceError: __dirname is not defined" é o `ua-parser-js` empacotado
// dentro do próprio `next/server` (bug conhecido do Next.js, ainda presente
// na 16.3.1 — https://github.com/vercel/next.js/issues/53968), não algo do
// nosso código. Já tentamos renomear pra `proxy.ts` (runtime Node.js) e
// trocar o bundler pra Webpack; nenhum dos dois resolveu — o polyfill é o
// workaround documentado pra esse bug específico.
//
// Import relativo (não "@/...") de propósito: o bundler de Edge Functions
// da Vercel não resolve o alias "@/" a partir do middleware.ts na raiz do
// projeto (mesmo bug do PR #3 deste repo, com "@/lib/supabase/middleware").
import "./src/lib/edge-dirname-polyfill";
import { NextResponse, type NextRequest } from "next/server";

const authConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxxxxxx");

/**
 * Middleware leve, sem dependências externas (só APIs nativas do Next.js).
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
