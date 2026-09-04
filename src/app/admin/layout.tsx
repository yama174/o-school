import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

export const metadata = { title: "管理画面" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // proxy.ts (旧middleware)でも保護しているが、多層防御として
  // レイアウト側でも必ず権限を再チェックする。
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/");

  return <AdminShell adminName={user.nickname}>{children}</AdminShell>;
}
