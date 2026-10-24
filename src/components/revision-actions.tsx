"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RevisionActions({ revisionId }: { revisionId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "APPROVE" | "REJECT") {
    if (
      action === "REJECT" &&
      !window.confirm("确定驳回这次修改吗？原文将保持不变。")
    ) {
      return;
    }
    setError(null);
    setLoading(action);
    try {
      const response = await fetch(`/api/admin/revisions/${revisionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
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

  return (
    <div className="mt-4 space-y-2 border-t border-ink-900/10 pt-3">
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="input text-xs"
        maxLength={1000}
        placeholder="审核意见（可选，将记录在修改申请中）"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => run("APPROVE")}
          disabled={loading !== null}
          className="rounded-sm bg-ink-900 px-3 py-1.5 text-[11px] text-paper-50 hover:bg-ink-700 disabled:opacity-50"
        >
          {loading === "APPROVE" ? "处理中…" : "通过并更新文章"}
        </button>
        <button
          type="button"
          onClick={() => run("REJECT")}
          disabled={loading !== null}
          className="rounded-sm border border-ink-900/20 px-3 py-1.5 text-[11px] text-ink-800 hover:border-crimson-600 hover:text-crimson-600 disabled:opacity-50"
        >
          {loading === "REJECT" ? "处理中…" : "驳回，保留原文"}
        </button>
      </div>
      {error && <p className="text-[11px] text-crimson-600">{error}</p>}
    </div>
  );
}
