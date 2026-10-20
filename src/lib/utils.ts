import {
  CATEGORY_LABELS,
  type Category,
  STATUS_LABELS,
  type SubmissionStatus,
} from "./constants";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: Date | string, withDay = true) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    ...(withDay ? { day: "numeric" } : {}),
    timeZone: "Asia/Shanghai",
  }).format(date);
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(date);
}

export function categoryLabel(value: string) {
  return CATEGORY_LABELS[value as Category] ?? "综合";
}

export function statusLabel(value: string) {
  return STATUS_LABELS[value as SubmissionStatus] ?? value;
}

export function readingTime(content: string) {
  const chars = content.replace(/\s/g, "").length;
  return Math.max(1, Math.round(chars / 400));
}

export function excerpt(text: string, length = 120) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

export function issueLabel(issue: {
  year: number;
  volume: number;
  number: number;
}) {
  return `${issue.year} 年第 ${issue.number} 期 · 第 ${issue.volume} 卷`;
}

export function safeNextPath(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\")) return null;
  return value;
}
