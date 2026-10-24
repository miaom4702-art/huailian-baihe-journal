import Link from "next/link";

import { RevisionActions } from "@/components/revision-actions";
import { EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRevisionsPage() {
  await requireRole("EDITOR");

  const revisions = await prisma.articleRevision.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { name: true, email: true } },
      article: {
        select: {
          id: true,
          title: true,
          abstract: true,
          keywords: true,
          category: true,
          content: true,
          slug: true,
        },
      },
    },
  });

  return (
    <div>
      <header>
        <p className="eyebrow">Article Revisions</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">文章修订</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          作者对已发表文章的修改申请。审核期间原文章继续展示；通过后才替换文章内容。
        </p>
      </header>

      <div className="mt-8 space-y-5">
        {revisions.length === 0 ? (
          <EmptyState
            title="没有待审核的修改"
            description="作者提交文章修改后，会出现在这里。"
          />
        ) : (
          revisions.map((revision) => (
            <article key={revision.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] text-ink-700/50">
                    {revision.author.name}（{revision.author.email}） ·{" "}
                    {formatDateTime(revision.createdAt)}
                  </p>
                  <h3 className="mt-2 font-serif text-lg text-ink-900">
                    修改：{revision.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-ink-700/45">
                    当前文章：{revision.article.title}
                  </p>
                </div>
                <Link
                  href={`/articles/${revision.article.slug}`}
                  className="text-[11px] text-crimson-600 no-underline"
                >
                  查看原文 →
                </Link>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-[11px] text-ink-700/55 hover:text-crimson-600">
                  对比当前文章与修改稿
                </summary>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-sm bg-paper-100/70 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700/45">
                      当前文章
                    </p>
                    <p className="mt-2 font-serif text-sm text-ink-900">
                      {revision.article.title}
                    </p>
                    <p className="mt-1 text-[10px] text-ink-700/45">
                      {revision.article.keywords}
                    </p>
                    <p className="mt-3 max-h-52 overflow-y-auto whitespace-pre-line text-[11px] leading-6 text-ink-700/70">
                      {revision.article.abstract || "（无摘要）"}
                      {"\n\n"}
                      {revision.article.content}
                    </p>
                  </div>
                  <div className="rounded-sm border border-crimson-600/20 bg-crimson-600/5 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-crimson-700/60">
                      修改稿
                    </p>
                    <p className="mt-2 font-serif text-sm text-ink-900">
                      {revision.title}
                    </p>
                    <p className="mt-1 text-[10px] text-ink-700/45">
                      {revision.keywords}
                    </p>
                    <p className="mt-3 max-h-52 overflow-y-auto whitespace-pre-line text-[11px] leading-6 text-ink-700/70">
                      {revision.abstract || "（无摘要）"}
                      {"\n\n"}
                      {revision.content}
                    </p>
                  </div>
                </div>
              </details>

              <RevisionActions revisionId={revision.id} />
            </article>
          ))
        )}
      </div>
    </div>
  );
}
