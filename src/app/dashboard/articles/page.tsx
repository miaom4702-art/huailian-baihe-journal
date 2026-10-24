import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardArticlesPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const articles = await prisma.article.findMany({
    where: isAdmin ? {} : { authorId: user.id },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      views: true,
      publishedAt: true,
      deletedAt: true,
      authorId: true,
      author: { select: { name: true } },
      revisions: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true },
      },
      articleViews: {
        orderBy: { lastViewedAt: "desc" },
        take: 100,
        select: {
          lastViewedAt: true,
          user: { select: { name: true } },
        },
      },
      _count: {
        select: {
          articleLikes: true,
          articleViews: true,
          comments: { where: { deletedAt: null } },
        },
      },
    },
  });

  return (
    <div>
      <header>
        <p className="eyebrow">Article Insights</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">文章数据</h2>
        <p className="mt-2 text-sm leading-7 text-ink-700/65">
          {isAdmin
            ? "管理员可查看全站文章的阅读、点赞与评论数据。"
            : "查看自己文章的阅读总数、登录读者名单、点赞与评论数据。"}
          匿名访问只计入阅读总数，不记录身份。
        </p>
      </header>

      <div className="mt-8 space-y-4">
        {articles.length === 0 && (
          <div className="card p-10 text-center text-sm text-ink-700/55">
            还没有已发表文章。
          </div>
        )}

        {articles.map((article) => (
          <article key={article.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-700/45">
                  <span>{formatDate(article.publishedAt, false)}</span>
                  {isAdmin && <span>· {article.author.name}</span>}
                  {article.deletedAt && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
                      已下架
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-serif text-lg leading-7 text-ink-900">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="no-underline hover:text-crimson-600"
                  >
                    {article.title}
                  </Link>
                </h3>
                {article.authorId === user.id && !article.deletedAt && (
                  <Link
                    href={`/dashboard/articles/${article.id}/edit`}
                    className="mt-2 inline-flex text-[11px] text-crimson-600 no-underline"
                  >
                    {article.revisions.length > 0
                      ? "????? ?"
                      : "???? ?"}
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-center">
                <div>
                  <p className="font-serif text-xl text-ink-900">{article.views}</p>
                  <p className="text-[9px] text-ink-700/45">阅读</p>
                </div>
                <div>
                  <p className="font-serif text-xl text-ink-900">
                    {article._count.articleViews}
                  </p>
                  <p className="text-[9px] text-ink-700/45">登录读者</p>
                </div>
                <div>
                  <p className="font-serif text-xl text-ink-900">
                    {article._count.articleLikes}
                  </p>
                  <p className="text-[9px] text-ink-700/45">点赞</p>
                </div>
                <div>
                  <p className="font-serif text-xl text-ink-900">
                    {article._count.comments}
                  </p>
                  <p className="text-[9px] text-ink-700/45">评论</p>
                </div>
              </div>
            </div>

            <details className="mt-4 border-t border-ink-900/10 pt-3">
              <summary className="cursor-pointer text-[11px] text-ink-700/55 hover:text-crimson-600">
                查看读过这篇文章的登录读者（{article.articleViews.length}）
              </summary>
              {article.articleViews.length === 0 ? (
                <p className="mt-3 text-[11px] text-ink-700/45">
                  暂无登录读者记录。
                </p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {article.articleViews.map((view, index) => (
                    <li
                      key={`${article.id}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-sm bg-paper-100/60 px-3 py-2 text-[11px]"
                    >
                      <span className="text-ink-800">{view.user.name}</span>
                      <span className="text-[9px] text-ink-700/40">
                        {formatDateTime(view.lastViewedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}
