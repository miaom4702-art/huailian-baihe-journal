import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  getClientIp,
  handleApiError,
  HttpError,
  json,
} from "@/lib/security";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(req);
    const { slug } = await params;

    const article = await prisma.article.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!article) throw new HttpError(404, "文章不存在");

    const user = await getCurrentUser();
    const ip = getClientIp(req);
    const key = user
      ? `view:user:${user.id}:${article.id}`
      : `view:ip:${ip}:${article.id}`;
    enforceRateLimit(key, 120, 60 * 60 * 1000, "阅读统计过于频繁");

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.article.update({
        where: { id: article.id },
        data: { views: { increment: 1 } },
        select: { views: true },
      });

      if (user && user.id !== article.authorId) {
        await tx.articleView.upsert({
          where: {
            articleId_userId: {
              articleId: article.id,
              userId: user.id,
            },
          },
          create: {
            articleId: article.id,
            userId: user.id,
          },
          update: {
            lastViewedAt: new Date(),
          },
        });
      }

      return result;
    });

    return json({ ok: true, views: updated.views });
  } catch (error) {
    return handleApiError(error);
  }
}
