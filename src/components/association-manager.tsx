"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Association = {
  id: string;
  name: string;
  shortName: string | null;
  description: string;
  email: string | null;
  groupNumber: string | null;
  sortOrder: number;
  published: boolean;
};

type FormState = {
  name: string;
  shortName: string;
  description: string;
  email: string;
  groupNumber: string;
  sortOrder: number;
  published: boolean;
};

const emptyForm: FormState = {
  name: "",
  shortName: "",
  description: "",
  email: "",
  groupNumber: "",
  sortOrder: 0,
  published: true,
};

export function AssociationManager({
  associations,
}: {
  associations: Association[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(item: Association) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      shortName: item.shortName ?? "",
      description: item.description,
      email: item.email ?? "",
      groupNumber: item.groupNumber ?? "",
      sortOrder: item.sortOrder,
      published: item.published,
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
          ? `/api/admin/associations/${editingId}`
          : "/api/admin/associations",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            shortName: form.shortName || undefined,
            email: form.email || undefined,
            groupNumber: form.groupNumber || undefined,
          }),
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

  async function remove(item: Association) {
    if (!window.confirm(`确定删除协会「${item.name}」吗？此操作不可恢复。`)) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/associations/${item.id}`, {
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
            {editingId ? "编辑协会" : "新建协会"}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="assoc-name">
              名称
            </label>
            <input
              id="assoc-name"
              className="input"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              minLength={2}
              maxLength={80}
            />
          </div>
          <div>
            <label className="label" htmlFor="assoc-short">
              简称（选填）
            </label>
            <input
              id="assoc-short"
              className="input"
              value={form.shortName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  shortName: event.target.value,
                }))
              }
              maxLength={30}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="assoc-description">
            简介
          </label>
          <textarea
            id="assoc-description"
            className="input min-h-32 resize-y"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            required
            minLength={10}
            maxLength={1000}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="assoc-email">
              邮箱（选填）
            </label>
            <input
              id="assoc-email"
              type="email"
              className="input"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              maxLength={160}
            />
          </div>
          <div>
            <label className="label" htmlFor="assoc-group">
              群号（选填）
            </label>
            <input
              id="assoc-group"
              className="input"
              value={form.groupNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  groupNumber: event.target.value,
                }))
              }
              maxLength={30}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="assoc-sort">
              排序值
            </label>
            <input
              id="assoc-sort"
              type="number"
              className="input"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value),
                }))
              }
              min={0}
              max={999}
            />
          </div>
          <label className="mt-6 flex items-center gap-2 text-xs text-ink-800">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  published: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-ink-900/20"
            />
            前台展示
          </label>
        </div>

        {error && (
          <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs text-crimson-700">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "保存中…" : editingId ? "保存修改" : "创建协会"}
        </button>
      </form>

      <div className="space-y-3">
        {associations.length === 0 && (
          <div className="card p-10 text-center text-sm text-ink-700/55">
            暂无协会，左侧可以创建第一条。
          </div>
        )}
        {associations.map((item) => (
          <article key={item.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-700/45">
              <span className="text-crimson-600">排序 {item.sortOrder}</span>
              <span>·</span>
              <span>{item.published ? "前台展示" : "已隐藏"}</span>
            </div>
            <h4 className="mt-2 font-serif text-[15px] text-ink-900">
              {item.name}
              {item.shortName && (
                <span className="ml-2 text-[11px] font-sans text-ink-700/45">
                  {item.shortName}
                </span>
              )}
            </h4>
            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-ink-700/60">
              {item.description}
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
