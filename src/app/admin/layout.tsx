import Link from "next/link";

import { SideNav } from "@/components/side-nav";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("EDITOR");

  const items = [
    { href: "/admin", label: "工作台", exact: true },
    { href: "/admin/submissions", label: "稿件处理" },
    { href: "/admin/issues", label: "期刊管理" },
    { href: "/admin/members", label: "入会审核" },
    ...(user.role === "ADMIN"
      ? [
          { href: "/admin/users", label: "用户与角色" },
          { href: "/admin/audit", label: "审计日志" },
        ]
      : []),
  ];

  return (
    <div className="wrap py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        <aside>
          <div className="mb-6">
            <p className="eyebrow">Editorial</p>
            <h1 className="mt-2 font-serif text-2xl text-ink-900">管理后台</h1>
            <p className="mt-2 text-[10px] text-ink-700/50">
              {user.name} · {ROLE_LABELS[user.role]}
            </p>
          </div>

          <SideNav items={items} />

          <div className="mt-8 hidden space-y-2 border-t border-ink-900/10 pt-5 lg:block">
            <Link
              href="/dashboard"
              className="block text-[11px] text-ink-700 no-underline hover:text-crimson-600"
            >
              ← 作者中心
            </Link>
            <Link
              href="/"
              className="block text-[11px] text-ink-700 no-underline hover:text-crimson-600"
            >
              ← 返回网站
            </Link>
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
