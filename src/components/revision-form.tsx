"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArticleFileImport } from "@/components/article-file-import";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

type Props = {
  article: {
    id: string;
    title: string;
    abstract: string;
    keywords: string;
    category: string;
    content: string;
  };
};

export function RevisionForm({ article }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: article.title,
    abstract: article.abstract,
    keywords: article.keywords,
    category: article.category,
    content: article.content,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/author/articles/${article.id}/revisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "提交失败");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <p className="font-serif text-xl text-ink-900">修改申请已提交</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-700/70">
          审核期间原文章继续正常展示；审核通过后才会更新文章，若被驳回则保持原文不变。
        </p>
        <Link
          href="/dashboard/articles"
          className="btn-outline mt-5 inline-flex"
        >
          返回文章数据
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
      <div className="rounded-sm bg-paper-100/70 px-4 py-3 text-[11px] leading-6 text-ink-700/65">
        提交后进入编辑审核。审核期间原文章继续公开，不会被替换；通过后更新，驳回则保留原文。
      </div>

      <div>
        <label className="label" htmlFor="revision-title">
          标题
        </label>
        <input
          id="revision-title"
          className="input"
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          required
          minLength={2}
          maxLength={120}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="revision-category">
            栏目
          </label>
          <select
            id="revision-category"
            className="input"
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="revision-keywords">
            关键词
          </label>
          <input
            id="revision-keywords"
            className="input"
            value={form.keywords}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                keywords: event.target.value,
              }))
            }
            required
            maxLength={120}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="revision-abstract">
          摘要（选填，建议 30 字以上）
        </label>
        <textarea
          id="revision-abstract"
          className="input min-h-28 resize-y"
          value={form.abstract}
          onChange={(event) =>
            setForm((current) => ({ ...current, abstract: event.target.value }))
          }
          maxLength={800}
        />
      </div>

      <div>
        <label className="label" htmlFor="revision-content">
          正文
        </label>
        <div className="mb-3">
          <ArticleFileImport
            hasContent={form.content.trim().length > 0}
            disabled={loading}
            onText={(text) =>
              setForm((current) => ({ ...current, content: text }))
            }
          />
        </div>
        <textarea
          id="revision-content"
          className="input min-h-80 resize-y font-serif leading-7"
          value={form.content}
          onChange={(event) =>
            setForm((current) => ({ ...current, content: event.target.value }))
          }
          required
          minLength={200}
          maxLength={30000}
        />
      </div>

      {error && (
        <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs text-crimson-700">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "提交中…" : "提交修改，送审"}
      </button>
    </form>
  );
}
