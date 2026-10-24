import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

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
import { revisionReviewSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const reviewer = await requireApiUser("EDITOR");
    enforceRateLimit(`revision:review:${reviewer.id}`, 60, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, revisionReviewSchema);

    const revision = await prisma.articleRevision.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        articleId: true,
        authorId: true,
        title: true,
        abstract: true,
        keywords: true,
        category: true,
        content: true,
        article: {
          select: { id: true, slug: true, title: true, deletedAt: true },
        },
      },
    });

    if (!revision) throw new HttpError(404, "未找到该修改申请");
    if (revision.status !== "PENDING") {
      throw new HttpError(409, "该修改申请已经处理");
    }
    if (revision.article.deletedAt) {
      throw new HttpError(409, "文章已下架，无法通过修改");
    }

    const approved = data.action === "APPROVE";

    await prisma.$transaction(async (tx) => {
      if (approved) {
        await tx.article.update({
          where: { id: revision.articleId },
          data: {
            title: revision.title,
            abstract: revision.abstract,
            keywords: revision.keywords,
            category: revision.category,
            content: revision.content,
          },
        });
      }

      await tx.articleRevision.update({
        where: { id },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          reviewNote: data.note ?? null,
          reviewerId: reviewer.id,
          reviewedAt: new Date(),
        },
      });
    });

    await writeAudit({
      userId: reviewer.id,
      action: approved
        ? "ARTICLE_REVISION_APPROVE"
        : "ARTICLE_REVISION_REJECT",
      entity: "ArticleRevision",
      entityId: id,
      req,
      meta: {
        articleId: revision.articleId,
        articleSlug: revision.article.slug,
        title: revision.title,
      },
    });

    revalidatePath("/");
    revalidatePath("/articles");
    revalidatePath(`/articles/${revision.article.slug}`);
    revalidatePath("/dashboard/articles");
    revalidatePath(`/dashboard/articles/${revision.articleId}/edit`);
    revalidatePath("/admin/revisions");

    return json({ ok: true, status: approved ? "APPROVED" : "REJECTED" });
  } catch (error) {
    return handleApiError(error);
  }
}
