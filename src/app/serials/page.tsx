import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { excerpt, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "连载",
  description: "《淮联百合期刊》的连载合集，按系列阅读同人、原创与长篇故事。",
};

export default async function SerialsPage() {
  const serials = await prisma.serial.findMany({
    where: {
      articles: { some: { deletedAt: null } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { name: true } },
      articles: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
  });

  return (
    <div className="wrap py-14 lg:py-20">
      <header className="max-w-2xl">
        <p className="eyebrow">Serials</p>
        <h1 className="mt-3 font-serif text-4xl tracking-wide text-ink-900">连载</h1>
        <p className="mt-4 text-sm leading-8 text-ink-700/75">
          按合集阅读的长篇与系列作品。一个合集可以包含多篇文章，适合同人长篇、原创连载与连续短篇。
        </p>
      </header>

      <div className="mt-12">
        {serials.length === 0 ? (
          <EmptyState
            title="还没有公开的连载"
            description="作者可以在投稿时创建连载合集，章节刊发后会出现在这里。"
            action={
              <Link href="/submit" className="btn-outline">
                去投稿
              </Link>
            }
          />
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {serials.map((serial) => (
              <Link
                key={serial.id}
                href={`/serials/${serial.slug}`}
                className="group block no-underline"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-ink-900/10 bg-ink-950 text-paper-50 shadow-paper">
                  {serial.coverImage ? (
                    <Image
                      src={serial.coverImage}
                      alt={`${serial.title} 封面`}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[linear-gradient(160deg,#173a50,#0b2233)]">
                      <span className="absolute right-4 top-2 font-serif text-8xl text-paper-50/[0.06]">
                        连
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                  <div className="absolute inset-x-6 bottom-6">
                    <p className="text-[9px] uppercase tracking-[0.24em] text-gold-300/80">
                      Serial Collection
                    </p>
                    <h2 className="mt-2 font-serif text-2xl leading-9 text-paper-50">
                      {serial.title}
                    </h2>
                    <p className="mt-1 text-[10px] text-paper-100/55">
                      {serial.author.name} · {serial.articles.length} 章
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-[11px] leading-5 text-ink-700/60">
                    {excerpt(serial.description, 70)}
                  </p>
                  <span className="shrink-0 text-[10px] text-crimson-600">
                    阅读合集 →
                  </span>
                </div>
                <p className="mt-1 text-[9px] text-ink-700/35">
                  更新于 {formatDate(serial.updatedAt, false)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
