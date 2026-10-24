"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatDate } from "@/lib/utils";

type Announcement = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  publishedAt: string;
};

const emptyForm = { title: "", content: "", pinned: false };

export function AnnouncementManager({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(item: Announcement) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      pinned: item.pinned,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(
        editingId
          ? `/api/admin/announcements/${editingId}`
          : "/api/admin/announcements",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
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

  async function remove(item: Announcement) {
    if (!window.confirm(`确定删除公告「${item.title}」吗？此操作不可恢复。`)) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/announcements/${item.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "删除失败");
        return;
      }
      if (editingId === item.id) reset();
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-ink-900">
            {editingId ? "编辑公告" : "新建公告"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="text-[11px] text-ink-700/60 hover:text-crimson-600"
            >
              取消编辑
            </button>
          )}
        </div>

        <div>
          <label className="label" htmlFor="ann-title">
            标题
          </label>
          <input
            id="ann-title"
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

        <div>
          <label className="label" htmlFor="ann-content">
            内容
          </label>
          <textarea
            id="ann-content"
            className="input min-h-56 resize-y"
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({ ...current, content: event.target.value }))
            }
            required
            minLength={10}
            maxLength={5000}
            placeholder="段落之间空一行，前台会按段落展示。"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-ink-800">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={(event) =>
              setForm((current) => ({ ...current, pinned: event.target.checked }))
            }
            className="h-4 w-4 rounded border-ink-900/20"
          />
          置顶显示
        </label>

        {error && (
          <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs text-crimson-700">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "保存中…" : editingId ? "保存修改" : "发布公告"}
        </button>
      </form>

      <div className="space-y-3">
        {announcements.length === 0 && (
          <div className="card p-10 text-center text-sm text-ink-700/55">
            暂无公告，左侧可以发布第一条。
          </div>
        )}
        {announcements.map((item) => (
          <article key={item.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-700/45">
              {item.pinned && (
                <span className="rounded-full bg-crimson-600/10 px-2 py-0.5 text-crimson-700">
                  置顶
                </span>
              )}
              <span>{formatDate(item.publishedAt)}</span>
            </div>
            <h4 className="mt-2 font-serif text-[15px] leading-7 text-ink-900">
              {item.title}
            </h4>
            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-ink-700/60">
              {item.content}
            </p>
            <div className="mt-3 flex gap-4 border-t border-ink-900/10 pt-3 text-[11px]">
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="text-crimson-600"
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => remove(item)}
                disabled={loading}
                className="text-ink-700/55 hover:text-crimson-600 disabled:opacity-50"
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
