import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleEngagement } from "@/components/article-engagement";
import { ArticleViewTracker } from "@/components/article-view-tracker";
import { Badge, Breadcrumb } from "@/components/ui";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  categoryLabel,
  formatDate,
  issueLabel,
  parseImageList,
  readingTime,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getArticle(slug: string) {
  return prisma.article.findFirst({
    where: { slug, deletedAt: null },
    include: {
      author: {
        select: {
          name: true,
          affiliation: true,
          bio: true,
          avatarImage: true,
        },
      },
      issue: true,
      serial: { select: { slug: true, title: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "文章未找到" };
  return {
    title: article.title,
    description: (article.abstract || article.content).slice(0, 150),
    openGraph: {
      title: article.title,
      description: (article.abstract || article.content).slice(0, 150),
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
  const illustrations = parseImageList(article.illustrations);

  const user = await getCurrentUser();
  const [likeCount, comments, likedRow] = await Promise.all([
    prisma.articleLike.count({ where: { articleId: article.id } }),
    prisma.comment.findMany({
      where: { articleId: article.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: { select: { name: true, avatarImage: true } },
      },
    }),
    user
      ? prisma.articleLike.findUnique({
          where: {
            articleId_userId: {
              articleId: article.id,
              userId: user.id,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const commentItems = comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    userName: comment.user.name,
    avatarImage: comment.user.avatarImage,
    canDelete: Boolean(
      user &&
        (comment.userId === user.id ||
          article.authorId === user.id ||
          hasRole(user, "EDITOR")),
    ),
  }));

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
            {article.issue && !article.issue.archivedAt && (
              <Link
                href={`/issues/${article.issue.id}`}
                className="no-underline hover:text-crimson-600"
              >
                {issueLabel(article.issue)}
              </Link>
            )}
            {article.serial && (
              <Link
                href={`/serials/${article.serial.slug}`}
                className="no-underline hover:text-crimson-600"
              >
                连载 · {article.serial.title}
              </Link>
            )}
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span>·</span>
            <span>约 {readingTime(article.content)} 分钟</span>
            <span>·</span>
            <ArticleViewTracker
              slug={article.slug}
              initialViews={article.views}
            />
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
          {article.abstract && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700/50">
                摘要
              </p>
              <p className="mt-2 text-[13.5px] leading-7 text-ink-900/80">
                {article.abstract}
              </p>
            </>
          )}
          <p className={`text-[11px] text-ink-700/60 ${article.abstract ? "mt-3" : ""}`}>
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

        {illustrations.length > 0 && (
          <section className="mt-12 border-t border-ink-900/10 pt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-700/50">
              插图
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {illustrations.map((url, index) => (
                <figure key={url} className="overflow-hidden rounded-sm border border-ink-900/10 bg-paper-100/50">
                  <Image
                    src={url}
                    alt={`${article.title} 插图 ${index + 1}`}
                    width={1200}
                    height={800}
                    unoptimized
                    className="h-auto w-full object-contain"
                  />
                </figure>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-14 border-t border-ink-900/10 pt-8">
          <div className="flex items-start gap-4">
            {article.author.avatarImage ? (
              <Image
                src={article.author.avatarImage}
                alt={article.author.name}
                width={96}
                height={96}
                unoptimized
                className="h-12 w-12 shrink-0 rounded-full border border-ink-900/10 object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-900 font-serif text-lg text-paper-50">
                {article.author.name.slice(0, 1)}
              </span>
            )}
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

        <ArticleEngagement
          slug={article.slug}
          initialLikes={likeCount}
          initialLiked={Boolean(likedRow)}
          comments={commentItems}
          isLoggedIn={Boolean(user)}
          loginHref={`/login?next=${encodeURIComponent(`/articles/${article.slug}`)}`}
        />
      </article>
    </div>
  );
}
