import Link from "next/link";

import { Alert, Badge, EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  MEMBERSHIP_STATUS_LABELS,
  ROLE_LABELS,
  STATUS_TONE,
  type SubmissionStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const user = await requireUser();
  const params = await searchParams;

  const [submissions, submittedCount, publishedCount, pendingCount, membership] =
    await Promise.all([
      prisma.submission.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { article: { select: { slug: true } } },
      }),
      prisma.submission.count({ where: { userId: user.id } }),
      prisma.submission.count({
        where: { userId: user.id, status: "PUBLISHED" },
      }),
      prisma.submission.count({
        where: {
          userId: user.id,
          status: { in: ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED"] },
        },
      }),
      prisma.membershipApplication.findFirst({
        where: { OR: [{ userId: user.id }, { email: user.email }] },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <div className="space-y-8">
      {params.error === "forbidden" && (
        <Alert tone="error">当前账号没有访问该页面的权限。</Alert>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h2 className="mt-2 font-serif text-3xl text-ink-900">
            你好，{user.name}
          </h2>
          <p className="mt-2 text-sm text-ink-700/65">
            {user.affiliation ?? "欢迎来到淮联百合学刊"} · 账号创建于{" "}
            {formatDate(user.createdAt)}
          </p>
        </div>
        <Link href="/submit" className="btn-primary">
          新建投稿
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "累计投稿", value: submittedCount },
          { label: "审稿进行中", value: pendingCount },
          { label: "已刊发", value: publishedCount },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="font-serif text-3xl text-ink-900">{stat.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-700/50">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-ink-900">最近稿件</h3>
            <Link
              href="/dashboard/submissions"
              className="text-[11px] text-crimson-600 no-underline"
            >
              全部 →
            </Link>
          </div>

          <div className="mt-4">
            {submissions.length === 0 ? (
              <EmptyState
                title="还没有投稿"
                description="从一篇短文开始也可以。编辑部会认真读完每一份来稿。"
                action={
                  <Link href="/submit" className="btn-outline">
                    去投稿
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-ink-900/10">
                {submissions.map((submission) => (
                  <li key={submission.id}>
                    <Link
                      href={`/dashboard/submissions/${submission.id}`}
                      className="group flex flex-wrap items-center justify-between gap-2 py-4 no-underline"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-serif text-[15px] text-ink-900 group-hover:text-crimson-700">
                          {submission.title}
                        </span>
                        <span className="mt-1 block text-[10px] text-ink-700/50">
                          {formatDate(submission.createdAt)} · 更新于{" "}
                          {formatDate(submission.updatedAt, false)}
                        </span>
                      </span>
                      <span
                        className={`badge ${STATUS_TONE[submission.status as SubmissionStatus] ?? "bg-ink-900/5 text-ink-700 ring-ink-900/10"}`}
                      >
                        {statusLabel(submission.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <h3 className="font-serif text-lg text-ink-900">会员身份</h3>
            {user.memberSince ? (
              <>
                <Badge className="mt-3 bg-emerald-50 text-emerald-700 ring-emerald-200">
                  正式会员
                </Badge>
                <p className="mt-3 text-xs leading-6 text-ink-700/60">
                  自 {formatDate(user.memberSince)} 起成为会员。感谢你参与共读、组稿与校对。
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-xs leading-6 text-ink-700/60">
                  你目前还不是正式会员。会员可以参与读书会、写作工坊与刊物编辑。
                </p>
                {membership && membership.status === "PENDING" ? (
                  <p className="mt-3 rounded-sm bg-paper-100 px-3 py-2 text-[11px] text-ink-700/70">
                    入会申请已提交，正在等待审核。
                  </p>
                ) : (
                  <Link
                    href="/membership"
                    className="mt-4 inline-flex text-xs text-crimson-600 no-underline"
                  >
                    申请入会 →
                  </Link>
                )}
                {membership && membership.status !== "PENDING" && (
                  <p className="mt-2 text-[10px] text-ink-700/45">
                    最近一次申请：{MEMBERSHIP_STATUS_LABELS[membership.status] ?? membership.status}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-serif text-lg text-ink-900">资料</h3>
            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-700/50">邮箱</dt>
                <dd className="truncate text-ink-800">{user.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-700/50">单位</dt>
                <dd className="text-right text-ink-800">
                  {user.affiliation ?? "未填写"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-700/50">角色</dt>
                <dd className="text-ink-800">{ROLE_LABELS[user.role]}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
