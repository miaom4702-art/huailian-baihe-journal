"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  issueId: string;
  archived: boolean;
};

export function IssueActions({ issueId, archived }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (
      !archived &&
      !window.confirm(
        "下架后前台不再显示该期，文章与历史数据会保留，可随时重新上架。确定继续吗？",
      )
    ) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: archived ? "RESTORE" : "ARCHIVE" }),
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
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className={
          archived
            ? "rounded-sm border border-ink-900/20 px-2.5 py-1.5 text-[11px] text-ink-800 hover:border-crimson-600 hover:text-crimson-600 disabled:opacity-50"
            : "rounded-sm border border-crimson-600/30 px-2.5 py-1.5 text-[11px] text-crimson-700 hover:bg-crimson-600/5 disabled:opacity-50"
        }
      >
        {loading ? "处理中…" : archived ? "重新上架" : "下架该期"}
      </button>
      {error && <span className="text-[10px] text-crimson-600">{error}</span>}
    </div>
  );
}
