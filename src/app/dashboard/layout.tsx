import Link from "next/link";

import { SideNav } from "@/components/side-nav";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const items = [
  { href: "/dashboard", label: "概览", exact: true },
  { href: "/dashboard/submissions", label: "我的投稿" },
  { href: "/submit", label: "新建投稿" },
  { href: "/membership", label: "入会申请" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="wrap py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        <aside>
          <div className="mb-6">
            <p className="eyebrow">Author Center</p>
            <h1 className="mt-2 font-serif text-2xl text-ink-900">作者中心</h1>
          </div>

          <SideNav items={items} />

          <div className="mt-8 hidden border-t border-ink-900/10 pt-5 lg:block">
            <p className="text-[13px] font-medium text-ink-900">{user.name}</p>
            <p className="mt-1 text-[10px] text-ink-700/50">
              {ROLE_LABELS[user.role]}
              {user.memberSince
                ? ` · 会员自 ${formatDate(user.memberSince, false)}`
                : " · 非正式会员"}
            </p>
            {user.role !== "READER" && (
              <Link
                href="/admin"
                className="mt-3 inline-flex text-[11px] text-crimson-600 no-underline"
              >
                进入管理后台 →
              </Link>
            )}
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
