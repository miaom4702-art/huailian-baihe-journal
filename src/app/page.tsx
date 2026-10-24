import Image from "next/image";
import Link from "next/link";

import { ArticleCard } from "@/components/article-card";
import { MoonPair, Petals } from "@/components/lily-motifs";
import { Badge, EmptyState, SectionHeading, Stat } from "@/components/ui";
import { prisma } from "@/lib/db";
import { categoryLabel, excerpt, formatDate, issueLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [latestIssue, featured, latest, announcements, articleCount, issueCount, memberCount] =
    await Promise.all([
      prisma.issue.findFirst({
        where: { archivedAt: null },
        orderBy: { publishedAt: "desc" },
        include: {
          articles: {
            orderBy: { publishedAt: "desc" },
            take: 5,
            include: { author: { select: { name: true } } },
          },
        },
      }),
      prisma.article.findMany({
        where: { featured: true, deletedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 3,
        include: { author: { select: { name: true } } },
      }),
      prisma.article.findMany({
        where: { deletedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 6,
        include: { author: { select: { name: true } } },
      }),
      prisma.announcement.findMany({
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        take: 3,
      }),
      prisma.article.count({ where: { deletedAt: null } }),
      prisma.issue.count(),
      prisma.user.count({ where: { memberSince: { not: null } } }),
    ]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-900/10">
        <Petals count={6} className="opacity-60" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(185,214,223,0.18),transparent_65%)]" />
        <div className="pointer-events-none absolute -right-24 top-10 hidden select-none font-serif text-[22rem] leading-none text-ink-900/[0.035] lg:block">
          百
        </div>
        <div className="wrap grid items-center gap-10 py-12 sm:gap-14 sm:py-16 lg:grid-cols-[1.12fr_0.88fr] lg:py-24">
          <div className="relative">
            <p className="eyebrow">淮安大学 · 淮联百合同好会</p>
            <h1 className="mt-6 font-serif text-[34px] leading-[1.25] sm:text-5xl tracking-wide text-ink-900 sm:text-5xl lg:text-[54px]">
              在文字的年轮里，
              <br />
              遇见同一种<span className="text-crimson-600">芬芳</span>。
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 sm:mt-7 sm:leading-8 text-ink-700/80">
              《淮联百合期刊》创刊于 2025 年，刊发同人、原创、短篇连载与长篇连载。
              我们相信，严肃的写作与温柔的共同体并不矛盾——每一期，都是一次缓慢而诚实的相聚。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={latestIssue ? `/issues/${latestIssue.id}` : "/issues"}
                className="btn-primary"
              >
                阅读本期
              </Link>
              <Link href="/submit" className="btn-outline">
                我要投稿
              </Link>
              <Link
                href="/about"
                className="btn-ghost text-ink-700 underline decoration-ink-900/20"
              >
                了解期刊
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 sm:mt-12 sm:gap-6 border-t border-ink-900/10 pt-7">
              <Stat value={articleCount} label="已刊文章" />
              <Stat value={issueCount} label="出版期数" />
              <Stat value={memberCount} label="在册会员" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[330px]">
            <MoonPair className="pointer-events-none absolute -left-24 -top-16 hidden w-[250px] opacity-55 sm:block" />
            <div className="absolute -inset-3 rotate-[-2.5deg] border border-gold-400/40" />
            <div className="absolute inset-0 translate-x-3 translate-y-3 bg-crimson-600/10" />
            <div className="absolute -top-1 right-7 z-10 h-14 w-4 bg-gold-400 shadow-sm [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]" />
            <div className="relative isolate bg-ink-950 px-6 py-8 text-paper-50 shadow-2xl sm:px-8 sm:py-9">
              {latestIssue?.coverImage && (
                <>
                  <Image
                    src={latestIssue.coverImage}
                    alt=""
                    fill
                    unoptimized
                    className="-z-10 object-cover opacity-45"
                  />
                  <div className="-z-10 absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/20" />
                </>
              )}
              <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.24em] text-paper-100/50">
                <span>Huailian Baihe</span>
                <span>{latestIssue?.year ?? new Date().getFullYear()}</span>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/50 font-serif text-3xl text-gold-300">
                  百
                </span>
                <div className="h-px flex-1 bg-gold-400/30" />
              </div>
              <p className="mt-8 font-serif text-[26px] leading-snug tracking-[0.18em]">
                淮联百合
                <br />
                期刊
              </p>
              <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-gold-300/80">
                {latestIssue ? issueLabel(latestIssue) : "Journal of Humanities"}
              </p>
              <p className="mt-2 font-serif text-sm leading-7 text-paper-100/80">
                {latestIssue?.title ?? "文学 · 历史 · 地方"}
              </p>
              {latestIssue?.theme && (
                <p className="mt-4 text-[11px] leading-6 text-paper-100/45">
                  专题 / {latestIssue.theme}
                </p>
              )}
              <div className="mt-10 border-t border-paper-50/15 pt-4 text-[9px] leading-5 tracking-[0.12em] text-paper-100/40">
                淮安大学淮联百合同好会 主办
                <br />
                HUAIAN UNIVERSITY · HUAILIAN BAIHE
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap py-12 sm:py-16 lg:py-20">
        <SectionHeading
          eyebrow="Current Issue"
          title="本期目录"
          description="从卷首语到末篇，一期完整的阅读路径。"
          action={
            latestIssue && (
              <Link href={`/issues/${latestIssue.id}`} className="btn-outline">
                查看整期
              </Link>
            )
          }
        />

        {latestIssue ? (
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="card divide-y divide-ink-900/10 px-6 py-3 sm:px-8">
              {latestIssue.articles.length === 0 && (
                <p className="py-10 text-center text-sm text-ink-700/60">
                  本期文章正在编排中。
                </p>
              )}
              {latestIssue.articles.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group flex items-baseline gap-4 py-5 no-underline"
                >
                  <span className="w-7 shrink-0 font-serif text-sm text-ink-900/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-[10px] text-ink-700/55">
                      <span className="text-crimson-600">
                        {categoryLabel(article.category)}
                      </span>
                      <span>·</span>
                      <span>{article.author.name}</span>
                    </span>
                    <span className="mt-1 block font-serif text-[16px] leading-7 text-ink-900 transition-colors group-hover:text-crimson-700">
                      {article.title}
                    </span>
                  </span>
                  <span className="hidden text-[11px] text-ink-900/25 group-hover:text-crimson-600 sm:block">
                    →
                  </span>
                </Link>
              ))}
            </div>

            <aside className="card flex flex-col bg-ink-950 p-7 text-paper-100/80">
              <p className="text-[10px] uppercase tracking-[0.24em] text-gold-300/80">
                卷首语
              </p>
              <h3 className="mt-4 font-serif text-2xl leading-snug text-paper-50">
                {latestIssue.title}
              </h3>
              <p className="mt-4 text-[13px] leading-7 text-paper-100/60">
                {latestIssue.description ?? "本期内容正在整理，敬请期待。"}
              </p>
              <div className="mt-auto pt-8">
                <p className="text-[11px] text-paper-100/40">
                  {issueLabel(latestIssue)}
                </p>
                <p className="mt-1 text-[11px] text-paper-100/40">
                  出版于 {formatDate(latestIssue.publishedAt)}
                </p>
                <Link
                  href={`/issues/${latestIssue.id}`}
                  className="mt-5 inline-flex items-center gap-2 text-xs text-gold-300 no-underline hover:text-gold-400"
                >
                  展开本期 <span>→</span>
                </Link>
              </div>
            </aside>
          </div>
        ) : (
          <p className="text-sm text-ink-700/60">期刊正在筹备中。</p>
        )}
      </section>

      <section className="border-y border-ink-900/10 bg-paper-100/40">
        <div className="wrap py-12 sm:py-16 lg:py-20">
          <SectionHeading
            eyebrow="Featured"
            title="精选文章"
            description="由编辑部从近期刊文中选出的三篇，供初次到访的读者开始阅读。"
            action={
              <Link href="/articles" className="btn-outline">
                全部文章
              </Link>
            }
          />

          {featured.length === 0 ? (
            <EmptyState
              title="精选文章正在筹备"
              description="新一期文章刊发后，编辑部会从这里选出入门阅读篇目。"
              action={
                <Link href="/submit" className="btn-outline">
                  向本刊投稿
                </Link>
              }
            />
          ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((article) => (
              <article
                key={article.id}
                className="card group flex flex-col p-6 transition-transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <Badge>{categoryLabel(article.category)}</Badge>
                  <span className="text-[10px] text-ink-700/45">
                    {formatDate(article.publishedAt, false)}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-xl leading-8 text-ink-900">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="no-underline transition-colors group-hover:text-crimson-700"
                  >
                    {article.title}
                  </Link>
                </h3>
                {article.abstract && (
                  <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-ink-700/70">
                    {excerpt(article.abstract, 120)}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between border-t border-ink-900/10 pt-5 text-[11px] text-ink-700/55">
                  <span>{article.author.name}</span>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="text-crimson-600 no-underline"
                  >
                    阅读 →
                  </Link>
                </div>
              </article>
            ))}
          </div>
          )}
        </div>
      </section>

      <section className="wrap grid gap-10 py-12 sm:gap-12 sm:py-16 lg:grid-cols-[1.25fr_0.75fr] lg:py-20">
        <div>
          <SectionHeading
            eyebrow="Latest"
            title="新近刊发"
            action={
              <Link href="/articles" className="text-xs text-crimson-600 no-underline">
                浏览全部 →
              </Link>
            }
          />
          {latest.length === 0 ? (
            <EmptyState
              title="暂无新刊文章"
              description="稿件经编辑部审稿、录用并刊发后，会出现在这里。"
              action={
                <Link href="/submit" className="btn-outline">
                  投稿入口
                </Link>
              }
            />
          ) : (
            <div className="space-y-6">
              {latest.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))}
            </div>
          )}
        </div>

        <aside>
          <SectionHeading
            eyebrow="Notices"
            title="公告"
            action={
              <Link
                href="/announcements"
                className="text-xs text-crimson-600 no-underline"
              >
                全部 →
              </Link>
            }
          />
          <div className="space-y-3">
            {announcements.map((notice) => (
              <Link
                key={notice.id}
                href={`/announcements#notice-${notice.id}`}
                className="card group block p-5 no-underline transition-colors hover:border-crimson-600/30"
              >
                <div className="flex items-center gap-2 text-[10px] text-ink-700/50">
                  {notice.pinned && (
                    <span className="rounded-full bg-crimson-600/10 px-2 py-0.5 text-crimson-700">
                      置顶
                    </span>
                  )}
                  <span>{formatDate(notice.publishedAt, false)}</span>
                </div>
                <p className="mt-2 font-serif text-[15px] leading-7 text-ink-900 group-hover:text-crimson-700">
                  {notice.title}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 bg-crimson-600 p-7 text-paper-50">
            <p className="text-[10px] uppercase tracking-[0.24em] text-paper-50/60">
              Join Us
            </p>
            <h3 className="mt-3 font-serif text-2xl leading-snug">
              成为百合的
              <br />
              一部分
            </h3>
            <p className="mt-3 text-xs leading-6 text-paper-50/70">
              无论你写小说、做考据，还是只想参加一次读书会，这里都为你留了座位。
            </p>
            <Link
              href="/membership"
              className="mt-6 inline-flex border border-paper-50/40 px-4 py-2 text-xs text-paper-50 no-underline transition-colors hover:bg-paper-50 hover:text-crimson-700"
            >
              申请入会
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
