import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireRole("ADMIN");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
  });

  return (
    <div>
      <header>
        <p className="eyebrow">Audit Log</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">审计日志</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          记录登录、投稿、审稿、刊发、角色变更等关键操作，最近 150 条。
        </p>
      </header>

      <div className="card mt-8 overflow-x-auto">
        <table className="admin-table min-w-[820px]">
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>动作</th>
              <th>对象</th>
              <th>IP</th>
              <th>附加信息</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap text-[11px] text-ink-700/55">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="text-[11px]">
                  {log.user ? (
                    <>
                      <p className="text-ink-900">{log.user.name}</p>
                      <p className="text-[10px] text-ink-700/45">{log.user.email}</p>
                    </>
                  ) : (
                    <span className="text-ink-700/45">系统 / 未登录</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-[11px] text-ink-900">
                  {log.action}
                </td>
                <td className="text-[11px] text-ink-700/60">
                  {log.entity}
                  {log.entityId && (
                    <span className="ml-1 font-mono text-[9px] text-ink-700/35">
                      {log.entityId.slice(0, 10)}…
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap font-mono text-[10px] text-ink-700/50">
                  {log.ip ?? "—"}
                </td>
                <td className="max-w-[240px]">
                  {log.meta ? (
                    <details>
                      <summary className="cursor-pointer text-[10px] text-ink-700/50">
                        查看
                      </summary>
                      <pre className="mt-1 whitespace-pre-wrap break-all text-[9px] leading-4 text-ink-700/60">
                        {log.meta}
                      </pre>
                    </details>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-ink-700/50">
                  暂无日志。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[10px] leading-5 text-ink-700/45">
        注意：审计日志仅管理员可见。生产环境建议将日志同步至外部不可篡改的存储，并设置保留周期。
      </p>
    </div>
  );
}
