"use client";

import { useState } from "react";
import clsx from "clsx";
import { Mascot } from "@/components/ui";
import {
  TEXT_SIZES,
  TEXT_SIZE_LABEL,
  CHAT_FACES,
  type ArticleBlock,
  type TextSize,
  type ChatFace,
} from "@/lib/article-blocks";
import { ImagePlus, ChevronUp, ChevronDown, Trash2, Type, MessageCircle } from "lucide-react";

const MAX_IMAGE_BLOCK_BYTES = 1.5 * 1024 * 1024; // 1.5MB(1記事に複数枚入る想定のため通常のサムネイルより小さめ)

function newBlock(type: ArticleBlock["type"]): ArticleBlock {
  if (type === "text") return { type: "text", text: "", size: "md" };
  if (type === "image") return { type: "image", src: "" };
  return { type: "chat", face: "face-smile", text: "", side: "left" };
}

export function ArticleBlockEditor({ initialBlocks }: { initialBlocks: ArticleBlock[] | null }) {
  const [enabled, setEnabled] = useState(!!initialBlocks && initialBlocks.length > 0);
  const [blocks, setBlocks] = useState<ArticleBlock[]>(initialBlocks ?? []);

  const update = (i: number, next: ArticleBlock) => {
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? next : b)));
  };
  const remove = (i: number) => setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const add = (type: ArticleBlock["type"]) => setBlocks((prev) => [...prev, newBlock(type)]);

  return (
    <div className="rounded-xl border border-[var(--border)] p-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        ブロックエディタを使う(画像・セリフ・文字サイズ変更などのギミック記事用)
      </label>
      <p className="mt-1 text-[11px] text-[var(--text-faint)]">
        オフの場合は上の「本文」欄がそのまま使われます。オンにしてブロックを1つ以上追加すると、そちらが優先して表示されます。
      </p>

      {enabled && (
        <div className="mt-3 flex flex-col gap-3">
          {blocks.map((block, i) => (
            <BlockCard
              key={i}
              block={block}
              onChange={(next) => update(i, next)}
              onRemove={() => remove(i)}
              onMoveUp={i > 0 ? () => move(i, -1) : undefined}
              onMoveDown={i < blocks.length - 1 ? () => move(i, 1) : undefined}
            />
          ))}

          <div className="flex flex-wrap gap-2">
            <AddButton icon={<Type size={14} />} label="テキストを追加" onClick={() => add("text")} />
            <AddButton icon={<ImagePlus size={14} />} label="画像を追加" onClick={() => add("image")} />
            <AddButton icon={<MessageCircle size={14} />} label="セリフを追加" onClick={() => add("chat")} />
          </div>
        </div>
      )}

      <input type="hidden" name="blocksJson" value={enabled ? JSON.stringify(blocks) : ""} />
    </div>
  );
}

function AddButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
    >
      {icon} {label}
    </button>
  );
}

function BlockCard({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: ArticleBlock;
  onChange: (b: ArticleBlock) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="rounded-xl bg-[var(--surface-muted)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-[var(--text-faint)]">
          {block.type === "text" ? "テキスト" : block.type === "image" ? "画像" : "セリフ(O)"}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!onMoveUp}
            onClick={onMoveUp}
            className="rounded-full p-1 text-[var(--text-faint)] hover:bg-[var(--surface)] disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={!onMoveDown}
            onClick={onMoveDown}
            className="rounded-full p-1 text-[var(--text-faint)] hover:bg-[var(--surface)] disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-1 text-[var(--text-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {block.type === "text" && (
        <div className="flex flex-col gap-2">
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={3}
            maxLength={4000}
            placeholder="テキストを入力"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <div className="flex gap-1.5">
            {TEXT_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...block, size: s })}
                className={clsx(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  block.size === s ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] text-[var(--text-muted)]"
                )}
              >
                {TEXT_SIZE_LABEL[s as TextSize]}
              </button>
            ))}
          </div>
        </div>
      )}

      {block.type === "image" && (
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs text-[var(--text-muted)] hover:border-[var(--primary)]">
            {block.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.src} alt="" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <ImagePlus size={20} className="text-[var(--text-faint)]" />
            )}
            <span>{block.src ? "画像を変更" : "画像を選択(jpeg/png/webp、1.5MBまで)"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > MAX_IMAGE_BLOCK_BYTES) {
                  alert("画像サイズは1.5MB以内にしてください");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => onChange({ ...block, src: reader.result as string });
                reader.readAsDataURL(file);
              }}
            />
          </label>
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            maxLength={200}
            placeholder="キャプション(任意)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
      )}

      {block.type === "chat" && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {CHAT_FACES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onChange({ ...block, face: f })}
                className={clsx(
                  "overflow-hidden rounded-full border-2",
                  block.face === f ? "border-[var(--primary)]" : "border-transparent"
                )}
              >
                <Mascot name={f as ChatFace} size={32} />
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(["left", "right"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => onChange({ ...block, side })}
                className={clsx(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  block.side === side ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] text-[var(--text-muted)]"
                )}
              >
                {side === "left" ? "左側" : "右側"}
              </button>
            ))}
          </div>
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={2}
            maxLength={1000}
            placeholder="セリフを入力"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
      )}
    </div>
  );
}
