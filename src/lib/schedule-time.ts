// 「現在の授業」「次の授業」をハイライトするための、時限ごとの目安時刻。
// 実際の学校のチャイム時刻とは異なる場合があるため、管理画面等で調整できるようにするのが将来的な拡張案。

export const PERIOD_TIMES = [
  { period: 1, start: "08:50", end: "09:40" },
  { period: 2, start: "09:50", end: "10:40" },
  { period: 3, start: "10:50", end: "11:40" },
  { period: 4, start: "12:30", end: "13:20" }, // 昼休み明け
  { period: 5, start: "13:30", end: "14:20" },
  { period: 6, start: "14:30", end: "15:20" },
] as const;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export interface PeriodStatus {
  currentPeriod: number | null; // 今まさに授業中の時限
  nextPeriod: number | null; // 次に始まる時限(今日残っているうちで最も近いもの)
}

/** "HH:MM" 形式の現在時刻から、今の時限・次の時限を判定する。 */
export function getPeriodStatus(hhmm: string): PeriodStatus {
  const now = toMinutes(hhmm);
  let currentPeriod: number | null = null;
  let nextPeriod: number | null = null;

  for (const p of PERIOD_TIMES) {
    const start = toMinutes(p.start);
    const end = toMinutes(p.end);
    if (now >= start && now < end) currentPeriod = p.period;
    if (now < start && nextPeriod === null) nextPeriod = p.period;
  }

  return { currentPeriod, nextPeriod };
}
