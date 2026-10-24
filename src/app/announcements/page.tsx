import Link from "next/link";

import { EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "公告",
  description: "《淮联百合期刊》征稿、活动与编辑部公告。",
};

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="wrap py-14 lg:py-20">
      <header className="max-w-2xl">
        <p className="eyebrow">Notices</p>
        <h1 className="mt-3 font-serif text-4xl tracking-wide text-ink-900">公告</h1>
        <p className="mt-4 text-sm leading-8 text-ink-700/75">
          征稿启事、活动通知与编辑部说明。请以本页发布的信息为准。
        </p>
      </header>

      <div className="mt-12 max-w-3xl">
        {announcements.length === 0 ? (
          <EmptyState title="暂无公告" description="新的通知将在这里发布。" />
        ) : (
          <div className="space-y-8">
            {announcements.map((notice) => (
              <article
                key={notice.id}
                id={`notice-${notice.id}`}
                className="card scroll-mt-28 p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-700/50">
                  {notice.pinned && (
                    <span className="rounded-full bg-crimson-600/10 px-2 py-0.5 text-crimson-700">
                      置顶
                    </span>
                  )}
                  <time dateTime={notice.publishedAt.toISOString()}>
                    {formatDate(notice.publishedAt)}
                  </time>
                  <span>·</span>
                  <span>{notice.author.name}</span>
                </div>
                <h2 className="mt-3 font-serif text-xl leading-8 text-ink-900">
                  {notice.title}
                </h2>
                <div className="mt-4 space-y-3 text-[13.5px] leading-7 text-ink-900/80">
                  {notice.content
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ink-900/10 pt-8">
        <p className="text-xs text-ink-700/55">如有疑问，请联系编辑部 editor@hlbh.org</p>
        <Link href="/submit" className="btn-outline">
          前往投稿
        </Link>
      </div>
    </div>
  );
}
