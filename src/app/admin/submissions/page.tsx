import Link from "next/link";

import { ReviewActions } from "@/components/review-actions";
import { EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import {
  STATUS_LABELS,
  STATUS_TONE,
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import { categoryLabel, formatDate, issueLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminSubmissionsPage({ searchParams }: Props) {
  await requireRole("EDITOR");
  const params = await searchParams;
  const status = SUBMISSION_STATUSES.includes(params.status as SubmissionStatus)
    ? (params.status as SubmissionStatus)
    : undefined;

  const [submissions, issues, counts] = await Promise.all([
    prisma.submission.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        author: { select: { name: true, email: true } },
        article: { select: { slug: true, deletedAt: true } },
        serial: { select: { title: true, slug: true } },
      },
    }),
    prisma.issue.findMany({
      orderBy: { publishedAt: "desc" },
      select: { id: true, year: true, volume: true, number: true, title: true },
    }),
    prisma.submission.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countMap = Object.fromEntries(
    counts.map((group) => [group.status, group._count._all]),
  ) as Record<string, number>;

  const issueOptions = issues.map((issue) => ({
    id: issue.id,
    label: `${issueLabel(issue)} · ${issue.title}`,
  }));

  const total = counts.reduce((sum, group) => sum + group._count._all, 0);

  return (
    <div>
      <header>
        <p className="eyebrow">Submissions</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">稿件处理</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          所有状态变更都会写入审稿时间线与审计日志。刊发操作将同步生成公开文章。
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-1.5">
        <Link
          href="/admin/submissions"
          className={`rounded-full px-3 py-1.5 text-[11px] no-underline ${
            !status
              ? "bg-ink-900 text-paper-50"
              : "bg-ink-900/5 text-ink-700 hover:bg-ink-900/10"
          }`}
        >
          全部 {total}
        </Link>
        {SUBMISSION_STATUSES.map((item) => (
          <Link
            key={item}
            href={`/admin/submissions?status=${item}`}
            className={`rounded-full px-3 py-1.5 text-[11px] no-underline ${
              status === item
                ? "bg-ink-900 text-paper-50"
                : "bg-ink-900/5 text-ink-700 hover:bg-ink-900/10"
            }`}
          >
            {STATUS_LABELS[item]} {countMap[item] ?? 0}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {submissions.length === 0 ? (
          <EmptyState title="没有符合条件的稿件" description="切换筛选条件后再试。" />
        ) : (
          submissions.map((submission) => (
            <article
              key={submission.id}
              id={`submission-${submission.id}`}
              className="card scroll-mt-28 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-700/50">
                    <span className="text-crimson-600">
                      {categoryLabel(submission.category)}
                    </span>
                    <span>·</span>
                    <span>
                      {submission.author.name}（{submission.author.email}）
                    </span>
                    <span>·</span>
                    <span>{formatDate(submission.createdAt)}</span>
                    {submission.serial && (
                      <>
                        <span>·</span>
                        <span className="text-crimson-600">
                          连载：{submission.serial.title}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-2 font-serif text-lg leading-7 text-ink-900">
                    {submission.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-ink-700/50">
                    关键词：{submission.keywords}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {submission.article &&
                    (submission.article.deletedAt ? (
                      <span className="text-[10px] text-ink-700/45">
                        文章已下架
                      </span>
                    ) : (
                      <Link
                        href={`/articles/${submission.article.slug}`}
                        className="text-[10px] text-crimson-600 no-underline"
                      >
                        查看文章
                      </Link>
                    ))}
                  <span
                    className={`badge ${STATUS_TONE[submission.status as SubmissionStatus] ?? "bg-ink-900/5 text-ink-700 ring-ink-900/10"}`}
                  >
                    {STATUS_LABELS[submission.status as SubmissionStatus] ??
                      submission.status}
                  </span>
                </div>
              </div>

              <details className="group mt-3">
                <summary className="cursor-pointer text-[11px] text-ink-700/60 hover:text-crimson-600">
                  展开摘要与正文
                </summary>
                <div className="mt-3 rounded-sm bg-paper-100/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-700/50">
                    摘要
                  </p>
                  <p className="mt-1 text-[12px] leading-6 text-ink-900/80">
                    {submission.abstract}
                  </p>
                  <p className="mt-4 whitespace-pre-line text-[12px] leading-7 text-ink-900/75">
                    {submission.content}
                  </p>
                </div>
              </details>

              {submission.editorNote && (
                <p className="mt-3 border-l-2 border-gold-400/60 pl-3 text-[11px] leading-5 text-ink-700/65">
                  最近意见：{submission.editorNote}
                </p>
              )}

              <div className="mt-4 border-t border-ink-900/10 pt-4">
                <ReviewActions
                  submissionId={submission.id}
                  status={submission.status}
                  issues={issueOptions}
                />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
