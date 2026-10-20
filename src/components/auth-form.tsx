"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { safeNextPath } from "@/lib/utils";

type Mode = "login" | "register";

export function AuthForm({ mode, next }: { mode: Mode; next?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      ...(mode === "register"
        ? {
            name: String(formData.get("name") ?? ""),
            affiliation: String(formData.get("affiliation") ?? ""),
          }
        : {}),
    };

    if (mode === "register" && payload.password !== String(formData.get("confirm"))) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "操作失败，请稍后再试");
        return;
      }

      const target =
        mode === "login" ? safeNextPath(next) ?? "/dashboard" : "/dashboard";
      router.push(target);
      router.refresh();
    } catch {
      setError("网络异常，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {mode === "register" && (
        <>
          <div>
            <label className="label" htmlFor="name">
              姓名 / 笔名
            </label>
            <input
              id="name"
              name="name"
              className="input"
              autoComplete="name"
              required
              minLength={2}
              maxLength={40}
              placeholder="如：林清和"
            />
          </div>
          <div>
            <label className="label" htmlFor="affiliation">
              院系 / 单位（选填）
            </label>
            <input
              id="affiliation"
              name="affiliation"
              className="input"
              maxLength={80}
              placeholder="如：淮安大学文学院"
            />
          </div>
        </>
      )}

      <div>
        <label className="label" htmlFor="email">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          required
          maxLength={160}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "login" ? 1 : 10}
          maxLength={72}
          placeholder={mode === "login" ? "请输入密码" : "至少 10 位，含字母与数字"}
        />
      </div>

      {mode === "register" && (
        <div>
          <label className="label" htmlFor="confirm">
            确认密码
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            className="input"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={72}
            placeholder="再次输入密码"
          />
        </div>
      )}

      {error && (
        <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs leading-6 text-crimson-700">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "请稍候…" : mode === "login" ? "登录" : "创建账号"}
      </button>

      <p className="text-center text-xs text-ink-700/70">
        {mode === "login" ? (
          <>
            还没有账号？
            <Link
              href="/register"
              className="ml-1 text-crimson-600 decoration-crimson-600/30"
            >
              注册
            </Link>
          </>
        ) : (
          <>
            已有账号？
            <Link
              href="/login"
              className="ml-1 text-crimson-600 decoration-crimson-600/30"
            >
              登录
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
