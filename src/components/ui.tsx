import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("badge ring-crimson-600/20 bg-crimson-600/5 text-crimson-700", className)}>
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="font-serif text-2xl tracking-wide text-ink-900 sm:text-[28px]">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-700/80">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <span className="font-serif text-3xl text-ink-900/20">百</span>
      <p className="mt-4 font-serif text-lg text-ink-900">{title}</p>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-7 text-ink-700/70">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="font-serif text-3xl text-ink-900">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-ink-700/60">
        {label}
      </p>
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success";
  children: ReactNode;
}) {
  const tones = {
    info: "border-sky-200 bg-sky-50 text-sky-800",
    error: "border-crimson-600/25 bg-crimson-600/5 text-crimson-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <div className={cn("rounded-sm border px-4 py-3 text-sm leading-6", tones[tone])}>
      {children}
    </div>
  );
}

export function Breadcrumb({
  items,
}: {
  items: Array<{ href?: string; label: string }>;
}) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-700/60">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-ink-900/20">/</span>}
          {item.href ? (
            <Link href={item.href} className="no-underline hover:text-crimson-600">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink-900/70">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
