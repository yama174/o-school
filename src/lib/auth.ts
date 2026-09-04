import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/constants";

const COOKIE_NAME = "spp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30日

const MFA_PENDING_COOKIE_NAME = "spp_mfa_pending";
const MFA_PENDING_TTL_SECONDS = 60 * 5; // 5分。パスワード確認済みだがTOTP未確認の短命な状態

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET が未設定、または短すぎます。.env を確認してください。"
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // userId
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

async function readSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { sub: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}

// 現在ログイン中のユーザーをDBから取得(停止済みユーザーは無効化)。
// Server Component / Server Action どちらからでも呼べる。
export async function getCurrentUser() {
  const session = await readSessionPayload();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { class: { include: { grade: { include: { school: true } } } } },
  });

  if (!user || user.suspended) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です。");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("管理者権限が必要です。");
  }
  return user;
}

// ---------------------------------------------------------------------------
// 管理者MFA(TOTP)の「パスワード確認済み・二段階目待ち」状態
// ---------------------------------------------------------------------------

export async function setPendingMfaCookie(userId: string) {
  const token = await new SignJWT({ mfaPending: true })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MFA_PENDING_TTL_SECONDS}s`)
    .sign(getSecretKey());

  const store = await cookies();
  store.set(MFA_PENDING_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MFA_PENDING_TTL_SECONDS,
  });
}

export async function readPendingMfaUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(MFA_PENDING_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.mfaPending !== true || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function clearPendingMfaCookie() {
  const store = await cookies();
  store.delete(MFA_PENDING_COOKIE_NAME);
}
