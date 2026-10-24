import Link from "next/link";

import { EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { STATUS_TONE, type SubmissionStatus } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { categoryLabel, formatDate, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MySubmissionsPage() {
  const user = await requireUser();
  const submissions = await prisma.submission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      article: { select: { slug: true, deletedAt: true } },
      _count: { select: { reviews: true } },
    },
  });

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Submissions</p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">我的投稿</h2>
          <p className="mt-2 text-sm text-ink-700/65">
            共 {submissions.length} 篇。点击标题查看审稿时间线。
          </p>
        </div>
        <Link href="/submit" className="btn-primary">
          新建投稿
        </Link>
      </header>

      <div className="mt-8">
        {submissions.length === 0 ? (
          <EmptyState
            title="还没有投稿"
            description="你可以提交论文、随笔、评论或社团史料整理。"
            action={
              <Link href="/submit" className="btn-outline">
                开始写作
              </Link>
            }
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="admin-table min-w-[640px]">
              <thead>
                <tr>
                  <th>稿件</th>
                  <th>栏目</th>
                  <th>状态</th>
                  <th>投稿时间</th>
                  <th>审稿记录</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <Link
                        href={`/dashboard/submissions/${submission.id}`}
                        className="font-serif text-[14px] text-ink-900 no-underline hover:text-crimson-600"
                      >
                        {submission.title}
                      </Link>
                      {submission.article && (
                        <p className="mt-0.5 text-[10px] text-crimson-600">
                          {submission.article.deletedAt
                            ? "文章已下架"
                            : "已生成文章"}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-xs">
                      {categoryLabel(submission.category)}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_TONE[submission.status as SubmissionStatus] ?? "bg-ink-900/5 text-ink-700 ring-ink-900/10"}`}
                      >
                        {statusLabel(submission.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-[11px] text-ink-700/55">
                      {formatDate(submission.createdAt, false)}
                    </td>
                    <td className="text-[11px] text-ink-700/55">
                      {submission._count.reviews} 条
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
