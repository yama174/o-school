import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 「参加コードゲート」: 時間割など生徒限定の閲覧コンテンツを、
// アカウント登録なしでも参加コードだけで見られるようにするための仕組み。
// アカウント認証(auth.ts)とは別の、独立した軽量なCookieで管理する
// (ゲート通過 ≠ 本人確認。あくまで「O-schoolを知っている人」であることの印)。

const GATE_COOKIE_NAME = "spp_gate";
const GATE_TTL_SECONDS = 60 * 60 * 24 * 180; // 180日

// 登録時の合言葉と共通のコードを使う。
// 環境変数はDB未設定時のフォールバック(初回セットアップ時の後方互換)。
const ENV_FALLBACK_CODE = process.env.SCHOOL_INVITE_CODE ?? "aobadai2026";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET が未設定、または短すぎます。.env を確認してください。");
  }
  return new TextEncoder().encode(secret);
}

/** 現在有効な参加コードを取得する(DB設定があればそちらを優先)。 */
export async function getActiveInviteCode(): Promise<string> {
  const setting = await prisma.siteSetting.findFirst();
  return setting?.inviteCode?.trim() || ENV_FALLBACK_CODE;
}

export async function isValidInviteCode(input: string): Promise<boolean> {
  const active = await getActiveInviteCode();
  return input.trim().toLowerCase() === active.toLowerCase();
}

export async function setGateCookie() {
  const token = await new SignJWT({ gate: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${GATE_TTL_SECONDS}s`)
    .sign(getSecretKey());

  const store = await cookies();
  store.set(GATE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_TTL_SECONDS,
  });
}

/** ゲートを通過済みか(=時間割を閲覧してよいか)を判定する。 */
export async function hasGateAccess(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(GATE_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.gate === true;
  } catch {
    return false;
  }
}

/**
 * 時間割など「参加コード or ログインのどちらかがあれば閲覧可」なページの入口で呼ぶガード。
 * どちらもなければ /gate へリダイレクトする(未ログインでURLを直接叩いた場合も同様)。
 * ログイン中のユーザーはそのまま返す(ページ側で自分の学年・クラス判定等に使える)。
 */
export async function requireGateOrLogin(nextPath: string) {
  const [user, gated] = await Promise.all([getCurrentUser(), hasGateAccess()]);
  if (user || gated) return user;
  redirect(`/gate?next=${encodeURIComponent(nextPath)}`);
}
