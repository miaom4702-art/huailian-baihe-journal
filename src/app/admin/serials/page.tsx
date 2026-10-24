import Image from "next/image";
import Link from "next/link";

import { SerialManager } from "@/components/serial-manager";
import { EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { STATUS_LABELS, STATUS_TONE, type SubmissionStatus } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSerialsPage() {
  const user = await requireRole("EDITOR");
  const isAdmin = user.role === "ADMIN";

  const [serials, available] = await Promise.all([
    prisma.serial.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { name: true, email: true } },
        submissions: {
          orderBy: { createdAt: "asc" },
          select: { id: true, title: true, status: true, createdAt: true },
        },
        articles: {
          where: { deletedAt: null },
          orderBy: [{ serialOrder: "asc" }, { publishedAt: "asc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            serialOrder: true,
          },
        },
      },
    }),
    prisma.article.findMany({
      where: { serialId: null, deletedAt: null },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, publishedAt: true },
    }),
  ]);

  return (
    <div>
      <header>
        <p className="eyebrow">Serials</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">连载管理</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          连载合集与所属章节会一并展示；点击章节可直接跳到稿件处理进行审稿、录用与刊发。管理员也可以在下方章节编排中管理任意合集。
        </p>
      </header>

      <div className="mt-8 space-y-5">
        {serials.length === 0 ? (
          <EmptyState
            title="还没有连载合集"
            description="作者在投稿页创建合集后，会显示在这里。"
          />
        ) : (
          serials.map((serial) => (
            <article key={serial.id} className="card p-5">
              <div className="flex flex-wrap gap-5">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-sm border border-ink-900/10 bg-ink-950">
                  {serial.coverImage ? (
                    <Image
                      src={serial.coverImage}
                      alt={`${serial.title} 封面`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[linear-gradient(160deg,#173a50,#0b2233)] font-serif text-lg text-paper-50/60">
                      连载
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl text-ink-900">
                        {serial.title}
                      </h3>
                      <p className="mt-1 text-[11px] text-ink-700/50">
                        {serial.author.name}（{serial.author.email}） · 更新于{" "}
                        {formatDate(serial.updatedAt, false)}
                      </p>
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <span className="rounded-full bg-ink-900/5 px-2 py-0.5 text-ink-700/60">
                        {serial.submissions.length} 章投稿
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
                        {serial.articles.length} 章已刊发
                      </span>
                      {serial.articles.length > 0 && (
                        <Link
                          href={`/serials/${serial.slug}`}
                          className="text-crimson-600 no-underline"
                        >
                          查看前台 →
                        </Link>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-6 text-ink-700/65">
                    {serial.description}
                  </p>

                  {serial.submissions.length > 0 && (
                    <div className="mt-4 border-t border-ink-900/10 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700/45">
                        章节
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {serial.submissions.map((submission, index) => (
                          <li key={submission.id}>
                            <Link
                              href={`/admin/submissions#submission-${submission.id}`}
                              className="flex flex-wrap items-center gap-2 text-[11px] text-ink-800 no-underline hover:text-crimson-600"
                            >
                              <span className="text-ink-700/35">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                {submission.title}
                              </span>
                              <span
                                className={`badge ${STATUS_TONE[submission.status as SubmissionStatus] ?? "bg-ink-900/5 text-ink-700 ring-ink-900/10"}`}
                              >
                                {STATUS_LABELS[submission.status as SubmissionStatus] ??
                                  submission.status}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {isAdmin && (
      <section className="mt-12 border-t border-ink-900/10 pt-8">
        <h3 className="font-serif text-2xl text-ink-900">章节编排</h3>
        <p className="mt-2 text-sm leading-7 text-ink-700/60">
          管理员可编辑任意连载合集：加入任意已发表文章、移出章节、上下调整顺序。普通作者仍只能管理自己的合集。
        </p>
        <SerialManager
          serials={serials.map((serial) => ({
            id: serial.id,
            title: serial.title,
            slug: serial.slug,
            description: serial.description,
            coverImage: serial.coverImage,
            updatedAt: serial.updatedAt.toISOString(),
            articles: serial.articles.map((article) => ({
              id: article.id,
              title: article.title,
              slug: article.slug,
              publishedAt: article.publishedAt.toISOString(),
            })),
          }))}
          available={available.map((article) => ({
            id: article.id,
            title: article.title,
            slug: article.slug,
            publishedAt: article.publishedAt.toISOString(),
          }))}
          canDelete
        />
      </section>
      )}
    </div>
  );
}
