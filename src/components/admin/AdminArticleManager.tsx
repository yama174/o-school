"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertArticleAction, deleteArticleAction } from "@/lib/actions/admin-articles";
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABEL } from "@/lib/constants";
import { articleBlocksSchema, type ArticleBlock } from "@/lib/article-blocks";
import { ArticleBlockEditor } from "@/components/admin/ArticleBlockEditor";
import { Button, Card, FieldLabel, inputClass, Badge } from "@/components/ui";
import { Pencil, Trash2, X } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface Category {
  id: string;
  name: string;
}
interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  blocks: unknown;
  thumbnail: string | null;
  categoryId: string;
  categoryName: string;
  authorName: string;
  status: string;
  publishedAt: string;
}

const initialState: ActionState = {};

export function AdminArticleManager({
  articles,
  categories,
}: {
  articles: Article[];
  categories: Category[];
}) {
  const [editing, setEditing] = useState<Article | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">{editing ? "記事を編集" : "記事を作成"}</p>
        <ArticleForm key={editing?.id ?? "new"} article={editing} categories={categories} onDone={() => setEditing(null)} />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {articles.map((a) => (
            <ArticleRow key={a.id} article={a} onEdit={() => setEditing(a)} />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ArticleRow({ article, onEdit }: { article: Article; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <li className="flex items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <div className="mb-0.5 flex items-center gap-1.5">
          <Badge tone={article.status === "PUBLISHED" ? "success" : "default"}>
            {ARTICLE_STATUS_LABEL[article.status as "DRAFT" | "PUBLISHED"]}
          </Badge>
          <span className="text-xs text-[var(--text-muted)]">{article.categoryName}</span>
        </div>
        <p className="truncate text-sm font-semibold">{article.title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={onEdit} className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--surface-muted)]">
          <Pencil size={15} />
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm(`「${article.title}」を削除しますか?`)) return;
            startTransition(async () => {
              await deleteArticleAction(article.id);
              router.refresh();
            });
          }}
          className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}

function ArticleForm({
  article,
  categories,
  onDone,
}: {
  article: Article | null;
  categories: Category[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(upsertArticleAction, initialState);
  const [removeThumb, setRemoveThumb] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {article && <input type="hidden" name="id" value={article.id} />}
      <div>
        <FieldLabel>タイトル</FieldLabel>
        <input name="title" required maxLength={80} defaultValue={article?.title} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>カテゴリー</FieldLabel>
          <select name="categoryId" required defaultValue={article?.categoryId ?? ""} className={inputClass}>
            <option value="" disabled>
              選択してください
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>公開状態</FieldLabel>
          <select name="status" defaultValue={article?.status ?? "PUBLISHED"} className={inputClass}>
            {ARTICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ARTICLE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>著者名</FieldLabel>
        <input name="authorName" maxLength={40} placeholder="O-school編集部" defaultValue={article?.authorName} className={inputClass} />
      </div>
      <div>
        <FieldLabel>要約(一覧・SNS共有用、任意)</FieldLabel>
        <input name="excerpt" maxLength={200} defaultValue={article?.excerpt ?? ""} className={inputClass} />
      </div>
      <div>
        <FieldLabel>本文</FieldLabel>
        <textarea name="body" required rows={8} maxLength={8000} defaultValue={article?.body} className={inputClass} />
      </div>

      <ArticleBlockEditor initialBlocks={parseBlocks(article?.blocks)} />

      <div>
        <FieldLabel>サムネイル画像(任意、jpeg/png/webp・3MBまで)</FieldLabel>
        {article?.thumbnail && !removeThumb ? (
          <div className="mb-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.thumbnail} alt="" className="h-16 w-28 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setRemoveThumb(true)}
              className="text-xs font-semibold text-[var(--danger)]"
            >
              削除する
            </button>
          </div>
        ) : null}
        {removeThumb && <input type="hidden" name="removeThumbnail" value="1" />}
        <input type="file" name="thumbnail" accept="image/jpeg,image/png,image/webp" className={inputClass} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : article ? "更新する" : "作成する"}
        </Button>
        {article && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X size={14} /> キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}

function parseBlocks(raw: unknown): ArticleBlock[] | null {
  if (!raw) return null;
  const parsed = articleBlocksSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
