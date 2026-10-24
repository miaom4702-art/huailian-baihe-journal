import Image from "next/image";
import Link from "next/link";

import { getCurrentUser, hasRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";

import { LogoutButton } from "./logout-button";
import { MobileNav } from "./mobile-nav";

const nav = [
  { href: "/", label: "首页" },
  { href: "/articles", label: "文章" },
  { href: "/issues", label: "期刊" },
  { href: "/serials", label: "连载" },
  { href: "/announcements", label: "公告" },
  { href: "/about", label: "关于" },
  { href: "/membership", label: "入会" },
  { href: "/submit", label: "投稿" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/10 bg-paper-50/85 backdrop-blur-md">
      <div className="wrap flex h-[76px] items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 no-underline sm:gap-3">
          <Image
            src="/logo.png"
            alt="淮联百合同好会徽标"
            width={112}
            height={112}
            priority
            className="h-11 w-11 shrink-0 rounded-full border border-ink-900/10 bg-white object-cover shadow-sm transition-transform group-hover:-rotate-3 sm:h-16 sm:w-16"
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-serif text-[16px] tracking-[0.06em] text-ink-900 sm:text-[19px]">
              淮联百合期刊
            </span>
            <span className="hidden truncate text-[9px] uppercase tracking-[0.2em] text-ink-700/70 sm:block">
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
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden text-right sm:block">
                <Link
                  href="/dashboard"
                  className="flex flex-wrap items-center justify-end gap-1.5 text-xs font-medium text-ink-900 no-underline hover:text-crimson-600"
                >
                  {user.avatarImage ? (
                    <Image
                      src={user.avatarImage}
                      alt={user.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="h-6 w-6 rounded-full border border-ink-900/10 object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/5 font-serif text-[10px] text-ink-700">
                      {user.name.slice(0, 1)}
                    </span>
                  )}
                  <span>{user.name}</span>
                  <span className="rounded-full bg-ink-900/5 px-1.5 py-0.5 text-[9px] text-ink-700">
                    {ROLE_LABELS[user.role]}
                  </span>
                  {user.memberSince && (
                    <span className="rounded-full bg-gold-400/25 px-1.5 py-0.5 text-[9px] text-gold-500">
                      会员
                    </span>
                  )}
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
              {user.memberSince && (
                <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[9px] text-gold-500 sm:hidden">
                  会员
                </span>
              )}
              <Link
                href="/dashboard"
                className="btn-outline whitespace-nowrap !px-2.5 !py-1.5 text-xs sm:hidden"
              >
                控制台
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="shrink-0 whitespace-nowrap text-xs text-ink-800 no-underline hover:text-crimson-600"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="btn-primary shrink-0 whitespace-nowrap !px-3 !py-1.5 text-xs"
              >
                注册
              </Link>
            </>
          )}

          <MobileNav
            items={nav}
            isLoggedIn={Boolean(user)}
            canAdmin={Boolean(user && hasRole(user, "EDITOR"))}
          />
        </div>
      </div>
    </header>
  );
}
