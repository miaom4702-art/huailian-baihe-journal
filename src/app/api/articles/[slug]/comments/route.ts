import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { requireApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  handleApiError,
  HttpError,
  json,
  parseBody,
} from "@/lib/security";
import { commentSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`comment:${user.id}`, 10, 60 * 60 * 1000, "评论过于频繁");

    const { slug } = await params;
    const data = await parseBody(req, commentSchema);

    const article = await prisma.article.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!article) throw new HttpError(404, "文章不存在");

    const comment = await prisma.comment.create({
      data: {
        articleId: article.id,
        userId: user.id,
        content: data.content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    revalidatePath(`/articles/${slug}`);

    return json({ ok: true, comment }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
