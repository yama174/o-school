import { z } from "zod";

// ---------------------------------------------------------------------------
// 記事の「ブロック形式」本文(オモコロ風レイアウト)。
//
// 通常の記事は今まで通りbody(プレーンテキスト)だけで書けるが、画像を挟んだり
// マスコット「O」の顔差分でセリフを言わせたり、文字サイズを変えて強調したい
// ギミック記事のために、blocksという追加のレイアウト情報を持てるようにした。
// blocksが設定されている記事は、表示時にbodyの代わりにblocksをレンダリングする。
// ---------------------------------------------------------------------------

export const TEXT_SIZES = ["sm", "md", "lg", "xl"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const TEXT_SIZE_LABEL: Record<TextSize, string> = {
  sm: "小",
  md: "標準",
  lg: "大",
  xl: "特大",
};

export const TEXT_SIZE_CLASS: Record<TextSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg font-semibold",
  xl: "text-2xl font-bold",
};

// チャット吹き出しに使えるマスコット「O」の顔差分(表情アイコンのみ。立ち絵は含まない)
export const CHAT_FACES = [
  "face-smile",
  "face-smile-more",
  "face-grin",
  "face-surprised",
  "face-wink",
  "face-side-eye",
  "face-flustered",
  "face-side",
] as const;
export type ChatFace = (typeof CHAT_FACES)[number];

export const chatFaceSchema = z.enum(CHAT_FACES);

export const articleBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string().min(1).max(4000),
    size: z.enum(TEXT_SIZES).default("md"),
  }),
  z.object({
    type: z.literal("image"),
    src: z.string().min(1), // data URI
    caption: z.string().max(200).optional(),
  }),
  z.object({
    type: z.literal("chat"),
    face: chatFaceSchema,
    text: z.string().min(1).max(1000),
    side: z.enum(["left", "right"]).default("left"),
  }),
]);

export const articleBlocksSchema = z.array(articleBlockSchema).max(60);

export type ArticleBlock = z.infer<typeof articleBlockSchema>;

/** 検索・OGP description用に、ブロックの文字列部分だけを結合したプレーンテキストを作る。 */
export function blocksToPlainText(blocks: ArticleBlock[]): string {
  return blocks
    .map((b) => (b.type === "image" ? (b.caption ?? "") : b.text))
    .filter(Boolean)
    .join("\n");
}
