// 日付ユーティリティ。
//
// サーバーの実行タイムゾーンに依存せず「日本時間の日付」を一貫して扱うため、
// カレンダー上の日付は常に「UTC真夜中(00:00:00.000Z)で表現したその日」として
// DBに保存・比較する。表示側は Asia/Tokyo で解釈する。

const JST_TZ = "Asia/Tokyo";

export function todayJST(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "YYYY-MM-DD"
  return parseYMD(parts);
}

export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatYMD(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function isSameDate(a: Date, b: Date): boolean {
  return formatYMD(a) === formatYMD(b);
}

export function dayOfWeek(date: Date): number {
  return date.getUTCDay(); // 0=日 ... 6=土
}

export function startOfMonth(year: number, month1to12: number): Date {
  return new Date(Date.UTC(year, month1to12 - 1, 1));
}

export function endOfMonth(year: number, month1to12: number): Date {
  return new Date(Date.UTC(year, month1to12, 0)); // 翌月0日=当月末日
}

export function daysInMonth(year: number, month1to12: number): number {
  return endOfMonth(year, month1to12).getUTCDate();
}

/** カレンダーグリッド用: 月曜始まりの週配列を返す。前後月の日付分はnull。 */
export function buildMonthGrid(
  year: number,
  month1to12: number
): (Date | null)[][] {
  const first = startOfMonth(year, month1to12);
  const total = daysInMonth(year, month1to12);
  // 月曜=0となるようずらす (日曜=0のJS標準を変換)
  const firstWeekday = (first.getUTCDay() + 6) % 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= total; d++) {
    cells.push(new Date(Date.UTC(year, month1to12 - 1, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

const WEEKDAY_KANJI = ["日", "月", "火", "水", "木", "金", "土"];

export function formatJapaneseDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const w = WEEKDAY_KANJI[dayOfWeek(date)];
  return `${y}年${m}月${d}日(${w})`;
}

export function formatMonthDay(date: Date): string {
  return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

/** 今日から指定日までの残り日数(0=今日, 負の値=過去) */
export function daysUntil(target: Date, from: Date = todayJST()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - from.getTime()) / msPerDay);
}

/** 現在時刻(日本時間)を "HH:MM" で返す。 */
export function nowJSTHHMM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: JST_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** 現在時刻に応じた短い挨拶(「毎朝開くためのUI」用)。 */
export function greetingForNow(hhmm: string = nowJSTHHMM()): string {
  const hour = Number(hhmm.split(":")[0]);
  if (hour >= 5 && hour < 11) return "おはよう";
  if (hour >= 11 && hour < 18) return "こんにちは";
  return "こんばんは";
}
