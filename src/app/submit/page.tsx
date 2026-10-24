import type { Metadata } from "next";
import Link from "next/link";

import { SubmissionForm } from "@/components/submission-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "投稿",
  description: "向《淮联百合期刊》提交稿件，查看栏目设置、格式要求与审稿流程。",
};

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const user = await requireUser();
  const serials = await prisma.serial.findMany({
    where: { authorId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, coverImage: true },
  });

  return (
    <div className="wrap py-14 lg:py-20">
      <header className="max-w-2xl">
        <p className="eyebrow">Submission</p>
        <h1 className="mt-3 font-serif text-4xl tracking-wide text-ink-900">投稿</h1>
        <p className="mt-4 text-sm leading-8 text-ink-700/75">
          感谢你把文字交给我们。提交前请确认稿件为原创，并已阅读下方的格式要求。
          你可以在作者中心随时查看审稿进度。
        </p>
      </header>

      <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-ink-900/10 py-4 text-[11px] text-ink-700/60">
        <span>
          当前投稿人：
          <span className="font-medium text-ink-900">{user.name}</span>
        </span>
        <span>·</span>
        <span>{user.affiliation ?? "未填写单位"}</span>
        <Link href="/dashboard" className="ml-auto text-crimson-600 no-underline">
          作者中心 →
        </Link>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <SubmissionForm serials={serials} />

        <aside className="space-y-6">
          <div className="card p-6">
            <p className="eyebrow">Checklist</p>
            <h2 className="mt-2 font-serif text-xl text-ink-900">投稿前请确认</h2>
            <ul className="mt-4 space-y-2.5 text-[13px] leading-6 text-ink-700/75">
              <li>· 稿件未在其他公开平台发表</li>
              <li>· 正文不少于 200 字，建议 4000—12000 字</li>
              <li>· 摘要 30—800 字，关键词 3—5 个</li>
              <li>· 引文与数据已核对来源</li>
              <li>· 未同时投递给其他刊物</li>
            </ul>
          </div>

          <div className="card p-6">
            <p className="eyebrow">Review</p>
            <h2 className="mt-2 font-serif text-xl text-ink-900">审稿流程</h2>
            <div className="mt-4 space-y-4">
              {[
                ["初审", "编辑部在 30 日内完成，判断选题与格式。"],
                ["外审", "同行专家匿名评审，给出修改建议。"],
                ["终审", "主编确认录用，安排刊期与校对。"],
                ["刊发", "纸质与数字版同步发布，寄送样刊。"],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson-600" />
                  <div>
                    <p className="text-[13px] font-medium text-ink-900">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-ink-700/60">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-ink-950 p-6 text-paper-100/70">
            <p className="font-serif text-lg text-paper-50">需要帮助？</p>
            <p className="mt-2 text-[11px] leading-6">
              如果你对栏目选择或格式有疑问，欢迎先发邮件至 {SITE_CONTACT_EMAIL}，
              附上标题与摘要，我们会尽快回复。
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
