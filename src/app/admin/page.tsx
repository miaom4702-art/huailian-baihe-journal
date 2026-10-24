import Link from "next/link";

import { requireRole } from "@/lib/auth";
import {
  REVIEW_ACTION_LABELS,
  STATUS_TONE,
  type SubmissionStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireRole("EDITOR");

  const [
    statusGroups,
    articleCount,
    issueCount,
    pendingMembers,
    recentSubmissions,
    recentLogs,
    userCount,
    pendingRevisionCount,
  ] = await Promise.all([
    prisma.submission.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.article.count(),
    prisma.issue.count(),
    prisma.membershipApplication.count({ where: { status: "PENDING" } }),
    prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { author: { select: { name: true } } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true } } },
    }),
    prisma.user.count(),
    prisma.articleRevision.count({ where: { status: "PENDING" } }),
  ]);

  const counts = Object.fromEntries(
    statusGroups.map((group) => [group.status, group._count._all]),
  ) as Record<string, number>;

  const stats = [
    {
      label: "待初审",
      value: counts.SUBMITTED ?? 0,
      href: "/admin/submissions?status=SUBMITTED",
    },
    {
      label: "审稿中",
      value: counts.UNDER_REVIEW ?? 0,
      href: "/admin/submissions?status=UNDER_REVIEW",
    },
    {
      label: "已录用待刊",
      value: counts.ACCEPTED ?? 0,
      href: "/admin/submissions?status=ACCEPTED",
    },
    {
      label: "待审核入会",
      value: pendingMembers,
      href: "/admin/members",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Dashboard</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">编辑部工作台</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          注册用户 {userCount} 人 · 已刊文章 {articleCount} 篇 · 出版{" "}
          {issueCount} 期 · 待审文章修改 {pendingRevisionCount} 篇
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card group p-5 no-underline transition-colors hover:border-crimson-600/30"
          >
            <p className="font-serif text-2xl sm:text-3xl text-ink-900">{stat.value}</p>
            <p className="mt-1 text-[11px] text-ink-700/55">{stat.label}</p>
            <p className="mt-4 text-[10px] text-crimson-600 opacity-0 transition-opacity group-hover:opacity-100">
              前往处理 →
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-ink-900">最新来稿</h3>
            <Link
              href="/admin/submissions"
              className="text-[11px] text-crimson-600 no-underline"
            >
              全部稿件 →
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table min-w-[520px]">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>作者</th>
                  <th>状态</th>
                  <th>投稿日期</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="max-w-[260px]">
                      <Link
                        href="/admin/submissions"
                        className="line-clamp-2 font-serif text-[13px] text-ink-900 no-underline hover:text-crimson-600"
                      >
                        {submission.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-xs">
                      {submission.author.name}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_TONE[submission.status as SubmissionStatus] ?? "bg-ink-900/5 text-ink-700 ring-ink-900/10"}`}
                      >
                        {statusLabel(submission.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-[11px] text-ink-700/55">
                      {formatDate(submission.createdAt, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-serif text-lg text-ink-900">最近操作</h3>
          <ul className="mt-4 space-y-3">
            {recentLogs.map((log) => (
              <li key={log.id} className="border-b border-ink-900/10 pb-3 last:border-b-0">
                <p className="text-[11px] text-ink-900">
                  {REVIEW_ACTION_LABELS[log.action] ?? log.action}
                  <span className="ml-1 text-ink-700/45">
                    · {log.entity}
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-ink-700/45">
                  {log.user?.name ?? "系统"} · {formatDateTime(log.createdAt)}
                </p>
              </li>
            ))}
            {recentLogs.length === 0 && (
              <li className="text-[11px] text-ink-700/50">暂无记录。</li>
            )}
          </ul>
          <Link
            href="/admin/audit"
            className="mt-4 inline-flex text-[11px] text-crimson-600 no-underline"
          >
            查看审计日志 →
          </Link>
        </div>
      </div>
    </div>
  );
}
