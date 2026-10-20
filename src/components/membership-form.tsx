"use client";

import { useState } from "react";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
};

export function MembershipForm({ defaultName, defaultEmail }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      studentId: String(formData.get("studentId") ?? ""),
      school: String(formData.get("school") ?? ""),
      major: String(formData.get("major") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    };

    setLoading(true);
    try {
      const response = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "提交失败，请稍后再试");
        return;
      }
      form.reset();
      setDone(true);
    } catch {
      setError("网络异常，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <span className="font-serif text-4xl text-crimson-600">候</span>
        <h2 className="mt-4 font-serif text-2xl text-ink-900">申请已收到</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-ink-700/75">
          理事会将在两周内完成审核，结果会通过邮件通知。感谢你愿意加入百合的共同体。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-9" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="m-name">
            姓名
          </label>
          <input
            id="m-name"
            name="name"
            className="input"
            defaultValue={defaultName}
            required
            minLength={2}
            maxLength={40}
          />
        </div>
        <div>
          <label className="label" htmlFor="m-email">
            邮箱
          </label>
          <input
            id="m-email"
            name="email"
            type="email"
            className="input"
            defaultValue={defaultEmail}
            required
            maxLength={160}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="studentId">
            学号（选填）
          </label>
          <input
            id="studentId"
            name="studentId"
            className="input"
            maxLength={30}
            placeholder="仅用于在校生身份核验"
          />
        </div>
        <div>
          <label className="label" htmlFor="school">
            学院 / 单位
          </label>
          <input
            id="school"
            name="school"
            className="input"
            required
            minLength={2}
            maxLength={80}
            placeholder="如：淮安大学文学院"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="major">
          专业 / 研究方向（选填）
        </label>
        <input id="major" name="major" className="input" maxLength={80} />
      </div>

      <div>
        <label className="label" htmlFor="reason">
          申请理由
        </label>
        <textarea
          id="reason"
          name="reason"
          className="input min-h-32 resize-y"
          required
          minLength={20}
          maxLength={1000}
          placeholder="20—1000 字。可以谈谈你与文学、地方文化或同好会的缘分，以及希望参与的工作。"
        />
      </div>

      {error && (
        <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs leading-6 text-crimson-700">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "正在提交…" : "提交入会申请"}
      </button>
    </form>
  );
}
