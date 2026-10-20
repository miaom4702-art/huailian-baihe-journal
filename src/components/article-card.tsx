import Link from "next/link";

import { categoryLabel, excerpt, formatDate } from "@/lib/utils";

type ArticleCardProps = {
  article: {
    slug: string;
    title: string;
    abstract: string;
    category: string;
    publishedAt: Date;
    author: { name: string };
  };
  index?: number;
};

export function ArticleCard({ article, index }: ArticleCardProps) {
  return (
    <article className="group flex gap-5 border-b border-ink-900/10 pb-7 last:border-b-0">
      {typeof index === "number" && (
        <span className="hidden w-10 shrink-0 pt-1 font-serif text-2xl text-ink-900/20 sm:block">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-700/60">
          <span className="font-medium text-crimson-600">
            {categoryLabel(article.category)}
          </span>
          <span className="h-3 w-px bg-ink-900/15" />
          <span>{article.author.name}</span>
          <span>{formatDate(article.publishedAt, false)}</span>
        </div>
        <h3 className="mt-2 font-serif text-lg leading-8 text-ink-900">
          <Link
            href={`/articles/${article.slug}`}
            className="no-underline decoration-crimson-600/40 decoration-1 underline-offset-[6px] transition-colors group-hover:text-crimson-700 group-hover:underline"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-ink-700/75">
          {excerpt(article.abstract, 110)}
        </p>
      </div>
    </article>
  );
}
