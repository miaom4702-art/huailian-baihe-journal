import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  REVIEW_ACTION_LABELS,
  STATUS_TONE,
  type SubmissionStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  categoryLabel,
  formatDate,
  formatDateTime,
  statusLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function SubmissionDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const submission = await prisma.submission.findFirst({
    where: { id, userId: user.id },
    include: {
      article: { select: { slug: true, title: true } },
      reviews: {
        orderBy: { createdAt: "asc" },
        include: { editor: { select: { name: true, role: true } } },
      },
    },
  });

  if (!submission) notFound();

  const paragraphs = submission.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div>
      <Breadcrumb
        items={[
          { href: "/dashboard", label: "作者中心" },
          { href: "/dashboard/submissions", label: "我的投稿" },
          { label: submission.title },
        ]}
      />

      <header className="border-b border-ink-900/10 pb-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-700/55">
          <span className="text-crimson-600">{categoryLabel(submission.category)}</span>
          <span>·</span>
          <span>投稿于 {formatDate(submission.createdAt)}</span>
          <span>·</span>
          <span
            className={`badge ${STATUS_TONE[submission.status as SubmissionStatus] ?? "bg-ink-900/5 text-ink-700 ring-ink-900/10"}`}
          >
            {statusLabel(submission.status)}
          </span>
        </div>
        <h2 className="mt-3 font-serif text-3xl leading-snug text-ink-900">
          {submission.title}
        </h2>
        <p className="mt-2 text-[11px] text-ink-700/55">
          关键词：{submission.keywords}
        </p>
      </header>

      {submission.editorNote && (
        <div className="mt-6 border-l-2 border-gold-400 bg-paper-100/70 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-700/50">
            编辑部意见
          </p>
          <p className="mt-1.5 whitespace-pre-line text-[13px] leading-7 text-ink-900/80">
            {submission.editorNote}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <h3 className="font-serif text-lg text-ink-900">摘要</h3>
          <p className="mt-2 text-[13px] leading-7 text-ink-700/80">
            {submission.abstract}
          </p>

          <h3 className="mt-8 font-serif text-lg text-ink-900">正文</h3>
          <div className="mt-3 space-y-4 border-t border-ink-900/10 pt-5">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="whitespace-pre-line text-[14px] leading-8 text-ink-900/85"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <aside>
          <div className="card p-5">
            <h3 className="font-serif text-base text-ink-900">审稿时间线</h3>
            <ol className="mt-4 space-y-4">
              {submission.reviews.map((review) => (
                <li key={review.id} className="relative border-l border-ink-900/15 pl-4">
                  <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-crimson-600" />
                  <p className="text-[12px] font-medium text-ink-900">
                    {REVIEW_ACTION_LABELS[review.action] ?? review.action}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-700/45">
                    {formatDateTime(review.createdAt)} · {review.editor.name}
                  </p>
                  {review.note && (
                    <p className="mt-1.5 whitespace-pre-line text-[11px] leading-5 text-ink-700/70">
                      {review.note}
                    </p>
                  )}
                </li>
              ))}
              {submission.reviews.length === 0 && (
                <li className="text-[11px] text-ink-700/50">暂无审稿记录。</li>
              )}
            </ol>
          </div>

          {submission.article && (
            <div className="mt-4 border border-crimson-600/20 bg-crimson-600/5 p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-crimson-700/70">
                Published
              </p>
              <p className="mt-2 font-serif text-sm text-ink-900">
                本文已正式刊发
              </p>
              <Link
                href={`/articles/${submission.article.slug}`}
                className="mt-3 inline-flex text-[11px] text-crimson-600 no-underline"
              >
                阅读文章 →
              </Link>
            </div>
          )}

          {submission.status === "REVISION_REQUIRED" && (
            <div className="mt-4 border border-orange-200 bg-orange-50 p-5">
              <p className="text-[12px] font-medium text-orange-800">需要修改</p>
              <p className="mt-1.5 text-[11px] leading-5 text-orange-800/75">
                请根据编辑部意见修改后，将修改稿发送至 editor@hlbh.org，
                并在邮件中逐条说明修改情况。
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-[11px]">
            <Link
              href="/dashboard/submissions"
              className="text-ink-700 no-underline hover:text-crimson-600"
            >
              ← 返回列表
            </Link>
            <Link href="/submit" className="text-crimson-600 no-underline">
              再投一篇 →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
