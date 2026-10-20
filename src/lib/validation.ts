import { z } from "zod";

import { CATEGORIES, REVIEW_ACTIONS, ROLES } from "./constants";

const email = z
  .string({ required_error: "请填写邮箱" })
  .trim()
  .toLowerCase()
  .email("邮箱格式不正确")
  .max(160, "邮箱过长");

const password = z
  .string({ required_error: "请填写密码" })
  .min(10, "密码至少 10 位")
  .max(72, "密码不能超过 72 位")
  .regex(/[A-Za-z]/, "密码需包含字母")
  .regex(/[0-9]/, "密码需包含数字");

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value ? value : undefined));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "姓名至少 2 个字").max(40, "姓名过长"),
  email,
  password,
  affiliation: optionalText(80, "单位或院系名称过长"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "请填写密码").max(72, "密码过长"),
});

export const submissionSchema = z.object({
  title: z.string().trim().min(4, "标题至少 4 个字").max(120, "标题过长"),
  abstract: z
    .string()
    .trim()
    .min(30, "摘要至少 30 个字")
    .max(800, "摘要不能超过 800 字"),
  keywords: z
    .string()
    .trim()
    .min(2, "请填写关键词")
    .max(120, "关键词不能超过 120 字"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "请选择栏目" }) }),
  content: z
    .string()
    .trim()
    .min(200, "正文至少 200 个字")
    .max(30000, "正文不能超过 30000 字"),
});

export const membershipSchema = z.object({
  name: z.string().trim().min(2, "请填写姓名").max(40, "姓名过长"),
  email,
  studentId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{4,30}$/, "学号格式不正确")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  school: z.string().trim().min(2, "请填写学院或单位").max(80, "名称过长"),
  major: optionalText(80, "专业名称过长"),
  reason: z
    .string()
    .trim()
    .min(20, "申请理由至少 20 个字")
    .max(1000, "申请理由不能超过 1000 字"),
});

export const reviewSchema = z.object({
  action: z.enum(REVIEW_ACTIONS, { errorMap: () => ({ message: "操作无效" }) }),
  note: optionalText(1000, "审稿意见过长"),
  issueId: z.string().trim().max(40).optional(),
});

export const issueSchema = z.object({
  year: z.coerce.number().int().min(2000, "年份无效").max(2100, "年份无效"),
  volume: z.coerce.number().int().min(1, "卷号无效").max(99, "卷号无效"),
  number: z.coerce.number().int().min(1, "期号无效").max(99, "期号无效"),
  title: z.string().trim().min(2, "请填写期刊标题").max(60, "标题过长"),
  theme: optionalText(60, "专题名称过长"),
  description: optionalText(500, "简介过长"),
  publishedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "请选择有效日期")
    .optional(),
});

export const roleSchema = z.object({
  role: z.enum(ROLES, { errorMap: () => ({ message: "角色无效" }) }),
});

export const membershipReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"], {
    errorMap: () => ({ message: "操作无效" }),
  }),
  note: optionalText(500, "审核意见过长"),
});
