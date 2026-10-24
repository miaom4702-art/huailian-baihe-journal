"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { formatDate, issueLabel } from "@/lib/utils";

type SerialOption = {
  id: string;
  title: string;
};

type IssueOption = {
  id: string;
  title: string;
  year: number;
  volume: number;
  number: number;
  archivedAt: string | null;
};

type Article = {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  keywords: string;
  category: string;
  content: string;
  featured: boolean;
  publishedAt: string;
  deletedAt: string | null;
  authorName: string;
  issue: IssueOption | null;
  serial: SerialOption | null;
};

type ArticleForm = {
  title: string;
  abstract: string;
  keywords: string;
  category: string;
  content: string;
  featured: boolean;
  issueId: string;
  serialId: string;
};

const emptyForm: ArticleForm = {
  title: "",
  abstract: "",
  keywords: "",
  category: CATEGORIES[0],
  content: "",
  featured: false,
  issueId: "",
  serialId: "",
};

export function ArticleManager({
  articles,
  issues,
  serials,
}: {
  articles: Article[];
  issues: IssueOption[];
  serials: SerialOption[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(article: Article) {
    setEditingId(article.id);
    setForm({
      title: article.title,
      abstract: article.abstract,
      keywords: article.keywords,
      category: article.category,
      content: article.content,
      featured: article.featured,
      issueId: article.issue?.id ?? "",
      serialId: article.serial?.id ?? "",
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/articles/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE",
          ...form,
          issueId: form.issueId || null,
          serialId: form.serialId || null,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "保存失败");
        return;
      }
      reset();
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(article: Article, action: "DELETE" | "RESTORE") {
    const label = action === "DELETE" ? "下架" : "恢复";
    if (
      !window.confirm(
        action === "DELETE"
          ? `确定下架《${article.title}》吗？前台会隐藏，但内容与投稿记录保留，可随时恢复。`
          : `确定恢复《${article.title}》吗？恢复后前台会重新显示。`,
      )
    ) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? `${label}失败`);
        return;
      }
      if (editingId === article.id) reset();
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
      <div>
        {editingId ? (
          <form onSubmit={save} className="card space-y-4 p-6" noValidate>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-ink-900">编辑文章</h3>
              <button
                type="button"
                onClick={reset}
                className="text-[11px] text-ink-700/60 hover:text-crimson-600"
              >
                取消
              </button>
            </div>

            <div>
              <label className="label" htmlFor="article-title">
                标题
              </label>
              <input
                id="article-title"
                className="input"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
                minLength={2}
                maxLength={120}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="article-category">
                  栏目
                </label>
                <select
                  id="article-category"
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
                <label className="label" htmlFor="article-issue">
                  所属期次
                </label>
                <select
                  id="article-issue"
                  className="input"
                  value={form.issueId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      issueId: event.target.value,
                    }))
                  }
                >
                  <option value="">不归入某一期</option>
                  {issues.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      {issueLabel(issue)} · {issue.title}
                      {issue.archivedAt ? "（已下架）" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="article-serial">
                所属连载合集
              </label>
              <select
                id="article-serial"
                className="input"
                value={form.serialId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    serialId: event.target.value,
                  }))
                }
              >
                <option value="">不加入连载</option>
                {serials.map((serial) => (
                  <option key={serial.id} value={serial.id}>
                    {serial.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-ink-700/45">
                已发表文章也可以在这里归入连载；保存后会自动同步到该合集的章节审核列表。
              </p>
            </div>

            <div>
              <label className="label" htmlFor="article-keywords">
                关键词
              </label>
              <input
                id="article-keywords"
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

            <div>
              <label className="label" htmlFor="article-abstract">
                摘要（选填，建议 30 字以上）
              </label>
              <textarea
                id="article-abstract"
                className="input min-h-28 resize-y"
                value={form.abstract}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    abstract: event.target.value,
                  }))
                }
                maxLength={800}
              />
            </div>

            <div>
              <label className="label" htmlFor="article-content">
                正文
              </label>
              <textarea
                id="article-content"
                className="input min-h-72 resize-y font-serif leading-7"
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                required
                minLength={200}
                maxLength={30000}
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-ink-800">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    featured: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-ink-900/20"
              />
              设为首页精选
            </label>

            {error && (
              <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs text-crimson-700">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "保存中…" : "保存修改"}
            </button>
          </form>
        ) : (
          <div className="card p-8 text-sm leading-7 text-ink-700/65">
            <p className="font-serif text-lg text-ink-900">文章管理</p>
            <p className="mt-2">
              文章由“录用并刊发”的稿件自动生成。这里可以修改标题、摘要、正文、栏目、期次与首页精选，也可以下架或恢复文章。
            </p>
            <p className="mt-2 text-[11px] text-ink-700/45">
              下架不会删除投稿记录；恢复后前台会重新显示。
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {articles.length === 0 && (
          <div className="card p-10 text-center text-sm text-ink-700/55">
            暂无文章。稿件完成审稿并刊发后，会出现在这里。
          </div>
        )}
        {articles.map((article) => (
          <article
            key={article.id}
            className={`card p-5 ${article.deletedAt ? "opacity-70" : ""}`}
          >
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-700/45">
              <span className="text-crimson-600">
                {CATEGORY_LABELS[article.category as keyof typeof CATEGORY_LABELS] ??
                  article.category}
              </span>
              <span>·</span>
              <span>{article.authorName}</span>
              <span>·</span>
              <span>{formatDate(article.publishedAt, false)}</span>
              {article.featured && (
                <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-gold-500">
                  首页精选
                </span>
              )}
              {article.deletedAt && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
                  已下架
                </span>
              )}
            </div>
            <h4 className="mt-2 font-serif text-[15px] leading-7 text-ink-900">
              {article.title}
            </h4>
            <p className="mt-1 text-[10px] text-ink-700/45">
              {article.issue
                ? `${issueLabel(article.issue)} · ${article.issue.title}`
                : "未归入期次"}
              {article.serial ? ` · 连载：${article.serial.title}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 border-t border-ink-900/10 pt-3 text-[11px]">
              <button
                type="button"
                onClick={() => startEdit(article)}
                className="text-crimson-600"
              >
                编辑
              </button>
              {article.deletedAt ? (
                <button
                  type="button"
                  onClick={() => runAction(article, "RESTORE")}
                  disabled={loading}
                  className="text-ink-700/60 hover:text-crimson-600 disabled:opacity-50"
                >
                  恢复
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => runAction(article, "DELETE")}
                  disabled={loading}
                  className="text-ink-700/60 hover:text-crimson-600 disabled:opacity-50"
                >
                  下架
                </button>
              )}
              {!article.deletedAt && (
                <a
                  href={`/articles/${article.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-700/60 no-underline hover:text-crimson-600"
                >
                  预览
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
