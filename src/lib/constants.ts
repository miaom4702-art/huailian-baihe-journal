export const ROLES = ["READER", "EDITOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  READER: "读者 / 作者",
  EDITOR: "编辑",
  ADMIN: "管理员",
};

export const ROLE_RANK: Record<Role, number> = {
  READER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export const CATEGORIES = [
  "LITERATURE",
  "HISTORY",
  "CULTURE",
  "ART",
  "REVIEW",
  "NEWS",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  LITERATURE: "文学研究",
  HISTORY: "历史考据",
  CULTURE: "文化观察",
  ART: "艺术评论",
  REVIEW: "学术综述",
  NEWS: "社团动态",
};

export const SUBMISSION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
  "ACCEPTED",
  "REJECTED",
  "PUBLISHED",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  SUBMITTED: "待初审",
  UNDER_REVIEW: "审稿中",
  REVISION_REQUIRED: "需修改",
  ACCEPTED: "已录用",
  REJECTED: "未录用",
  PUBLISHED: "已刊发",
};

export const STATUS_TONE: Record<SubmissionStatus, string> = {
  SUBMITTED: "bg-amber-50 text-amber-700 ring-amber-200",
  UNDER_REVIEW: "bg-sky-50 text-sky-700 ring-sky-200",
  REVISION_REQUIRED: "bg-orange-50 text-orange-700 ring-orange-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-stone-100 text-stone-600 ring-stone-200",
  PUBLISHED: "bg-ink-900 text-paper-50 ring-ink-900",
};

export const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "未通过",
};

export const REVIEW_ACTION_LABELS: Record<string, string> = {
  SUBMIT: "提交投稿",
  START_REVIEW: "进入外审",
  REQUEST_REVISION: "退回修改",
  ACCEPT: "录用",
  REJECT: "退稿",
  PUBLISH: "刊发",
};

export const REVIEW_ACTIONS = [
  "START_REVIEW",
  "REQUEST_REVISION",
  "ACCEPT",
  "REJECT",
  "PUBLISH",
] as const;
