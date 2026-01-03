import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔓 Rotas públicas (NÃO proteger)
  const publicRoutes = [
    "/",
    "/planos",
    "/login",
    "/checkout",
    "/api",
  ];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 🔐 Proteger tudo que começa com /crm
  if (pathname.startsWith("/crm")) {
    const hasSession =
      req.cookies.get("sb-access-token") ||
      req.cookies.get("sb-refresh-token");

    if (!hasSession) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/crm/:path*"],
};
