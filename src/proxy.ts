import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// proxy.ts (旧 middleware.ts) は「UXのための先回りリダイレクト」であって、
// 認可の最終防衛線ではない。各Server Action / Server Component側でも
// getCurrentUser() / requireAdmin() による再チェックを必ず行う。
// (参照: Next.js公式 "Framework protections are not a substitute for
// application-level checks")

const SESSION_COOKIE_NAME = "spp_session";
const GATE_COOKIE_NAME = "spp_gate";

async function readRole(req: NextRequest): Promise<"STUDENT" | "ADMIN" | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return (payload.role as "STUDENT" | "ADMIN") ?? null;
  } catch {
    return null;
  }
}

async function hasValidCookie(req: NextRequest, name: string): Promise<boolean> {
  const token = req.cookies.get(name)?.value;
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await readRole(req);

  // 時間割・学校行事は「参加コード(ゲート) or ログイン」のどちらかがあれば閲覧可(先回りリダイレクト)。
  // 最終判定は各ページの requireGateOrLogin() で行う。
  if (pathname.startsWith("/timetable") || pathname.startsWith("/events")) {
    const gated = role !== null || (await hasValidCookie(req, GATE_COOKIE_NAME));
    if (!gated) {
      const url = new URL("/gate", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const needsLogin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/assignments");

  if (needsLogin && !role) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/attendance/:path*",
    "/settings/:path*",
    "/assignments/:path*",
    "/timetable/:path*",
    "/events/:path*",
  ],
};
