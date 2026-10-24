import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { getCurrentUser, hasRole } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  handleApiError,
  HttpError,
  json,
} from "@/lib/security";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "请先登录");
    enforceRateLimit(`comment:delete:${user.id}`, 30, 60 * 60 * 1000);

    const { id } = await params;
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        deletedAt: true,
        article: {
          select: { id: true, slug: true, authorId: true },
        },
      },
    });

    if (!comment || comment.deletedAt) {
      throw new HttpError(404, "评论不存在");
    }

    const canDelete =
      comment.userId === user.id ||
      comment.article.authorId === user.id ||
      hasRole(user, "EDITOR");

    if (!canDelete) {
      throw new HttpError(403, "无权删除该评论");
    }

    await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await writeAudit({
      userId: user.id,
      action: "COMMENT_DELETE",
      entity: "Comment",
      entityId: id,
      req,
      meta: { articleId: comment.article.id },
    });

    revalidatePath(`/articles/${comment.article.slug}`);

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
