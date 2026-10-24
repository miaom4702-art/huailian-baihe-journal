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
import { serialOrderSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`serial:chapter:order:${user.id}`, 120, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, serialOrderSchema);

    const isAdmin = user.role === "ADMIN";
    const serial = await prisma.serial.findFirst({
      where: isAdmin ? { id } : { id, authorId: user.id },
      select: { id: true, slug: true },
    });
    if (!serial) throw new HttpError(404, "未找到该连载合集");

    const current = await prisma.article.findMany({
      where: isAdmin
        ? { serialId: id, deletedAt: null }
        : { serialId: id, authorId: user.id, deletedAt: null },
      select: { id: true },
    });
    const currentIds = new Set(current.map((article) => article.id));
    const providedIds = new Set(data.articleIds);

    if (
      currentIds.size !== providedIds.size ||
      data.articleIds.length !== providedIds.size ||
      [...currentIds].some((articleId) => !providedIds.has(articleId))
    ) {
      throw new HttpError(422, "章节列表已变化，请刷新后重试");
    }

    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < data.articleIds.length; index += 1) {
        await tx.article.update({
          where: { id: data.articleIds[index] },
          data: { serialOrder: index },
        });
      }
      await tx.serial.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    });

    await writeAudit({
      userId: user.id,
      action: "SERIAL_CHAPTER_REORDER",
      entity: "Serial",
      entityId: id,
      req,
      meta: { articleIds: data.articleIds },
    });

    revalidatePath("/serials");
    revalidatePath(`/serials/${serial.slug}`);
    revalidatePath("/dashboard/serials");

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
