import { NextResponse, type NextRequest } from "next/server";

const authConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxxxxxx");

/**
 * No Next.js 16, este arquivo precisa se chamar `proxy.ts` (não mais
 * `middleware.ts`) para rodar no runtime Node.js — o antigo `middleware.ts`
 * roda no Edge Runtime, que na Vercel (Turbopack) estava travando em
 * produção com "ReferenceError: __dirname is not defined" mesmo sem
 * nenhuma dependência Node no código.
 *
 * Faz apenas uma checagem de presença do cookie de sessão do Supabase —
 * a validação real (token válido/expirado) acontece no layout autenticado.
 */
export function proxy(request: NextRequest) {
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
