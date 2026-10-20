"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

export function SubmissionForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") ?? ""),
      abstract: String(formData.get("abstract") ?? ""),
      keywords: String(formData.get("keywords") ?? ""),
      category: String(formData.get("category") ?? ""),
      content: String(formData.get("content") ?? ""),
    };

    setLoading(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "投稿失败，请稍后再试");
        return;
      }
      form.reset();
      setDone(true);
      router.refresh();
    } catch {
      setError("网络异常，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <span className="font-serif text-4xl text-crimson-600">收</span>
        <h2 className="mt-4 font-serif text-2xl text-ink-900">稿件已送达编辑部</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-700/75">
          我们会在 30 日内完成初审，并通过站内状态更新通知你。你可以随时在作者中心查看审稿进度。
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="btn-primary">
            前往作者中心
          </Link>
          <button type="button" onClick={() => setDone(false)} className="btn-outline">
            再投一篇
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-9" noValidate>
      <div>
        <label className="label" htmlFor="title">
          稿件标题
        </label>
        <input
          id="title"
          name="title"
          className="input"
          required
          minLength={4}
          maxLength={120}
          placeholder="简洁、准确地概括文章主题"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">
            投稿栏目
          </label>
          <select id="category" name="category" className="input" required>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="keywords">
            关键词
          </label>
          <input
            id="keywords"
            name="keywords"
            className="input"
            required
            maxLength={120}
            placeholder="以分号分隔，如：地方文学；记忆"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="abstract">
          摘要
        </label>
        <textarea
          id="abstract"
          name="abstract"
          className="input min-h-32 resize-y"
          required
          minLength={30}
          maxLength={800}
          placeholder="30—800 字，说明问题意识、材料与方法、主要结论"
        />
      </div>

      <div>
        <label className="label" htmlFor="content">
          正文
        </label>
        <textarea
          id="content"
          name="content"
          className="input min-h-80 resize-y font-serif leading-7"
          required
          minLength={200}
          maxLength={30000}
          placeholder="请粘贴正文。段落之间空一行。当前版本暂不支持图片与附件上传。"
        />
        <p className="mt-2 text-[11px] leading-5 text-ink-700/55">
          提交即表示你确认稿件为原创作品，并授权本刊在纸质刊与数字平台刊发。审核期间请勿一稿多投。
        </p>
      </div>

      {error && (
        <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs leading-6 text-crimson-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] text-ink-700/50">带 * 项为必填</span>
        <button type="submit" className="btn-crimson" disabled={loading}>
          {loading ? "正在提交…" : "提交稿件"}
        </button>
      </div>
    </form>
  );
}
