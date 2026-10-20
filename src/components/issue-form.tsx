"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function IssueForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      year: Number(formData.get("year")),
      volume: Number(formData.get("volume")),
      number: Number(formData.get("number")),
      title: String(formData.get("title") ?? ""),
      theme: String(formData.get("theme") ?? ""),
      description: String(formData.get("description") ?? ""),
      publishedAt: String(formData.get("publishedAt") ?? ""),
    };

    setLoading(true);
    try {
      const response = await fetch("/api/admin/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "创建失败");
        return;
      }
      form.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        新建一期
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card w-full space-y-4 p-5"
      noValidate
    >
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg text-ink-900">新建期刊</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-700/60 hover:text-crimson-600"
        >
          取消
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="year">
            年份
          </label>
          <input
            id="year"
            name="year"
            type="number"
            className="input"
            defaultValue={year}
            min={2000}
            max={2100}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="volume">
            卷
          </label>
          <input
            id="volume"
            name="volume"
            type="number"
            className="input"
            defaultValue={1}
            min={1}
            max={99}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="number">
            期
          </label>
          <input
            id="number"
            name="number"
            type="number"
            className="input"
            defaultValue={1}
            min={1}
            max={99}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="issue-title">
          标题
        </label>
        <input
          id="issue-title"
          name="title"
          className="input"
          required
          minLength={2}
          maxLength={60}
          placeholder="如：生长的年轮"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="theme">
            专题（选填）
          </label>
          <input id="theme" name="theme" className="input" maxLength={60} />
        </div>
        <div>
          <label className="label" htmlFor="publishedAt">
            出版日期
          </label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            className="input"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="description">
          卷首语 / 简介（选填）
        </label>
        <textarea
          id="description"
          name="description"
          className="input min-h-20 resize-y"
          maxLength={500}
        />
      </div>

      {error && <p className="text-xs text-crimson-600">{error}</p>}

      <button type="submit" className="btn-crimson" disabled={loading}>
        {loading ? "创建中…" : "创建期刊"}
      </button>
    </form>
  );
}
