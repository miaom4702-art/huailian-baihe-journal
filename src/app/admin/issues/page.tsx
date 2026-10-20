import Link from "next/link";

import { IssueForm } from "@/components/issue-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, issueLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminIssuesPage() {
  await requireRole("EDITOR");

  const issues = await prisma.issue.findMany({
    orderBy: { publishedAt: "desc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Issues</p>
          <h2 className="mt-2 font-serif text-3xl text-ink-900">期刊管理</h2>
          <p className="mt-2 text-sm text-ink-700/65">
            新建期刊后，可在稿件处理中将已录用文章归入该期。
          </p>
        </div>
        <IssueForm />
      </header>

      <div className="mt-8 card overflow-x-auto">
        <table className="admin-table min-w-[640px]">
          <thead>
            <tr>
              <th>期次</th>
              <th>标题</th>
              <th>专题</th>
              <th>文章数</th>
              <th>出版日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td className="whitespace-nowrap text-[11px] text-ink-700/60">
                  {issueLabel(issue)}
                </td>
                <td className="font-serif text-[13px] text-ink-900">{issue.title}</td>
                <td className="text-[11px] text-ink-700/60">{issue.theme ?? "—"}</td>
                <td className="text-[11px] text-ink-700/60">
                  {issue._count.articles}
                </td>
                <td className="whitespace-nowrap text-[11px] text-ink-700/60">
                  {formatDate(issue.publishedAt, false)}
                </td>
                <td>
                  <Link
                    href={`/issues/${issue.id}`}
                    className="text-[11px] text-crimson-600 no-underline"
                  >
                    查看
                  </Link>
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-ink-700/50">
                  还没有期刊，点击右上角新建。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
