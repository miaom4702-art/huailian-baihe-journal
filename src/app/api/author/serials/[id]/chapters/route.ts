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
import { serialChapterSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`serial:chapter:add:${user.id}`, 60, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, serialChapterSchema);

    const isAdmin = user.role === "ADMIN";
    const serial = await prisma.serial.findFirst({
      where: isAdmin ? { id } : { id, authorId: user.id },
      select: { id: true, slug: true, title: true },
    });
    if (!serial) throw new HttpError(404, "未找到该连载合集");

    const article = await prisma.article.findFirst({
      where: isAdmin
        ? { id: data.articleId, deletedAt: null }
        : { id: data.articleId, authorId: user.id, deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        serialId: true,
        submissionId: true,
      },
    });
    if (!article) throw new HttpError(404, "未找到可加入的文章");
    if (article.serialId) {
      throw new HttpError(409, "该文章已经属于其他连载，请先移出");
    }

    const maxOrder = await prisma.article.aggregate({
      where: { serialId: id },
      _max: { serialOrder: true },
    });
    const serialOrder = (maxOrder._max.serialOrder ?? -1) + 1;

    await prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: article.id },
        data: { serialId: id, serialOrder },
      });
      await tx.submission.updateMany({
        where: { id: article.submissionId },
        data: { serialId: id },
      });
      await tx.serial.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    });

    await writeAudit({
      userId: user.id,
      action: "SERIAL_CHAPTER_ADD",
      entity: "Serial",
      entityId: id,
      req,
      meta: { articleId: article.id, title: article.title },
    });

    revalidatePath("/serials");
    revalidatePath(`/serials/${serial.slug}`);
    revalidatePath(`/articles/${article.slug}`);
    revalidatePath("/dashboard/serials");

    return json({ ok: true, articleId: article.id, serialOrder });
  } catch (error) {
    return handleApiError(error);
  }
}
