import Link from "next/link";

import { IssueActions } from "@/components/issue-actions";
import { IssueCoverUploader } from "@/components/issue-cover-uploader";
import { IssueForm } from "@/components/issue-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, issueLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminIssuesPage() {
  const user = await requireRole("EDITOR");
  const isAdmin = user.role === "ADMIN";

  const issues = await prisma.issue.findMany({
    orderBy: [{ archivedAt: "asc" }, { publishedAt: "desc" }],
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Issues</p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">期刊管理</h2>
          <p className="mt-2 text-sm text-ink-700/65">
            新建期刊后，可在稿件处理中将已录用文章归入该期。管理员可下架某一期，文章与历史数据会保留，也可重新上架。
          </p>
        </div>
        <IssueForm />
      </header>

      <div className="mt-8 card overflow-x-auto">
        <table className="admin-table min-w-[880px]">
          <thead>
            <tr>
              <th>封面</th>
              <th>期次</th>
              <th>标题</th>
              <th>专题</th>
              <th>文章数</th>
              <th>出版日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td>
                  <IssueCoverUploader
                    issueId={issue.id}
                    coverImage={issue.coverImage}
                    editable={isAdmin}
                  />
                </td>
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
                  {issue.archivedAt ? (
                    <div>
                      <span className="badge bg-stone-100 text-stone-600 ring-stone-200">
                        已下架
                      </span>
                      <p className="mt-1 text-[10px] text-ink-700/40">
                        {formatDate(issue.archivedAt, false)}
                      </p>
                    </div>
                  ) : (
                    <span className="badge bg-emerald-50 text-emerald-700 ring-emerald-200">
                      已上架
                    </span>
                  )}
                </td>
                <td>
                  <div className="flex flex-col items-start gap-1.5">
                    {!issue.archivedAt && (
                      <Link
                        href={`/issues/${issue.id}`}
                        className="text-[11px] text-crimson-600 no-underline"
                      >
                        查看
                      </Link>
                    )}
                    {isAdmin ? (
                      <IssueActions
                        issueId={issue.id}
                        archived={Boolean(issue.archivedAt)}
                      />
                    ) : (
                      <span className="text-[10px] text-ink-700/40">
                        仅管理员可下架
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs text-ink-700/50">
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
