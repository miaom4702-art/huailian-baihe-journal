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
import { issueCoverSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`issue:cover:${admin.id}`, 30, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, issueCoverSchema);

    const issue = await prisma.issue.findUnique({
      where: { id },
      select: { id: true, title: true, coverImage: true },
    });
    if (!issue) throw new HttpError(404, "未找到该期期刊");

    await prisma.issue.update({
      where: { id },
      data: { coverImage: data.coverImage ?? null },
    });

    await writeAudit({
      userId: admin.id,
      action: "ISSUE_COVER",
      entity: "Issue",
      entityId: id,
      req,
      meta: {
        title: issue.title,
        previousCover: issue.coverImage,
      },
    });

    revalidatePath("/");
    revalidatePath("/issues");
    revalidatePath(`/issues/${id}`);

    return json({ ok: true, coverImage: data.coverImage ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
