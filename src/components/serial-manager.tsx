"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatDate } from "@/lib/utils";

type Chapter = {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
};

type SerialItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  updatedAt: string;
  articles: Chapter[];
};

type AvailableArticle = Chapter;

export function SerialManager({
  serials,
  available,
  canDelete = false,
}: {
  serials: SerialItem[];
  available: AvailableArticle[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, string>>({});

  async function request(url: string, options: RequestInit, key: string) {
    setError(null);
    setLoading(key);
    try {
      const response = await fetch(url, options);
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "操作失败");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("网络异常，请稍后重试");
      return false;
    } finally {
      setLoading(null);
    }
  }

  async function addArticle(serial: SerialItem) {
    const articleId = selection[serial.id];
    if (!articleId) return;
    await request(
      `/api/author/serials/${serial.id}/chapters`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      },
      `add:${serial.id}`,
    );
    setSelection((current) => ({ ...current, [serial.id]: "" }));
  }

  async function removeArticle(serial: SerialItem, article: Chapter) {
    if (!window.confirm(`确定把《${article.title}》移出「${serial.title}」吗？`)) {
      return;
    }
    await request(
      `/api/author/serials/${serial.id}/chapters/${article.id}`,
      { method: "DELETE" },
      `remove:${article.id}`,
    );
  }

  async function changeCover(serial: SerialItem, file: File) {
    setError(null);
    setLoading(`cover:${serial.id}`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const uploadResult = (await uploadResponse.json()) as {
        url?: string;
        error?: string;
      };
      if (!uploadResponse.ok || !uploadResult.url) {
        setError(uploadResult.error ?? "封面上传失败");
        return;
      }

      const response = await fetch(`/api/serials/${serial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: uploadResult.url }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "封面保存失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(null);
    }
  }

  async function removeCover(serial: SerialItem) {
    if (!window.confirm("确定恢复该合集的默认封面吗？")) return;
    setError(null);
    setLoading(`cover:${serial.id}`);
    try {
      const response = await fetch(`/api/serials/${serial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: null }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "操作失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(null);
    }
  }

  async function deleteSerial(serial: SerialItem) {
    if (
      !window.confirm(
        `确定删除合集「${serial.title}」吗？\n\n合集内的文章和投稿不会被删除，只会解除与合集的关联，恢复为独立文章。`,
      )
    ) {
      return;
    }
    await request(
      `/api/admin/serials/${serial.id}`,
      { method: "DELETE" },
      `delete:${serial.id}`,
    );
  }

  async function moveArticle(
    serial: SerialItem,
    articleId: string,
    direction: -1 | 1,
  ) {
    const ids = serial.articles.map((article) => article.id);
    const index = ids.indexOf(articleId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;

    [ids[index], ids[target]] = [ids[target], ids[index]];
    await request(
      `/api/author/serials/${serial.id}/order`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: ids }),
      },
      `order:${serial.id}`,
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {error && (
        <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs text-crimson-700">
          {error}
        </p>
      )}

      {serials.length === 0 && (
        <div className="card p-8 text-center">
          <p className="font-serif text-lg text-ink-900">还没有连载合集</p>
          <p className="mt-2 text-sm text-ink-700/60">
            在投稿页新建连载合集后，就可以在这里管理已发表文章。
          </p>
          <Link href="/submit" className="btn-outline mt-5 inline-flex">
            去投稿页创建
          </Link>
        </div>
      )}

      {serials.map((serial) => (
        <article key={serial.id} className="card p-5 sm:p-6">
          <div className="flex flex-wrap gap-5">
            <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-sm border border-ink-900/10 bg-ink-950">
              {serial.coverImage ? (
                <Image
                  src={serial.coverImage}
                  alt={`${serial.title} 封面`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(160deg,#173a50,#0b2233)] font-serif text-lg text-paper-50/60">
                  连载
                </div>
              )}
              <label className="absolute inset-x-0 bottom-0 cursor-pointer bg-ink-950/75 px-1 py-1 text-center text-[9px] text-paper-50 hover:bg-ink-950/90">
                {loading === `cover:${serial.id}` ? "上传中…" : "更换封面"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={loading !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) changeCover(serial, file);
                  }}
                />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl text-ink-900">
                    {serial.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-ink-700/50">
                    {serial.articles.length} 章 · 更新于{" "}
                    {formatDate(serial.updatedAt, false)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {serial.articles.length > 0 && (
                    <Link
                      href={`/serials/${serial.slug}`}
                      className="text-[11px] text-crimson-600 no-underline"
                    >
                      查看前台 →
                    </Link>
                  )}
                  {serial.coverImage && (
                    <button
                      type="button"
                      onClick={() => removeCover(serial)}
                      disabled={loading !== null}
                      className="text-[11px] text-ink-700/55 hover:text-crimson-600 disabled:opacity-50"
                    >
                      恢复默认封面
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => deleteSerial(serial)}
                      disabled={loading !== null}
                      className="text-[11px] text-crimson-600 hover:text-crimson-700 disabled:opacity-50"
                    >
                      {loading === `delete:${serial.id}`
                        ? "删除中…"
                        : "删除合集"}
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-ink-700/60">
                {serial.description}
              </p>

              <div className="mt-4 border-t border-ink-900/10 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700/45">
                  章节
                </p>
                {serial.articles.length === 0 ? (
                  <p className="mt-2 text-[11px] text-ink-700/45">
                    还没有章节，可以从下方加入已发表文章。
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {serial.articles.map((article, index) => (
                      <li
                        key={article.id}
                        className="flex flex-wrap items-center gap-2 rounded-sm bg-paper-100/60 px-2 py-1.5"
                      >
                        <span className="w-5 text-[10px] text-ink-700/35">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Link
                          href={`/articles/${article.slug}`}
                          className="min-w-0 flex-1 truncate text-[12px] text-ink-900 no-underline hover:text-crimson-600"
                        >
                          {article.title}
                        </Link>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveArticle(serial, article.id, -1)}
                            disabled={index === 0 || loading !== null}
                            className="rounded-sm border border-ink-900/15 px-1.5 py-0.5 text-[10px] text-ink-700/60 disabled:opacity-30"
                            aria-label="上移"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveArticle(serial, article.id, 1)}
                            disabled={
                              index === serial.articles.length - 1 ||
                              loading !== null
                            }
                            className="rounded-sm border border-ink-900/15 px-1.5 py-0.5 text-[10px] text-ink-700/60 disabled:opacity-30"
                            aria-label="下移"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeArticle(serial, article)}
                            disabled={loading !== null}
                            className="ml-1 text-[10px] text-ink-700/45 hover:text-crimson-600 disabled:opacity-40"
                          >
                            移出
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <select
                    className="input text-xs"
                    value={selection[serial.id] ?? ""}
                    onChange={(event) =>
                      setSelection((current) => ({
                        ...current,
                        [serial.id]: event.target.value,
                      }))
                    }
                    disabled={available.length === 0 || loading !== null}
                  >
                    <option value="">
                      {available.length === 0
                        ? "暂无可加入的已发表文章"
                        : "选择一篇已发表文章"}
                    </option>
                    {available.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => addArticle(serial)}
                    disabled={
                      !selection[serial.id] ||
                      loading !== null ||
                      available.length === 0
                    }
                    className="btn-outline shrink-0 !px-4 !py-2 text-xs"
                  >
                    {loading === `add:${serial.id}` ? "加入中…" : "加入合集"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
