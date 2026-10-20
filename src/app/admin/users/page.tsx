import { RoleSelect } from "@/components/role-select";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      affiliation: true,
      memberSince: true,
      createdAt: true,
      _count: { select: { submissions: true, articles: true } },
    },
  });

  return (
    <div>
      <header>
        <p className="eyebrow">Users & Roles</p>
        <h2 className="mt-2 font-serif text-3xl text-ink-900">用户与角色</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          角色变更即时生效，并写入审计日志。为避免权限丢失，不能修改自己的角色。
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-3 text-[11px] text-ink-700/55">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <span key={role} className="rounded-full bg-ink-900/5 px-3 py-1">
            {label}：
            {users.filter((user) => user.role === role).length} 人
          </span>
        ))}
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="admin-table min-w-[720px]">
          <thead>
            <tr>
              <th>用户</th>
              <th>单位</th>
              <th>投稿 / 刊文</th>
              <th>会员</th>
              <th>注册时间</th>
              <th>角色</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <p className="text-[13px] text-ink-900">
                    {user.name}
                    {user.id === admin.id && (
                      <span className="ml-1.5 text-[9px] text-crimson-600">（我）</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-700/50">{user.email}</p>
                </td>
                <td className="text-[11px] text-ink-700/60">
                  {user.affiliation ?? "—"}
                </td>
                <td className="whitespace-nowrap text-[11px] text-ink-700/60">
                  {user._count.submissions} / {user._count.articles}
                </td>
                <td className="whitespace-nowrap text-[11px] text-ink-700/60">
                  {user.memberSince
                    ? `自 ${formatDate(user.memberSince, false)}`
                    : "非会员"}
                </td>
                <td className="whitespace-nowrap text-[11px] text-ink-700/60">
                  {formatDate(user.createdAt, false)}
                </td>
                <td>
                  <RoleSelect
                    userId={user.id}
                    currentRole={user.role as Role}
                    disabled={user.id === admin.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[10px] leading-5 text-ink-700/45">
        提示：编辑角色可处理稿件与期刊；管理员额外拥有用户角色管理与审计日志权限。
      </p>
    </div>
  );
}
