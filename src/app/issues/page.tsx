import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate, issueLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany({
    where: { archivedAt: null },
    orderBy: { publishedAt: "desc" },
    include: {
      _count: {
        select: { articles: { where: { deletedAt: null } } },
      },
    },
  });

  return (
    <div className="wrap py-14 lg:py-20">
      <header className="max-w-2xl">
        <p className="eyebrow">Issues</p>
        <h1 className="mt-3 font-serif text-4xl tracking-wide text-ink-900">期刊</h1>
        <p className="mt-4 text-sm leading-8 text-ink-700/75">
          每一期都是一次完整的编排。你可以按出版时间浏览，也可以进入某一期查看目录。
        </p>
      </header>

      <div className="mt-12">
        {issues.length === 0 ? (
          <EmptyState title="期刊正在筹备中" description="敬请关注创刊号的发布。" />
        ) : (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="group block no-underline"
              >
                <div className="relative isolate overflow-hidden bg-ink-950 p-7 text-paper-50 shadow-paper transition-transform group-hover:-translate-y-1">
                  {issue.coverImage && (
                    <>
                      <Image
                        src={issue.coverImage}
                        alt=""
                        fill
                        unoptimized
                        className="-z-10 object-cover opacity-45"
                      />
                      <div className="-z-10 absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/20" />
                    </>
                  )}
                  <div className="absolute right-3 top-2 font-serif text-8xl text-paper-50/[0.04]">
                    百
                  </div>
                  <div className="flex items-start justify-between">
                    <p className="text-[9px] uppercase tracking-[0.22em] text-gold-300/80">
                      Huailian Baihe
                    </p>
                    <span className="border border-gold-400/40 px-1.5 py-0.5 text-[9px] text-gold-300">
                      {issue.year}
                    </span>
                  </div>
                  <p className="mt-12 font-serif text-xl tracking-[0.14em]">
                    淮联百合期刊
                  </p>
                  <p className="mt-2 text-[10px] tracking-[0.14em] text-paper-100/45">
                    {issueLabel(issue)}
                  </p>
                  <p className="mt-6 font-serif text-lg leading-7 text-paper-50">
                    {issue.title}
                  </p>
                  {issue.theme && (
                    <p className="mt-2 text-[11px] text-paper-100/50">
                      专题 / {issue.theme}
                    </p>
                  )}
                  <div className="mt-8 flex items-center justify-between border-t border-paper-50/15 pt-4 text-[10px] text-paper-100/40">
                    <span>{formatDate(issue.publishedAt, false)}</span>
                    <span>{issue._count.articles} 篇</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between px-1 text-[11px]">
                  <span className="text-ink-700/55">{issue._count.articles} 篇文章</span>
                  <span className="text-crimson-600">查看目录 →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
