"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  CalendarDays,
  ClipboardList,
  Store,
  Menu,
  X,
  Search,
  CheckSquare,
  PartyPopper,
  Settings,
  LogOut,
  ShieldCheck,
  FileText,
  Scale,
  Mail,
  LogIn,
  UserPlus,
  Newspaper,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/Logo";

export interface ViewerInfo {
  nickname: string;
  role: "STUDENT" | "ADMIN";
}

const TABS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/timetable", label: "時間割", icon: CalendarDays },
  { href: "/assignments", label: "課題", icon: ClipboardList },
  { href: "/shops", label: "お店", icon: Store },
];

export function SiteChrome({
  viewer,
  children,
}: {
  viewer: ViewerInfo | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <div className="flex min-h-dvh flex-col">
      {!isAdminRoute && (
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <Logo size={30} />
              <span className="text-[15px] tracking-tight">O-school</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <Link
                href="/search"
                aria-label="検索"
                className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                <Search size={20} />
              </Link>
              <button
                aria-label="メニュー"
                onClick={() => setOpen(true)}
                className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={clsx("mx-auto w-full max-w-3xl flex-1 px-4 pt-4", !isAdminRoute && "pb-24")}>
        {children}
      </main>

      {!isAdminRoute && (
        <nav className="sticky bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
          <div className="mx-auto grid max-w-3xl grid-cols-5">
            {TABS.map((tab) => {
              const active =
                tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={clsx(
                    "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                    active ? "text-[var(--primary)]" : "text-[var(--text-faint)]"
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  {tab.label}
                </Link>
              );
            })}
            <button
              onClick={() => setOpen(true)}
              className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-[var(--text-faint)]"
            >
              <Menu size={20} />
              メニュー
            </button>
          </div>
        </nav>
      )}

      {open && (
        <MenuDrawer viewer={viewer} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

function MenuDrawer({
  viewer,
  onClose,
}: {
  viewer: ViewerInfo | null;
  onClose: () => void;
}) {
  const items = [
    { href: "/articles", label: "O-schoolの記事", icon: Newspaper },
    { href: "/events", label: "学校行事", icon: PartyPopper },
    { href: "/timetable/subjects", label: "今月の教科回数", icon: CalendarDays },
    { href: "/attendance", label: "出席状況", icon: CheckSquare },
    { href: "/search", label: "検索", icon: Search },
  ];
  const legal = [
    { href: "/privacy", label: "プライバシーポリシー", icon: FileText },
    { href: "/terms", label: "利用規約", icon: Scale },
    { href: "/contact", label: "お問い合わせ", icon: Mail },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="閉じる"
        className="flex-1 bg-black/30"
        onClick={onClose}
      />
      <div className="flex h-full w-[82%] max-w-xs flex-col overflow-y-auto bg-[var(--surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-bold">メニュー</span>
          <button onClick={onClose} aria-label="閉じる" className="rounded-full p-1.5 hover:bg-[var(--surface-muted)]">
            <X size={20} />
          </button>
        </div>

        {viewer ? (
          <div className="mb-4 rounded-xl bg-[var(--surface-muted)] px-3.5 py-3">
            <p className="text-xs text-[var(--text-muted)]">ログイン中</p>
            <p className="font-bold">{viewer.nickname}</p>
          </div>
        ) : (
          <div className="mb-4 flex gap-2">
            <Link
              href="/login"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-2.5 text-sm font-semibold text-white"
            >
              <LogIn size={16} /> ログイン
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--surface-muted)] px-3 py-2.5 text-sm font-semibold"
            >
              <UserPlus size={16} /> 新規登録
            </Link>
          </div>
        )}

        <nav className="flex flex-col gap-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-muted)]"
            >
              <item.icon size={18} className="text-[var(--text-muted)]" />
              {item.label}
            </Link>
          ))}
        </nav>

        {viewer && (
          <nav className="mt-3 flex flex-col gap-0.5 border-t border-[var(--border)] pt-3">
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-muted)]"
            >
              <Settings size={18} className="text-[var(--text-muted)]" />
              設定・マイページ
            </Link>
            {viewer.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-muted)]"
              >
                <ShieldCheck size={18} className="text-[var(--text-muted)]" />
                管理画面
              </Link>
            )}
            <form action={logoutAction}>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]">
                <LogOut size={18} />
                ログアウト
              </button>
            </form>
          </nav>
        )}

        <nav className="mt-3 flex flex-col gap-0.5 border-t border-[var(--border)] pt-3">
          {legal.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="mt-4 text-[10px] leading-relaxed text-[var(--text-faint)]">
          O-schoolは学校公式のサービスではありません。個人が運営する非公式のサービスです。
        </p>
      </div>
    </div>
  );
}
