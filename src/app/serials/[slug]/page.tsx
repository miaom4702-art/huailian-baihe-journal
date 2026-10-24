import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Breadcrumb } from "@/components/ui";
import { prisma } from "@/lib/db";
import { categoryLabel, formatDate, issueLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getSerial(slug: string) {
  return prisma.serial.findFirst({
    where: {
      slug,
      articles: { some: { deletedAt: null } },
    },
    include: {
      author: { select: { name: true, affiliation: true, bio: true } },
      articles: {
        where: { deletedAt: null },
        orderBy: [{ serialOrder: "asc" }, { publishedAt: "asc" }],
        include: {
          author: { select: { name: true } },
          issue: {
            select: {
              id: true,
              year: true,
              volume: true,
              number: true,
              archivedAt: true,
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const serial = await getSerial(slug);
  if (!serial) return { title: "连载未找到" };
  return {
    title: serial.title,
    description: serial.description.slice(0, 150),
  };
}

export default async function SerialDetailPage({ params }: Props) {
  const { slug } = await params;
  const serial = await getSerial(slug);
  if (!serial) notFound();

  return (
    <div className="wrap py-12 lg:py-16">
      <Breadcrumb
        items={[
          { href: "/", label: "首页" },
          { href: "/serials", label: "连载" },
          { label: serial.title },
        ]}
      />

      <header className="grid gap-8 border-b border-ink-900/10 pb-10 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-ink-900/10 bg-ink-950 shadow-paper">
          {serial.coverImage ? (
            <Image
              src={serial.coverImage}
              alt={`${serial.title} 封面`}
              fill
              unoptimized
              priority
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(160deg,#173a50,#0b2233)]">
              <span className="absolute right-6 top-2 font-serif text-[10rem] leading-none text-paper-50/[0.05]">
                连
              </span>
              <p className="absolute inset-x-7 bottom-7 font-serif text-2xl tracking-[0.18em] text-paper-50">
                {serial.title}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="eyebrow">Serial</p>
          <h1 className="mt-3 font-serif text-3xl leading-snug tracking-wide text-ink-900 sm:text-4xl">
            {serial.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-700/60">
            <span className="text-ink-900">{serial.author.name}</span>
            {serial.author.affiliation && <span>{serial.author.affiliation}</span>}
            <span>·</span>
            <span>{serial.articles.length} 章</span>
            <span>·</span>
            <span>更新于 {formatDate(serial.updatedAt, false)}</span>
          </div>
          <p className="mt-6 max-w-2xl whitespace-pre-line text-sm leading-8 text-ink-700/75">
            {serial.description}
          </p>
          {serial.author.bio && (
            <p className="mt-4 max-w-2xl text-[11px] leading-6 text-ink-700/45">
              作者简介：{serial.author.bio}
            </p>
          )}
        </div>
      </header>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ink-900">章节目录</h2>
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-700/40">
            {serial.articles.length} chapters
          </span>
        </div>

        <ol className="mt-4 divide-y divide-ink-900/10 border-y border-ink-900/10">
          {serial.articles.map((article, index) => (
            <li key={article.id}>
              <Link
                href={`/articles/${article.slug}`}
                className="group grid gap-2 py-6 no-underline sm:grid-cols-[48px_1fr_auto] sm:items-baseline"
              >
                <span className="font-serif text-sm text-ink-900/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="flex flex-wrap items-center gap-2 text-[10px] text-ink-700/50">
                    <Badge>{categoryLabel(article.category)}</Badge>
                    {article.issue && !article.issue.archivedAt && (
                      <span>{issueLabel(article.issue)}</span>
                    )}
                  </span>
                  <span className="mt-1 block font-serif text-lg leading-8 text-ink-900 transition-colors group-hover:text-crimson-700">
                    {article.title}
                  </span>
                  <span className="mt-1 block text-[11px] text-ink-700/55">
                    {article.author.name} · {formatDate(article.publishedAt, false)}
                  </span>
                </span>
                <span className="text-[11px] text-ink-900/25 group-hover:text-crimson-600">
                  阅读 →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/serials"
          className="text-xs text-ink-700 no-underline hover:text-crimson-600"
        >
          ← 返回连载列表
        </Link>
        <Link href="/submit" className="btn-outline">
          投稿到连载
        </Link>
      </div>
    </div>
  );
}
