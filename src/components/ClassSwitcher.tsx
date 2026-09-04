"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface ClassOption {
  id: string;
  label: string; // 例: "高校1年 1年A組"
}

export function ClassSwitcher({ options, currentClassId }: { options: ClassOption[]; currentClassId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      value={currentClassId}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("classId", e.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
