// Polyfill necessário para o bundle do middleware Edge do Next.js/Vercel.
import "./src/lib/edge-dirname-polyfill";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get("auditx-session")?.value);
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
