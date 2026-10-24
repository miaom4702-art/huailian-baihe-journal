"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { href: string; label: string };

export function MobileNav({
  items,
  isLoggedIn,
  canAdmin,
}: {
  items: NavItem[];
  isLoggedIn: boolean;
  canAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const accountItems = isLoggedIn
    ? [
        { href: "/dashboard", label: "作者中心" },
        { href: "/dashboard/submissions", label: "我的投稿" },
        { href: "/dashboard/articles", label: "文章数据" },
        { href: "/dashboard/serials", label: "我的连载" },
        { href: "/dashboard/profile", label: "个人资料" },
        ...(canAdmin ? [{ href: "/admin", label: "管理后台" }] : []),
      ]
    : [];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "关闭菜单" : "打开菜单"}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-sm border border-ink-900/15 text-ink-800"
      >
        <span
          className={`h-px w-4 bg-current transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`}
        />
        <span
          className={`h-px w-4 bg-current transition-opacity ${open ? "opacity-0" : ""}`}
        />
        <span
          className={`h-px w-4 bg-current transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
        />
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="mobile-menu-panel fixed inset-x-0 z-50 overflow-y-auto border-t border-ink-900/10 bg-paper-50 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-xl"
        >
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-sm px-3 py-3 text-sm no-underline ${
                  pathname === item.href
                    ? "bg-ink-900 text-paper-50"
                    : "bg-ink-900/[0.04] text-ink-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {accountItems.length > 0 && (
            <div className="mt-5 border-t border-ink-900/10 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-700/45">
                我的账号
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {accountItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-sm border border-ink-900/10 px-3 py-2.5 text-xs text-ink-700 no-underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <p className="mt-5 text-center text-[10px] leading-5 text-ink-700/40">
            淮安大学 · 淮联百合同好会
          </p>
        </div>
      )}
    </div>
  );
}
