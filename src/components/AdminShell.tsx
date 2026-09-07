"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ClipboardList,
  PartyPopper,
  Megaphone,
  GalleryHorizontal,
  Store,
  Flag,
  Users,
  Rss,
  BarChart3,
  Calculator,
  Mail,
  ExternalLink,
  Menu,
  X,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/timetable", label: "時間割", icon: CalendarDays },
  { href: "/admin/subjects", label: "教科", icon: BookOpen },
  { href: "/admin/assignments", label: "課題", icon: ClipboardList },
  { href: "/admin/events", label: "学校行事", icon: PartyPopper },
  { href: "/admin/announcements", label: "お知らせ", icon: Megaphone },
  { href: "/admin/home-banners", label: "ホームバナー", icon: GalleryHorizontal },
  { href: "/admin/articles", label: "記事", icon: Newspaper },
  { href: "/admin/shops", label: "お店", icon: Store },
  { href: "/admin/shop-moderation", label: "お店の通報", icon: Flag },
  { href: "/admin/users", label: "ユーザー", icon: Users },
  { href: "/admin/inquiries", label: "お問い合わせ", icon: Mail },
  { href: "/admin/ads", label: "広告枠・公開設定", icon: Rss },
  { href: "/admin/security", label: "セキュリティ", icon: ShieldCheck },
  { href: "/admin/analytics", label: "アクセス・収益", icon: BarChart3 },
  { href: "/admin/revenue-simulator", label: "収益シミュレーター", icon: Calculator },
];

export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-4 lg:block">
        <SidebarContent pathname={pathname} adminName={adminName} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-72 overflow-y-auto bg-[var(--surface)] p-4">
            <div className="mb-2 flex justify-end">
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-[var(--surface-muted)]">
                <X size={18} />
              </button>
            </div>
            <SidebarContent pathname={pathname} adminName={adminName} onNavigate={() => setOpen(false)} />
          </div>
          <button aria-label="閉じる" className="flex-1 bg-black/30" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-full p-1.5 hover:bg-[var(--surface-muted)]">
            <Menu size={20} />
          </button>
          <span className="font-bold">管理画面</span>
          <span className="w-8" />
        </header>
        <main className="mx-auto max-w-4xl px-4 py-5 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  adminName,
  onNavigate,
}: {
  pathname: string | null;
  adminName: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="mb-5 flex items-center gap-2 px-1">
        <Logo size={26} />
        <div>
          <p className="text-xs text-[var(--text-faint)]">管理画面</p>
          <p className="font-bold">{adminName}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
                active
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/"
        className="mt-5 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text-faint)] hover:bg-[var(--surface-muted)]"
      >
        <ExternalLink size={14} /> サイトに戻る
      </Link>
    </>
  );
}
