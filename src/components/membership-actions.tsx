"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MembershipActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "APPROVE" | "REJECT") {
    setError(null);
    if (action === "REJECT" && !window.confirm("确定拒绝该入会申请吗？")) return;

    setLoading(action);
    try {
      const response = await fetch(`/api/admin/memberships/${applicationId}`, {
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
    <div className="mt-2 space-y-2">
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="input text-xs"
        maxLength={500}
        placeholder="审核备注（可选）"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => run("APPROVE")}
          disabled={loading !== null}
          className="rounded-sm bg-ink-900 px-2.5 py-1.5 text-[11px] text-paper-50 hover:bg-ink-700 disabled:opacity-50"
        >
          {loading === "APPROVE" ? "处理中…" : "通过"}
        </button>
        <button
          type="button"
          onClick={() => run("REJECT")}
          disabled={loading !== null}
          className="rounded-sm border border-ink-900/20 px-2.5 py-1.5 text-[11px] text-ink-800 hover:border-crimson-600 hover:text-crimson-600 disabled:opacity-50"
        >
          {loading === "REJECT" ? "处理中…" : "拒绝"}
        </button>
      </div>
      {error && <p className="text-[11px] text-crimson-600">{error}</p>}
    </div>
  );
}
