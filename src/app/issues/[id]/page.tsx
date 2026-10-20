import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/ui";
import { prisma } from "@/lib/db";
import { categoryLabel, formatDate, issueLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const issue = await prisma.issue.findUnique({ where: { id } });
  if (!issue) return { title: "期刊未找到" };
  return {
    title: `${issue.title}（${issueLabel(issue)}）`,
    description: issue.description ?? undefined,
  };
}

export default async function IssueDetailPage({ params }: Props) {
  const { id } = await params;
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      articles: {
        orderBy: { publishedAt: "asc" },
        include: { author: { select: { name: true, affiliation: true } } },
      },
    },
  });

  if (!issue) notFound();

  return (
    <div className="wrap py-12 lg:py-16">
      <Breadcrumb
        items={[
          { href: "/", label: "首页" },
          { href: "/issues", label: "期刊" },
          { label: issue.title },
        ]}
      />

      <header className="grid gap-8 border-b border-ink-900/10 pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div className="relative max-w-sm bg-ink-950 p-8 text-paper-50 shadow-paper">
          <div className="absolute right-4 top-2 font-serif text-7xl text-paper-50/[0.04]">
            百
          </div>
          <p className="text-[9px] uppercase tracking-[0.24em] text-gold-300/70">
            Journal of Huailian Baihe
          </p>
          <p className="mt-10 font-serif text-2xl tracking-[0.14em]">淮联百合学刊</p>
          <p className="mt-2 text-[10px] text-paper-100/50">{issueLabel(issue)}</p>
          <div className="my-6 h-px w-full bg-gold-400/25" />
          <p className="font-serif text-lg leading-8">{issue.title}</p>
          {issue.theme && (
            <p className="mt-3 text-[11px] text-paper-100/50">专题 / {issue.theme}</p>
          )}
          <p className="mt-8 text-[10px] text-paper-100/35">
            出版于 {formatDate(issue.publishedAt)}
          </p>
        </div>

        <div>
          <p className="eyebrow">Issue</p>
          <h1 className="mt-3 font-serif text-3xl leading-snug tracking-wide text-ink-900 sm:text-4xl">
            {issue.title}
          </h1>
          <p className="mt-3 text-xs text-ink-700/55">
            {issueLabel(issue)} · 共 {issue.articles.length} 篇
          </p>
          <p className="mt-6 max-w-xl text-sm leading-8 text-ink-700/75">
            {issue.description ?? "本期卷首语正在整理中。"}
          </p>
        </div>
      </header>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ink-900">本期目录</h2>
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-700/40">
            Contents
          </span>
        </div>

        {issue.articles.length === 0 ? (
          <p className="card mt-6 p-10 text-center text-sm text-ink-700/60">
            本期文章正在编排中。
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-ink-900/10 border-y border-ink-900/10">
            {issue.articles.map((article, index) => (
              <li key={article.id}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="group grid gap-2 py-6 no-underline sm:grid-cols-[48px_1fr_auto] sm:items-baseline"
                >
                  <span className="font-serif text-sm text-ink-900/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="text-[10px] text-crimson-600">
                      {categoryLabel(article.category)}
                    </span>
                    <span className="mt-1 block font-serif text-lg leading-8 text-ink-900 transition-colors group-hover:text-crimson-700">
                      {article.title}
                    </span>
                    <span className="mt-1 block text-[11px] text-ink-700/55">
                      {article.author.name}
                      {article.author.affiliation
                        ? ` · ${article.author.affiliation}`
                        : ""}
                    </span>
                  </span>
                  <span className="text-[11px] text-ink-900/25 group-hover:text-crimson-600">
                    阅读 →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <Link href="/issues" className="text-xs text-ink-700 no-underline hover:text-crimson-600">
          ← 返回期刊列表
        </Link>
        <Link href="/submit" className="btn-outline">
          向下一期投稿
        </Link>
      </div>
    </div>
  );
}
