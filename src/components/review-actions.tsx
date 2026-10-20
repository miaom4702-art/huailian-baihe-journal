"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type IssueOption = { id: string; label: string };

type Props = {
  submissionId: string;
  status: string;
  issues: IssueOption[];
};

const actionLabels: Record<string, string> = {
  START_REVIEW: "进入外审",
  REQUEST_REVISION: "退回修改",
  ACCEPT: "录用",
  REJECT: "退稿",
  PUBLISH: "确认刊发",
};

function actionsFor(status: string) {
  switch (status) {
    case "SUBMITTED":
      return ["START_REVIEW", "REQUEST_REVISION", "ACCEPT", "REJECT"];
    case "UNDER_REVIEW":
      return ["REQUEST_REVISION", "ACCEPT", "REJECT"];
    case "REVISION_REQUIRED":
      return ["ACCEPT", "REJECT"];
    case "ACCEPTED":
      return ["PUBLISH"];
    default:
      return [];
  }
}

export function ReviewActions({ submissionId, status, issues }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [issueId, setIssueId] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = actionsFor(status);
  if (actions.length === 0) {
    return <p className="text-[11px] text-ink-700/50">该稿件已完成流程</p>;
  }

  async function run(action: string) {
    if (
      (action === "REJECT" || action === "PUBLISH") &&
      !window.confirm(`确定要执行「${actionLabels[action]}」吗？`)
    ) {
      return;
    }

    setError(null);
    setLoading(action);
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: note.trim() || undefined,
          issueId: action === "PUBLISH" && issueId ? issueId : undefined,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "操作失败");
        return;
      }
      setNote("");
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="input min-h-16 text-xs"
        maxLength={1000}
        placeholder="审稿意见（可选，将记录在审稿时间线中）"
      />

      {status === "ACCEPTED" && (
        <select
          value={issueId}
          onChange={(event) => setIssueId(event.target.value)}
          className="input text-xs"
        >
          <option value="">暂不归入某一期</option>
          {issues.map((issue) => (
            <option key={issue.id} value={issue.id}>
              {issue.label}
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => run(action)}
            disabled={loading !== null}
            className={
              action === "REJECT" || action === "ACCEPT" || action === "PUBLISH"
                ? "rounded-sm border border-ink-900/20 px-2.5 py-1.5 text-[11px] text-ink-800 hover:border-crimson-600 hover:text-crimson-600 disabled:opacity-50"
                : "rounded-sm bg-ink-900 px-2.5 py-1.5 text-[11px] text-paper-50 hover:bg-ink-700 disabled:opacity-50"
            }
          >
            {loading === action ? "处理中…" : actionLabels[action]}
          </button>
        ))}
      </div>

      {error && <p className="text-[11px] text-crimson-600">{error}</p>}
    </div>
  );
}
