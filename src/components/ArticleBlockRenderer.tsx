import clsx from "clsx";
import { Mascot } from "@/components/ui";
import { TEXT_SIZE_CLASS, type ArticleBlock } from "@/lib/article-blocks";

/** 記事本文をブロック単位で表示する(オモコロ風レイアウト)。 */
export function ArticleBlockRenderer({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        if (block.type === "text") {
          return (
            <p
              key={i}
              className={clsx("whitespace-pre-wrap leading-relaxed", TEXT_SIZE_CLASS[block.size])}
            >
              {block.text}
            </p>
          );
        }
        if (block.type === "image") {
          return (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.caption ?? ""} className="w-full rounded-2xl object-cover" />
              {block.caption && (
                <figcaption className="mt-1.5 text-center text-xs text-[var(--text-faint)]">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }
        // chat
        return (
          <div
            key={i}
            className={clsx("flex items-end gap-2", block.side === "right" && "flex-row-reverse")}
          >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <Mascot name={block.face} size={44} className="h-full w-full object-cover" />
            </div>
            <div
              className={clsx(
                "max-w-[80%] rounded-2xl bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                block.side === "right" ? "rounded-br-sm" : "rounded-bl-sm"
              )}
            >
              {block.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
