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
} from "@/lib/security";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`serial:chapter:remove:${user.id}`, 60, 60 * 60 * 1000);

    const { id, articleId } = await params;

    const isAdmin = user.role === "ADMIN";
    const serial = await prisma.serial.findFirst({
      where: isAdmin ? { id } : { id, authorId: user.id },
      select: { id: true, slug: true },
    });
    if (!serial) throw new HttpError(404, "未找到该连载合集");

    const article = await prisma.article.findFirst({
      where: isAdmin
        ? { id: articleId, serialId: id, deletedAt: null }
        : { id: articleId, authorId: user.id, serialId: id, deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        submissionId: true,
      },
    });
    if (!article) throw new HttpError(404, "该文章不在此连载中");

    await prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: article.id },
        data: { serialId: null, serialOrder: 0 },
      });
      await tx.submission.updateMany({
        where: { id: article.submissionId },
        data: { serialId: null },
      });
      await tx.serial.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    });

    await writeAudit({
      userId: user.id,
      action: "SERIAL_CHAPTER_REMOVE",
      entity: "Serial",
      entityId: id,
      req,
      meta: { articleId: article.id, title: article.title },
    });

    revalidatePath("/serials");
    revalidatePath(`/serials/${serial.slug}`);
    revalidatePath(`/articles/${article.slug}`);
    revalidatePath("/dashboard/serials");

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
