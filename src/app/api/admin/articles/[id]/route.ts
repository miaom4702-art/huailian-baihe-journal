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
import { articleAdminSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`article:admin:${admin.id}`, 60, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, articleAdminSchema);

    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        issueId: true,
        serialId: true,
        submissionId: true,
        deletedAt: true,
      },
    });
    if (!article) throw new HttpError(404, "未找到该文章");

    let action = "ARTICLE_UPDATE";
    let updated;

    if (data.action === "UPDATE") {
      if (data.issueId) {
        const issue = await prisma.issue.findUnique({
          where: { id: data.issueId },
          select: { id: true },
        });
        if (!issue) throw new HttpError(422, "目标期刊不存在");
      }
      if (data.serialId) {
        const serial = await prisma.serial.findUnique({
          where: { id: data.serialId },
          select: { id: true },
        });
        if (!serial) throw new HttpError(422, "目标连载合集不存在");
      }

      updated = await prisma.$transaction(async (tx) => {
        const articleUpdated = await tx.article.update({
          where: { id },
          data: {
            title: data.title,
            abstract: data.abstract ?? "",
            keywords: data.keywords,
            category: data.category,
            content: data.content,
            featured: data.featured,
            issueId: data.issueId,
            serialId: data.serialId,
          },
          select: { id: true, slug: true, title: true },
        });

        await tx.submission.update({
          where: { id: article.submissionId },
          data: { serialId: data.serialId },
        });

        return articleUpdated;
      });
    } else if (data.action === "DELETE") {
      action = "ARTICLE_DELETE";
      updated = await prisma.article.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: { id: true, slug: true, title: true },
      });
    } else {
      action = "ARTICLE_RESTORE";
      updated = await prisma.article.update({
        where: { id },
        data: { deletedAt: null },
        select: { id: true, slug: true, title: true },
      });
    }

    await writeAudit({
      userId: admin.id,
      action,
      entity: "Article",
      entityId: id,
      req,
      meta: {
        title: article.title,
        slug: article.slug,
        previousIssueId: article.issueId,
      },
    });

    revalidatePath("/");
    revalidatePath("/articles");
    revalidatePath(`/articles/${updated.slug}`);
    revalidatePath("/issues");
    if (article.issueId) revalidatePath(`/issues/${article.issueId}`);
    revalidatePath("/serials");
    if (article.serialId) {
      const oldSerial = await prisma.serial.findUnique({
        where: { id: article.serialId },
        select: { slug: true },
      });
      if (oldSerial) revalidatePath(`/serials/${oldSerial.slug}`);
    }
    if (data.action === "UPDATE" && data.serialId) {
      const newSerial = await prisma.serial.findUnique({
        where: { id: data.serialId },
        select: { slug: true },
      });
      if (newSerial) revalidatePath(`/serials/${newSerial.slug}`);
    }

    return json({
      ok: true,
      action,
      article: updated,
      deleted: action === "ARTICLE_DELETE",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
