import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Breadcrumb } from "@/components/ui";
import { prisma } from "@/lib/db";
import {
  categoryLabel,
  formatDate,
  issueLabel,
  readingTime,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getArticle(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      author: {
        select: { name: true, affiliation: true, bio: true },
      },
      issue: true,
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "文章未找到" };
  return {
    title: article.title,
    description: article.abstract.slice(0, 150),
    openGraph: {
      title: article.title,
      description: article.abstract.slice(0, 150),
      type: "article",
      publishedTime: article.publishedAt.toISOString(),
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="wrap py-12 lg:py-16">
      <Breadcrumb
        items={[
          { href: "/", label: "首页" },
          { href: "/articles", label: "文章" },
          { label: article.title },
        ]}
      />

      <article className="mx-auto max-w-3xl">
        <header className="border-b border-ink-900/10 pb-9">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-700/60">
            <Badge>{categoryLabel(article.category)}</Badge>
            {article.issue && (
              <Link
                href={`/issues/${article.issue.id}`}
                className="no-underline hover:text-crimson-600"
              >
                {issueLabel(article.issue)}
              </Link>
            )}
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span>·</span>
            <span>约 {readingTime(article.content)} 分钟</span>
          </div>

          <h1 className="mt-5 font-serif text-[30px] leading-[1.4] tracking-wide text-ink-900 sm:text-4xl">
            {article.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-700/70">
            <span className="font-medium text-ink-900">{article.author.name}</span>
            {article.author.affiliation && (
              <span>{article.author.affiliation}</span>
            )}
          </div>
        </header>

        <div className="mt-8 border-l-2 border-gold-400/60 bg-paper-100/60 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700/50">
            摘要
          </p>
          <p className="mt-2 text-[13.5px] leading-7 text-ink-900/80">
            {article.abstract}
          </p>
          <p className="mt-3 text-[11px] text-ink-700/60">
            <span className="text-ink-700/45">关键词 / </span>
            {article.keywords}
          </p>
        </div>

        <div className="article-body mt-10">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>

        <footer className="mt-14 border-t border-ink-900/10 pt-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-900 font-serif text-lg text-paper-50">
              {article.author.name.slice(0, 1)}
            </span>
            <div>
              <p className="font-serif text-base text-ink-900">
                {article.author.name}
              </p>
              {article.author.affiliation && (
                <p className="mt-0.5 text-[11px] text-ink-700/55">
                  {article.author.affiliation}
                </p>
              )}
              <p className="mt-2 text-xs leading-6 text-ink-700/70">
                {article.author.bio ?? "淮联百合同好会会员。"}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ink-900/10 pt-6">
            <p className="text-[11px] text-ink-700/50">
              本文版权归作者所有，转载请注明出处。
            </p>
            <div className="flex items-center gap-4 text-xs">
              <Link href="/articles" className="text-ink-700 no-underline hover:text-crimson-600">
                ← 返回文章列表
              </Link>
              <Link href="/submit" className="text-crimson-600 no-underline">
                向本刊投稿 →
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
