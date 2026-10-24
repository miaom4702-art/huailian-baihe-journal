"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  active: (pathname: string) => boolean;
  icon: React.ReactNode;
  center?: boolean;
};

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function MobileTabBar({
  isLoggedIn,
  avatarImage,
}: {
  isLoggedIn: boolean;
  avatarImage: string | null;
}) {
  const pathname = usePathname();

  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/submit") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  if (hidden) return null;

  const tabs: Tab[] = [
    {
      href: "/",
      label: "首页",
      active: (path) => path === "/",
      icon: (
        <svg {...iconProps}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      ),
    },
    {
      href: "/articles",
      label: "文章",
      active: (path) => path.startsWith("/articles"),
      icon: (
        <svg {...iconProps}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      ),
    },
    {
      href: "/serials",
      label: "连载",
      active: (path) => path.startsWith("/serials"),
      icon: (
        <svg {...iconProps}>
          <path d="M4 5h16v14H4z" />
          <path d="M8 5v14M12 5v14" />
        </svg>
      ),
    },
    {
      href: isLoggedIn ? "/dashboard" : "/login",
      label: "我的",
      active: (path) => path.startsWith("/dashboard"),
      icon: avatarImage ? (
        <Image
          src={avatarImage}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="h-[22px] w-[22px] rounded-full border border-ink-900/10 object-cover"
        />
      ) : (
        <svg {...iconProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="h-[calc(4.75rem+env(safe-area-inset-bottom))] lg:hidden" />
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-900/10 bg-paper-50/[0.97] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-20px_rgba(16,47,68,0.5)] backdrop-blur-md lg:hidden"
        aria-label="应用导航"
      >
        <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 items-center px-2">
          {tabs.slice(0, 2).map((tab) => (
            <TabLink key={tab.href} tab={tab} pathname={pathname} />
          ))}

          <Link
            href="/submit"
            className="group relative flex flex-col items-center gap-0.5 text-[10px] text-crimson-600 no-underline"
            aria-label="投稿"
          >
            <span className="-mt-6 flex h-11 w-11 items-center justify-center rounded-full border-4 border-paper-50 bg-crimson-600 text-white shadow-lg transition-transform group-active:scale-95">
              <svg {...iconProps} width={20} height={20}>
                <path d="m4 20 4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11z" />
                <path d="m14.5 5.5 3 3" />
              </svg>
            </span>
            <span>投稿</span>
          </Link>

          {tabs.slice(2).map((tab) => (
            <TabLink key={tab.href} tab={tab} pathname={pathname} />
          ))}
        </div>
      </nav>
    </>
  );
}

function TabLink({ tab, pathname }: { tab: Tab; pathname: string }) {
  const active = tab.active(pathname);
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-0.5 py-2 text-[10px] no-underline ${
        active ? "text-crimson-600" : "text-ink-700/55"
      }`}
    >
      <span className={active ? "text-crimson-600" : "text-ink-700/55"}>
        {tab.icon}
      </span>
      <span>{tab.label}</span>
    </Link>
  );
}
