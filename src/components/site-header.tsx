import Link from "next/link";

import { getCurrentUser, hasRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";

import { LogoutButton } from "./logout-button";

const nav = [
  { href: "/", label: "首页" },
  { href: "/articles", label: "文章" },
  { href: "/issues", label: "期刊" },
  { href: "/announcements", label: "公告" },
  { href: "/about", label: "关于" },
  { href: "/membership", label: "入会" },
  { href: "/submit", label: "投稿" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/10 bg-paper-50/85 backdrop-blur-md">
      <div className="wrap flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3 no-underline">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-crimson-600/40 bg-crimson-600 font-serif text-xl text-paper-50 shadow-sm transition-transform group-hover:-rotate-6">
            百
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-[19px] tracking-[0.08em] text-ink-900">
              淮联百合学刊
            </span>
            <span className="block text-[9px] uppercase tracking-[0.24em] text-ink-700/70">
              Journal of Huailian Baihe
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-3 py-2 text-[13px] text-ink-800 no-underline transition-colors hover:bg-ink-900/5 hover:text-crimson-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <Link
                  href="/dashboard"
                  className="block text-xs font-medium text-ink-900 no-underline hover:text-crimson-600"
                >
                  {user.name}
                  <span className="ml-1.5 rounded-full bg-ink-900/5 px-1.5 py-0.5 text-[9px] text-ink-700">
                    {ROLE_LABELS[user.role]}
                  </span>
                </Link>
                <div className="mt-0.5 flex items-center justify-end gap-2">
                  {hasRole(user, "EDITOR") && (
                    <Link
                      href="/admin"
                      className="text-[10px] text-crimson-600 underline decoration-crimson-600/30 underline-offset-2"
                    >
                      管理后台
                    </Link>
                  )}
                  <LogoutButton />
                </div>
              </div>
              <Link
                href="/dashboard"
                className="btn-outline !px-3 !py-1.5 text-xs sm:hidden"
              >
                控制台
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs text-ink-800 no-underline hover:text-crimson-600"
              >
                登录
              </Link>
              <Link href="/register" className="btn-primary !px-4 !py-1.5 text-xs">
                注册
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-ink-900/5 lg:hidden">
        <nav className="wrap flex gap-1 overflow-x-auto py-2" aria-label="移动导航">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-sm px-2.5 py-1.5 text-xs text-ink-800 no-underline hover:bg-ink-900/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
