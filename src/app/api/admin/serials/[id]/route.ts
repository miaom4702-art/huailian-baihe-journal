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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`serial:delete:${admin.id}`, 30, 60 * 60 * 1000);

    const { id } = await params;

    const serial = await prisma.serial.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        articles: { select: { slug: true } },
        _count: { select: { articles: true, submissions: true } },
      },
    });
    if (!serial) throw new HttpError(404, "未找到该连载合集");

    const result = await prisma.$transaction(async (tx) => {
      // 只解除关联：文章与投稿本身完全保留。
      const articles = await tx.article.updateMany({
        where: { serialId: id },
        data: { serialId: null, serialOrder: 0 },
      });
      const submissions = await tx.submission.updateMany({
        where: { serialId: id },
        data: { serialId: null },
      });
      await tx.serial.delete({ where: { id } });
      return { articles: articles.count, submissions: submissions.count };
    });

    await writeAudit({
      userId: admin.id,
      action: "SERIAL_DELETE",
      entity: "Serial",
      entityId: id,
      req,
      meta: {
        title: serial.title,
        detachedArticles: result.articles,
        detachedSubmissions: result.submissions,
      },
    });

    revalidatePath("/serials");
    revalidatePath(`/serials/${serial.slug}`);
    revalidatePath("/articles");
    revalidatePath("/admin/serials");
    revalidatePath("/dashboard/serials");
    for (const article of serial.articles) {
      revalidatePath(`/articles/${article.slug}`);
    }

    return json({
      ok: true,
      detachedArticles: result.articles,
      detachedSubmissions: result.submissions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
