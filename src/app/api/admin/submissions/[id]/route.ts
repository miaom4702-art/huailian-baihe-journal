import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  handleApiError,
  HttpError,
  json,
  parseBody,
} from "@/lib/security";
import { createArticleSlug } from "@/lib/slug";
import { reviewSchema } from "@/lib/validation";

const TRANSITIONS: Record<string, string[]> = {
  START_REVIEW: ["SUBMITTED"],
  REQUEST_REVISION: ["SUBMITTED", "UNDER_REVIEW"],
  ACCEPT: ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED"],
  REJECT: ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED"],
  PUBLISH: ["ACCEPTED"],
};

const NEXT_STATUS: Record<string, string> = {
  START_REVIEW: "UNDER_REVIEW",
  REQUEST_REVISION: "REVISION_REQUIRED",
  ACCEPT: "ACCEPTED",
  REJECT: "REJECTED",
  PUBLISH: "PUBLISHED",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const editor = await requireApiUser("EDITOR");
    enforceRateLimit(`review:${editor.id}`, 60, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, reviewSchema);

    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        abstract: true,
        keywords: true,
        category: true,
        content: true,
        status: true,
        editorNote: true,
      },
    });

    if (!submission) {
      throw new HttpError(404, "未找到该稿件");
    }

    const allowedFrom = TRANSITIONS[data.action];
    if (!allowedFrom || !allowedFrom.includes(submission.status)) {
      throw new HttpError(409, "当前稿件状态不支持该操作，请刷新后重试");
    }

    if (data.action === "PUBLISH" && data.issueId) {
      const issue = await prisma.issue.findUnique({
        where: { id: data.issueId },
        select: { id: true },
      });
      if (!issue) {
        throw new HttpError(422, "目标期刊不存在");
      }
    }

    const nextStatus = NEXT_STATUS[data.action];
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id },
        data: {
          status: nextStatus,
          editorNote: data.note ?? submission.editorNote,
          assignedEditorId: editor.id,
          ...(data.action === "PUBLISH" ? { publishedAt: now } : {}),
        },
      });

      await tx.reviewRecord.create({
        data: {
          submissionId: id,
          editorId: editor.id,
          action: data.action,
          note: data.note ?? null,
        },
      });

      let articleId: string | null = null;
      if (data.action === "PUBLISH") {
        const existing = await tx.article.findUnique({
          where: { submissionId: id },
          select: { id: true },
        });
        if (existing) {
          throw new HttpError(409, "该稿件已经生成过文章");
        }

        const article = await tx.article.create({
          data: {
            slug: createArticleSlug(submission.title),
            title: submission.title,
            abstract: submission.abstract,
            keywords: submission.keywords,
            category: submission.category,
            content: submission.content,
            publishedAt: now,
            submissionId: id,
            authorId: submission.userId,
            issueId: data.issueId ?? null,
          },
          select: { id: true, slug: true },
        });
        articleId = article.id;
      }

      return { articleId };
    });

    await writeAudit({
      userId: editor.id,
      action: data.action === "PUBLISH" ? "SUBMISSION_PUBLISH" : "SUBMISSION_REVIEW",
      entity: "Submission",
      entityId: id,
      req,
      meta: { from: submission.status, to: nextStatus, articleId: result.articleId },
    });

    return json({ ok: true, status: nextStatus, articleId: result.articleId });
  } catch (error) {
    return handleApiError(error);
  }
}
