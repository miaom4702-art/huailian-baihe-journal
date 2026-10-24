import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  handleApiError,
  HttpError,
  json,
} from "@/lib/security";

async function getArticle(slug: string) {
  const article = await prisma.article.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });
  if (!article) throw new HttpError(404, "文章不存在");
  return article;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`like:${user.id}`, 60, 60 * 60 * 1000);
    const { slug } = await params;
    const article = await getArticle(slug);

    await prisma.articleLike.upsert({
      where: {
        articleId_userId: { articleId: article.id, userId: user.id },
      },
      create: { articleId: article.id, userId: user.id },
      update: { createdAt: new Date() },
    });

    const count = await prisma.articleLike.count({
      where: { articleId: article.id },
    });

    return json({ ok: true, liked: true, count });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`like:${user.id}`, 60, 60 * 60 * 1000);
    const { slug } = await params;
    const article = await getArticle(slug);

    await prisma.articleLike.deleteMany({
      where: { articleId: article.id, userId: user.id },
    });

    const count = await prisma.articleLike.count({
      where: { articleId: article.id },
    });

    return json({ ok: true, liked: false, count });
  } catch (error) {
    return handleApiError(error);
  }
}
