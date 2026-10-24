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
import { articleRevisionSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`article:revision:${user.id}`, 10, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, articleRevisionSchema);

    const article = await prisma.article.findFirst({
      where: { id, authorId: user.id, deletedAt: null },
      select: { id: true, slug: true, title: true },
    });
    if (!article) throw new HttpError(404, "未找到可修改的文章");

    const pending = await prisma.articleRevision.findFirst({
      where: { articleId: id, status: "PENDING" },
      select: { id: true },
    });
    if (pending) {
      throw new HttpError(409, "这篇文章已有修改正在审核，请等待结果");
    }

    const revision = await prisma.articleRevision.create({
      data: {
        articleId: id,
        authorId: user.id,
        title: data.title,
        abstract: data.abstract ?? "",
        keywords: data.keywords,
        category: data.category,
        content: data.content,
        status: "PENDING",
      },
      select: { id: true, status: true, createdAt: true },
    });

    await writeAudit({
      userId: user.id,
      action: "ARTICLE_REVISION_SUBMIT",
      entity: "ArticleRevision",
      entityId: revision.id,
      req,
      meta: { articleId: id, articleSlug: article.slug },
    });

    revalidatePath("/dashboard/articles");
    revalidatePath(`/dashboard/articles/${id}/edit`);
    revalidatePath("/admin/revisions");

    return json({ ok: true, revision }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
