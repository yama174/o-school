import type { AttendanceStats } from "@/lib/attendance";

export function AttendanceDonut({ stats }: { stats: AttendanceStats }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const rate = Math.min(100, Math.max(0, stats.attendanceRate));
  const dash = (rate / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth="14" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-black">{rate}%</p>
          <p className="text-xs text-[var(--text-muted)]">出席率</p>
        </div>
      </div>
      <dl className="flex flex-1 flex-col gap-1.5 text-sm">
        <Row label="授業日数" value={`${stats.schoolDays}日`} />
        <Row label="出席" value={`${stats.present}日`} tone="success" />
        <Row label="欠席" value={`${stats.absent}日`} tone="danger" />
        <Row label="遅刻" value={`${stats.late}回`} />
        <Row label="早退" value={`${stats.earlyLeave}回`} />
        <Row label="公欠" value={`${stats.excused}日`} />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  const color =
    tone === "success" ? "var(--success)" : tone === "danger" ? "var(--danger)" : "var(--text)";
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="font-bold" style={{ color }}>
        {value}
      </dd>
    </div>
  );
}
