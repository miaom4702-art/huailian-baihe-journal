import { MembershipActions } from "@/components/membership-actions";
import { EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { MEMBERSHIP_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  await requireRole("EDITOR");

  const [pending, processed] = await Promise.all([
    prisma.membershipApplication.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { applicant: { select: { name: true, email: true } } },
    }),
    prisma.membershipApplication.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { reviewedAt: "desc" },
      take: 50,
      include: {
        reviewer: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div>
      <header>
        <p className="eyebrow">Membership</p>
        <h2 className="mt-2 font-serif text-3xl text-ink-900">入会审核</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          通过申请后，系统会自动为该账号标记会员身份（若申请已关联账号）。
        </p>
      </header>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-ink-900">待审核</h3>
          <span className="text-[11px] text-ink-700/50">{pending.length} 份</span>
        </div>

        <div className="mt-4 space-y-4">
          {pending.length === 0 ? (
            <EmptyState title="没有待审核的申请" description="新的申请会显示在这里。" />
          ) : (
            pending.map((application) => (
              <article key={application.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg text-ink-900">
                      {application.name}
                      {application.applicant && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] text-emerald-700 ring-1 ring-emerald-200">
                          已关联账号
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-700/55">
                      {application.email}
                      {application.studentId ? ` · 学号 ${application.studentId}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-700/55">
                      {application.school}
                      {application.major ? ` · ${application.major}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] text-ink-700/45">
                    {formatDate(application.createdAt)}
                  </span>
                </div>

                <div className="mt-3 rounded-sm bg-paper-100/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-700/50">
                    申请理由
                  </p>
                  <p className="mt-1 text-[12px] leading-6 text-ink-900/80">
                    {application.reason}
                  </p>
                </div>

                <MembershipActions applicationId={application.id} />
              </article>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h3 className="font-serif text-lg text-ink-900">处理记录</h3>
        <div className="card mt-4 overflow-x-auto">
          <table className="admin-table min-w-[620px]">
            <thead>
              <tr>
                <th>申请人</th>
                <th>学院</th>
                <th>结果</th>
                <th>审核人</th>
                <th>时间</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {processed.map((application) => (
                <tr key={application.id}>
                  <td className="text-[12px] text-ink-900">{application.name}</td>
                  <td className="text-[11px] text-ink-700/60">
                    {application.school}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        application.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-stone-100 text-stone-600 ring-stone-200"
                      }`}
                    >
                      {MEMBERSHIP_STATUS_LABELS[application.status] ?? application.status}
                    </span>
                  </td>
                  <td className="text-[11px] text-ink-700/60">
                    {application.reviewer?.name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap text-[11px] text-ink-700/60">
                    {application.reviewedAt
                      ? formatDate(application.reviewedAt, false)
                      : "—"}
                  </td>
                  <td className="max-w-[180px] text-[11px] text-ink-700/60">
                    {application.reviewNote ?? "—"}
                  </td>
                </tr>
              ))}
              {processed.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-ink-700/50">
                    暂无处理记录。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
