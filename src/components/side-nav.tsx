"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type SideNavItem = { href: string; label: string; exact?: boolean };

export function SideNav({ items }: { items: SideNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 lg:flex-col">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-sm px-3.5 py-2.5 text-[13px] no-underline transition-colors",
              active
                ? "bg-ink-900 text-paper-50"
                : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
