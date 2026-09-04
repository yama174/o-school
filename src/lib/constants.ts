// アプリ全体で使う定数・文字列ユニオン型。
// SQLiteはPrisma enumを扱えないため、DB上はString列にしてここで型を保証する。

export const ROLES = ["STUDENT", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const OVERRIDE_KINDS = ["CUSTOM", "NO_CLASS"] as const;
export type OverrideKind = (typeof OVERRIDE_KINDS)[number];

export const ATTENDANCE_STATUSES = [
  "ABSENT",
  "LATE",
  "EARLY_LEAVE",
  "EXCUSED",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  ABSENT: "欠席",
  LATE: "遅刻",
  EARLY_LEAVE: "早退",
  EXCUSED: "公欠",
};

export const REPORT_STATUSES = ["PENDING", "REVIEWED", "DISMISSED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "未対応",
  REVIEWED: "対応済み",
  DISMISSED: "却下",
};

export const WEEKDAY_LABEL = ["日", "月", "火", "水", "木", "金", "土"];

export const PERIODS = [1, 2, 3, 4, 5, 6] as const;

// ---------------------------------------------------------------------------
// 課題(共有課題 / 個人課題)
// ---------------------------------------------------------------------------

export const ASSIGNMENT_VISIBILITIES = ["SHARED", "PERSONAL"] as const;
export type AssignmentVisibility = (typeof ASSIGNMENT_VISIBILITIES)[number];

export const ASSIGNMENT_VISIBILITY_LABEL: Record<AssignmentVisibility, string> = {
  SHARED: "みんなに共有",
  PERSONAL: "自分だけ",
};

// ---------------------------------------------------------------------------
// 大空町のお店
// ---------------------------------------------------------------------------

export const SHOP_TARGET_TYPES = ["PHOTO", "REVIEW"] as const;
export type ShopTargetType = (typeof SHOP_TARGET_TYPES)[number];

export const CONTENT_STATUSES = ["PUBLISHED", "REMOVED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const SHOP_REPORT_REASONS = [
  "不適切な画像(暴力的・性的など)",
  "個人情報が写っている(顔・車のナンバー等)",
  "他人の著作物を無断使用している",
  "お店と関係ない投稿",
  "誹謗中傷",
  "スパム・宣伝",
  "その他",
] as const;

// 画像アップロードの容量上限(バイト数、data URI文字列の長さで概算)
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

// ---------------------------------------------------------------------------
// O-schoolの記事
// ---------------------------------------------------------------------------

export const ARTICLE_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: "下書き",
  PUBLISHED: "公開中",
};

// 禁止ワード(簡易フィルタ)。実運用ではより高度なモデレーションを推奨。
export const BANNED_PATTERNS: RegExp[] = [
  /死ね|殺す|消えろ/,
  /\b0\d{1,4}-?\d{2,4}-?\d{3,4}\b/, // 電話番号らしき数字列
  /〒?\d{3}-?\d{4}.{0,10}(丁目|番地|号)/, // 住所らしき文字列
  /https?:\/\/(twitter|x)\.com\/\S+/i,
  /instagram\.com\/\S+/i,
  /line\.me\/\S+/i,
];

export function containsBannedContent(text: string): boolean {
  return BANNED_PATTERNS.some((re) => re.test(text));
}
