import Link from "next/link";

import { ArticleCard } from "@/components/article-card";
import { Badge, EmptyState } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

type SearchParams = Promise<{
  q?: string;
  category?: string;
  page?: string;
}>;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 80);
  const category = CATEGORIES.includes(params.category as Category)
    ? (params.category as Category)
    : undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { abstract: { contains: q } },
            { keywords: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { author: { select: { name: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(target: number) {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (category) query.set("category", category);
    if (target > 1) query.set("page", String(target));
    const suffix = query.toString();
    return suffix ? `/articles?${suffix}` : "/articles";
  }

  return (
    <div className="wrap py-14 lg:py-20">
      <header className="max-w-2xl">
        <p className="eyebrow">Archive</p>
        <h1 className="mt-3 font-serif text-4xl tracking-wide text-ink-900">文章</h1>
        <p className="mt-4 text-sm leading-8 text-ink-700/75">
          自创刊以来的全部刊文。可按栏目筛选，或检索标题、摘要与关键词。
        </p>
      </header>

      <div className="mt-10 border-y border-ink-900/10 py-5">
        <form method="get" className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={q}
            className="input sm:max-w-xs"
            placeholder="检索文章…"
            maxLength={80}
          />
          {category && <input type="hidden" name="category" value={category} />}
          <button type="submit" className="btn-primary !py-2.5 sm:w-auto">
            检索
          </button>
          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            <Link
              href={q ? `/articles?q=${encodeURIComponent(q)}` : "/articles"}
              className={`rounded-full px-3 py-1.5 text-[11px] no-underline transition-colors ${
                !category
                  ? "bg-ink-900 text-paper-50"
                  : "bg-ink-900/5 text-ink-700 hover:bg-ink-900/10"
              }`}
            >
              全部栏目
            </Link>
            {CATEGORIES.map((item) => {
              const query = new URLSearchParams();
              if (q) query.set("q", q);
              query.set("category", item);
              return (
                <Link
                  key={item}
                  href={`/articles?${query.toString()}`}
                  className={`rounded-full px-3 py-1.5 text-[11px] no-underline transition-colors ${
                    category === item
                      ? "bg-ink-900 text-paper-50"
                      : "bg-ink-900/5 text-ink-700 hover:bg-ink-900/10"
                  }`}
                >
                  {CATEGORY_LABELS[item]}
                </Link>
              );
            })}
          </div>
        </form>
      </div>

      <div className="mt-6 flex items-center justify-between text-[11px] text-ink-700/55">
        <span>
          共 {total} 篇{q ? `，关键词「${q}」` : ""}
          {category ? `，栏目「${CATEGORY_LABELS[category]}」` : ""}
        </span>
        <span>
          第 {page} / {totalPages} 页
        </span>
      </div>

      <div className="mt-6">
        {articles.length === 0 ? (
          <EmptyState
            title="没有找到相关文章"
            description="试试更换关键词，或浏览其他栏目。"
            action={
              <Link href="/articles" className="btn-outline">
                清除筛选
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {articles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={(page - 1) * PAGE_SIZE + index}
              />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="分页">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="btn-outline !px-4 !py-2 text-xs">
              上一页
            </Link>
          )}
          <span className="px-2 text-xs text-ink-700/60">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className="btn-outline !px-4 !py-2 text-xs">
              下一页
            </Link>
          )}
        </nav>
      )}

      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-ink-900/10 pt-8">
        <Badge>投稿通道长期开放</Badge>
        <Link href="/submit" className="text-sm text-crimson-600 no-underline">
          查看投稿要求并提交稿件 →
        </Link>
      </div>
    </div>
  );
}
